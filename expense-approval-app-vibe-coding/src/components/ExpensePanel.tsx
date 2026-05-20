import React from "react";
import {
  DatePicker,
  DefaultButton,
  Dropdown,
  IconButton,
  Label,
  Link,
  MessageBar,
  MessageBarType,
  Panel,
  PanelType,
  PrimaryButton,
  Separator,
  Stack,
  Text,
  TextField,
} from "@fluentui/react";
import type { SPListItemAttachment } from "../generated/models/SharePointModel";
import {
  CATEGORY_OPTIONS,
  type ExpenseFormState,
  type ExpenseRecord,
  STATUS_COLORS,
} from "../expenseApp/shared";

interface ExpensePanelProps {
  isOpen: boolean;
  activeItem: ExpenseRecord | null;
  activeStatus: string;
  form: ExpenseFormState;
  formError: string | null;
  decisionComment: string;
  attachments: SPListItemAttachment[];
  pendingFiles: File[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  saving: boolean;
  approving: boolean;
  canEditSubmittedExpense: boolean;
  canApproveActiveExpense: boolean;
  canDeleteActiveExpense: boolean;
  canManageAttachments: boolean;
  hasManagerForSubmission: boolean;
  loadingUserContext: boolean;
  saveButtonText: string;
  onDismiss: () => void;
  onSave: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDeleteRequested: () => void;
  onTitleChange: (value: string) => void;
  onDetailChange: (value: string) => void;
  onExpenseDateChange: (value: Date | undefined) => void;
  onAmountChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onDecisionCommentChange: (value: string) => void;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  onRemovePendingFile: (index: number) => void;
  onDismissFormError: () => void;
}

const StatusBadge = ({ status }: { status: string }) => {
  const style = STATUS_COLORS[status] ?? STATUS_COLORS.Pending;

  return (
    <span
      style={{
        background: style.bg,
        color: style.color,
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
        display: "inline-block",
      }}
    >
      {status}
    </span>
  );
};

export function ExpensePanel({
  isOpen,
  activeItem,
  activeStatus,
  form,
  formError,
  decisionComment,
  attachments,
  pendingFiles,
  fileInputRef,
  saving,
  approving,
  canEditSubmittedExpense,
  canApproveActiveExpense,
  canDeleteActiveExpense,
  canManageAttachments,
  hasManagerForSubmission,
  loadingUserContext,
  saveButtonText,
  onDismiss,
  onSave,
  onApprove,
  onReject,
  onDeleteRequested,
  onTitleChange,
  onDetailChange,
  onExpenseDateChange,
  onAmountChange,
  onCategoryChange,
  onDecisionCommentChange,
  onFileSelect,
  onDeleteAttachment,
  onRemovePendingFile,
  onDismissFormError,
}: ExpensePanelProps) {
  return (
    <Panel
      isOpen={isOpen}
      type={PanelType.medium}
      onDismiss={() => !saving && !approving && onDismiss()}
      headerText={activeItem ? activeItem.Title : "New Expense"}
      isFooterAtBottom
      onRenderFooterContent={() => (
        <Stack
          horizontal
          tokens={{ childrenGap: 8 }}
          styles={{ root: { padding: "12px 0 4px" } }}
        >
          {canApproveActiveExpense && (
            <>
              <PrimaryButton
                text={approving ? "Working..." : "Approve"}
                disabled={approving || saving}
                styles={{
                  root: { background: "#198754", borderColor: "#198754" },
                  rootHovered: {
                    background: "#146c43",
                    borderColor: "#146c43",
                  },
                }}
                onClick={onApprove}
              />
              <DefaultButton
                text="Reject"
                disabled={approving || saving}
                styles={{
                  root: { color: "#a4262c", borderColor: "#a4262c" },
                  rootHovered: { color: "#7f1d1d", borderColor: "#7f1d1d" },
                }}
                onClick={onReject}
              />
            </>
          )}

          {canEditSubmittedExpense && (
            <PrimaryButton
              text={saving ? "Saving..." : saveButtonText}
              disabled={
                saving || approving || (!activeItem && !hasManagerForSubmission)
              }
              iconProps={saving ? undefined : { iconName: "Save" }}
              onClick={onSave}
            />
          )}

          {canDeleteActiveExpense && (
            <DefaultButton
              text="Delete"
              disabled={saving || approving}
              iconProps={{ iconName: "Delete" }}
              onClick={onDeleteRequested}
            />
          )}

          <DefaultButton
            text="Close"
            disabled={saving || approving}
            onClick={onDismiss}
          />
        </Stack>
      )}
    >
      <Stack tokens={{ childrenGap: 14 }} styles={{ root: { paddingTop: 8 } }}>
        {formError && (
          <MessageBar
            messageBarType={MessageBarType.error}
            onDismiss={onDismissFormError}
          >
            {formError}
          </MessageBar>
        )}

        {activeItem && (
          <div className="panel-status-row">
            <div>
              <Text className="panel-status-label">Current status</Text>
              <div style={{ marginTop: 6 }}>
                <StatusBadge status={activeStatus} />
              </div>
            </div>
            <div>
              <Text className="panel-status-label">Submitted by</Text>
              <Text className="panel-status-value">
                {activeItem.Author?.DisplayName ?? "-"}
              </Text>
            </div>
          </div>
        )}

        <TextField
          label="Title"
          required
          value={form.Title}
          disabled={!canEditSubmittedExpense}
          onChange={(_, value) => onTitleChange(value ?? "")}
          placeholder="Brief description of the expense"
        />

        <TextField
          label="Details"
          multiline
          rows={3}
          value={form.Detail}
          disabled={!canEditSubmittedExpense}
          onChange={(_, value) => onDetailChange(value ?? "")}
          placeholder="Why was this expense needed?"
        />

        <Stack horizontal tokens={{ childrenGap: 16 }}>
          <Stack.Item grow={1}>
            <DatePicker
              label="Expense Date"
              value={form.expenseDate}
              disabled={!canEditSubmittedExpense}
              onSelectDate={(value) => onExpenseDateChange(value ?? undefined)}
              placeholder="Select a date"
            />
          </Stack.Item>
          <Stack.Item grow={1}>
            <TextField
              label="Amount"
              required
              value={form.Amount}
              disabled={!canEditSubmittedExpense}
              onChange={(_, value) => onAmountChange(value ?? "")}
              placeholder="0.00"
              prefix="$"
            />
          </Stack.Item>
        </Stack>

        <Dropdown
          label="Category"
          selectedKey={form.Category}
          disabled={!canEditSubmittedExpense}
          options={CATEGORY_OPTIONS}
          onChange={(_, option) => onCategoryChange(String(option?.key ?? ""))}
          placeholder="Select a category"
        />

        <TextField
          label="Approver"
          value={form.ApproverName || "Manager not available"}
          disabled
        />

        {canApproveActiveExpense && (
          <TextField
            label="Approval Comment"
            multiline
            rows={3}
            value={decisionComment}
            onChange={(_, value) => onDecisionCommentChange(value ?? "")}
            placeholder="Add a note for the submitter"
          />
        )}

        {!canApproveActiveExpense && activeItem?.ApproverComment && (
          <TextField
            label="Approver Comment"
            multiline
            rows={3}
            value={activeItem.ApproverComment}
            disabled
          />
        )}

        {activeItem && !canEditSubmittedExpense && !canApproveActiveExpense && (
          <MessageBar messageBarType={MessageBarType.info}>
            This record is read-only. Submitted expenses stay locked while they
            are pending or approved. Rejected expenses can be updated and
            resubmitted by the original submitter.
          </MessageBar>
        )}

        {!activeItem && !hasManagerForSubmission && !loadingUserContext && (
          <MessageBar messageBarType={MessageBarType.warning}>
            Manager details are not ready yet, so the expense cannot be
            submitted until the approver information is available.
          </MessageBar>
        )}

        <Separator />
        <Label>Attachments</Label>

        {attachments.length > 0 && (
          <Stack tokens={{ childrenGap: 6 }}>
            {attachments.map((attachment) => (
              <Stack
                key={attachment.Id}
                horizontal
                verticalAlign="center"
                tokens={{ childrenGap: 8 }}
                styles={{
                  root: {
                    background: "#f3f2f1",
                    borderRadius: 8,
                    padding: "8px 10px",
                  },
                }}
              >
                <div className="attachment-icon">📎</div>
                <Text className="attachment-name">
                  {attachment.DisplayName}
                </Text>
                {attachment.AbsoluteUri && (
                  <Link href={attachment.AbsoluteUri} target="_blank">
                    Download
                  </Link>
                )}
                {canManageAttachments && (
                  <IconButton
                    iconProps={{ iconName: "Delete" }}
                    title="Remove attachment"
                    onClick={() =>
                      attachment.Id && onDeleteAttachment(attachment.Id)
                    }
                  />
                )}
              </Stack>
            ))}
          </Stack>
        )}

        {pendingFiles.length > 0 && (
          <Stack tokens={{ childrenGap: 6 }}>
            <Text className="queued-label">Queued for upload</Text>
            {pendingFiles.map((file, index) => (
              <Stack
                key={`${file.name}-${index}`}
                horizontal
                verticalAlign="center"
                tokens={{ childrenGap: 8 }}
                styles={{
                  root: {
                    background: "#e8f3fc",
                    borderRadius: 8,
                    padding: "8px 10px",
                  },
                }}
              >
                <Text className="attachment-name">
                  {file.name}{" "}
                  <span className="attachment-meta">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </Text>
                {canManageAttachments && (
                  <IconButton
                    iconProps={{ iconName: "Cancel" }}
                    title="Remove queued file"
                    onClick={() => onRemovePendingFile(index)}
                  />
                )}
              </Stack>
            ))}
          </Stack>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: "none" }}
          onChange={onFileSelect}
        />
        <DefaultButton
          text="Add Attachment"
          iconProps={{ iconName: "Attach" }}
          disabled={!canManageAttachments}
          styles={{ root: { alignSelf: "flex-start" } }}
          onClick={() => fileInputRef.current?.click()}
        />
      </Stack>
    </Panel>
  );
}
