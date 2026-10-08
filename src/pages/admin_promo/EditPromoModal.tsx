import { X } from "lucide-react";
import { usePromo, useUpdatePromo } from "@/hooks/use-promos";
import { useLocations } from "@/hooks/use-locations";
import type { PromoDetail } from "@/services/promo";
import type { Location } from "@/services/locations";
import LoadingCircle from "@/components/LoadingCircle";
import PromoFormModal from "./PromoFormModal";
import {
  buildPromoPayload,
  createProductRow,
  diffPromoPayload,
  emptyPromoFormValues,
} from "./promo-form-utils";
import type { PromoFormValues } from "./promo-form-utils";
import {
  parseMaxQtyProducts,
  parseOrderTypes,
  toInputDate,
} from "./promo-detail-utils";

// Data promo lokal → nilai awal form edit. ID lokasi di DB berupa location_id
// (UUID) sehingga dipetakan balik ke runchise_id lewat daftar lokasi.
const toFormValues = (
  { promo, promo_rule, promo_reward }: PromoDetail,
  locations: Location[],
): PromoFormValues => {
  const byLocationId = new Map(
    locations
      .filter((location) => location.runchise_id != null)
      .map((location) => [location.location_id, location]),
  );
  const owner = byLocationId.get(promo.owner_location_id);
  const orderTypeIds = parseOrderTypes(promo_rule?.order_types).map(
    (orderType) => orderType.id,
  );
  // DB hanya menyimpan nama get_products; ID produk hanya tersedia dari
  // maximum_qty_applied_to_products
  const products = parseMaxQtyProducts(
    promo_rule?.maximum_qty_applied_to_products,
  );

  return {
    ...emptyPromoFormValues(),
    name: promo.name ?? "",
    goal: (promo.goal as PromoFormValues["goal"]) ?? "",
    promoType: promo.promo_type ?? "",
    termsConditions: promo.terms_conditions ?? "",
    startDate: toInputDate(promo.start_date),
    endDate: toInputDate(promo.end_date),
    discountValue: promo_reward?.discount_amount ?? "",
    productRows: products.length
      ? products.map((product) =>
          createProductRow(
            { id: product.id, name: product.name },
            product.maximum_purchase,
          ),
        )
      : [createProductRow()],
    applyToOptionSet: promo_reward?.apply_to_option_set ?? true,
    ownerLocation: owner
      ? { id: owner.runchise_id, name: owner.name }
      : null,
    validLocation: {
      mode: "locations",
      selectAll: false,
      ids: promo.location_ids.flatMap((id) => {
        const location = byLocationId.get(id);
        return location ? [location.runchise_id] : [];
      }),
    },
    isOrderTypeEnabled: orderTypeIds.length > 0,
    orderTypeIds,
    usePromoCode: promo_rule?.use_promotion_code ?? false,
  };
};

type EditPromoModalProps = {
  promoId: string;
  onClose: () => void;
  onSuccess: () => void;
};

const EditPromoModal = ({ promoId, onClose, onSuccess }: EditPromoModalProps) => {
  const { data: detail, error: detailError } = usePromo(promoId);
  const { data: locationsData, error: locationsError } = useLocations({
    take: 100, // batas maksimal take di backend
  });
  const {
    mutate: updatePromo,
    isPending,
    error: mutationError,
  } = useUpdatePromo();

  const loadError = detailError ?? locationsError;

  // Form baru di-mount setelah data siap agar nilai awalnya lengkap
  if (!detail || !locationsData) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 shadow-md"
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-chocolate">Edit Promo</h3>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-full p-1.5 text-gray-400 transition-colors hover:bg-cream hover:text-chocolate"
              aria-label="Tutup"
            >
              <X size={18} />
            </button>
          </div>
          {loadError ? (
            <p className="py-6 text-sm text-red-500">
              Gagal memuat promo: {loadError.message}
            </p>
          ) : (
            <LoadingCircle className="py-10" />
          )}
        </div>
      </div>
    );
  }

  const initialValues = toFormValues(detail, locationsData.locations);
  const initialPayload = buildPromoPayload(initialValues);
  const initialOrderTypes = parseOrderTypes(detail.promo_rule?.order_types);

  const handleSubmit = (values: PromoFormValues) => {
    const request = diffPromoPayload(buildPromoPayload(values), initialPayload);

    if (Object.keys(request).length === 0) {
      onClose();
      return;
    }

    // Sertakan ID rule/reward Runchise agar atribut bersarang meng-update
    // data yang ada, bukan membuat yang baru
    if (
      request.promo_rule_attributes &&
      detail.promo_rule?.runchise_promo_rule_id
    ) {
      request.promo_rule_attributes.id =
        detail.promo_rule.runchise_promo_rule_id;
    }
    if (
      request.promo_reward_attributes &&
      detail.promo_reward?.runchise_promo_reward_id
    ) {
      request.promo_reward_attributes.id =
        detail.promo_reward.runchise_promo_reward_id;
    }

    updatePromo({ promo_id: promoId, request }, { onSuccess });
  };

  return (
    <PromoFormModal
      title="Edit Promo"
      subtitle={detail.promo.name ?? "-"}
      submitLabel="Simpan perubahan"
      initialValues={initialValues}
      extraOrderTypes={initialOrderTypes}
      showPromoCode={false}
      // Promo tanpa data produk yang terbaca tidak dipaksa memilih ulang produk
      requireProducts={initialValues.productRows.some((row) => row.product)}
      isPending={isPending}
      error={mutationError?.message}
      onSubmit={handleSubmit}
      onClose={onClose}
    />
  );
};

export default EditPromoModal;
