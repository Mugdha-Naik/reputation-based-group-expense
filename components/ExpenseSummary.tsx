import Card from "@/components/ui/Card";

interface CategorySummary {
  name: string;
  amount: number;
}

interface ExpenseSummaryProps {
  totalExpense: number;
  categories: CategorySummary[];
}

export default function ExpenseSummary({
  totalExpense,
  categories,
}: ExpenseSummaryProps) {
  const largestAmount = categories[0]?.amount || 1;

  return (
    <Card className="p-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Total Group Expense</p>
          <p className="mt-2 text-3xl font-semibold text-white">INR {totalExpense.toFixed(2)}</p>
        </div>
        <p className="text-sm text-slate-400">{categories.length} categories</p>
      </div>

      <div className="mt-5 space-y-4">
        {categories.map((category) => {
          const width = Math.max(12, (category.amount / largestAmount) * 100);
          return (
            <div key={category.name}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-slate-200">{category.name}</span>
                <span className="text-cyan-200">INR {category.amount.toFixed(2)}</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-950/80">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500"
                  style={{ width: `${Math.min(width, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
