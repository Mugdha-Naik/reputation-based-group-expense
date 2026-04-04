import Badge from "@/components/ui/Badge";

interface BadgeListProps {
  badges: string[];
}

export default function BadgeList({ badges }: BadgeListProps) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {badges.map((badge) => (
        <Badge key={badge} variant="slate">
          {badge}
        </Badge>
      ))}
    </div>
  );
}
