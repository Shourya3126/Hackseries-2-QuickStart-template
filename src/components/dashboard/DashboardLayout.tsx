import { ReactNode } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield, LogOut, Home, QrCode, Vote, MessageSquare, Award,
  BookOpen, Users, BarChart3, FileCheck, Wallet
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const studentNav = [
  { to: "/dashboard", icon: Home, label: "Overview" },
  { to: "/dashboard/attendance", icon: QrCode, label: "Attendance" },
  { to: "/dashboard/voting", icon: Vote, label: "Elections" },
  { to: "/dashboard/complaints", icon: MessageSquare, label: "Complaints" },
  { to: "/dashboard/certificates", icon: Award, label: "Certificates" },
];

const teacherNav = [
  { to: "/dashboard", icon: Home, label: "Overview" },
  { to: "/dashboard/attendance", icon: BookOpen, label: "Sessions" },
  { to: "/dashboard/teacher-voting", icon: Vote, label: "Elections" },
  { to: "/dashboard/certificates", icon: Award, label: "Issue Certs" },
];

const adminNav = [
  { to: "/dashboard", icon: Home, label: "Overview" },
  { to: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/dashboard/complaints", icon: MessageSquare, label: "Complaints" },
  { to: "/dashboard/verification", icon: FileCheck, label: "Verification" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { userRole, userName, walletConnected, logout } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = userRole === "admin" ? adminNav : userRole === "teacher" ? teacherNav : studentNav;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border/50 bg-sidebar">
        <div className="flex h-16 items-center gap-2 border-b border-border/50 px-6">
          <Shield className="h-6 w-6 text-primary" />
          <span className="font-bold">Trust<span className="gradient-text">Sphere</span></span>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border/50 p-4">
          <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Wallet className="h-3.5 w-3.5" />
            {walletConnected ? (
              <span className="text-accent">Wallet Connected</span>
            ) : (
              <span>No Wallet</span>
            )}
          </div>
          <div className="mb-3 rounded-lg bg-muted/50 px-3 py-2">
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="text-sm font-medium">{userName || "User"}</p>
            <p className="text-xs capitalize text-primary">{userRole}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-64 flex-1 p-8">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
