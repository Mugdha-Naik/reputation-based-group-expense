import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

interface LeaderboardEntry {
  id: string;
  name: string;
  xp: number;
  level: string;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
}

export default function Leaderboard({ entries }: LeaderboardProps) {
  return (
    <Card className="p-4">
      <ul className="space-y-3">
        {entries.map((entry, index) => (
          <li
            key={entry.id}
            className="flex items-center justify-between rounded-2xl border border-white/8 bg-slate-950/45 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/8 text-sm font-semibold text-white">
                {index + 1}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{entry.name}</p>
                <p className="text-xs text-slate-400">{entry.xp} XP</p>
              </div>
            </div>
            <Badge variant={index === 0 ? "emerald" : "slate"}>{entry.level}</Badge>
          </li>
        ))}
      </ul>
    </Card>
  );
}
