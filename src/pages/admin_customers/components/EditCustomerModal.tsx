import { useState } from "react";
import { X } from "lucide-react";
import { useLocations } from "@/hooks/use-locations";
import { useUpdateCustomer } from "@/hooks/use-customers";
import {
  CUSTOMER_FORM_FIELD_CLASS,
  CUSTOMER_GENDERS,
} from "@/constant/customerDetails";
import type { Customer } from "@/services/customers";
import CustomerFormField from "./CustomerFormField";

type CustomerForm = {
  name: string;
  email: string;
  address: string;
  province: string;
  city: string;
  country: string;
  postal_code: string;
  gender: "male" | "female" | "unknown";
  status: "active" | "inactive";
  owner_location_id: string;
  dob: string;
};

const buildCustomerForm = (customer: Customer): CustomerForm => {
  const gender =
    CUSTOMER_GENDERS.find((option) => option === customer.gender) ?? "unknown";

  return {
    name: customer.name ?? "",
    email: customer.user?.email ?? "",
    address: customer.address ?? "",
    province: customer.province ?? "",
    city: customer.city ?? "",
    country: customer.country ?? "",
    postal_code: customer.postal_code ?? "",
    gender,
    status: customer.status === "inactive" ? "inactive" : "active",
    owner_location_id:
      customer.owner_location?.runchise_id != null
        ? String(customer.owner_location.runchise_id)
        : "",
    dob: customer.dob?.slice(0, 10) ?? "",
  };
};

const EditCustomerModal = ({
  customer,
  onClose,
}: {
  customer: Customer;
  onClose: () => void;
}) => {
  const [form, setForm] = useState(() => buildCustomerForm(customer));
  const { data: locationsData } = useLocations({ take: 100 });
  const { mutate, isPending, error } = useUpdateCustomer();

  const setField =
    (field: keyof CustomerForm) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    mutate(
      {
        customer_id: customer.customer_id,
        name: form.name.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        province: form.province.trim() || undefined,
        city: form.city.trim() || undefined,
        country: form.country.trim() || undefined,
        postal_code: form.postal_code.trim() || undefined,
        gender: form.gender,
        status: form.status,
        owner_location_id: form.owner_location_id || undefined,
        dob: form.dob || (customer.dob ? null : undefined),
      },
      { onSuccess: onClose },
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={isPending ? undefined : onClose}
    >
      <div
        className="w-full max-w-2xl rounded-3xl border border-gray-100 bg-white shadow-md"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 p-4 sm:p-6">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-chocolate">Edit Customer</h3>
            <span className="text-xs text-gray-500">
              Perbarui informasi customer {customer.name}.
            </span>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="cursor-pointer rounded-full p-1.5 text-gray-400 transition-colors hover:bg-cream hover:text-chocolate"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid max-h-[60dvh] grid-cols-1 gap-4 overflow-y-auto p-4 sm:max-h-[65vh] sm:grid-cols-2 sm:p-6">
            <CustomerFormField label="Name">
              <input
                type="text"
                value={form.name}
                onChange={setField("name")}
                required
                className={CUSTOMER_FORM_FIELD_CLASS}
              />
            </CustomerFormField>

            <CustomerFormField label="Email">
              <input
                type="email"
                value={form.email}
                onChange={setField("email")}
                className={CUSTOMER_FORM_FIELD_CLASS}
              />
            </CustomerFormField>

            <CustomerFormField label="Address">
              <input
                type="text"
                value={form.address}
                onChange={setField("address")}
                className={CUSTOMER_FORM_FIELD_CLASS}
              />
            </CustomerFormField>

            <CustomerFormField label="Date of birth">
              <input
                type="date"
                value={form.dob}
                onChange={setField("dob")}
                className={CUSTOMER_FORM_FIELD_CLASS}
              />
            </CustomerFormField>

            <CustomerFormField label="Province">
              <input
                type="text"
                value={form.province}
                onChange={setField("province")}
                className={CUSTOMER_FORM_FIELD_CLASS}
              />
            </CustomerFormField>

            <CustomerFormField label="City">
              <input
                type="text"
                value={form.city}
                onChange={setField("city")}
                className={CUSTOMER_FORM_FIELD_CLASS}
              />
            </CustomerFormField>

            <CustomerFormField label="Country">
              <input
                type="text"
                value={form.country}
                onChange={setField("country")}
                className={CUSTOMER_FORM_FIELD_CLASS}
              />
            </CustomerFormField>

            <CustomerFormField label="Postal code">
              <input
                type="text"
                value={form.postal_code}
                onChange={setField("postal_code")}
                className={CUSTOMER_FORM_FIELD_CLASS}
              />
            </CustomerFormField>

            <CustomerFormField label="Gender">
              <select
                value={form.gender}
                onChange={setField("gender")}
                className={CUSTOMER_FORM_FIELD_CLASS}
              >
                {CUSTOMER_GENDERS.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                  </option>
                ))}
              </select>
            </CustomerFormField>

            <CustomerFormField label="Owner location">
              <select
                value={form.owner_location_id}
                onChange={setField("owner_location_id")}
                className={CUSTOMER_FORM_FIELD_CLASS}
              >
                <option value="">Pilih lokasi...</option>
                {locationsData?.locations
                  .filter((location) => location.runchise_id != null)
                  .map((location) => (
                    <option
                      key={location.location_id}
                      value={String(location.runchise_id)}
                    >
                      {location.name}
                    </option>
                  ))}
              </select>
            </CustomerFormField>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 p-4 sm:p-6">
            {error && (
              <p className="mr-auto text-sm text-red-500">{error.message}</p>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="cursor-pointer rounded-3xl border border-gray-100 py-2 px-5 text-sm font-semibold text-chocolate transition-colors hover:bg-cream"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="cursor-pointer rounded-3xl bg-orange py-2 px-6 text-sm font-semibold text-white shadow-sm shadow-amber-600 active:bg-orange-500"
            >
              {isPending ? "Menyimpan..." : "Simpan perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCustomerModal;
