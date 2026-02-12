import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, QrCode, ExternalLink, Download, User, Calendar, Shield, X } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAppStore } from "@/store/useAppStore";
import { Navigate } from "react-router-dom";
import CertificateVerify from "@/components/certificate/CertificateVerify";

const certificates = [
  {
    id: "CERT-2026-001",
    title: "Blockchain Development Workshop",
    issuer: "CS Department",
    date: "Jan 20, 2026",
    txHash: "stub-tx-8f2ad4e1", // In a real app this would be a valid TX hash
  },
  {
    id: "CERT-2026-002",
    title: "AI/ML Hackathon - Winner",
    issuer: "Innovation Cell",
    date: "Dec 5, 2025",
    txHash: "stub-tx-1b3ca7f2",
  },
  {
    id: "CERT-2026-003",
    title: "Data Structures Course Completion",
    issuer: "Prof. R. Kumar",
    date: "Nov 15, 2025",
    txHash: "stub-tx-4d6ec9b3",
  },
];

export default function CertificatesPage() {
  const { isAuthenticated } = useAppStore();
  const [viewTxId, setViewTxId] = useState<string | null>(null);

  if (!isAuthenticated) return <Navigate to="/auth" replace />;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Certificates</h1>
          <p className="text-sm text-muted-foreground">Your verifiable credentials on the Algorand blockchain.</p>
        </div>

        {/* Verification View Modal/Overlay */}
        <AnimatePresence>
          {viewTxId && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="relative rounded-xl border border-accent/20 bg-accent/5 p-6 mb-8">
                <button
                  onClick={() => setViewTxId(null)}
                  className="absolute top-4 right-4 rounded-full p-1 hover:bg-background/50 transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-accent" />
                  Verifying Certificate
                </h2>
                <CertificateVerify txId={viewTxId} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert, i) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`glass-card-hover group p-6 ${viewTxId === cert.txHash ? "ring-2 ring-accent bg-accent/5" : ""}`}
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <QrCode className="h-8 w-8 text-muted-foreground/30 transition-colors group-hover:text-primary/50" />
              </div>

              <h3 className="mb-1 text-sm font-semibold">{cert.title}</h3>
              <p className="text-xs text-muted-foreground">{cert.issuer}</p>
              <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {cert.date}
              </p>

              <div className="mt-4 flex items-center gap-2 rounded bg-muted/30 px-2 py-1.5 overflow-hidden">
                <span className="font-mono text-[10px] text-muted-foreground truncate w-full">TX: {cert.txHash}</span>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setViewTxId(cert.txHash)}
                  className="btn-outline-glow flex-1 rounded-lg py-1.5 text-xs font-medium hover:bg-accent/10 hover:text-accent hover:border-accent/50 selection:bg-accent"
                >
                  <span className="flex items-center justify-center gap-1">
                    <Shield className="h-3 w-3" /> Verify
                  </span>
                </button>
                <button className="btn-outline-glow flex-1 rounded-lg py-1.5 text-xs font-medium">
                  <span className="flex items-center justify-center gap-1">
                    <Download className="h-3 w-3" /> PDF
                  </span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
