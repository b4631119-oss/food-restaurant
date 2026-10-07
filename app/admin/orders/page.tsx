"use client";

import { OrdersHistory } from "@/components/admin/orders-history";
import { useReportOrders } from "@/hooks/use-report-orders";
import { useReportPeriod } from "@/hooks/use-report-period";

export default function OrdersPage() {
  const { period, chooseKey } = useReportPeriod();
  const report = useReportOrders(period);
  return <OrdersHistory period={period} onChoose={chooseKey} orders={report.orders ?? []} loading={report.loading} error={report.error} onRefresh={report.refresh} />;
}
