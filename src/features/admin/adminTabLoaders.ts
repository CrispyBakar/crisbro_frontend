export const adminTabLoaders = {
  activity: () => import("./AdminActivityTab"),
  report: () => import("./AdminReportTab"),
  sales: () => import("./AdminSalesTransactionsTab"),
  users: () => import("./AdminUsersTab"),
  customers: () => import("./AdminCustomersTab"),
  referrals: () => import("./AdminReferralCodesTab"),
  notifications: () => import("./AdminNotificationsTab"),
  redeem: () => import("./AdminRedeemTab"),
};
