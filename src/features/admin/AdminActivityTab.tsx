import { Button } from "@/components/ui/button";
import type { AdminActivityLog } from "@/lib/admin";
import { dateTimeFormat, numberFormat } from "./adminFormatters";
import { FormInput, Panel, TableScrollArea } from "./adminUiPrimitives";

// H-5: Tab Activity Log dipecah menjadi modul lazy terpisah yang tetap presentational dan menerima state lewat props, sehingga mengurangi ukuran bundle tanpa mengubah state atau biaya re-render di AdminPage.

function compactJson(value: unknown) {
  if (value === null || value === undefined) return "-";
  const text = JSON.stringify(value);
  if (!text) return "-";
  return text.length > 140 ? `${text.slice(0, 140)}...` : text;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizeAuditValue(value: unknown) {
  return value === undefined || value === "" ? null : value;
}

function auditValuesEqual(before: unknown, after: unknown) {
  return JSON.stringify(normalizeAuditValue(before)) === JSON.stringify(normalizeAuditValue(after));
}

function sortedAuditLocationIds(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => (isRecord(item) ? Number(item.location_id) : Number(item)))
    .filter((locationId) => Number.isInteger(locationId))
    .sort((a, b) => a - b);
}

function isNoisyLegacyCustomerChangedFields(value: unknown) {
  return Array.isArray(value) && value.map(String).includes("last_updated_by_id");
}

function actualCustomerChangedFields(log?: AdminActivityLog) {
  if (log?.action !== "update_customer" || log.entity_type !== "customer") return [];
  if (!isRecord(log.before) || !isRecord(log.after)) return [];

  const customerFields = [
    "name",
    "phone_number",
    "phone_number_country_code",
    "address",
    "province",
    "city",
    "country",
    "postal_code",
    "dob",
    "gender",
    "status",
    "balance",
    "brand_id",
    "owner_location_id",
  ];
  const before = isRecord(log.before) ? log.before : {};
  const after = isRecord(log.after) ? log.after : {};
  const changedFields = customerFields.filter(
    (field) => !auditValuesEqual(before[field], after[field]),
  );

  const beforeUser = isRecord(before.user) ? before.user : {};
  const afterUser = isRecord(after.user) ? after.user : {};
  for (const field of ["phone_number", "email"]) {
    if (!auditValuesEqual(beforeUser[field], afterUser[field])) {
      changedFields.push(`user.${field}`);
    }
  }

  const beforePoint = isRecord(before.customer_point) ? before.customer_point : {};
  const afterPoint = isRecord(log.after.customer_point) ? log.after.customer_point : {};
  for (const field of ["total_point", "available_point"]) {
    if (!auditValuesEqual(beforePoint[field], afterPoint[field])) {
      changedFields.push(`point.${field}`);
    }
  }

  if (
    !auditValuesEqual(
      sortedAuditLocationIds(log.before.customer_locations),
      sortedAuditLocationIds(log.after.customer_locations),
    )
  ) {
    changedFields.push("location_ids");
  }

  return changedFields;
}

function metadataLabels(value: unknown, log?: AdminActivityLog) {
  if (!isRecord(value)) return [];

  const labels: Array<{ label: string; value: string; tone?: "success" | "warning" | "danger" }> =
    [];
  const sync = value.runchise_sync;
  if (isRecord(sync)) {
    const status = typeof sync.status === "string" ? sync.status : "";
    labels.push({
      label: "Sync Runchise",
      value:
        status === "synced"
          ? "Berhasil"
          : status === "failed"
            ? "Gagal"
            : status === "skipped"
              ? "Dilewati"
              : status || "-",
      tone: status === "synced" ? "success" : status === "failed" ? "danger" : "warning",
    });

    if (typeof sync.runchise_customer_id === "number") {
      labels.push({ label: "ID Runchise", value: String(sync.runchise_customer_id) });
    }
    if (sync.updated_existing === true) {
      labels.push({ label: "Aksi Runchise", value: "Update data yang sudah ada" });
    } else if (sync.matched_existing === true) {
      labels.push({ label: "Aksi Runchise", value: "Cocokkan data yang sudah ada" });
    }
    if (typeof sync.error === "string") {
      labels.push({ label: "Error Sync", value: sync.error, tone: "danger" });
    }
  }

  const activationEmail = value.activation_email;
  if (isRecord(activationEmail)) {
    const sent = activationEmail.sent === true;
    const skipped = activationEmail.skipped === true;
    labels.push({
      label: "Email Aktivasi",
      value: sent ? "Terkirim" : skipped ? "Dilewati" : "Gagal/belum terkirim",
      tone: sent ? "success" : skipped ? "warning" : "danger",
    });
    if (typeof activationEmail.error === "string") {
      labels.push({ label: "Error Email", value: activationEmail.error, tone: "danger" });
    }
    if (typeof activationEmail.reason === "string") {
      labels.push({ label: "Alasan Email", value: activationEmail.reason });
    }
  }

  const actualChangedFields = actualCustomerChangedFields(log);
  const metadataChangedFields = value.changed_fields;
  if (isNoisyLegacyCustomerChangedFields(metadataChangedFields)) {
    labels.push({
      label: "Field Berubah",
      value: actualChangedFields.length
        ? actualChangedFields.join(", ")
        : "Log lama sebelum perbaikan metadata, daftar field belum akurat",
      tone: "warning",
    });
  } else if (Array.isArray(metadataChangedFields) && metadataChangedFields.length > 0) {
    labels.push({
      label: "Field Berubah",
      value: metadataChangedFields.map(String).join(", "),
    });
  }

  return labels;
}

function metadataToneClass(tone?: "success" | "warning" | "danger") {
  if (tone === "success") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700";
  if (tone === "danger") return "border-red-500/20 bg-red-500/10 text-red-700";
  if (tone === "warning") return "border-amber-500/20 bg-amber-500/10 text-amber-700";
  return "border-border bg-muted text-muted-foreground";
}

function ActivityMetadata({ log }: { log: AdminActivityLog }) {
  const value = log.metadata;
  const labels = metadataLabels(value, log);

  if (labels.length === 0) {
    return (
      <code
        className="block max-h-24 overflow-auto rounded-md bg-muted px-2 py-1 font-mono text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap break-words"
        title={compactJson(value)}
      >
        {compactJson(value)}
      </code>
    );
  }

  return (
    <div className="flex max-h-28 flex-col gap-1 overflow-auto pr-1">
      {labels.map((item) => (
        <span
          key={`${item.label}:${item.value}`}
          className={`rounded-md border px-2 py-1 text-[11px] font-semibold leading-snug ${metadataToneClass(
            item.tone,
          )}`}
          title={`${item.label}: ${item.value}`}
        >
          <span className="font-black">{item.label}:</span> {item.value}
        </span>
      ))}
    </div>
  );
}

export default function AdminActivityTab({
  logs,
  search,
  onSearchChange,
  action,
  onActionChange,
  entityType,
  onEntityTypeChange,
  from,
  onFromChange,
  to,
  onToChange,
  page,
  totalPages,
  total,
  loading,
  onLoadPage,
}: {
  logs: AdminActivityLog[];
  search: string;
  onSearchChange: (value: string) => void;
  action: string;
  onActionChange: (value: string) => void;
  entityType: string;
  onEntityTypeChange: (value: string) => void;
  from: string;
  onFromChange: (value: string) => void;
  to: string;
  onToChange: (value: string) => void;
  page: number;
  totalPages: number;
  total: number;
  loading: boolean;
  onLoadPage: (page: number) => void;
}) {
  return (
    <section>
      <Panel title="Activity Log Admin & Marketing">
        <div className="mb-4 grid gap-3 md:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_auto] md:items-end">
          <FormInput label="Search" value={search} onChange={onSearchChange} />
          <FormInput
            label="Action"
            value={action}
            onChange={onActionChange}
            placeholder="update_customer"
          />
          <FormInput
            label="Entity"
            value={entityType}
            onChange={onEntityTypeChange}
            placeholder="customer"
          />
          <FormInput label="Dari" type="date" value={from} onChange={onFromChange} />
          <FormInput label="Hingga" type="date" value={to} onChange={onToChange} />
          <Button
            onClick={() => onLoadPage(1)}
            disabled={loading}
            className="mb-3 rounded-full font-bold"
          >
            Filter
          </Button>
        </div>
        <TableScrollArea>
          <table className="min-w-295 w-full table-fixed text-sm">
            <colgroup>
              <col className="w-37.5" />
              <col className="w-55" />
              <col className="w-47.5" />
              <col className="w-37.5" />
              <col className="w-90" />
              <col className="w-27.5" />
            </colgroup>
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="p-2">Waktu</th>
                <th className="p-2">Actor</th>
                <th className="p-2">Action</th>
                <th className="p-2">Entity</th>
                <th className="p-2">Metadata</th>
                <th className="p-2">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr className="border-t border-border">
                  <td colSpan={6} className="p-8 text-center font-bold">
                    Belum ada activity log
                  </td>
                </tr>
              )}
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-border align-top">
                  <td className="p-2 whitespace-nowrap">{dateTimeFormat(log.created_at)}</td>
                  <td className="p-2">
                    <p
                      className="truncate font-bold"
                      title={log.actor?.email ?? log.actor?.phone_number ?? undefined}
                    >
                      {log.actor?.email ??
                        log.actor?.phone_number ??
                        `User #${log.actor_user_id ?? "-"}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.actor_role ?? log.actor?.role ?? "-"}
                    </p>
                  </td>
                  <td className="p-2 wrap-break-word font-bold">{log.action}</td>
                  <td className="p-2 whitespace-nowrap">
                    {log.entity_type}
                    {log.entity_id ? ` #${log.entity_id}` : ""}
                  </td>
                  <td className="p-2">
                    <ActivityMetadata log={log} />
                  </td>
                  <td className="p-2 whitespace-nowrap text-xs text-muted-foreground">
                    {log.ip_address ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScrollArea>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="font-semibold text-muted-foreground">
            Total {numberFormat(total)} log · Halaman {page} dari {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading || page <= 1}
              onClick={() => onLoadPage(page - 1)}
              className="rounded-full font-bold"
            >
              Sebelumnya
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading || page >= totalPages}
              onClick={() => onLoadPage(page + 1)}
              className="rounded-full font-bold"
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </Panel>
    </section>
  );
}
