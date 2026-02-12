import { useAppStore } from "@/store/useAppStore";
import { Navigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StudentDashboard from "./StudentDashboard";
import TeacherDashboard from "./TeacherDashboard";
import AdminDashboard from "./AdminDashboard";

export default function DashboardPage() {
  const { isAuthenticated, userRole } = useAppStore();

  if (!isAuthenticated) return <Navigate to="/auth" replace />;

  return (
    <DashboardLayout>
      {userRole === "student" && <StudentDashboard />}
      {userRole === "teacher" && <TeacherDashboard />}
      {userRole === "admin" && <AdminDashboard />}
    </DashboardLayout>
  );
}
