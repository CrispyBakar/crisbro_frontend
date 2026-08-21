import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Bell, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Panel, TableScrollArea } from "./adminUiPrimitives";

const STORAGE_KEY = "crisbro-notification-schedules-v1";
const DAYS = [
  { value: "mon", short: "Sen", label: "Senin" },
  { value: "tue", short: "Sel", label: "Selasa" },
  { value: "wed", short: "Rab", label: "Rabu" },
  { value: "thu", short: "Kam", label: "Kamis" },
  { value: "fri", short: "Jum", label: "Jumat" },
  { value: "sat", short: "Sab", label: "Sabtu" },
  { value: "sun", short: "Min", label: "Minggu" },
] as const;

type RepeatMode = "daily" | "custom" | "once";
type NotificationSchedule = {
  id: string;
  title: string;
  message: string;
  target: "all";
  repeat: RepeatMode;
  days: string[];
  date: string;
  time: string;
  active: boolean;
  createdAt: string;
};

type FormState = Omit<NotificationSchedule, "id" | "active" | "createdAt">;

const EMPTY_FORM: FormState = {
  title: "",
  message: "",
  target: "all",
  repeat: "daily",
  days: DAYS.map((day) => day.value),
  date: "",
  time: "11:00",
};

function readSchedules(): NotificationSchedule[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function AdminNotificationsTab() {
  const [items, setItems] = useState<NotificationSchedule[]>(readSchedules);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const activeCount = useMemo(() => items.filter((item) => item.active).length, [items]);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function changeRepeat(repeat: RepeatMode) {
    setForm((current) => ({
      ...current,
      repeat,
      days:
        repeat === "daily" ? DAYS.map((day) => day.value) : repeat === "custom" ? current.days : [],
      date: repeat === "once" ? current.date : "",
    }));
  }

  function toggleDay(day: string) {
    setForm((current) => ({
      ...current,
      days: current.days.includes(day)
        ? current.days.filter((value) => value !== day)
        : [...current.days, day],
    }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast.error("Judul dan isi notifikasi wajib diisi.");
      return;
    }
    if (form.repeat === "custom" && form.days.length === 0) {
      toast.error("Pilih minimal satu hari pengiriman.");
      return;
    }
    if (form.repeat === "once" && !form.date) {
      toast.error("Pilih tanggal pengiriman.");
      return;
    }

    if (editingId) {
      setItems((current) =>
        current.map((item) =>
          item.id === editingId
            ? { ...item, ...form, title: form.title.trim(), message: form.message.trim() }
            : item,
        ),
      );
      toast.success("Jadwal notifikasi diperbarui.");
    } else {
      setItems((current) => [
        {
          ...form,
          id: crypto.randomUUID(),
          title: form.title.trim(),
          message: form.message.trim(),
          active: true,
          createdAt: new Date().toISOString(),
        },
        ...current,
      ]);
      toast.success("Notifikasi ditambahkan (tersimpan di browser). ");
    }
    resetForm();
  }

  function editItem(item: NotificationSchedule) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      message: item.message,
      target: item.target,
      repeat: item.repeat,
      days: item.days,
      date: item.date,
      time: item.time,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
      <div>
        <Panel title={editingId ? "Edit Notifikasi" : "Tambah Notifikasi"}>
          <form onSubmit={submit}>
            <div className="space-y-4">
              <Field label="Judul notifikasi" required>
                <Input
                  value={form.title}
                  maxLength={80}
                  onChange={(event) => updateForm("title", event.target.value)}
                  placeholder="Contoh: Waktunya makan siang"
                  className="h-10 rounded-xl border-border bg-background font-medium"
                />
                <p className="mt-1 text-right text-xs text-muted-foreground">
                  {form.title.length}/80
                </p>
              </Field>

              <Field label="Isi notifikasi" required>
                <textarea
                  value={form.message}
                  maxLength={240}
                  onChange={(event) => updateForm("message", event.target.value)}
                  placeholder="Tulis pesan yang akan diterima pelanggan..."
                  className="min-h-24 w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <p className="mt-1 text-right text-xs text-muted-foreground">
                  {form.message.length}/240
                </p>
              </Field>

              <Field label="Target user">
                <Select
                  value={form.target}
                  onValueChange={(value) => updateForm("target", value as "all")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua user</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Pengulangan">
                <Select
                  value={form.repeat}
                  onValueChange={(value) => changeRepeat(value as RepeatMode)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Semua hari</SelectItem>
                    <SelectItem value="custom">Custom hari</SelectItem>
                    <SelectItem value="once">Notifikasi Terjadwal</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {form.repeat === "custom" && (
                <Field label="Pilih hari">
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-7 lg:grid-cols-4 xl:grid-cols-7">
                    {DAYS.map((day) => {
                      const selected = form.days.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          title={day.label}
                          aria-pressed={selected}
                          onClick={() => toggleDay(day.value)}
                          className={`h-10 rounded-xl border text-xs font-black transition-colors ${selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/50"}`}
                        >
                          {day.short}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              )}

              {form.repeat === "once" && (
                <Field label="Tanggal pengiriman" required>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(event) => updateForm("date", event.target.value)}
                    className="h-10 rounded-xl border-border bg-background font-medium"
                  />
                </Field>
              )}

              <Field label="Jam pengiriman" required>
                <Input
                  type="time"
                  value={form.time}
                  onChange={(event) => updateForm("time", event.target.value)}
                  className="h-10 w-24 rounded-xl border-border bg-background font-medium"
                />
              </Field>
            </div>

            <div className="mt-5 flex gap-2">
              <Button type="submit" className="flex-1 rounded-full font-bold">
                <Plus className="h-4 w-4" /> {editingId ? "Simpan Notifikasi" : "Tambah Notifikasi"}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="rounded-full font-bold"
                >
                  Batal
                </Button>
              )}
            </div>
            <p className="mt-4 text-xs font-medium leading-relaxed text-muted-foreground">
              Jadwal masih berupa prototype frontend dan hanya tersimpan di browser ini.
            </p>
          </form>
        </Panel>
      </div>

      <Panel title="Daftar Notifikasi" className="flex h-full flex-col">
        <TableScrollArea className="min-h-72 flex-1 xl:max-h-none">
          <table className={`min-w-210 w-full text-sm ${items.length === 0 ? "h-full" : ""}`}>
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="p-2">Notifikasi</th>
                <th className="p-2">Target</th>
                <th className="p-2">Jadwal</th>
                <th className="p-2">Jam</th>
                <th className="p-2">Status</th>
                <th className="p-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr className="border-t border-border">
                  <td colSpan={6} className="p-8 text-center">
                    <Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                    <p className="font-bold text-foreground">Belum ada data notifikasi</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Gunakan form untuk membuat jadwal pertama.
                    </p>
                  </td>
                </tr>
              )}
              {items.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  onEdit={() => editItem(item)}
                  onToggle={() =>
                    setItems((current) =>
                      current.map((value) =>
                        value.id === item.id ? { ...value, active: !value.active } : value,
                      ),
                    )
                  }
                  onDelete={() => {
                    if (window.confirm(`Hapus notifikasi “${item.title}”?`)) {
                      setItems((current) => current.filter((value) => value.id !== item.id));
                      if (editingId === item.id) resetForm();
                      toast.success("Notifikasi dihapus.");
                    }
                  }}
                />
              ))}
            </tbody>
          </table>
        </TableScrollArea>
        <p className="mt-4 text-sm text-muted-foreground">
          {items.length} notifikasi · {activeCount} aktif
        </p>
      </Panel>
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-bold">
      <span className="mb-1.5 block text-xs font-black uppercase text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </span>
      {children}
    </label>
  );
}

function NotificationRow({
  item,
  onEdit,
  onToggle,
  onDelete,
}: {
  item: NotificationSchedule;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const schedule =
    item.repeat === "daily"
      ? "Semua hari"
      : item.repeat === "once"
        ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(
            new Date(`${item.date}T00:00:00`),
          )
        : DAYS.filter((day) => item.days.includes(day.value))
            .map((day) => day.short)
            .join(", ");
  return (
    <tr className="border-t border-border align-top">
      <td className="max-w-80 p-2">
        <p className="font-bold">{item.title}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.message}</p>
      </td>
      <td className="p-2">Semua user</td>
      <td className="p-2 font-medium">{schedule}</td>
      <td className="whitespace-nowrap p-2">{item.time}</td>
      <td className="p-2">
        <button
          type="button"
          onClick={onToggle}
          aria-label={`${item.active ? "Nonaktifkan" : "Aktifkan"} ${item.title}`}
          className={`font-bold ${item.active ? "text-primary" : "text-muted-foreground"}`}
        >
          {item.active ? "Aktif" : "Nonaktif"}
        </button>
      </td>
      <td className="p-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 font-bold text-primary"
          >
            <Pencil className="h-4 w-4" /> Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1 font-bold text-destructive"
          >
            <Trash2 className="h-4 w-4" /> Hapus
          </button>
        </div>
      </td>
    </tr>
  );
}
