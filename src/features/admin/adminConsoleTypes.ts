// L-7: tipe yang dipakai bersama AdminPage.tsx dan AdminConsoleChrome.tsx.
// Dipisah ke file non-komponen agar tidak melanggar
// react-refresh/only-export-components.

export type ConsoleTab =
  | "report"
  | "sales-transactions"
  | "users"
  | "customers"
  | "referral-codes"
  | "notifications"
  | "redeem"
  | "activity";

export type ConfirmDialogState = {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
};
