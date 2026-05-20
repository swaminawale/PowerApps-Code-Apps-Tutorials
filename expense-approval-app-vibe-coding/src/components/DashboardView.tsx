import { Text, IconButton } from "@fluentui/react";
import {
  buildMonthlySpend,
  CATEGORY_COLORS,
  type ChangeIndicator,
  type ChartSlice,
  type ExpenseRecord,
  formatAmount,
  formatDate,
  getCategory,
  getChangeIndicator,
  getStatus,
  matchesPerson,
  STATUS_COLORS,
} from "../expenseApp/shared";

interface DashboardViewProps {
  items: ExpenseRecord[];
  currentUserEmail: string;
  onOpenExpense?: (item: ExpenseRecord) => void;
}

const SummaryCard = ({
  label,
  value,
  note,
  indicator,
}: {
  label: string;
  value: string | number;
  note: string;
  indicator?: ChangeIndicator;
}) => (
  <div className="summary-card">
    <Text className="summary-card-label">{label}</Text>
    <Text className="summary-card-value">{value}</Text>
    <Text className="summary-card-note">{note}</Text>
    {indicator && (
      <Text
        className={`summary-card-change summary-card-change-${indicator.tone}`}
      >
        {indicator.direction === "up"
          ? "▲"
          : indicator.direction === "down"
            ? "▼"
            : "■"}{" "}
        {indicator.label}
      </Text>
    )}
  </div>
);

const PieChartCard = ({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle: string;
  data: ChartSlice[];
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let progress = 0;

  return (
    <div className="panel-card">
      <div className="panel-card-header">
        <Text className="panel-card-title">{title}</Text>
        <Text className="panel-card-subtitle">{subtitle}</Text>
      </div>

      <div className="pie-card-body">
        <svg viewBox="0 0 42 42" className="pie-chart">
          <circle className="pie-chart-track" cx="21" cy="21" r="15.915" />
          {data.length === 0 && (
            <circle className="pie-chart-empty" cx="21" cy="21" r="15.915" />
          )}
          {data.map((item) => {
            const sliceSize = total === 0 ? 0 : (item.value / total) * 100;
            const segment = (
              <circle
                key={item.label}
                className="pie-chart-segment"
                cx="21"
                cy="21"
                r="15.915"
                stroke={item.color}
                strokeDasharray={`${sliceSize} ${100 - sliceSize}`}
                strokeDashoffset={25 - progress}
              />
            );

            progress += sliceSize;
            return segment;
          })}
          <text x="21" y="19" className="pie-chart-total">
            {total}
          </text>
          <text x="21" y="24" className="pie-chart-label">
            items
          </text>
        </svg>

        <div className="pie-legend">
          {data.length === 0 && (
            <Text className="empty-text">No data available.</Text>
          )}
          {data.map((item) => (
            <div key={item.label} className="legend-row">
              <span className="legend-dot" style={{ background: item.color }} />
              <Text className="legend-label">{item.label}</Text>
              <Text className="legend-value">{item.value}</Text>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const TrendCard = ({
  data,
}: {
  data: ReturnType<typeof buildMonthlySpend>;
}) => {
  const maxAmount = Math.max(...data.map((item) => item.totalAmount), 1);

  return (
    <div className="panel-card panel-card-wide">
      <div className="panel-card-header">
        <Text className="panel-card-title">Spend trend</Text>
        <Text className="panel-card-subtitle">
          Last 6 months by expense date
        </Text>
      </div>

      <div className="trend-chart">
        {data.map((item) => (
          <div key={item.label} className="trend-column">
            <Text className="trend-amount">
              {formatAmount(item.totalAmount)}
            </Text>
            <div className="trend-bar-shell">
              <div
                className="trend-bar-fill"
                style={{
                  height: `${Math.max(
                    (item.totalAmount / maxAmount) * 100,
                    item.totalAmount > 0 ? 12 : 0,
                  )}%`,
                }}
              />
            </div>
            <Text className="trend-label">{item.label}</Text>
            <Text className="trend-count">{item.itemCount} items</Text>
          </div>
        ))}
      </div>
    </div>
  );
};

const PendingApprovalsCard = ({
  items,
  currentUserEmail,
  onOpenExpense,
}: {
  items: ExpenseRecord[];
  currentUserEmail: string;
  onOpenExpense?: (item: ExpenseRecord) => void;
}) => {
  const myPendingItems = items.filter(
    (item) =>
      matchesPerson(item.Approver, currentUserEmail) &&
      getStatus(item) === "Pending",
  );

  if (myPendingItems.length === 0) {
    return null;
  }

  return (
    <div className="panel-card">
      <div className="panel-card-header">
        <Text className="panel-card-title">Pending approvals</Text>
        <Text className="panel-card-subtitle">
          {myPendingItems.length} awaiting your action
        </Text>
      </div>
      <div className="quick-action-list">
        {myPendingItems.slice(0, 5).map((item) => (
          <div key={item.ID} className="quick-action-item">
            <div className="quick-action-content">
              <Text className="quick-action-title">{item.Title}</Text>
              <Text className="quick-action-meta">
                {item.ExpenseDate ? formatDate(item.ExpenseDate) : "No date"} •{" "}
                {formatAmount(item.Amount ?? 0)}
              </Text>
            </div>
            <div className="quick-action-button">
              <IconButton
                iconProps={{ iconName: "ChevronRight" }}
                title="Open"
                onClick={() => onOpenExpense?.(item)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export function DashboardView({
  items,
  currentUserEmail,
  onOpenExpense,
}: DashboardViewProps) {
  const pendingCount = items.filter(
    (item) => getStatus(item) === "Pending",
  ).length;
  const approvedCount = items.filter((item) =>
    ["Approved", "Auto approved"].includes(getStatus(item)),
  ).length;
  const rejectedCount = items.filter(
    (item) => getStatus(item) === "Rejected",
  ).length;
  const totalAmount = items.reduce((sum, item) => sum + (item.Amount ?? 0), 0);

  const monthlySpend = buildMonthlySpend(items);
  const currentMonthSpend =
    monthlySpend[monthlySpend.length - 1]?.totalAmount ?? 0;
  const previousMonthSpend =
    monthlySpend[monthlySpend.length - 2]?.totalAmount ?? 0;
  const spendChange = getChangeIndicator(currentMonthSpend, previousMonthSpend);
  const myApprovalsPending = items.filter(
    (item) =>
      matchesPerson(item.Approver, currentUserEmail) &&
      getStatus(item) === "Pending",
  ).length;

  const categorySlices = Object.entries(
    items.reduce<Record<string, number>>((result, item) => {
      const category = getCategory(item);
      result[category] = (result[category] ?? 0) + 1;
      return result;
    }, {}),
  )
    .map(([label, value], index) => ({
      label,
      value,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }))
    .sort((leftItem, rightItem) => rightItem.value - leftItem.value);

  const statusSlices: ChartSlice[] = [
    {
      label: "Pending",
      value: pendingCount,
      color: STATUS_COLORS.Pending.chartColor,
    },
    {
      label: "Approved",
      value: approvedCount,
      color: STATUS_COLORS.Approved.chartColor,
    },
    {
      label: "Rejected",
      value: rejectedCount,
      color: STATUS_COLORS.Rejected.chartColor,
    },
  ].filter((item) => item.value > 0);

  return (
    <>
      <div className="summary-grid">
        <SummaryCard
          label="Total expenses"
          value={items.length}
          note="All submitted requests"
        />
        <SummaryCard
          label="Total spend"
          value={formatAmount(totalAmount)}
          note="Across all expense records"
        />
        <SummaryCard
          label="This month spend"
          value={formatAmount(currentMonthSpend)}
          note="Compared with last month"
          indicator={spendChange}
        />
        <SummaryCard
          label="Awaiting my action"
          value={myApprovalsPending}
          note={
            myApprovalsPending > 0
              ? "Pending approval decisions"
              : "No pending approvals"
          }
        />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-left">
          <PieChartCard
            title="Expense categories"
            subtitle="How expenses are distributed"
            data={categorySlices}
          />
          <PieChartCard
            title="Approval status"
            subtitle="Current workflow balance"
            data={statusSlices}
          />
          <TrendCard data={monthlySpend} />
        </div>
        <div className="dashboard-right">
          <PendingApprovalsCard
            items={items}
            currentUserEmail={currentUserEmail}
            onOpenExpense={onOpenExpense}
          />
          <div className="panel-card insights-card">
            <div className="panel-card-header">
              <Text className="panel-card-title">Quick insights</Text>
              <Text className="panel-card-subtitle">
                Simple numbers to scan at a glance
              </Text>
            </div>

            <div className="insight-list">
              <div className="insight-row">
                <Text className="insight-label">This month spend</Text>
                <Text className="insight-value">
                  {formatAmount(currentMonthSpend)}
                </Text>
              </div>
              <div className="insight-row">
                <Text className="insight-label">Previous month spend</Text>
                <Text className="insight-value">
                  {formatAmount(previousMonthSpend)}
                </Text>
              </div>
              <div className="insight-row">
                <Text className="insight-label">Approved expenses</Text>
                <Text className="insight-value">{approvedCount}</Text>
              </div>
              <div className="insight-row">
                <Text className="insight-label">Rejected expenses</Text>
                <Text className="insight-value">{rejectedCount}</Text>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
