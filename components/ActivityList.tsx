import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
  tone: "paid" | "owes";
}

interface ActivityListProps {
  items: ActivityItem[];
}

export default function ActivityList({ items }: ActivityListProps) {
  return (
    <Card className="p-4">
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-slate-950/45 px-4 py-3"
          >
            <div>
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <p className="mt-1 text-xs text-slate-400">{item.subtitle}</p>
            </div>
            <div className="text-right">
              <Badge variant={item.tone === "paid" ? "emerald" : "amber"}>
                {item.tone === "paid" ? "Paid" : "Owes"}
              </Badge>
              <p className="mt-2 text-sm font-semibold text-white">{item.amount}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
