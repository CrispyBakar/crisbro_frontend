import { Gift, RefreshCw, UserPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Customer } from "@/services/customers";

export type CustomerActivity = {
  icon: LucideIcon;
  title: string;
  description: string;
  timestamp: string;
};

export const formatDateWIB = (iso: string) => {
  const date = new Date(iso);

  return (
    new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    })
      .format(date)
      .replace(",", ",") + " WIB"
  );
};

export const formatRupiah = (value: number) =>
  `Rp ${new Intl.NumberFormat("id-ID").format(value)}`;

export const formatPoint = (pointType: string | null, point: number) => {
  if (pointType === "earned") return `+ ${point} point`;
  if (pointType === "redeemed") return `- ${Math.abs(point)} point`;

  return `${point} point`;
};

export const getPointColor = (pointType: string | null, point: number) =>
  pointType === "redeemed" || point < 0 ? "text-red-500" : "text-success";

export const getCustomerInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("") || "-";

export const buildCustomerActivities = (
  customer: Customer,
): CustomerActivity[] => {
  const activities: CustomerActivity[] = [];

  if (customer.runchise_synced_at) {
    activities.push({
      icon: RefreshCw,
      title: "Customer disinkronkan",
      description: "Data diperbarui dari Runchise",
      timestamp: customer.runchise_synced_at,
    });
  }

  if (customer.available_point > 0) {
    activities.push({
      icon: Gift,
      title: `${customer.available_point} poin diterima`,
      description: `Poin tersedia saat ini: ${customer.available_point}`,
      timestamp: customer.member_since ?? customer.created_at,
    });
  }

  activities.push({
    icon: UserPlus,
    title: "Customer dibuat",
    description: `Profil ${customer.name} ditambahkan`,
    timestamp: customer.created_at,
  });

  return activities;
};
