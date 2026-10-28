import { UserRound } from "lucide-react";
import { Link } from "react-router";
import { useCustomerProfile } from "@/hooks/use-customer-profile";
import type { Customer } from "@/services/customers";

const checkCustomerData = (customer: Customer, user: any): boolean => {
  if (
    !customer ||
    !customer.name.trim() ||
    !customer.phone_number.trim() ||
    !customer.gender?.trim() ||
    !customer.dob ||
    !user.email.trim()
  ) {
    return true;
  }

  return false;
};

const MustCompleteProfile = () => {
  const { data: user } = useCustomerProfile();
  const customer = user?.customer;
  const isProfileIncomplete =
    Boolean(user) && checkCustomerData(customer as Customer, user);

  if (!isProfileIncomplete) return null;

  return (
    <div className="fixed inset-0 z-50 flex min-h-dvh items-center justify-center bg-black/50 px-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="must-complete-profile-title"
        className="w-full max-w-sm rounded-2xl border border-chocolate/10 bg-white px-6 py-7 text-center shadow-xl"
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sunshine-yellow/30 text-chocolate">
          <UserRound size={26} strokeWidth={2} />
        </span>
        <h2
          id="must-complete-profile-title"
          className="mt-5 text-xl font-extrabold leading-tight text-chocolate"
        >
          Lengkapi data diri kamu
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Untuk melanjutkan menggunakan aplikasi, lengkapi data diri pada profil
          kamu terlebih dahulu.
        </p>
        <Link
          to="/settings/profile"
          className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-berry-red px-4 text-base font-bold text-white transition-colors hover:bg-berry-red/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-berry-red"
        >
          Lengkapi profil
        </Link>
      </section>
    </div>
  );
};

export default MustCompleteProfile;
