/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import "./App.css";

import {
  ComboBox,
  DatePicker,
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  Dropdown,
  MessageBar,
  MessageBarType,
  Modal,
  PrimaryButton,
  Stack,
  TextField,
  type IComboBox,
  type IComboBoxOption,
  type IDropdownOption,
} from "@fluentui/react";
import type { InvoicesListBase } from "./generated/models/InvoicesListModel";
import type { User } from "./generated/models/Office365UsersModel";
import { InvoicesListService, Office365UsersService } from "./generated";
import type { SPListItemAttachment } from "./generated/models/SharePointModel";

interface Invoice {
  ID?: number;
  Title: string;
  InvoiceID: string;
  TotalCost: number;
  InvoiceDate?: string;
  DueDate?: string;
  BilledToName: string;
  WorkDetails?: string;
  AssignedTo?: SPPersonField | string;
  AssignedToName?: string;
  Approvers?: SPPersonField[];
  Status?: {
    Id: number;
    Value: string;
  };
  "{HasAttachments}"?: boolean;
}

interface StatusChoice {
  Id: number;
  Value: string;
}

interface InvoiceFormValues extends InvoicesListBase {
  Status?: StatusChoice;
}

const DEFAULT_STATUS_VALUE = "Under Review";

/** Shape SharePoint returns for Person columns */
interface SPPersonField {
  "@odata.type"?: string;
  Claims?: string;
  DisplayName?: string;
  Email?: string;
  Picture?: string;
  Department?: string;
  JobTitle?: string;
}

/** Safely extract a display name from a SP Person field or plain string */
const toPersonName = (
  field: SPPersonField | string | undefined,
  fallback?: string,
): string => {
  if (!field) return fallback ?? "-";
  if (typeof field === "string") return (field || fallback) ?? "-";
  return field.DisplayName ?? fallback ?? "-";
};

/** Safely extract an email/UPN from a SP Person field or plain string */
const toPersonEmail = (field: SPPersonField | string | undefined): string => {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field.Email ?? field.Claims?.split("|").pop() ?? "";
};

/** Build the SPListExpandedUser object SharePoint expects for Person columns */
const toSPUser = (u: User): SPPersonField => ({
  "@odata.type": "#Microsoft.Azure.Connectors.SharePoint.SPListExpandedUser",
  Claims: `i:0#.f|membership|${u.Mail ?? u.UserPrincipalName ?? u.Id}`,
  DisplayName: u.DisplayName ?? "",
  Email: u.Mail ?? u.UserPrincipalName ?? "",
  Department: u.Department ?? undefined,
  JobTitle: u.JobTitle ?? undefined,
});

const toStartOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const formatDateOnly = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const parseDateValue = (value?: string): Date | undefined => {
  if (!value) return undefined;

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]) - 1;
    const day = Number(dateOnlyMatch[3]);
    return new Date(year, month, day);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const generateInvoiceId = (): string => {
  const sequence = (Date.now() % 10000).toString().padStart(4, "0");
  return `INV-${sequence}`;
};

const createDefaultForm = (): InvoiceFormValues => {
  const today = toStartOfDay(new Date());
  const dueDate = addDays(today, 30);
  return {
    Title: "",
    InvoiceID: generateInvoiceId(),
    TotalCost: 0,
    InvoiceDate: formatDateOnly(today),
    DueDate: formatDateOnly(dueDate),
    BilledToName: "",
    WorkDetails: "",
    Status: {
      Id: 0,
      Value: DEFAULT_STATUS_VALUE,
    },
  };
};

const CARD_ENTER_ANIMATION_MS = 380;
const CARD_EXIT_ANIMATION_MS = 280;
const GET_ATTACHMENTS_FLOW_URL =
  "https://defaulta5d6d2a6a0344767b0c35c2ddc1311.38.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/f1fded2a180c4ea09598af235361737b/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=nnDNq-b0_SL3IghfpqBKGXrp9WM1SOP9_ah0P96PcQo";
const SHAREPOINT_SITE_URL =
  "https://swami01.sharepoint.com/sites/PowerAppsEducation";
const SHAREPOINT_LIST_ID = "a2280f7e-5e93-43ab-99af-f87eef02aafc";

function App() {
  const [records, setRecords] = useState<Invoice[]>([]);
  const [enteringIds, setEnteringIds] = useState<number[]>([]);
  const [leavingIds, setLeavingIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<InvoiceFormValues>(createDefaultForm());
  const [formErrors, setFormErrors] = useState<{
    Title?: string;
    WorkDetails?: string;
    TotalCost?: string;
    BilledToName?: string;
  }>({});
  const [isDueDateManuallyEdited, setIsDueDateManuallyEdited] = useState(false);
  const [userOptions, setUserOptions] = useState<IComboBoxOption[]>([]);
  const [statusOptions, setStatusOptions] = useState<IDropdownOption[]>([]);
  const [assignedToUser, setAssignedToUser] = useState<User | null>(null);
  const comboBoxRef = useRef<IComboBox>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [approverOptions, setApproverOptions] = useState<IComboBoxOption[]>([]);
  const [selectedApprovers, setSelectedApprovers] = useState<User[]>([]);
  const approverComboBoxRef = useRef<IComboBox>(null);
  const approverSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<Invoice | null>(null);
  const [notification, setNotification] = useState<{
    text: string;
    type: MessageBarType;
  } | null>(null);

  const [attachmentDialogInvoice, setAttachmentDialogInvoice] =
    useState<Invoice | null>(null);
  const [attachments, setAttachments] = useState<SPListItemAttachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [attachmentsError, setAttachmentsError] = useState<string | null>(null);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 3500);
    return () => clearTimeout(timer);
  }, [notification]);

  useEffect(() => {
    loadRecords();
  }, []);

  const getStatusFromOption = (option: IDropdownOption): StatusChoice => ({
    Id: Number(option.key),
    Value: String(option.text),
  });

  const getDefaultStatus = (): StatusChoice => {
    const underReview = statusOptions.find(
      (opt) =>
        String(opt.text).toLowerCase() === DEFAULT_STATUS_VALUE.toLowerCase(),
    );
    const first = underReview ?? statusOptions[0];
    return first
      ? getStatusFromOption(first)
      : {
          Id: 0,
          Value: DEFAULT_STATUS_VALUE,
        };
  };

  const loadRecords = async () => {
    try {
      const result: any = await InvoicesListService.getAll();

      const choiceoptions = await InvoicesListService.getReferencedEntity(
        "",
        "Status",
      );
      console.log("Choice options for Status:", choiceoptions);

      const choices = Array.isArray((choiceoptions as any)?.data?.value)
        ? (
            (choiceoptions as any).data.value as Array<{
              Id?: number;
              Value?: string;
            }>
          )
            .filter((item) => typeof item?.Value === "string")
            .map((item) => ({
              key: Number(item.Id ?? 0),
              text: item.Value as string,
            }))
        : [];

      setStatusOptions(choices);

      if (choices.length > 0) {
        setForm((prev) => {
          const hasCurrent =
            !!prev.Status &&
            choices.some(
              (opt) =>
                Number(opt.key) === prev.Status?.Id &&
                String(opt.text) === prev.Status?.Value,
            );

          if (hasCurrent) return prev;

          const underReview = choices.find(
            (opt) =>
              String(opt.text).toLowerCase() ===
              DEFAULT_STATUS_VALUE.toLowerCase(),
          );
          const selected = underReview ?? choices[0];
          return {
            ...prev,
            Status: getStatusFromOption(selected),
          };
        });
      }

      setRecords(result.data ?? []);
      setEnteringIds([]);
      setLeavingIds([]);
    } catch (error) {
      console.error("Load error", error);
    } finally {
      setLoading(false);
    }
  };

  const markCardAsEntering = (id: number) => {
    setEnteringIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setTimeout(() => {
      setEnteringIds((prev) => prev.filter((itemId) => itemId !== id));
    }, CARD_ENTER_ANIMATION_MS);
  };

  const updateForm = (field: keyof Invoice, value: any) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setFormErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }));
  };

  const resetForm = () => {
    setSelectedId(null);
    setForm(createDefaultForm());
    setIsDueDateManuallyEdited(false);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: {
      Title?: string;
      WorkDetails?: string;
      TotalCost?: string;
      BilledToName?: string;
    } = {};

    if (!form.Title?.trim()) errors.Title = "Title is required.";
    if (!form.WorkDetails?.trim()) errors.WorkDetails = "Details are required.";
    if (!form.BilledToName?.trim())
      errors.BilledToName = "Bill To is required.";
    if (!form.TotalCost || Number(form.TotalCost) <= 0)
      errors.TotalCost = "Cost must be greater than 0.";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetUserSelections = () => {
    setAssignedToUser(null);
    setUserOptions([]);
    setSelectedApprovers([]);
    setApproverOptions([]);
  };

  const showNotification = (text: string, type: MessageBarType) => {
    setNotification({ text, type });
  };

  const hasAttachments = (item: Invoice): boolean =>
    item["{HasAttachments}"] === true;

  const closeAttachmentsDialog = () => {
    setAttachmentDialogInvoice(null);
    setAttachments([]);
    setAttachmentsError(null);
    setAttachmentsLoading(false);
  };

  const getAttachments = async (item: Invoice) => {
    if (!item.ID) return;

    setAttachmentDialogInvoice(item);
    setAttachments([]);
    setAttachmentsError(null);
    setAttachmentsLoading(true);

    try {
      const requestBody = {
        siteUrl: SHAREPOINT_SITE_URL,
        listId: SHAREPOINT_LIST_ID,
        itemId: item.ID,
      };

      const response = await fetch(GET_ATTACHMENTS_FLOW_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const rawResponse = await response.text();
      if (!response.ok) {
        throw new Error(
          `Flow call failed (${response.status} ${response.statusText}): ${rawResponse}`,
        );
      }

      let parsed: unknown = [];
      if (rawResponse.trim()) {
        parsed = JSON.parse(rawResponse);
      }

      // Handle either direct array response or wrapped shape from some flows.
      const files = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as { value?: unknown[] })?.value)
          ? (parsed as { value: unknown[] }).value
          : [];

      const normalized = files
        .filter((file): file is SPListItemAttachment => {
          const candidate = file as SPListItemAttachment;
          return (
            typeof candidate?.DisplayName === "string" ||
            typeof candidate?.AbsoluteUri === "string" ||
            typeof candidate?.Id === "string"
          );
        })
        .map((file) => ({
          Id: file.Id,
          AbsoluteUri: file.AbsoluteUri,
          DisplayName: file.DisplayName,
        }));

      setAttachments(normalized);
    } catch (error) {
      console.error("Get attachments error", error);
      setAttachmentsError(
        error instanceof Error
          ? error.message
          : "Could not load attachments for this invoice.",
      );
    } finally {
      setAttachmentsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      const status = form.Status ?? getDefaultStatus();
      const payload = {
        ...form,
        Status: {
          Id: status.Id,
          Value: status.Value,
        },
        AssignedTo: assignedToUser ? toSPUser(assignedToUser) : undefined,
        Approvers:
          selectedApprovers.length > 0
            ? selectedApprovers.map(toSPUser)
            : undefined,
      };
      const created = await InvoicesListService.create(payload as any);

      if (created.data) {
        const createdInvoice = created.data as Invoice;
        setRecords((prev) => [createdInvoice, ...prev]);
        if (createdInvoice.ID) {
          markCardAsEntering(createdInvoice.ID);
        }
        showNotification(
          "Invoice created successfully.",
          MessageBarType.success,
        );
        resetForm();
        resetUserSelections();
        setIsFormModalOpen(false);
      } else {
        await loadRecords();
      }
    } catch (error) {
      console.error("Create error", error);
      showNotification("Failed to create invoice.", MessageBarType.error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedId) return;
    if (!validateForm()) return;

    const status = form.Status ?? getDefaultStatus();

    // Explicitly pick only writable fields — spreading `form` would include
    // OData metadata (@odata.etag, @odata.id, etc.) that SharePoint rejects.
    const payload = {
      Title: form.Title,
      InvoiceID: form.InvoiceID,
      TotalCost: form.TotalCost,
      InvoiceDate: form.InvoiceDate,
      DueDate: form.DueDate,
      BilledToName: form.BilledToName,
      WorkDetails: form.WorkDetails,
      Status: {
        Id: status.Id,
        Value: status.Value,
      },
      AssignedTo: assignedToUser ? toSPUser(assignedToUser) : undefined,
      Approvers:
        selectedApprovers.length > 0
          ? selectedApprovers.map(toSPUser)
          : undefined,
    };
    try {
      await InvoicesListService.update(selectedId.toString(), payload as any);

      showNotification("Invoice updated successfully.", MessageBarType.success);

      resetForm();
      resetUserSelections();
      setIsFormModalOpen(false);
      loadRecords();
    } catch (error) {
      console.error("Update error", error);
      showNotification("Failed to update invoice.", MessageBarType.error);
    }
  };

  const requestDelete = (item: Invoice) => {
    setDeleteCandidate(item);
  };
  const confirmDelete = async () => {
    if (!deleteCandidate?.ID) return;

    const deletedId = deleteCandidate.ID;
    setLeavingIds((prev) =>
      prev.includes(deletedId) ? prev : [...prev, deletedId],
    );

    try {
      await InvoicesListService.delete(deletedId.toString());

      showNotification("Invoice deleted successfully.", MessageBarType.success);

      setDeleteCandidate(null);

      setTimeout(() => {
        setRecords((prev) => prev.filter((record) => record.ID !== deletedId));
        setLeavingIds((prev) => prev.filter((itemId) => itemId !== deletedId));
      }, CARD_EXIT_ANIMATION_MS);
    } catch (error) {
      console.error("Delete error", error);
      showNotification("Failed to delete invoice.", MessageBarType.error);
      setLeavingIds((prev) => prev.filter((itemId) => itemId !== deletedId));
    }
  };

  const handleEdit = async (item: Invoice) => {
    if (item.ID) {
      try {
        const latest = await InvoicesListService.get(item.ID.toString());
        console.log("Invoice fetched by get():", latest?.data ?? latest);
      } catch (error) {
        console.error("Error fetching invoice by get()", error);
      }
    }

    setSelectedId(item.ID ?? null);
    setIsFormModalOpen(true);
    setIsDueDateManuallyEdited(true);
    setFormErrors({});

    const normalizedInvoiceDate = parseDateValue(item.InvoiceDate);
    const normalizedDueDate = parseDateValue(item.DueDate);
    setForm({
      Title: item.Title ?? "",
      InvoiceID: item.InvoiceID ?? "",
      TotalCost: item.TotalCost ?? 0,
      InvoiceDate: normalizedInvoiceDate
        ? formatDateOnly(normalizedInvoiceDate)
        : "",
      DueDate: normalizedDueDate ? formatDateOnly(normalizedDueDate) : "",
      BilledToName: item.BilledToName ?? "",
      WorkDetails: item.WorkDetails ?? "",
      Status: item.Status
        ? {
            Id: item.Status.Id,
            Value: item.Status.Value,
          }
        : getDefaultStatus(),
    });

    // Restore Assigned To
    if (item.AssignedTo) {
      const upn = toPersonEmail(item.AssignedTo);
      const displayName = toPersonName(item.AssignedTo, item.AssignedToName);
      const user: User = {
        Id: upn,
        UserPrincipalName: upn,
        DisplayName: displayName,
        Mail: upn,
      };
      setAssignedToUser(user);
      setUserOptions([
        {
          key: upn || "assigned",
          text: displayName ? `${displayName} (${upn})` : upn,
          data: user,
        },
      ]);
    } else {
      setAssignedToUser(null);
      setUserOptions([]);
    }

    // Restore Approvers
    const approversList = Array.isArray(item.Approvers) ? item.Approvers : [];
    if (approversList.length > 0) {
      const approvers: User[] = approversList.map((p) => ({
        Id: toPersonEmail(p),
        UserPrincipalName: toPersonEmail(p),
        DisplayName: p.DisplayName,
        Mail: p.Email,
        JobTitle: p.JobTitle,
        Department: p.Department,
      }));
      setSelectedApprovers(approvers);
      setApproverOptions(
        approvers.map((u) => ({
          key: u.UserPrincipalName ?? u.Id,
          text: u.Mail
            ? `${u.DisplayName} (${u.Mail})`
            : (u.DisplayName ?? u.UserPrincipalName ?? u.Id),
          data: u,
        })),
      );
    } else {
      setSelectedApprovers([]);
      setApproverOptions([]);
    }
  };

  const openCreateModal = () => {
    resetForm();
    resetUserSelections();
    setIsFormModalOpen(true);
  };

  const handleAssignedToSearch = (value: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!value.trim()) {
      setUserOptions([]);
      comboBoxRef.current?.dismissMenu();
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      try {
        const result = await Office365UsersService.SearchUserV2(value);
        const users = result.data?.value ?? [];
        setUserOptions(
          users.map(
            (u: {
              DisplayName?: any;
              GivenName?: any;
              UserPrincipalName?: any;
              Id?: any;
              Mail?: any;
            }) => {
              const name =
                u.DisplayName ?? u.GivenName ?? u.UserPrincipalName ?? u.Id;
              const email = u.Mail ?? u.UserPrincipalName ?? "";
              return {
                key: u.UserPrincipalName ?? u.Id,
                text: email ? `${name} (${email})` : name,
                data: u,
              };
            },
          ),
        );
        if (users.length > 0) {
          comboBoxRef.current?.focus(true);
        } else {
          comboBoxRef.current?.dismissMenu();
        }
      } catch (error) {
        console.error("User search error", error);
        comboBoxRef.current?.dismissMenu();
      }
    }, 500);
  };

  const handleApproversSearch = (value: string) => {
    if (approverSearchTimerRef.current)
      clearTimeout(approverSearchTimerRef.current);

    const toOption = (u: User) => {
      const name = u.DisplayName ?? u.GivenName ?? u.UserPrincipalName ?? u.Id;
      const email = u.Mail ?? u.UserPrincipalName ?? "";
      return {
        key: u.UserPrincipalName ?? u.Id,
        text: email ? `${name} (${email})` : name,
        data: u,
      };
    };

    if (!value.trim()) {
      // Show currently selected approvers so they can be unchecked
      setApproverOptions(selectedApprovers.map(toOption));
      return;
    }

    approverSearchTimerRef.current = setTimeout(async () => {
      try {
        const result = await Office365UsersService.SearchUserV2(value);
        const users = result.data?.value ?? [];
        const searchOptions = users.map(toOption);

        // Always merge in already-selected users so they remain uncheckable
        const searchKeys = new Set(
          users.map(
            (u: { UserPrincipalName?: any; Id?: any }) =>
              u.UserPrincipalName ?? u.Id,
          ),
        );
        const missingSelected = selectedApprovers
          .filter((u) => !searchKeys.has(u.UserPrincipalName ?? u.Id))
          .map(toOption);

        setApproverOptions([...searchOptions, ...missingSelected]);

        if (searchOptions.length > 0) {
          approverComboBoxRef.current?.focus(true);
        } else {
          approverComboBoxRef.current?.dismissMenu();
        }
      } catch (error) {
        console.error("Approver search error", error);
        approverComboBoxRef.current?.dismissMenu();
      }
    }, 500);
  };

  const getDueProgress = (item: Invoice) => {
    if (!item.DueDate) {
      return {
        percent: 0,
        stateClass: "neutral",
        label: "No due date",
      };
    }

    const now = Date.now();
    const dueTs = parseDateValue(item.DueDate)?.getTime() ?? now;
    const startTs = parseDateValue(item.InvoiceDate)?.getTime() ?? now;

    if (startTs > now) {
      const startsInDays = Math.ceil((startTs - now) / (1000 * 60 * 60 * 24));
      return {
        percent: 6,
        stateClass: "neutral",
        label: `Starts in ${Math.max(startsInDays, 1)} day(s)`,
      };
    }

    const safeStart = Number.isFinite(startTs) ? startTs : now;
    const total = Math.max(dueTs - safeStart, 1);
    const elapsed = now - safeStart;
    const percent = Math.min(Math.max((elapsed / total) * 100, 0), 100);

    if (dueTs < now) {
      const overdueDays = Math.floor((now - dueTs) / (1000 * 60 * 60 * 24));
      return {
        percent: 100,
        stateClass: "overdue",
        label: `Overdue by ${Math.max(overdueDays, 1)} day(s)`,
      };
    }

    const remainingDays = Math.ceil((dueTs - now) / (1000 * 60 * 60 * 24));
    return {
      percent,
      stateClass: remainingDays <= 3 ? "warning" : "safe",
      label: `${remainingDays} day(s) left`,
    };
  };

  return (
    <div className="container">
      {notification ? (
        <MessageBar
          messageBarType={notification.type}
          isMultiline={false}
          onDismiss={() => setNotification(null)}
        >
          {notification.text}
        </MessageBar>
      ) : null}

      <div className="header-row">
        <h1 className="page-title">Invoices Dashboard</h1>
        <PrimaryButton text="New Invoice" onClick={openCreateModal} />
      </div>

      <Modal
        isOpen={isFormModalOpen}
        onDismiss={() => {
          setIsFormModalOpen(false);
          resetForm();
          resetUserSelections();
        }}
        isBlocking={false}
      >
        <div className="card modal-card">
          <h2>{selectedId ? "Update Invoice" : "Create Invoice"}</h2>

          <Stack tokens={{ childrenGap: 15 }}>
            <div className="grid2">
              <TextField label="Invoice ID" value={form.InvoiceID} disabled />

              <DatePicker
                label="Invoice Date"
                value={parseDateValue(form.InvoiceDate)}
                onSelectDate={(d) => {
                  if (!d) return;
                  const normalizedInvoiceDate = toStartOfDay(d);
                  updateForm(
                    "InvoiceDate",
                    formatDateOnly(normalizedInvoiceDate),
                  );
                  if (!selectedId && !isDueDateManuallyEdited) {
                    updateForm(
                      "DueDate",
                      formatDateOnly(addDays(normalizedInvoiceDate, 30)),
                    );
                  }
                }}
              />
            </div>

            <TextField
              label="Title"
              value={form.Title}
              onChange={(_, v) => updateForm("Title", v)}
              required
              errorMessage={formErrors.Title}
              maxLength={250}
            />
            <TextField
              label="Work Details"
              multiline
              rows={3}
              value={form.WorkDetails}
              onChange={(_, v) => updateForm("WorkDetails", v)}
              required
              errorMessage={formErrors.WorkDetails}
              maxLength={250}
            />
            <div className="grid3">
              <DatePicker
                label="Due Date"
                value={parseDateValue(form.DueDate)}
                onSelectDate={(d) => {
                  setIsDueDateManuallyEdited(true);
                  updateForm(
                    "DueDate",
                    d ? formatDateOnly(toStartOfDay(d)) : "",
                  );
                }}
              />
              <TextField
                label="Total Cost"
                type="number"
                value={form.TotalCost?.toString()}
                onChange={(_, v) => updateForm("TotalCost", Number(v))}
                required
                errorMessage={formErrors.TotalCost}
              />

              <TextField
                label="Billed To"
                value={form.BilledToName}
                onChange={(_, v) => updateForm("BilledToName", v)}
                required
                errorMessage={formErrors.BilledToName}
              />
            </div>

            <div className="grid3">
              <ComboBox
                label="Assigned To"
                componentRef={comboBoxRef}
                options={userOptions}
                selectedKey={assignedToUser?.UserPrincipalName ?? null}
                allowFreeform
                autoComplete="off"
                onInputValueChange={(value) =>
                  handleAssignedToSearch(value ?? "")
                }
                onChange={(_, option) => {
                  if (option?.data) {
                    const user = option.data as User;
                    setAssignedToUser(user);
                  }
                }}
                placeholder="Type to search users..."
              />

              <ComboBox
                label="Approvers"
                componentRef={approverComboBoxRef}
                options={approverOptions}
                selectedKey={selectedApprovers.map(
                  (u) => u.UserPrincipalName ?? u.Id,
                )}
                multiSelect
                allowFreeform
                autoComplete="off"
                onMenuOpen={() => {
                  // Ensure selected approvers are visible when opening so they can be unchecked
                  if (
                    approverOptions.length === 0 &&
                    selectedApprovers.length > 0
                  ) {
                    setApproverOptions(
                      selectedApprovers.map((u) => {
                        const name =
                          u.DisplayName ??
                          u.GivenName ??
                          u.UserPrincipalName ??
                          u.Id;
                        const email = u.Mail ?? u.UserPrincipalName ?? "";
                        return {
                          key: u.UserPrincipalName ?? u.Id,
                          text: email ? `${name} (${email})` : name,
                          data: u,
                        };
                      }),
                    );
                  }
                }}
                onInputValueChange={(value) =>
                  handleApproversSearch(value ?? "")
                }
                onChange={(_, option) => {
                  if (!option?.data) return;
                  const user = option.data as User;
                  setSelectedApprovers((prev) =>
                    option.selected
                      ? [...prev, user]
                      : prev.filter(
                          (u) =>
                            (u.UserPrincipalName ?? u.Id) !==
                            (user.UserPrincipalName ?? user.Id),
                        ),
                  );
                }}
                placeholder="Type to search approvers..."
              />

              <Dropdown
                label="Status"
                options={statusOptions}
                selectedKey={form.Status?.Id}
                onChange={(_, option) => {
                  if (!option) return;
                  updateForm("Status", getStatusFromOption(option));
                }}
                disabled={!selectedId || statusOptions.length === 0}
                placeholder={
                  statusOptions.length > 0
                    ? "Select status"
                    : "Loading status options..."
                }
              />
            </div>

            <div className="buttonRow">
              {selectedId ? (
                <>
                  <PrimaryButton text="Update Invoice" onClick={handleUpdate} />
                  <DefaultButton
                    text="Cancel"
                    onClick={() => {
                      setIsFormModalOpen(false);
                      resetForm();
                      resetUserSelections();
                    }}
                  />
                </>
              ) : (
                <>
                  <PrimaryButton text="Create Invoice" onClick={handleCreate} />
                  <DefaultButton
                    text="Cancel"
                    onClick={() => {
                      setIsFormModalOpen(false);
                      resetForm();
                      resetUserSelections();
                    }}
                  />
                </>
              )}
            </div>
          </Stack>
        </div>
      </Modal>

      {/* ================= INVOICE CARDS ================= */}

      <div className="card">
        {loading ? (
          <p>Loading...</p>
        ) : records.length === 0 ? (
          <p className="empty-state">No invoices found.</p>
        ) : (
          <div className="invoice-cards">
            {records.map((item) => (
              <div
                key={item.ID}
                className={`invoice-card ${
                  item.ID && enteringIds.includes(item.ID) ? "is-entering" : ""
                } ${
                  item.ID && leavingIds.includes(item.ID) ? "is-leaving" : ""
                }`}
              >
                {(() => {
                  const dueProgress = getDueProgress(item);
                  return (
                    <>
                      {/* Card header: Invoice ID + Status */}
                      <div className="invoice-card-header">
                        <span className="invoice-card-id">
                          #{item.InvoiceID}
                        </span>
                        <span
                          className={`status status-${(item.Status?.Value ?? "")
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {item.Status?.Value ?? "N/A"}
                        </span>
                      </div>

                      {/* Title */}
                      <div className="invoice-card-title">{item.Title}</div>

                      {/* Field grid */}
                      <div className="invoice-card-grid">
                        <div className="invoice-card-field">
                          <span className="field-label">Total Cost</span>
                          <span className="field-value cost">
                            ${item.TotalCost?.toLocaleString()}
                          </span>
                        </div>
                        <div className="invoice-card-field">
                          <span className="field-label">Invoice Date</span>
                          <span className="field-value">
                            {parseDateValue(
                              item.InvoiceDate,
                            )?.toLocaleDateString() ?? "-"}
                          </span>
                        </div>
                        <div className="invoice-card-field">
                          <span className="field-label">Due Date</span>
                          <span className="field-value">
                            {parseDateValue(
                              item.DueDate,
                            )?.toLocaleDateString() ?? "-"}
                          </span>
                        </div>
                        <div className="invoice-card-field">
                          <span className="field-label">Billed To</span>
                          <span className="field-value">
                            {item.BilledToName || "-"}
                          </span>
                        </div>
                        <div className="invoice-card-field">
                          <span className="field-label">Assigned To</span>
                          <span className="field-value">
                            {toPersonName(item.AssignedTo, item.AssignedToName)}
                          </span>
                        </div>
                      </div>

                      {/* Due date progress */}
                      <div className="invoice-card-progress">
                        <div className="due-progress-label-row">
                          <span className="field-label">Due Progress</span>
                          <span
                            className={`due-progress-text ${dueProgress.stateClass}`}
                          >
                            {dueProgress.label}
                          </span>
                        </div>
                        <div className="due-progress-track" aria-hidden="true">
                          <div
                            className={`due-progress-fill ${dueProgress.stateClass}`}
                            style={{ width: `${dueProgress.percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Approvers */}
                      <div className="invoice-card-approvers">
                        <span className="field-label">Approvers</span>
                        {Array.isArray(item.Approvers) &&
                        item.Approvers.length ? (
                          <div className="approver-chips">
                            {item.Approvers.map((a, i) => (
                              <span key={i} className="approver-chip">
                                {a.DisplayName ?? "-"}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="field-value">-</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="invoice-card-actions">
                        {hasAttachments(item) ? (
                          <DefaultButton
                            text="View Attachments"
                            onClick={() => getAttachments(item)}
                          />
                        ) : null}
                        <DefaultButton
                          text="Edit"
                          onClick={() => handleEdit(item)}
                        />
                        <PrimaryButton
                          text="Delete"
                          onClick={() => requestDelete(item)}
                        />
                      </div>
                    </>
                  );
                })()}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={!!attachmentDialogInvoice}
        onDismiss={closeAttachmentsDialog}
        isBlocking={false}
      >
        <div className="attachments-modal-card">
          <div className="attachments-modal-header">
            <h2>Attachments - {attachmentDialogInvoice?.InvoiceID ?? ""}</h2>
          </div>

          {attachmentsLoading ? (
            <p>Loading attachments...</p>
          ) : attachmentsError ? (
            <p>{attachmentsError}</p>
          ) : attachments.length === 0 ? (
            <p>No attachments found for this invoice.</p>
          ) : (
            <div className="attachments-table-wrap">
              <table
                className="attachments-table"
                aria-label="Invoice attachments"
              >
                <thead>
                  <tr>
                    <th scope="col">Attachment Name</th>
                    <th scope="col" className="attachments-table-action-col">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {attachments.map((file) => {
                    const key = file.Id ?? file.AbsoluteUri ?? file.DisplayName;
                    const displayName =
                      file.DisplayName ?? file.Id ?? "Attachment";
                    const hasUrl = !!file.AbsoluteUri;

                    return (
                      <tr key={key}>
                        <td className="attachments-table-name">
                          {displayName}
                        </td>
                        <td className="attachments-table-action-col">
                          {hasUrl ? (
                            <a
                              href={file.AbsoluteUri}
                              target="_blank"
                              rel="noreferrer"
                              className="attachment-view-btn"
                            >
                              View
                            </a>
                          ) : (
                            <span className="attachment-view-btn disabled">
                              No Link
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="attachments-modal-actions">
            <PrimaryButton text="Close" onClick={closeAttachmentsDialog} />
          </div>
        </div>
      </Modal>

      <Dialog
        hidden={!deleteCandidate}
        onDismiss={() => setDeleteCandidate(null)}
        dialogContentProps={{
          type: DialogType.normal,
          title: "Delete invoice?",
          subText: `Are you sure you want to delete invoice ${deleteCandidate?.InvoiceID ?? ""}? This action cannot be undone.`,
        }}
      >
        <DialogFooter>
          <PrimaryButton text="Delete" onClick={confirmDelete} />
          <DefaultButton
            text="Cancel"
            onClick={() => setDeleteCandidate(null)}
          />
        </DialogFooter>
      </Dialog>
    </div>
  );
}

export default App;
