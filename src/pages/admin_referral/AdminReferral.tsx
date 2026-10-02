import { useState } from "react";
import { BadgeCheck } from "lucide-react";
import GeneralTable, { type TableHead } from "@/components/GeneralTable";
import HeaderMain from "@/components/HeaderMain";
import ConfirmDialog from "@/components/ConfirmDialog";
import { usePageTitle } from "@/hooks/use-page-title";
import { useReferrals, useValidateReferral } from "@/hooks/use-referrals";
import { REFERRAL_STATUS } from "@/services/referral";

const formatReferralDate = (value: unknown) =>
  value
    ? new Date(String(value)).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

const renderStatus = (value: unknown) => {
  const status = String(value ?? "");

  return (
    <span
      className={`inline-block py-1 px-3 rounded-full font-semibold ${
        status === REFERRAL_STATUS.COMPLETED
          ? "bg-green-50 text-success"
          : "bg-amber-100 text-orange"
      }`}
    >
      {status || "-"}
    </span>
  );
};

const renderPoint = (value: unknown) => (
  <span className="inline-block py-1 px-3 rounded-full bg-amber-100 text-orange font-semibold">
    {String(value ?? 0)}
  </span>
);

const referralHeads: TableHead[] = [
  { key: "referral_code", label: "Referral Code" },
  { key: "referrer_username", label: "Referrer" },
  {
    key: "referrer_point_reward",
    label: "Referrer Reward",
    render: (row) => renderPoint(row.referrer_point_reward),
  },
  { key: "referred_username", label: "Referred" },
  { key: "referred_phone", label: "Referred Phone" },
  {
    key: "referred_point_given",
    label: "Referred Point",
    render: (row) => renderPoint(row.referred_point_given),
  },
  {
    key: "status",
    label: "Status",
    render: (row) => renderStatus(row.status),
  },
  {
    key: "expires_at",
    label: "Expires At",
    render: (row) => formatReferralDate(row.expires_at),
  },
  {
    key: "created_at",
    label: "Created At",
    render: (row) => formatReferralDate(row.created_at),
  },
];

// Field tambahan yang hanya tampil di modal detail
const referralDetailHeads: TableHead[] = [
  ...referralHeads,
  {
    key: "referred_phone_verified",
    label: "Phone Verified",
    render: (row) => (row.referred_phone_verified ? "Ya" : "Tidak"),
  },
  { key: "referred_account_status", label: "Account Status" },
  {
    key: "can_validate",
    label: "Can Validate",
    render: (row) => (row.can_validate ? "Ya" : "Tidak"),
  },
];

// Alasan tombol validasi nonaktif, mengikuti syarat can_validate di backend
const getValidateBlockReason = (row: {
  referred_phone_verified: boolean;
  referred_account_status: string;
}) => {
  if (!row.referred_phone_verified)
    return "Nomor HP customer belum terverifikasi";
  if (row.referred_account_status !== "active")
    return "Akun customer tidak aktif";
  return "Referral belum bisa divalidasi";
};

type ValidateTarget = {
  userId: string;
  referredUsername: string;
  referrerUsername: string;
};

const statusOptions = [
  { label: "Pending", value: REFERRAL_STATUS.PENDING },
  { label: "Completed", value: REFERRAL_STATUS.COMPLETED },
];

const AdminReferral = () => {
  usePageTitle("Referral");

  const itemsPerPage = 25;
  const [currentPage, setCurrentPage] = useState(1);
  const [status, setStatus] = useState("");
  const [validateTarget, setValidateTarget] = useState<ValidateTarget | null>(
    null,
  );

  const validate = useValidateReferral();

  const closeValidateDialog = () => {
    setValidateTarget(null);
    validate.reset();
  };

  const {
    data: referrals,
    isPending,
    isFetching,
    error,
  } = useReferrals({
    page: currentPage,
    limit: itemsPerPage,
    status,
  });

  // Field bersarang (referrer/referred) diratakan agar bisa dipakai GeneralTable
  const rows =
    referrals?.items?.map((referral) => ({
      id: referral.referral_id,
      referral_code: referral.referral_code,
      status: referral.status,
      referrer_username: referral.referrer.username,
      referrer_point_reward: referral.referrer.point_reward,
      referred_user_id: referral.referred.user_id,
      referred_username: referral.referred.username,
      referred_phone: referral.referred.phone,
      referred_phone_verified: referral.referred.phone_verified,
      referred_account_status: referral.referred.account_status,
      referred_point_given: referral.referred.point_given,
      expires_at: referral.expires_at,
      created_at: referral.created_at,
      can_validate: referral.can_validate,
    })) ?? [];

  return (
    <main className="w-full space-y-6">
      <HeaderMain
        title="Referrals"
        subtitle="Pantau penggunaan kode referral oleh customer crisbro"
      />

      {isPending ? (
        <p className="text-gray-500">Memuat referral...</p>
      ) : error ? (
        <p className="text-red-500">Gagal memuat referral: {error.message}</p>
      ) : (
        <GeneralTable
          dataPending={isFetching}
          tableTitle="Referrals"
          dataHeads={referralHeads}
          detailHeads={referralDetailHeads}
          data={rows}
          deleteBulk={false}
          searchPlaceholder="Search code or username..."
          itemsPerPage={itemsPerPage}
          totalPages={referrals?.meta?.total_pages ?? 0}
          total={referrals?.meta?.total ?? 0}
          currentPage={referrals?.meta?.page ?? currentPage}
          setCurrentPage={setCurrentPage}
          filterLabel="Status"
          filterOptions={statusOptions}
          filterValue={status}
          onFilterChange={setStatus}
          canDelete={false}
          canUpdate={false}
          canShow={true}
          canDetail={false}
          canSelectDate={false}
          renderActions={(row) => {
            // Referral yang sudah completed tidak perlu divalidasi lagi
            if (row.status !== REFERRAL_STATUS.PENDING) return null;

            return (
              <button
                type="button"
                disabled={!row.can_validate}
                title={
                  row.can_validate ? undefined : getValidateBlockReason(row)
                }
                onClick={() =>
                  setValidateTarget({
                    userId: row.referred_user_id,
                    referredUsername: row.referred_username,
                    referrerUsername: row.referrer_username,
                  })
                }
                className="mr-1 py-1 px-2.5 rounded-3xl bg-orange text-sm text-white font-semibold cursor-pointer active:bg-orange-500 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Validasi
              </button>
            );
          }}
        />
      )}

      {validateTarget && (
        <ConfirmDialog
          title="Validasi referral?"
          message={
            <>
              Poin referral akan diberikan ke{" "}
              <b>{validateTarget.referrerUsername}</b> dan{" "}
              <b>{validateTarget.referredUsername}</b>. Aksi ini tidak bisa
              dibatalkan.
            </>
          }
          icon={BadgeCheck}
          confirmLabel="Ya, validasi"
          isPending={validate.isPending}
          error={validate.error?.message}
          onConfirm={() =>
            validate.mutate(validateTarget.userId, {
              onSuccess: closeValidateDialog,
            })
          }
          onCancel={closeValidateDialog}
        />
      )}
    </main>
  );
};

export default AdminReferral;
