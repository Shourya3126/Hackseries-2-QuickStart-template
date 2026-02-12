import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAppStore } from "@/store/useAppStore";
import { Navigate } from "react-router-dom";
import SubmitComplaint from "@/components/complaint/SubmitComplaint";

export default function ComplaintsPage() {
  const { isAuthenticated } = useAppStore();

  if (!isAuthenticated) return <Navigate to="/auth" replace />;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Anonymous Complaints</h1>
          <p className="text-sm text-muted-foreground">Your identity is never revealed. All complaints are anonymized on-chain.</p>
        </div>

        <div className="mx-auto max-w-2xl">
          <SubmitComplaint />
        </div>
      </div>
    </DashboardLayout>
  );
}
