/* eslint-disable react-hooks/refs */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  MessageBar,
  MessageBarType,
  PrimaryButton,
  Selection,
  Text,
} from "@fluentui/react";
import { ExpensePanel } from "./components/ExpensePanel";
import { ExpensesView } from "./components/ExpensesView";
import { DashboardView } from "./components/DashboardView";
import {
  APPROVER_FIELD_NAME,
  type AppView,
  type ApprovalAction,
  buildApprovalEmail,
  buildDecisionEmail,
  createEmptyForm,
  extractPersonEmail,
  fileToBase64,
  getStatus,
  LIST_NAME,
  matchesPerson,
  normalizeEmail,
  normalizeExpenseRecord,
  type ExpenseRecord,
  SITE_URL,
  sortExpenses,
  type SortMode,
} from "./expenseApp/shared";
import { Office365OutlookService } from "./generated/services/Office365OutlookService";
import { Office365UsersService } from "./generated/services/Office365UsersService";
import { SharePointService } from "./generated/services/SharePointService";
import type { User } from "./generated/models/Office365UsersModel";
import type {
  SPListExpandedUser,
  SPListItemAttachment,
} from "./generated/models/SharePointModel";
import { getContext } from "@microsoft/power-apps/app";
import "./App.css";

function App() {
  const [view, setView] = useState<AppView>("dashboard");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [items, setItems] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUserContext, setLoadingUserContext] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [managerNotice, setManagerNotice] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [managerUser, setManagerUser] = useState<User | null>(null);
  const [resolvedApprover, setResolvedApprover] =
    useState<SPListExpandedUser | null>(null);

  const [panelOpen, setPanelOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<ExpenseRecord | null>(null);
  const [form, setForm] = useState(createEmptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [decisionComment, setDecisionComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);

  const [attachments, setAttachments] = useState<SPListItemAttachment[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [selectedItem, setSelectedItem] = useState<ExpenseRecord | null>(null);
  const ignoreSelectionRef = useRef(false);
  const selectionRef = useRef<Selection | null>(null);

  if (!selectionRef.current) {
    selectionRef.current = new Selection({
      onSelectionChanged: () => {
        if (ignoreSelectionRef.current) {
          ignoreSelectionRef.current = false;
          return;
        }

        const selection =
          selectionRef.current?.getSelection() as ExpenseRecord[];
        setSelectedItem(selection.length === 1 ? selection[0] : null);
      },
    });
  }

  const managerEmail = normalizeEmail(
    managerUser?.Mail ??
      managerUser?.UserPrincipalName ??
      resolvedApprover?.Email,
  );
  const managerName =
    managerUser?.DisplayName ?? resolvedApprover?.DisplayName ?? "";
  const currentUserEmail = normalizeEmail(
    currentUser?.Mail ?? currentUser?.UserPrincipalName,
  );
  const currentUserName = currentUser?.DisplayName ?? "Current user";
  const [queryExpenseId, setQueryExpenseId] = useState<number | null>(null);

  const clearSelection = useCallback(() => {
    if (selectionRef.current) {
      ignoreSelectionRef.current = true;
      selectionRef.current.setAllSelected(false);
    }

    setSelectedItem(null);
  }, []);

  const resetPanelState = useCallback(() => {
    setPanelOpen(false);
    setActiveItem(null);
    setFormError(null);
    setDecisionComment("");
    setAttachments([]);
    setPendingFiles([]);
    clearSelection();
  }, [clearSelection]);

  const loadUserContext = useCallback(async () => {
    setLoadingUserContext(true);
    setManagerNotice(null);

    try {
      const profileResult = await Office365UsersService.MyProfile();

      if (profileResult.error) {
        throw new Error(
          (profileResult.error as { message?: string }).message ??
            "Could not load the current user profile.",
        );
      }

      const profile = profileResult.data ?? null;
      setCurrentUser(profile);

      if (!profile?.Id) {
        setManagerUser(null);
        setResolvedApprover(null);
        setManagerNotice("Could not identify the current user manager.");
        return;
      }

      const managerResult = await Office365UsersService.Manager(profile.Id);

      if (managerResult.error) {
        throw new Error(
          (managerResult.error as { message?: string }).message ??
            "Could not load your manager information.",
        );
      }

      const managerProfile = managerResult.data ?? null;
      setManagerUser(managerProfile);

      const approverEmail =
        managerProfile?.Mail ?? managerProfile?.UserPrincipalName;

      if (!approverEmail) {
        setResolvedApprover(null);
        setManagerNotice(
          "Manager found, but no email address is available for approvals.",
        );
        return;
      }

      const approverResult = await SharePointService.SearchForUser(
        SITE_URL,
        LIST_NAME,
        APPROVER_FIELD_NAME,
        approverEmail,
      );

      if (approverResult.error) {
        throw new Error(
          (approverResult.error as { message?: string }).message ??
            "Could not resolve the manager as a SharePoint approver.",
        );
      }

      setResolvedApprover(approverResult.data ?? null);
    } catch (e) {
      setManagerUser(null);
      setResolvedApprover(null);
      setManagerNotice(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingUserContext(false);
    }
  }, []);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await SharePointService.GetItems(
        SITE_URL,
        LIST_NAME,
        undefined,
        "ID desc",
        100,
      );

      if (result.error) {
        throw new Error(
          (result.error as { message?: string }).message ??
            "Failed to load items",
        );
      }

      const rawItems = result.data?.value ?? [];
      setItems(
        rawItems
          .map(normalizeExpenseRecord)
          .filter((item): item is ExpenseRecord => item !== null),
      );
      clearSelection();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [clearSelection]);

  useEffect(() => {
    void loadItems();
    void loadUserContext();
  }, [loadItems, loadUserContext]);

  useEffect(() => {
    if (!successMsg) {
      return undefined;
    }

    const timer = window.setTimeout(() => setSuccessMsg(null), 4000);
    return () => window.clearTimeout(timer);
  }, [successMsg]);

  useEffect(() => {
    if (!activeItem && managerName) {
      setForm((currentForm) =>
        currentForm.ApproverName === managerName
          ? currentForm
          : { ...currentForm, ApproverName: managerName },
      );
    }
  }, [activeItem, managerName]);

  const sortedItems = sortExpenses(items, sortMode);

  useEffect(() => {
    selectionRef.current?.setItems(sortedItems, true);
  }, [sortedItems]);

  const loadAttachments = useCallback(async (itemId: number) => {
    try {
      const result = await SharePointService.GetItemAttachments(
        SITE_URL,
        LIST_NAME,
        String(itemId),
      );
      setAttachments(result.data ?? []);
    } catch {
      setAttachments([]);
    }
  }, []);

  const openNewExpensePanel = useCallback(() => {
    clearSelection();
    setActiveItem(null);
    setForm(createEmptyForm(managerName));
    setDecisionComment("");
    setFormError(null);
    setAttachments([]);
    setPendingFiles([]);
    setPanelOpen(true);
  }, [clearSelection, managerName]);

  const openExpensePanel = useCallback(
    (item: ExpenseRecord) => {
      setActiveItem(item);
      setForm({
        Title: item.Title ?? "",
        Detail: item.Detail ?? "",
        expenseDate: item.ExpenseDate ? new Date(item.ExpenseDate) : undefined,
        Amount:
          item.Amount !== undefined && item.Amount !== null
            ? String(item.Amount)
            : "",
        Category: item.Category?.Value ?? "Miscellaneous",
        ApproverName: item.Approver?.DisplayName ?? managerName,
      });
      setDecisionComment(item.ApproverComment ?? "");
      setFormError(null);
      setPendingFiles([]);
      setPanelOpen(true);
      void loadAttachments(item.ID);
    },
    [loadAttachments, managerName],
  );

  useEffect(() => {
    let isCancelled = false;

    const resolveQueryExpenseId = async () => {
      try {
        const context = await getContext();
        const idFromContext = context?.app?.queryParams?.id;
        const parsedContextId =
          idFromContext != null
            ? Number.parseInt(String(idFromContext), 10)
            : Number.NaN;

        if (!isCancelled) {
          setQueryExpenseId(
            !Number.isNaN(parsedContextId) && parsedContextId > 0
              ? parsedContextId
              : null,
          );
        }
      } catch {
        if (!isCancelled) {
          setQueryExpenseId(null);
        }
      }
    };

    void resolveQueryExpenseId();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedItem) {
      return;
    }

    if (!panelOpen || activeItem?.ID !== selectedItem.ID) {
      openExpensePanel(selectedItem);
    }
  }, [activeItem?.ID, openExpensePanel, panelOpen, selectedItem]);

  useEffect(() => {
    if (queryExpenseId && items.length > 0 && !panelOpen) {
      const expenseItem = items.find((item) => item.ID === queryExpenseId);

      if (expenseItem) {
        openExpensePanel(expenseItem);
        setQueryExpenseId(null);
      }
    }
  }, [items, openExpensePanel, panelOpen, queryExpenseId]);

  const activeStatus = activeItem ? getStatus(activeItem) : "Pending";
  const isCurrentUserAuthor = activeItem
    ? matchesPerson(activeItem.Author, currentUserEmail)
    : false;
  const isCurrentUserApprover = activeItem
    ? matchesPerson(activeItem.Approver, currentUserEmail)
    : false;

  const canEditSubmittedExpense =
    !activeItem || (activeStatus === "Rejected" && isCurrentUserAuthor);
  const canApproveActiveExpense = Boolean(
    activeItem && isCurrentUserApprover && activeStatus === "Pending",
  );
  const canDeleteActiveExpense = Boolean(
    activeItem && isCurrentUserAuthor && activeStatus === "Rejected",
  );
  const canDeleteSelected = Boolean(
    selectedItem &&
    matchesPerson(selectedItem.Author, currentUserEmail) &&
    getStatus(selectedItem) === "Rejected",
  );
  const canManageAttachments = !activeItem || canEditSubmittedExpense;
  const hasManagerForSubmission = Boolean(resolvedApprover && managerEmail);
  const saveButtonText = activeItem ? "Save and resubmit" : "Submit expense";

  const sendApprovalEmail = useCallback(
    async (expense: ExpenseRecord, expenseId?: number) => {
      if (!managerEmail) {
        throw new Error(
          "Manager email is not available, so the approval email could not be sent.",
        );
      }

      const result = await Office365OutlookService.SendEmailV2({
        To: managerEmail,
        Subject: `Expense approval needed: ${expense.Title}`,
        Body: buildApprovalEmail(
          expense,
          currentUserName,
          managerName,
          expenseId,
        ),
        Importance: "High",
      });

      if (result.error) {
        throw new Error(
          (result.error as { message?: string }).message ??
            "The expense was saved, but the approval email could not be sent.",
        );
      }
    },
    [currentUserName, managerEmail, managerName],
  );

  const sendDecisionEmail = useCallback(
    async (
      expense: ExpenseRecord,
      action: ApprovalAction,
      comment: string,
      expenseId?: number,
    ) => {
      const submitterEmail = extractPersonEmail(expense.Author);

      if (!submitterEmail) {
        return;
      }

      const result = await Office365OutlookService.SendEmailV2({
        To: submitterEmail,
        Subject: `Expense ${action.toLowerCase()}: ${expense.Title}`,
        Body: buildDecisionEmail(
          expense,
          expense.Author?.DisplayName ?? currentUserName,
          action,
          currentUserName,
          comment,
          expenseId,
        ),
        Importance: "High",
      });

      if (result.error) {
        throw new Error(
          (result.error as { message?: string }).message ??
            `The expense was updated, but the ${action.toLowerCase()} email could not be sent.`,
        );
      }
    },
    [currentUserName],
  );

  const handleSave = async () => {
    if (!form.Title.trim()) {
      setFormError("Title is required.");
      return;
    }

    if (!form.Amount.trim() || Number.isNaN(Number(form.Amount))) {
      setFormError("Amount must be a valid number.");
      return;
    }

    if (!activeItem && !hasManagerForSubmission) {
      setFormError(
        "Manager information is required before you can submit an expense.",
      );
      return;
    }

    if (activeItem && !canEditSubmittedExpense) {
      setFormError(
        "This expense is read-only while it is waiting for approval or already approved.",
      );
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const approverValue = resolvedApprover ?? activeItem?.Approver;
      const amount = parseFloat(form.Amount);
      const isAutoApproved = amount < 100;
      const itemData = {
        Title: form.Title.trim(),
        Detail: form.Detail.trim() || undefined,
        ExpenseDate: form.expenseDate
          ? form.expenseDate.toISOString()
          : undefined,
        Amount: amount,
        Category: form.Category ? { Value: form.Category } : undefined,
        ApprovalStatus: { Value: isAutoApproved ? "Auto approved" : "Pending" },
        ApproverComment: isAutoApproved
          ? "Automatically approved (amount < $100)"
          : undefined,
        Approver: approverValue,
      };

      let savedId = activeItem?.ID ?? 0;

      if (activeItem) {
        const result = await SharePointService.PatchItem(
          SITE_URL,
          LIST_NAME,
          activeItem.ID,
          itemData,
        );

        if (result.error) {
          throw new Error(
            (result.error as { message?: string }).message ??
              "Failed to update the expense.",
          );
        }
      } else {
        const result = await SharePointService.PostItem(
          SITE_URL,
          LIST_NAME,
          itemData,
        );

        if (result.error) {
          throw new Error(
            (result.error as { message?: string }).message ??
              "Failed to create the expense.",
          );
        }

        const savedItem = result.data as Record<string, unknown>;
        savedId = Number(savedItem?.ID ?? 0);
      }

      for (const file of pendingFiles) {
        try {
          const base64 = await fileToBase64(file);
          await SharePointService.CreateAttachment(
            SITE_URL,
            LIST_NAME,
            savedId,
            file.name,
            base64,
          );
        } catch {
          // Keep attachment failures non-blocking.
        }
      }

      const emailExpense: ExpenseRecord = {
        ID: savedId,
        Title: itemData.Title,
        Detail: itemData.Detail,
        ExpenseDate: itemData.ExpenseDate,
        Amount: itemData.Amount,
        Category: itemData.Category,
        ApprovalStatus: itemData.ApprovalStatus,
        Approver: approverValue,
        Author: activeItem?.Author ?? {
          DisplayName: currentUserName,
          Email: currentUserEmail,
        },
      };

      await sendApprovalEmail(emailExpense, savedId);

      setSuccessMsg(
        activeItem
          ? "Expense updated and resubmitted for approval."
          : "Expense submitted successfully.",
      );
      resetPanelState();
      await loadItems();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleApproval = async (action: ApprovalAction) => {
    if (!activeItem || !canApproveActiveExpense) {
      return;
    }

    setApproving(true);

    try {
      const result = await SharePointService.PatchItem(
        SITE_URL,
        LIST_NAME,
        activeItem.ID,
        {
          ApprovalStatus: { Value: action },
          ApproverComment: decisionComment.trim() || undefined,
        },
      );

      if (result.error) {
        throw new Error(
          (result.error as { message?: string }).message ??
            `Failed to ${action === "Approved" ? "approve" : "reject"} the expense.`,
        );
      }

      const updatedExpense: ExpenseRecord = {
        ...activeItem,
        ApprovalStatus: { Value: action },
        ApproverComment: decisionComment.trim() || undefined,
      };

      await sendDecisionEmail(
        updatedExpense,
        action,
        decisionComment,
        activeItem.ID,
      );

      setSuccessMsg(
        action === "Approved"
          ? "Expense approved successfully."
          : "Expense rejected successfully.",
      );
      resetPanelState();
      await loadItems();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e));
    } finally {
      setApproving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeItem || !canDeleteActiveExpense) {
      return;
    }

    setDeleting(true);

    try {
      const result = await SharePointService.DeleteItem(
        SITE_URL,
        LIST_NAME,
        activeItem.ID,
      );

      if (result.error) {
        throw new Error(
          (result.error as { message?: string }).message ??
            "Failed to delete the expense.",
        );
      }

      setDeleteOpen(false);
      setSuccessMsg("Expense deleted.");
      resetPanelState();
      await loadItems();
    } catch (e) {
      setDeleteOpen(false);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!activeItem || !canManageAttachments) {
      return;
    }

    try {
      await SharePointService.DeleteAttachment(
        SITE_URL,
        LIST_NAME,
        activeItem.ID,
        attachmentId,
      );
      void loadAttachments(activeItem.ID);
    } catch {
      // Keep attachment delete failures silent for now.
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setPendingFiles((currentFiles) => [...currentFiles, ...files]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div>
          <Text className="sidebar-eyebrow">PACA Expense Hub</Text>
          <Text className="sidebar-title">Expense Approval System</Text>
          <Text className="sidebar-subtitle">
            Dashboard analytics and expense reviews in one place.
          </Text>
        </div>

        <div className="nav-list">
          <button
            className={`nav-button ${view === "dashboard" ? "nav-button-active" : ""}`}
            onClick={() => setView("dashboard")}
            type="button"
          >
            <span>Dashboard</span>
            <span className="nav-caption">Charts and trends</span>
          </button>
          <button
            className={`nav-button ${view === "expenses" ? "nav-button-active" : ""}`}
            onClick={() => setView("expenses")}
            type="button"
          >
            <span>Expenses</span>
            <span className="nav-caption">List and review</span>
          </button>
        </div>

        <div className="sidebar-user-card">
          <Text className="sidebar-user-label">Signed in user</Text>
          <Text className="sidebar-user-name">{currentUserName}</Text>
          <Text className="sidebar-user-meta">
            {currentUserEmail || "Profile loading..."}
          </Text>
          <Text className="sidebar-user-label sidebar-user-label-spacing">
            Current approver
          </Text>
          <Text className="sidebar-user-name">
            {managerName || "Not available"}
          </Text>
          <Text className="sidebar-user-meta">
            {managerEmail || "Manager email unavailable"}
          </Text>
        </div>
      </aside>

      <main className="app-main">
        <div className="page-header">
          <div>
            <Text className="page-title">
              {view === "dashboard" ? "Dashboard" : "Expenses"}
            </Text>
            <Text className="page-subtitle">
              {view === "dashboard"
                ? "Track category trends, approval status, and month-over-month movement."
                : "Open any expense to view details, approve it, or resubmit rejected items."}
            </Text>
          </div>
        </div>

        {successMsg && (
          <MessageBar
            messageBarType={MessageBarType.success}
            onDismiss={() => setSuccessMsg(null)}
            styles={{ root: { marginBottom: 16 } }}
          >
            {successMsg}
          </MessageBar>
        )}

        {error && (
          <MessageBar
            messageBarType={MessageBarType.error}
            onDismiss={() => setError(null)}
            styles={{ root: { marginBottom: 16 } }}
          >
            {error}
          </MessageBar>
        )}

        {managerNotice && (
          <MessageBar
            messageBarType={MessageBarType.warning}
            onDismiss={() => setManagerNotice(null)}
            styles={{ root: { marginBottom: 16 } }}
          >
            {managerNotice}
          </MessageBar>
        )}

        {view === "dashboard" ? (
          <DashboardView
            items={items}
            currentUserEmail={currentUserEmail}
            onOpenExpense={openExpensePanel}
          />
        ) : (
          <ExpensesView
            items={sortedItems}
            loading={loading}
            selectedItem={selectedItem}
            selection={selectionRef.current}
            sortMode={sortMode}
            managerName={managerName}
            managerEmail={managerEmail}
            canDeleteSelected={canDeleteSelected}
            loadingUserContext={loadingUserContext}
            onSortChange={setSortMode}
            onRefresh={() => void loadItems()}
            onNewExpense={openNewExpensePanel}
            onDeleteSelected={() => setDeleteOpen(true)}
            onOpenExpense={openExpensePanel}
          />
        )}
      </main>

      <ExpensePanel
        isOpen={panelOpen}
        activeItem={activeItem}
        activeStatus={activeStatus}
        form={form}
        formError={formError}
        decisionComment={decisionComment}
        attachments={attachments}
        pendingFiles={pendingFiles}
        fileInputRef={fileInputRef}
        saving={saving}
        approving={approving}
        canEditSubmittedExpense={canEditSubmittedExpense}
        canApproveActiveExpense={canApproveActiveExpense}
        canDeleteActiveExpense={canDeleteActiveExpense}
        canManageAttachments={canManageAttachments}
        hasManagerForSubmission={hasManagerForSubmission}
        loadingUserContext={loadingUserContext}
        saveButtonText={saveButtonText}
        onDismiss={resetPanelState}
        onSave={() => void handleSave()}
        onApprove={() => void handleApproval("Approved")}
        onReject={() => void handleApproval("Rejected")}
        onDeleteRequested={() => setDeleteOpen(true)}
        onTitleChange={(value) =>
          setForm((current) => ({ ...current, Title: value }))
        }
        onDetailChange={(value) =>
          setForm((current) => ({ ...current, Detail: value }))
        }
        onExpenseDateChange={(value) =>
          setForm((current) => ({ ...current, expenseDate: value }))
        }
        onAmountChange={(value) =>
          setForm((current) => ({ ...current, Amount: value }))
        }
        onCategoryChange={(value) =>
          setForm((current) => ({ ...current, Category: value }))
        }
        onDecisionCommentChange={setDecisionComment}
        onFileSelect={handleFileSelect}
        onDeleteAttachment={(attachmentId) =>
          void handleDeleteAttachment(attachmentId)
        }
        onRemovePendingFile={(index) =>
          setPendingFiles((currentFiles) =>
            currentFiles.filter((_, currentIndex) => currentIndex !== index),
          )
        }
        onDismissFormError={() => setFormError(null)}
      />

      <Dialog
        hidden={!deleteOpen}
        onDismiss={() => !deleting && setDeleteOpen(false)}
        dialogContentProps={{
          type: DialogType.close,
          title: "Delete Expense",
          subText: `Are you sure you want to permanently delete "${activeItem?.Title ?? selectedItem?.Title ?? "this expense"}"?`,
        }}
        minWidth={420}
      >
        <DialogFooter>
          <PrimaryButton
            text={deleting ? "Deleting..." : "Delete"}
            disabled={deleting}
            styles={{
              root: { background: "#A4262C", borderColor: "#A4262C" },
              rootHovered: { background: "#8e1e22", borderColor: "#8e1e22" },
            }}
            onClick={() => void handleDelete()}
          />
          <DefaultButton
            text="Cancel"
            disabled={deleting}
            onClick={() => setDeleteOpen(false)}
          />
        </DialogFooter>
      </Dialog>
    </div>
  );
}

export default App;
