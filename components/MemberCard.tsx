import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

interface MemberCardProps {
  name: string;
  xp: number;
  level: string;
  avatar?: string;
  rank?: number;
}

export default function MemberCard({
  name,
  xp,
  level,
  avatar,
  rank,
}: MemberCardProps) {
  return (
    <Card className="h-full p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="h-12 w-12 rounded-2xl object-cover ring-1 ring-white/15"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/25 to-violet-500/25 text-base font-semibold text-white ring-1 ring-white/10">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-base font-semibold text-white">{name}</p>
            <p className="text-sm text-slate-400">{xp} XP</p>
          </div>
        </div>
        {typeof rank === "number" && <Badge variant="cyan">#{rank}</Badge>}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.24em] text-slate-500">Level</span>
        <Badge variant="violet">{level}</Badge>
      </div>
    </Card>
  );
}
