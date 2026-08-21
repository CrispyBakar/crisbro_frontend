import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormInput, Panel, Select, TableScrollArea } from "./adminUiPrimitives";

type ReferralStatus = "pending" | "added";

type ReferralUsage = {
  id: number;
  ownerPhoneNumber: string;
  userPhoneNumber: string;
  usedAt: string;
  status: ReferralStatus;
};

// Data sengaja kosong sampai endpoint referral tersedia. Seluruh interaksi
// filter tetap berjalan di frontend dan siap menerima hasil API nantinya.
const referralUsages: ReferralUsage[] = [];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AdminReferralCodesTab() {
  const [phoneSearch, setPhoneSearch] = useState("");
  const [status, setStatus] = useState<"all" | ReferralStatus>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filteredRows = useMemo(() => {
    const query = phoneSearch.replace(/\D/g, "");
    return referralUsages.filter((row) => {
      const matchesPhone =
        !query ||
        row.ownerPhoneNumber.replace(/\D/g, "").includes(query) ||
        row.userPhoneNumber.replace(/\D/g, "").includes(query);
      const matchesStatus = status === "all" || row.status === status;
      const usedDate = row.usedAt.slice(0, 10);
      return matchesPhone && matchesStatus && (!from || usedDate >= from) && (!to || usedDate <= to);
    });
  }, [from, phoneSearch, status, to]);

  function resetFilters() {
    setPhoneSearch("");
    setStatus("all");
    setFrom("");
    setTo("");
  }

  return (
    <Panel title="Penggunaan Kode Referral">
      <p className="mb-5 text-sm text-muted-foreground">
        Pantau kode referral yang digunakan customer saat proses registrasi.
      </p>

      <div className="mb-5 grid items-end gap-3 md:grid-cols-2 lg:grid-cols-5">
        <FormInput
          label="Cari Nomor HP"
          value={phoneSearch}
          onChange={setPhoneSearch}
          type="tel"
          placeholder="Contoh: 0812..."
        />
        <FormInput label="Dari Tanggal" value={from} onChange={setFrom} type="date" />
        <FormInput label="Sampai Tanggal" value={to} onChange={setTo} type="date" />
        <Select
          label="Status"
          value={status}
          onChange={(value) => setStatus(value as "all" | ReferralStatus)}
          options={[
            { value: "all", label: "Semua status" },
            { value: "pending", label: "Menunggu ditambahkan" },
            { value: "added", label: "Telah ditambahkan" },
          ]}
        />
        <Button type="button" variant="outline" onClick={resetFilters} className="mb-3">
          Reset Filter
        </Button>
      </div>

      <TableScrollArea>
        <table className="min-w-215 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="p-3 font-black">No.</th>
              <th className="p-3 font-black">Nomor HP Pemilik Kode</th>
              <th className="p-3 font-black">Nomor HP Pengguna Kode</th>
              <th className="p-3 font-black">Tanggal Digunakan</th>
              <th className="p-3 font-black">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-muted-foreground">
                  <Search className="mx-auto mb-3 h-8 w-8 opacity-50" />
                  Belum ada penggunaan kode referral yang sesuai filter.
                </td>
              </tr>
            ) : (
              filteredRows.map((row, index) => (
                <tr key={row.id} className="border-b border-border/70">
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3 font-semibold">{row.ownerPhoneNumber}</td>
                  <td className="p-3 font-semibold">{row.userPhoneNumber}</td>
                  <td className="p-3">{formatDate(row.usedAt)}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                        row.status === "added"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      {row.status === "added" ? "Telah ditambahkan" : "Menunggu ditambahkan"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableScrollArea>
    </Panel>
  );
}
