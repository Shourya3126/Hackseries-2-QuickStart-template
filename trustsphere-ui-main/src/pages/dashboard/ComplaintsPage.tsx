import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Send, EyeOff } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAppStore } from "@/store/useAppStore";
import { Navigate } from "react-router-dom";

export default function ComplaintsPage() {
  const { isAuthenticated } = useAppStore();
  const [complaint, setComplaint] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!isAuthenticated) return <Navigate to="/auth" replace />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (complaint.trim()) setSubmitted(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Anonymous Complaints</h1>
          <p className="text-sm text-muted-foreground">Your identity is never revealed. All complaints are anonymized on-chain.</p>
        </div>

        <div className="mx-auto max-w-2xl">
          {!submitted ? (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="glass-card space-y-4 p-6"
            >
              <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-xs text-primary">
                <EyeOff className="h-4 w-4" />
                Your identity is protected by zero-knowledge proofs
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Category</label>
                <select className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm outline-none focus:border-primary">
                  <option>Infrastructure</option>
                  <option>Academic</option>
                  <option>Hostel</option>
                  <option>Faculty</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Complaint</label>
                <textarea
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  rows={5}
                  placeholder="Describe your complaint in detail..."
                  className="w-full resize-none rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm outline-none focus:border-primary"
                  required
                />
              </div>

              <button type="submit" className="btn-glow inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-primary-foreground">
                <Send className="h-4 w-4" />
                Submit Anonymously
              </button>
            </motion.form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card flex flex-col items-center p-8 text-center"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                <MessageSquare className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-lg font-semibold">Complaint Submitted</h3>
              <p className="mt-1 text-sm text-muted-foreground">Your complaint has been anonymized and logged on-chain.</p>
              <p className="mt-3 font-mono text-xs text-muted-foreground">REF: C-1043</p>
              <button
                onClick={() => { setSubmitted(false); setComplaint(""); }}
                className="btn-outline-glow mt-6 rounded-lg px-6 py-2.5 text-sm font-semibold"
              >
                Submit Another
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
