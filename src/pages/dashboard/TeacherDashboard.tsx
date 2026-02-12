import { useState } from "react";
import { BookOpen, Users, Vote, Award, Plus, X, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import StatCard from "@/components/dashboard/StatCard";
import MintCertificate from "@/components/certificate/MintCertificate";
import CreateElection from "@/components/voting/CreateElection";

const sessions = [
  { name: "Data Structures - Sec A", date: "Feb 11, 2026", students: 45, present: 42 },
  { name: "Algorithms - Sec B", date: "Feb 10, 2026", students: 40, present: 38 },
  { name: "Data Structures - Sec A", date: "Feb 9, 2026", students: 45, present: 40 },
];

export default function TeacherDashboard() {
  const [showMint, setShowMint] = useState(false);
  const [showCreateElection, setShowCreateElection] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your classes and sessions.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowMint(!showMint)}
            className={`btn-glow inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground ${showMint ? "bg-accent text-accent-foreground" : ""}`}
          >
            <Award className="h-4 w-4" />
            {showMint ? "Close Issuer" : "Issue Certificate"}
          </button>
          <button
            onClick={() => setShowCreateElection(!showCreateElection)}
            className={`btn-glow inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground ${showCreateElection ? "bg-accent text-accent-foreground" : ""}`}
          >
            <Vote className="h-4 w-4" />
            {showCreateElection ? "Close Election" : "Create Election"}
          </button>
          <button className="btn-glow inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground">
            <Plus className="h-4 w-4" />
            Create Session
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showMint && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mb-8 border border-accent/20 rounded-xl p-1 bg-accent/5">
              <MintCertificate />
            </div>
          </motion.div>
        )}
        {showCreateElection && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mb-8 border border-accent/20 rounded-xl p-1 bg-accent/5">
              <CreateElection />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BookOpen} label="Active Sessions" value="3" />
        <StatCard icon={Users} label="Total Students" value="130" />
        <Link to="/dashboard/teacher-voting">
          <StatCard icon={Vote} label="Elections Created" value="2" />
        </Link>
        <StatCard icon={Award} label="Certs Issued" value="45" change="+12" positive />
      </div>

      <div className="glass-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Recent Sessions</h2>
        <div className="space-y-3">
          {sessions.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.date}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-accent">{s.present}/{s.students}</p>
                <p className="text-xs text-muted-foreground">attended</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
