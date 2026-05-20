import {
  DefaultButton,
  DetailsList,
  DetailsListLayoutMode,
  Dropdown,
  FontWeights,
  Link,
  type IColumn,
  type IDropdownOption,
  PrimaryButton,
  Selection,
  SelectionMode,
  Stack,
  Text,
} from "@fluentui/react";
import {
  formatAmount,
  formatDate,
  getCategory,
  getStatus,
  type ExpenseRecord,
  type SortMode,
  SORT_OPTIONS,
  STATUS_COLORS,
} from "../expenseApp/shared";

interface ExpensesViewProps {
  items: ExpenseRecord[];
  loading: boolean;
  selectedItem: ExpenseRecord | null;
  selection: Selection;
  sortMode: SortMode;
  managerName: string;
  managerEmail: string;
  canDeleteSelected: boolean;
  loadingUserContext: boolean;
  onSortChange: (sortMode: SortMode) => void;
  onRefresh: () => void;
  onNewExpense: () => void;
  onDeleteSelected: () => void;
  onOpenExpense: (item: ExpenseRecord) => void;
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

const SummaryCard = ({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note: string;
}) => (
  <div className="summary-card">
    <Text className="summary-card-label">{label}</Text>
    <Text className="summary-card-value">{value}</Text>
    <Text className="summary-card-note">{note}</Text>
  </div>
);

export function ExpensesView({
  items,
  loading,
  selectedItem,
  selection,
  sortMode,
  managerName,
  managerEmail,
  canDeleteSelected,
  loadingUserContext,
  onSortChange,
  onRefresh,
  onNewExpense,
  onDeleteSelected,
  onOpenExpense,
}: ExpensesViewProps) {
  const pendingCount = items.filter(
    (item) => getStatus(item) === "Pending",
  ).length;
  const approvedCount = items.filter((item) =>
    ["Approved", "Auto approved"].includes(getStatus(item)),
  ).length;
  const rejectedCount = items.filter(
    (item) => getStatus(item) === "Rejected",
  ).length;

  const columns: IColumn[] = [
    {
      key: "title",
      name: "Expense",
      minWidth: 220,
      maxWidth: 280,
      isResizable: true,
      onRender: (item: ExpenseRecord) => (
        <Stack tokens={{ childrenGap: 4 }}>
          <Link
            onClick={(event) => {
              event.preventDefault();
              onOpenExpense(item);
            }}
            styles={{
              root: { fontWeight: FontWeights.semibold, fontSize: 14 },
            }}
          >
            {item.Title}
          </Link>
          <Text styles={{ root: { fontSize: 12, color: "#605e5c" } }}>
            {item.Detail || "No additional details"}
          </Text>
        </Stack>
      ),
    },
    {
      key: "category",
      name: "Category",
      minWidth: 140,
      maxWidth: 180,
      isResizable: true,
      onRender: (item: ExpenseRecord) => <Text>{getCategory(item)}</Text>,
    },
    {
      key: "expenseDate",
      name: "Expense Date",
      minWidth: 120,
      maxWidth: 140,
      isResizable: true,
      onRender: (item: ExpenseRecord) => (
        <Text>{formatDate(item.ExpenseDate)}</Text>
      ),
    },
    {
      key: "amount",
      name: "Amount",
      minWidth: 120,
      maxWidth: 140,
      isResizable: true,
      onRender: (item: ExpenseRecord) => (
        <Text styles={{ root: { fontWeight: FontWeights.semibold } }}>
          {formatAmount(item.Amount)}
        </Text>
      ),
    },
    {
      key: "status",
      name: "Status",
      minWidth: 110,
      maxWidth: 130,
      isResizable: true,
      onRender: (item: ExpenseRecord) => (
        <StatusBadge status={getStatus(item)} />
      ),
    },
    {
      key: "submittedBy",
      name: "Submitted By",
      minWidth: 150,
      maxWidth: 180,
      isResizable: true,
      onRender: (item: ExpenseRecord) => (
        <Text>{item.Author?.DisplayName ?? "-"}</Text>
      ),
    },
    {
      key: "approver",
      name: "Approver",
      minWidth: 150,
      maxWidth: 180,
      isResizable: true,
      onRender: (item: ExpenseRecord) => (
        <Text>{item.Approver?.DisplayName ?? "-"}</Text>
      ),
    },
  ];

  return (
    <>
      <div className="summary-grid">
        <SummaryCard
          label="Pending"
          value={pendingCount}
          note="Waiting for approval"
        />
        <SummaryCard
          label="Approved"
          value={approvedCount}
          note="Approved or auto approved"
        />
        <SummaryCard
          label="Rejected"
          value={rejectedCount}
          note="Needs changes before resubmission"
        />
        <SummaryCard
          label="My manager"
          value={managerName || "Unavailable"}
          note={managerEmail || "Manager email could not be resolved"}
        />
      </div>

      <div className="expenses-toolbar">
        <div className="expenses-toolbar-left">
          <PrimaryButton
            text="New expense"
            iconProps={{ iconName: "Add" }}
            onClick={onNewExpense}
            disabled={loadingUserContext}
          />
          <DefaultButton
            text="Refresh"
            iconProps={{ iconName: "Refresh" }}
            onClick={onRefresh}
          />
          <DefaultButton
            text="Delete selected"
            iconProps={{ iconName: "Delete" }}
            disabled={!selectedItem || !canDeleteSelected}
            onClick={onDeleteSelected}
          />
        </div>

        <div className="expenses-toolbar-right">
          <Dropdown
            label="Sort"
            selectedKey={sortMode}
            options={SORT_OPTIONS as IDropdownOption[]}
            onChange={(_, option) =>
              onSortChange((option?.key as SortMode) ?? "newest")
            }
            styles={{ dropdown: { width: 220 } }}
          />
        </div>
      </div>

      <div className="expenses-table-card">
        <div className="table-card-header">
          <Text className="panel-card-title">Expense requests</Text>
          <Text className="panel-card-subtitle">
            Click any title or select a row to open the expense panel.
          </Text>
        </div>

        <div className="expense-list-container">
          {loading ? (
            <Stack
              horizontalAlign="center"
              styles={{ root: { padding: "48px 24px" } }}
            >
              <Text variant="large" styles={{ root: { marginBottom: 8 } }}>
                Loading expenses...
              </Text>
              <Text variant="small">
                Please wait while the latest items are loaded.
              </Text>
            </Stack>
          ) : (
            <DetailsList
              items={items}
              columns={columns}
              selectionMode={SelectionMode.single}
              selection={selection}
              layoutMode={DetailsListLayoutMode.justified}
              setKey="expense-list"
              getKey={(item: ExpenseRecord, index?: number) =>
                item?.ID != null ? String(item.ID) : `row-${index ?? 0}`
              }
              isHeaderVisible
              onItemInvoked={(item) => onOpenExpense(item as ExpenseRecord)}
            />
          )}

          {!loading && items.length === 0 && (
            <Stack
              horizontalAlign="center"
              styles={{ root: { padding: "48px 24px" } }}
            >
              <Text variant="large" styles={{ root: { marginBottom: 8 } }}>
                No expenses found
              </Text>
              <Text variant="small">
                Create the first expense from the toolbar above.
              </Text>
            </Stack>
          )}
        </div>
      </div>
    </>
  );
}
