"use client";

import { usePolling } from "@/hooks/usePolling";
import { Card, EmptyState, SectionTitle } from "@/components/ui";
import { PAYMENT_METHODS, formatDate, formatFcfa, formatTime } from "@/lib/constants";
import { prettyPhone } from "@/lib/phone";

type Payment = {
  id: number;
  reference: string;
  amountFcfa: number;
  commissionFcfa: number;
  driverEarningsFcfa: number;
  method: string;
  status: string;
  driverName: string;
  clientPhone: string;
  createdAt: string;
};

export default function AdminPaymentsPage() {
  const { data } = usePolling<{ payments: Payment[] }>(
    async () => {
      const res = await fetch("/api/admin/payments", { cache: "no-store" });
      if (!res.ok) return { payments: [] };
      return res.json();
    },
    10_000,
  );

  const payments = data?.payments ?? [];
  const totalAmount = payments.reduce((s, p) => s + p.amountFcfa, 0);
  const totalCommission = payments.reduce((s, p) => s + p.commissionFcfa, 0);
  const totalDriver = payments.reduce((s, p) => s + p.driverEarningsFcfa, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-gozo-900">Paiements & commissions</h1>
        <p className="text-sm text-slate-500">Historique des encaissements et des commissions GOZO</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-gozo-700 p-4 text-white">
          <p className="text-xs text-gozo-100">Total encaissé</p>
          <p className="text-2xl font-black">{formatFcfa(totalAmount)}</p>
        </div>
        <div className="rounded-2xl bg-emerald-600 p-4 text-white">
          <p className="text-xs text-emerald-100">Reversé aux livreurs</p>
          <p className="text-2xl font-black">{formatFcfa(totalDriver)}</p>
        </div>
        <div className="rounded-2xl bg-gold-500 p-4 text-gozo-900">
          <p className="text-xs text-gozo-900/70">Commissions GOZO</p>
          <p className="text-2xl font-black">{formatFcfa(totalCommission)}</p>
        </div>
      </div>

      <Card>
        <SectionTitle>Historique</SectionTitle>
        {payments.length === 0 ? (
          <EmptyState icon="🧾" title="Aucun paiement" hint="Les paiements apparaîtront après les premières livraisons." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 pr-3">Référence</th>
                  <th className="pb-2 pr-3">Livreur</th>
                  <th className="pb-2 pr-3">Client</th>
                  <th className="pb-2 pr-3">Mode</th>
                  <th className="pb-2 pr-3">Montant</th>
                  <th className="pb-2 pr-3">Commission</th>
                  <th className="pb-2 pr-3">Livreur</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const method = PAYMENT_METHODS.find((m) => m.id === p.method);
                  return (
                    <tr key={p.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2.5 pr-3 font-mono text-xs font-bold text-gozo-600">{p.reference}</td>
                      <td className="py-2.5 pr-3 font-medium text-gozo-800">{p.driverName}</td>
                      <td className="py-2.5 pr-3 text-slate-500">{prettyPhone(p.clientPhone)}</td>
                      <td className="py-2.5 pr-3">{method?.icon} {method?.short}</td>
                      <td className="py-2.5 pr-3 font-bold text-gozo-800">{formatFcfa(p.amountFcfa)}</td>
                      <td className="py-2.5 pr-3 text-rose-500">{formatFcfa(p.commissionFcfa)}</td>
                      <td className="py-2.5 pr-3 text-emerald-600">{formatFcfa(p.driverEarningsFcfa)}</td>
                      <td className="py-2.5 text-xs text-slate-400">
                        {formatDate(p.createdAt)} {formatTime(p.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
