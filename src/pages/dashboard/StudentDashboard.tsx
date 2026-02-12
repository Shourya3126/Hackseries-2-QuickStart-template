import { QrCode, Vote, MessageSquare, Award, Calendar, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import StatCard from "@/components/dashboard/StatCard";

const quickActions = [
  { to: "/dashboard/attendance", icon: QrCode, label: "Join Attendance", desc: "Scan QR & verify", gradient: "from-primary to-secondary" },
  { to: "/dashboard/voting", icon: Vote, label: "Vote Now", desc: "Active elections", gradient: "from-secondary to-accent" },
  { to: "/dashboard/complaints", icon: MessageSquare, label: "Submit Complaint", desc: "Anonymized & secure", gradient: "from-accent to-primary" },
  { to: "/dashboard/certificates", icon: Award, label: "My Certificates", desc: "View & share", gradient: "from-primary to-accent" },
];

const attendanceHistory = [
  { date: "Feb 11, 2026", subject: "Data Structures", status: "present" },
  { date: "Feb 10, 2026", subject: "Operating Systems", status: "present" },
  { date: "Feb 9, 2026", subject: "Computer Networks", status: "absent" },
  { date: "Feb 8, 2026", subject: "Data Structures", status: "present" },
];

export default function StudentDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Student Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back! Here's your overview.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Calendar} label="Attendance Rate" value="87%" change="+2.3%" positive />
        <StatCard icon={Vote} label="Elections Voted" value="5" />
        <StatCard icon={MessageSquare} label="Complaints Filed" value="2" />
        <StatCard icon={Award} label="Certificates" value="3" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action, i) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Link to={action.to} className="glass-card-hover flex flex-col items-center p-6 text-center">
              <div className={`mb-3 rounded-xl bg-gradient-to-br ${action.gradient} p-3`}>
                <action.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-sm font-semibold">{action.label}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{action.desc}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="glass-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Recent Attendance</h2>
        <div className="space-y-3">
          {attendanceHistory.map((item, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3">
              <div>
                <p className="text-sm font-medium">{item.subject}</p>
                <p className="text-xs text-muted-foreground">{item.date}</p>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                item.status === "present" ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"
              }`}>
                <CheckCircle className="h-3 w-3" />
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
