import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
}

export default function StatCard({ icon: Icon, label, value, change, positive }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card-hover p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        {change && (
          <span className={`text-xs font-medium ${positive ? "text-accent" : "text-destructive"}`}>
            {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </motion.div>
  );
}
