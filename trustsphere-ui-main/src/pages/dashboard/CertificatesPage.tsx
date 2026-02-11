import { motion } from "framer-motion";
import { Award, QrCode, ExternalLink, Download } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAppStore } from "@/store/useAppStore";
import { Navigate } from "react-router-dom";

const certificates = [
  {
    id: "CERT-2026-001",
    title: "Blockchain Development Workshop",
    issuer: "CS Department",
    date: "Jan 20, 2026",
    txHash: "0x8f2a...d4e1",
  },
  {
    id: "CERT-2026-002",
    title: "AI/ML Hackathon - Winner",
    issuer: "Innovation Cell",
    date: "Dec 5, 2025",
    txHash: "0x1b3c...a7f2",
  },
  {
    id: "CERT-2026-003",
    title: "Data Structures Course Completion",
    issuer: "Prof. R. Kumar",
    date: "Nov 15, 2025",
    txHash: "0x4d6e...c9b3",
  },
];

export default function CertificatesPage() {
  const { isAuthenticated } = useAppStore();

  if (!isAuthenticated) return <Navigate to="/auth" replace />;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Certificates</h1>
          <p className="text-sm text-muted-foreground">Your verifiable credentials on the Algorand blockchain.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert, i) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card-hover group p-6"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <QrCode className="h-8 w-8 text-muted-foreground/30 transition-colors group-hover:text-primary/50" />
              </div>

              <h3 className="mb-1 text-sm font-semibold">{cert.title}</h3>
              <p className="text-xs text-muted-foreground">{cert.issuer}</p>
              <p className="mt-1 text-xs text-muted-foreground">{cert.date}</p>

              <div className="mt-4 flex items-center gap-2 rounded bg-muted/30 px-2 py-1.5">
                <span className="font-mono text-[10px] text-muted-foreground">TX: {cert.txHash}</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </div>

              <div className="mt-4 flex gap-2">
                <button className="btn-outline-glow flex-1 rounded-lg py-1.5 text-xs font-medium">
                  <span className="flex items-center justify-center gap-1">
                    <QrCode className="h-3 w-3" /> Verify
                  </span>
                </button>
                <button className="btn-outline-glow flex-1 rounded-lg py-1.5 text-xs font-medium">
                  <span className="flex items-center justify-center gap-1">
                    <Download className="h-3 w-3" /> Download
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
