import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
}

export function StatsCard({
  title,
  value,
  change,
  isPositive,
  icon: Icon,
  iconColor,
  iconBgColor,
}: StatsCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-600">{title}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
          <p className={`mt-1 text-xs ${isPositive ? "text-green-600" : "text-red-600"}`}>
            {change}
          </p>
        </div>
        <div className={`rounded-full ${iconBgColor} p-3`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>
    </Card>
  );
}