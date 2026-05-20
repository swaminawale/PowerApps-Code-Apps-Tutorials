import type { IDropdownOption } from "@fluentui/react";

export const SITE_URL = "https://swami01.sharepoint.com/sites/Playground";
export const LIST_NAME = "c714d986-c8d9-4690-9407-87adf2fdd4c6";
export const APPROVER_FIELD_NAME = "Approver";
export const EXPENSE_APP_BASE_URL =
  "https://apps.powerapps.com/play/e/default-a5d6d2a6-a034-4767-b0c3-5c2ddc131138/app/02f22ac4-ff20-4209-af5d-580067a11b50?tenantId=a5d6d2a6-a034-4767-b0c3-5c2ddc131138&sourcehint=1&hint=2af871d7-26fa-48d7-a203-b9bcdd2cba94";

const buildExpenseAppLink = (expenseId?: number): string => {
  if (expenseId == null) {
    return EXPENSE_APP_BASE_URL;
  }

  return `${EXPENSE_APP_BASE_URL}&id=${encodeURIComponent(String(expenseId))}`;
};

export const CATEGORY_OPTIONS: IDropdownOption[] = [
  { key: "Travel", text: "Travel" },
  { key: "Meals & Entertainment", text: "Meals & Entertainment" },
  { key: "Office & Supplies", text: "Office & Supplies" },
  { key: "Technology & Software", text: "Technology & Software" },
  {
    key: "Client & Business Development",
    text: "Client & Business Development",
  },
  { key: "Health & Wellness", text: "Health & Wellness" },
  { key: "Miscellaneous", text: "Miscellaneous" },
];

export const SORT_OPTIONS: IDropdownOption[] = [
  { key: "newest", text: "Newest first" },
  { key: "highest", text: "Highest amount first" },
  { key: "lowest", text: "Lowest amount first" },
  { key: "expenseDate", text: "Latest expense date first" },
  { key: "oldestDate", text: "Oldest expense date first" },
];

export const CATEGORY_COLORS = [
  "#0f6cbd",
  "#198754",
  "#c27c0e",
  "#a4262c",
  "#5c2d91",
  "#007d84",
  "#6b7280",
];

export const STATUS_COLORS: Record<
  string,
  { bg: string; color: string; chartColor: string }
> = {
  Pending: { bg: "#FFF4CE", color: "#7F5A00", chartColor: "#c27c0e" },
  Approved: {
    bg: "#DFF6DD",
    color: "#107C10",
    chartColor: "#198754",
  },
  Rejected: {
    bg: "#FDE7E9",
    color: "#A4262C",
    chartColor: "#d13438",
  },
  "Auto approved": {
    bg: "#EFF6FC",
    color: "#0078D4",
    chartColor: "#0f6cbd",
  },
};

export type AppView = "dashboard" | "expenses";
export type SortMode =
  | "newest"
  | "highest"
  | "lowest"
  | "expenseDate"
  | "oldestDate";
export type ApprovalAction = "Approved" | "Rejected";

export interface ChoiceValue {
  Value: string;
}

export interface PersonValue {
  DisplayName?: string;
  Email?: string;
  Claims?: string;
}

export interface ExpenseRecord {
  key?: string;
  ID: number;
  Title: string;
  Detail?: string;
  ExpenseDate?: string;
  Amount?: number;
  ApprovalStatus?: ChoiceValue;
  ApproverComment?: string;
  Approver?: PersonValue;
  Category?: ChoiceValue;
  Author?: PersonValue;
  Created?: string;
}

export interface ExpenseFormState {
  Title: string;
  Detail: string;
  expenseDate: Date | undefined;
  Amount: string;
  Category: string;
  ApproverName: string;
}

export interface ChartSlice {
  label: string;
  value: number;
  color: string;
}

export interface MonthlyDataPoint {
  label: string;
  totalAmount: number;
  itemCount: number;
}

export interface ChangeIndicator {
  amount: number;
  percentage: number;
  direction: "up" | "down" | "flat";
  label: string;
  tone: "positive" | "negative" | "neutral";
}

export const createEmptyForm = (approverName = ""): ExpenseFormState => ({
  Title: "",
  Detail: "",
  expenseDate: undefined,
  Amount: "",
  Category: "Miscellaneous",
  ApproverName: approverName,
});

export const getStatus = (item: ExpenseRecord): string =>
  item.ApprovalStatus?.Value ?? "Pending";

export const getCategory = (item: ExpenseRecord): string =>
  item.Category?.Value ?? "Uncategorized";

export const formatDate = (dateStr?: string): string => {
  if (!dateStr) {
    return "-";
  }

  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatAmount = (amount?: number): string => {
  if (amount === undefined || amount === null) {
    return "$0.00";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

export const normalizeEmail = (value?: string): string =>
  (value ?? "").trim().toLowerCase();

export const getRecordDate = (item: ExpenseRecord): Date | null => {
  const sourceDate = item.ExpenseDate ?? item.Created;

  if (!sourceDate) {
    return null;
  }

  const date = new Date(sourceDate);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getDaysAgoDate = (daysAgo: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
};

export const getChangeIndicator = (
  currentValue: number,
  previousValue: number,
): ChangeIndicator => {
  const amount = currentValue - previousValue;

  if (previousValue === 0) {
    if (currentValue === 0) {
      return {
        amount: 0,
        percentage: 0,
        direction: "flat",
        label: "0% vs last month",
        tone: "neutral",
      };
    }

    return {
      amount,
      percentage: 100,
      direction: "up",
      label: "+100% vs last month",
      tone: "positive",
    };
  }

  const percentage = Math.round((amount / previousValue) * 100);

  if (percentage === 0) {
    return {
      amount,
      percentage,
      direction: "flat",
      label: "0% vs last month",
      tone: "neutral",
    };
  }

  return {
    amount,
    percentage,
    direction: percentage > 0 ? "up" : "down",
    label: `${percentage > 0 ? "+" : ""}${percentage}% vs last month`,
    tone: percentage > 0 ? "positive" : "negative",
  };
};

export const matchesPerson = (
  person: PersonValue | undefined,
  userEmail: string,
): boolean => {
  if (!person || !userEmail) {
    return false;
  }

  const email = normalizeEmail(person.Email);
  const claims = normalizeEmail(person.Claims);

  return email === userEmail || claims.includes(userEmail);
};

export const buildMonthlySpend = (
  items: ExpenseRecord[],
): MonthlyDataPoint[] => {
  const now = new Date();
  const points: MonthlyDataPoint[] = [];

  for (let offset = 5; offset >= 0; offset -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const monthItems = items.filter((item) => {
      const itemDate = getRecordDate(item);

      return (
        itemDate !== null &&
        itemDate.getMonth() === monthDate.getMonth() &&
        itemDate.getFullYear() === monthDate.getFullYear()
      );
    });

    points.push({
      label: monthDate.toLocaleDateString("en-US", { month: "short" }),
      totalAmount: monthItems.reduce(
        (sum, item) => sum + (item.Amount ?? 0),
        0,
      ),
      itemCount: monthItems.length,
    });
  }

  return points;
};

export const sortExpenses = (
  items: ExpenseRecord[],
  sortMode: SortMode,
): ExpenseRecord[] => {
  return [...items].sort((leftItem, rightItem) => {
    if (sortMode === "highest") {
      return (rightItem.Amount ?? 0) - (leftItem.Amount ?? 0);
    }

    if (sortMode === "lowest") {
      return (leftItem.Amount ?? 0) - (rightItem.Amount ?? 0);
    }

    const leftDate = getRecordDate(leftItem)?.getTime() ?? 0;
    const rightDate = getRecordDate(rightItem)?.getTime() ?? 0;

    if (sortMode === "expenseDate") {
      return rightDate - leftDate;
    }

    if (sortMode === "oldestDate") {
      return leftDate - rightDate;
    }

    return rightItem.ID - leftItem.ID;
  });
};

export const normalizeExpenseRecord = (
  item: {
    dynamicProperties?: Record<string, unknown>;
  } & Partial<ExpenseRecord>,
): ExpenseRecord | null => {
  const source = item.dynamicProperties ?? item;
  const id = source.ID;

  if (typeof id !== "number") {
    return null;
  }

  return {
    key: String(id),
    ID: id,
    Title: String(source.Title ?? ""),
    Detail: typeof source.Detail === "string" ? source.Detail : undefined,
    ExpenseDate:
      typeof source.ExpenseDate === "string" ? source.ExpenseDate : undefined,
    Amount: typeof source.Amount === "number" ? source.Amount : undefined,
    ApprovalStatus:
      typeof source.ApprovalStatus === "object" && source.ApprovalStatus
        ? (source.ApprovalStatus as ChoiceValue)
        : undefined,
    ApproverComment:
      typeof source.ApproverComment === "string"
        ? source.ApproverComment
        : undefined,
    Approver:
      typeof source.Approver === "object" && source.Approver
        ? (source.Approver as PersonValue)
        : undefined,
    Category:
      typeof source.Category === "object" && source.Category
        ? (source.Category as ChoiceValue)
        : undefined,
    Author:
      typeof source.Author === "object" && source.Author
        ? (source.Author as PersonValue)
        : undefined,
    Created: typeof source.Created === "string" ? source.Created : undefined,
  };
};

export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const buildExpenseSummaryTable = (expense: ExpenseRecord): string => `
  <table style="width:100%;border-collapse:collapse;background:#faf9f8;border-radius:12px;overflow:hidden;">
    <tr>
      <td style="padding:12px 16px;font-weight:600;color:#605e5c;width:38%;border-bottom:1px solid #edebe9;">Title</td>
      <td style="padding:12px 16px;color:#201f1e;border-bottom:1px solid #edebe9;">${expense.Title}</td>
    </tr>
    <tr>
      <td style="padding:12px 16px;font-weight:600;color:#605e5c;width:38%;border-bottom:1px solid #edebe9;">Amount</td>
      <td style="padding:12px 16px;color:#201f1e;border-bottom:1px solid #edebe9;">${formatAmount(expense.Amount)}</td>
    </tr>
    <tr>
      <td style="padding:12px 16px;font-weight:600;color:#605e5c;width:38%;border-bottom:1px solid #edebe9;">Category</td>
      <td style="padding:12px 16px;color:#201f1e;border-bottom:1px solid #edebe9;">${getCategory(expense)}</td>
    </tr>
    <tr>
      <td style="padding:12px 16px;font-weight:600;color:#605e5c;width:38%;border-bottom:1px solid #edebe9;">Expense date</td>
      <td style="padding:12px 16px;color:#201f1e;border-bottom:1px solid #edebe9;">${formatDate(expense.ExpenseDate)}</td>
    </tr>
    <tr>
      <td style="padding:12px 16px;font-weight:600;color:#605e5c;width:38%;">Details</td>
      <td style="padding:12px 16px;color:#201f1e;">${expense.Detail || "No additional details provided."}</td>
    </tr>
  </table>
`;

export const extractPersonEmail = (person?: PersonValue): string => {
  const email = normalizeEmail(person?.Email);

  if (email) {
    return email;
  }

  const claims = person?.Claims ?? "";
  const claimParts = claims.split("|");
  return normalizeEmail(claimParts[claimParts.length - 1]);
};

export const buildApprovalEmail = (
  expense: ExpenseRecord,
  submitterName: string,
  managerName: string,
  expenseId?: number,
): string => {
  const appLink = buildExpenseAppLink(expenseId);

  return `
    <div style="font-family:Segoe UI,Arial,sans-serif;background:#f5f7fb;padding:24px;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e1dfdd;border-radius:16px;overflow:hidden;">
        <div style="background:#0f6cbd;color:#ffffff;padding:24px 28px;">
          <div style="font-size:13px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.8;">Expense Approval</div>
          <div style="font-size:28px;font-weight:700;margin-top:6px;">New expense needs your review</div>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 16px;font-size:15px;color:#201f1e;">Hi ${managerName || "Manager"},</p>
          <p style="margin:0 0 20px;font-size:15px;color:#323130;line-height:1.6;">
            ${submitterName} submitted a new expense request. The summary is below.
          </p>
          ${buildExpenseSummaryTable(expense)}
          <div style="margin-top:24px;">
            <a href="${appLink}" style="display:inline-block;background:#0f6cbd;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600;">Open Expense App</a>
          </div>
        </div>
      </div>
    </div>
  `;
};

export const buildDecisionEmail = (
  expense: ExpenseRecord,
  submitterName: string,
  decision: "Approved" | "Rejected",
  approverName: string,
  comment?: string,
  expenseId?: number,
): string => {
  const isApproved = decision === "Approved";
  const accentColor = isApproved ? "#198754" : "#d13438";
  const appLink = buildExpenseAppLink(expenseId);

  return `
    <div style="font-family:Segoe UI,Arial,sans-serif;background:#f5f7fb;padding:24px;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e1dfdd;border-radius:16px;overflow:hidden;">
        <div style="background:${accentColor};color:#ffffff;padding:24px 28px;">
          <div style="font-size:13px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.84;">Expense ${decision}</div>
          <div style="font-size:28px;font-weight:700;margin-top:6px;">Your expense was ${decision.toLowerCase()}</div>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 16px;font-size:15px;color:#201f1e;">Hi ${submitterName || "there"},</p>
          <p style="margin:0 0 20px;font-size:15px;color:#323130;line-height:1.6;">
            ${approverName || "Your approver"} ${isApproved ? "approved" : "rejected"} your expense request.
          </p>
          ${buildExpenseSummaryTable(expense)}
          <div style="margin-top:16px;padding:16px;border-radius:12px;background:${isApproved ? "#eef8f2" : "#fff1f1"};border:1px solid ${isApproved ? "#cfe9d7" : "#f1c7c7"};">
            <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#605e5c;">Approver comment</div>
            <div style="margin-top:8px;font-size:14px;color:#201f1e;line-height:1.6;">${comment?.trim() || "No comment was added."}</div>
          </div>
          <div style="margin-top:24px;">
            <a href="${appLink}" style="display:inline-block;background:${accentColor};color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600;">Open Expense App</a>
          </div>
        </div>
      </div>
    </div>
  `;
};
