import { useState } from "react";
import { motion } from "framer-motion";
import { Vote, CheckCircle, Users } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAppStore } from "@/store/useAppStore";
import { Navigate } from "react-router-dom";

const elections = [
  {
    id: 1,
    title: "Student Council President 2026",
    status: "active",
    endsIn: "2 days",
    candidates: [
      { name: "Arjun Mehta", votes: 124, party: "Progress Alliance" },
      { name: "Priya Sharma", votes: 98, party: "Innovation Front" },
      { name: "Ravi Kumar", votes: 76, party: "Unity Group" },
    ],
  },
  {
    id: 2,
    title: "Department Representative",
    status: "upcoming",
    endsIn: "Starts Feb 15",
    candidates: [],
  },
];

export default function VotingPage() {
  const { isAuthenticated } = useAppStore();
  const [voted, setVoted] = useState<number | null>(null);

  if (!isAuthenticated) return <Navigate to="/auth" replace />;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Elections</h1>
          <p className="text-sm text-muted-foreground">Cast your vote anonymously, verified on-chain.</p>
        </div>

        {elections.map((election) => (
          <motion.div
            key={election.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{election.title}</h2>
                <p className="text-xs text-muted-foreground">{election.endsIn}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                election.status === "active" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
              }`}>
                {election.status}
              </span>
            </div>

            {election.candidates.length > 0 ? (
              <div className="space-y-3">
                {election.candidates.map((c, i) => (
                  <button
                    key={c.name}
                    onClick={() => setVoted(i)}
                    disabled={voted !== null}
                    className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-all ${
                      voted === i
                        ? "border-accent bg-accent/5"
                        : "border-border/50 bg-muted/20 hover:border-primary/30 hover:bg-muted/40"
                    } ${voted !== null && voted !== i ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {c.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.party}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {voted === i && <CheckCircle className="h-4 w-4 text-accent" />}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {c.votes + (voted === i ? 1 : 0)}
                      </div>
                    </div>
                  </button>
                ))}
                {voted !== null && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-sm text-accent"
                  >
                    ✓ Your vote has been recorded on-chain
                  </motion.p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Candidates will be announced soon.</p>
            )}
          </motion.div>
        ))}
      </div>
    </DashboardLayout>
  );
}
