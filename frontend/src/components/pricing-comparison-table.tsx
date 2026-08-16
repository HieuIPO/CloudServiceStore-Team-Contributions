import { FeatureIcon } from "@/components/pricing-art";
import { pricingSpecRows, type PricingPlan } from "@/lib/pricing-data";

export function PricingComparisonTable({ plans }: { plans: PricingPlan[] }) {
  const labelColumnWidthRem = 12;
  const planColumnWidthRem = 10;
  const tableMinWidth = `${Math.max(68, labelColumnWidthRem + plans.length * planColumnWidthRem)}rem`;

  return (
    <>
      <div aria-label="So sánh cấu hình theo từng gói" className="pricing-comparison-cards grid gap-3 sm:grid-cols-2 xl:hidden">
        {plans.map(plan => (
          <article className="min-w-0 rounded-xl border border-blue-100 bg-white p-4 shadow-sm" key={plan.id}>
            <h3 className="min-w-0 break-words text-sm font-black text-[#10245a]">{plan.name}</h3>
            <dl className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-100 bg-[#fbfdff] px-3">
              {pricingSpecRows.map(row => (
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(5.5rem,auto)] items-start gap-3 py-2" key={row.key}>
                  <dt className="flex min-w-0 items-start gap-2 text-xs font-semibold leading-5 text-slate-600">
                    <FeatureIcon label={row.label} />
                    <span className="min-w-0 break-words">{row.label}</span>
                  </dt>
                  <dd className="min-w-0 break-words text-right text-xs font-bold leading-5 text-slate-700">{plan.specs[row.key]}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>

      <div className="pricing-comparison-scroll mt-1 hidden min-w-0 max-w-full overflow-x-auto overscroll-x-contain rounded-xl border border-blue-100 bg-white xl:block">
        <table aria-label="So sánh cấu hình các gói dịch vụ" className="pricing-comparison-table w-full table-fixed border-collapse text-[13px] text-slate-700" style={{ minWidth: tableMinWidth }}>
          <caption className="sr-only">So sánh CPU, RAM, SSD/NVMe, băng thông và các tiện ích của từng gói.</caption>
          <colgroup>
            <col style={{ width: `${labelColumnWidthRem}rem` }} />
            {plans.map(plan => <col key={plan.id} style={{ width: `${planColumnWidthRem}rem` }} />)}
          </colgroup>
          <thead className="sr-only">
            <tr>
              <th scope="col">Thông số</th>
              {plans.map(plan => <th key={plan.id} scope="col">{plan.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {pricingSpecRows.map(row => (
              <tr className="border-t border-slate-100 odd:bg-[#fbfdff]" key={row.key}>
                <th className="sticky left-0 z-10 bg-inherit px-4 py-1.5 text-left font-bold text-slate-600" scope="row">
                  <span className="flex min-w-0 items-center gap-2"><FeatureIcon label={row.label} /><span className="min-w-0 break-words">{row.label}</span></span>
                </th>
                {plans.map(plan => <td className="px-3 py-1.5 text-center font-semibold text-slate-600" key={`${plan.id}-${row.key}`}><span className="pricing-comparison-table__value block break-words">{plan.specs[row.key]}</span></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
