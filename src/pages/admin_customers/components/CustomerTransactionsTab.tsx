import { CreditCardCheck } from "lucide-react";
import { useSaleTransaction } from "@/hooks/use-sale-transactions";
import { formatDateWIB, formatRupiah } from "../customer-details.utils";
import CustomerDetailTabState from "./CustomerDetailTabState";
import CustomerDetailOptionsButton from "./CustomerDetailOptionsButton";

const CustomerTransactionsTab = ({ customerId }: { customerId: string }) => {
  const { data: transactions, isPending, error } =
    useSaleTransaction(customerId);

  if (isPending || error || !transactions || transactions.length === 0) {
    return (
      <CustomerDetailTabState
        isPending={isPending}
        error={error}
        emptyTitle="Belum ada transaksi"
        emptyDescription="Transaksi customer akan muncul di sini."
      />
    );
  }

  return (
    <ul className="mt-6 flex flex-col gap-4">
      {transactions.map((transaction) => {
        const productNames = (transaction.products ?? [])
          .map((product) => product.name)
          .join(", ");

        return (
          <li
            key={transaction.transaction_id}
            className="flex flex-col gap-3 rounded-2xl border border-gray-100 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:p-5"
          >
            <div className="flex min-w-0 items-start gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cream text-muted">
                <CreditCardCheck size={18} />
              </span>

              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-chocolate">
                  {transaction.order_type_name || "Transaksi"}
                </span>
                <span className="text-sm text-gray-500">
                  Sales no: {transaction.runchise_sales_no ?? "-"}
                </span>
                {productNames && (
                  <span className="text-sm text-gray-500">{productNames}</span>
                )}
                <span className="mt-1 text-xs text-gray-400">
                  Waktu pesanan:{" "}
                  {transaction.sales_time
                    ? formatDateWIB(transaction.sales_time)
                    : "-"}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between gap-4 pl-14 sm:pl-0">
              <span className="text-sm font-bold text-chocolate">
                {transaction.net_sales != null
                  ? formatRupiah(transaction.net_sales)
                  : "-"}
              </span>
              <CustomerDetailOptionsButton />
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default CustomerTransactionsTab;
