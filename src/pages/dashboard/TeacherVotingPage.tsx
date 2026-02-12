import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Vote, TrendingUp, Plus, X, BarChart3 } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAppStore } from "@/store/useAppStore";
import { Navigate } from "react-router-dom";
import CreateElection from "@/components/voting/CreateElection";
import ElectionResults from "@/components/voting/ElectionResults";

export default function TeacherVotingPage() {
  const { isAuthenticated, userRole } = useAppStore();
  const [showCreateElection, setShowCreateElection] = useState(false);
  const [showResults, setShowResults] = useState(true);

  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (userRole !== "teacher" && userRole !== "admin") {
    return <Navigate to="/dashboard/voting" replace />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Election Management</h1>
            <p className="text-sm text-muted-foreground">
              Create and manage elections, view real-time results
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowResults(!showResults)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                showResults
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              {showResults ? "Hide Results" : "Show Results"}
            </button>
            <button
              onClick={() => setShowCreateElection(!showCreateElection)}
              className={`btn-glow inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground ${
                showCreateElection ? "ring-2 ring-accent" : ""
              }`}
            >
              {showCreateElection ? (
                <>
                  <X className="h-4 w-4" />
                  Close
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Election
                </>
              )}
            </button>
          </div>
        </div>

        {/* Create Election Form */}
        <AnimatePresence>
          {showCreateElection && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <CreateElection />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Election Results */}
        <AnimatePresence>
          {showResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  Live Election Results
                </h2>
                <p className="text-sm text-muted-foreground">
                  Real-time voting data, refreshed every 10 seconds
                </p>
              </div>
              <ElectionResults />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="glass-card p-4">
            <div className="mb-2 flex items-center gap-2">
              <Vote className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">Active Elections</p>
            </div>
            <p className="text-2xl font-bold">-</p>
          </div>
          <div className="glass-card p-4">
            <div className="mb-2 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              <p className="text-sm text-muted-foreground">Total Votes Cast</p>
            </div>
            <p className="text-2xl font-bold">-</p>
          </div>
          <div className="glass-card p-4">
            <div className="mb-2 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-400" />
              <p className="text-sm text-muted-foreground">Voter Turnout</p>
            </div>
            <p className="text-2xl font-bold">-</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
