// L-7: nilai awal form dipisahkan dari file komponen. Aturan
// react-refresh/only-export-components (lihat catatan yang sama di
// adminFormatters.ts) membuat HMR jatuh ke full reload bila satu file
// mengekspor komponen sekaligus konstanta. Isi objeknya dipindahkan apa adanya
// dari AdminPage.tsx.

export const emptyUserForm = {
  id: 0,
  email: "",
  phone_number: "",
  password: "",
  role: "marketing",
};

export const emptyCustomerForm = {
  id: 0,
  name: "",
  email: "",
  phone_number: "",
  phone_number_country_code: 62,
  address: "",
  province: "",
  city: "",
  country: "Indonesia",
  postal_code: "",
  dob: "",
  gender: "unknown",
  status: "active",
  balance: 0,
  brand_id: 1,
  owner_location_id: 0,
  location_ids: [] as number[],
  total_point: 0,
  available_point: 0,
  next_reward_threshold: 2000,
};

export type UserFormValues = typeof emptyUserForm;
export type CustomerFormValues = typeof emptyCustomerForm;

export type RedeemFormState = {
  id: number;
  menu_item_id: number;
  points_required: number;
  sort_order: number;
  is_active: boolean;
};
