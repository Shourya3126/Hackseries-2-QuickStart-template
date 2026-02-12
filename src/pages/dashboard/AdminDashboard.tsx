import { BarChart3, FileCheck, MessageSquare, Users, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import StatCard from "@/components/dashboard/StatCard";

const logs = [
  { action: "Certificate verified", user: "student_stub-3f..a2", time: "2 min ago", status: "success" },
  { action: "Attendance logged", user: "student_stub-7b..c1", time: "5 min ago", status: "success" },
  { action: "Vote cast", user: "anonymous", time: "12 min ago", status: "success" },
  { action: "Complaint submitted", user: "anonymous", time: "1 hr ago", status: "pending" },
];

const complaints = [
  { id: "C-1042", subject: "Lab equipment issue", status: "In Review", priority: "medium" },
  { id: "C-1041", subject: "Hostel maintenance", status: "Resolved", priority: "high" },
  { id: "C-1040", subject: "Library hours", status: "Open", priority: "low" },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Platform-wide analytics and management.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Users" value="3,200" change="+5.2%" positive />
        <StatCard icon={ShieldCheck} label="Verifications" value="12,847" change="+120" positive />
        <StatCard icon={MessageSquare} label="Open Complaints" value="7" />
        <StatCard icon={BarChart3} label="Uptime" value="99.9%" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Verification Logs</h2>
          <div className="space-y-3">
            {logs.map((log, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{log.action}</p>
                  <p className="font-mono text-xs text-muted-foreground">{log.user}</p>
                </div>
                <div className="text-right">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${log.status === "success" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
                    }`}>
                    {log.status}
                  </span>
                  <p className="mt-1 text-xs text-muted-foreground">{log.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Complaint Status</h2>
          <div className="space-y-3">
            {complaints.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{c.subject}</p>
                  <p className="font-mono text-xs text-muted-foreground">{c.id}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${c.status === "Resolved" ? "bg-accent/10 text-accent" :
                    c.status === "In Review" ? "bg-primary/10 text-primary" :
                      "bg-secondary/10 text-secondary"
                  }`}>
                  {c.status}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
