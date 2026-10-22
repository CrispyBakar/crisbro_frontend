import { useCustomerPointHistory } from "@/hooks/use-customers";
import { CUSTOMER_POINT_COLUMNS } from "@/constant/customerDetails";
import { formatDateWIB, formatPoint, getPointColor } from "../customer-details.utils";
import CustomerDetailTabState from "./CustomerDetailTabState";

const CustomerPointsTab = ({ customerId }: { customerId: string }) => {
  const { data: histories, isPending, error } =
    useCustomerPointHistory(customerId);

  if (isPending || error || !histories || histories.length === 0) {
    return (
      <CustomerDetailTabState
        isPending={isPending}
        error={error}
        emptyTitle="Belum ada riwayat poin"
        emptyDescription="Riwayat poin customer akan muncul di sini."
      />
    );
  }

  return (
    <div className="mt-6 w-full max-h-112.5 overflow-auto">
      <table className="w-full whitespace-nowrap">
        <thead className="bg-gray-50 text-left text-xs">
          <tr>
            {CUSTOMER_POINT_COLUMNS.map((column) => (
              <th key={column} className="px-2 py-1.5 font-normal text-gray-500">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white text-sm">
          {histories.map((history) => {
            const timestamp =
              history.formatted_created_at ?? history.issued_at_time;

            return (
              <tr key={history.customer_point_history}>
                <td className="px-2 py-2">
                  {timestamp ? formatDateWIB(timestamp) : "-"}
                </td>
                <td className="px-2 py-2">{history.sales_no ?? "-"}</td>
                <td className="px-2 py-2">{history.location_id ?? "-"}</td>
                <td className="px-2 py-2">
                  {history.point_type_description || history.notes || "-"}
                </td>
                <td className="px-2 py-2">{history.channel || "-"}</td>
                <td className="px-2 py-2">
                  {history.point != null ? (
                    <span
                      className={getPointColor(
                        history.point_type,
                        history.point,
                      )}
                    >
                      {formatPoint(history.point_type, history.point)}
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerPointsTab;
