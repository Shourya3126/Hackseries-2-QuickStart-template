import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Mail, Lock, Wallet, User, GraduationCap, BookOpen, Settings } from "lucide-react";
import { useAppStore, UserRole } from "@/store/useAppStore";
import WalletConnectButton from "@/components/wallet/WalletConnectButton";

const roles: { id: UserRole; label: string; icon: typeof User; desc: string }[] = [
  { id: "student", label: "Student", icon: GraduationCap, desc: "Attend, vote, submit complaints" },
  { id: "teacher", label: "Teacher", icon: BookOpen, desc: "Manage classes & elections" },
  { id: "admin", label: "Admin", icon: Settings, desc: "Full platform oversight" },
];

export default function Auth() {
  const navigate = useNavigate();
  const { setAuthenticated, setUserRole, setUserName, setWalletConnected, setWalletAddress } = useAppStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [step, setStep] = useState<"login" | "role" | "wallet">("login");
  const [isSignup, setIsSignup] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError("");

    if (isSignup) {
      // In signup mode, go to role selection first, then register
      setUserName(email.split("@")[0]);
      setStep("role");
      setLoading(false);
    } else {
      // Login mode — call backend
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Login failed");
          setLoading(false);
          return;
        }
        // Store JWT token
        localStorage.setItem("trustsphere_token", data.token);
        localStorage.setItem("trustsphere_user", JSON.stringify(data.user));
        setUserName(data.user.email.split("@")[0]);
        setUserRole(data.user.role);
        setWalletConnected(!!data.user.walletAddress);
        setAuthenticated(true);
        navigate("/dashboard");
      } catch (err) {
        setError("Network error. Is the server running?");
      }
      setLoading(false);
    }
  };

  const handleRoleSelect = async (role: UserRole) => {
    setSelectedRole(role);
    setLoading(true);
    setError("");

    try {
      // Register on the backend
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }
      // Store JWT token
      localStorage.setItem("trustsphere_token", data.token);
      localStorage.setItem("trustsphere_user", JSON.stringify(data.user));
      setUserRole(role);
      setStep("wallet");
    } catch (err) {
      setError("Network error. Is the server running?");
    }
    setLoading(false);
  };

  const handleWalletConnected = async (address: string) => {
    // Save wallet address to backend
    try {
      const token = localStorage.getItem("trustsphere_token");
      if (token) {
        await fetch("/api/auth/link-wallet", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ walletAddress: address }),
        });
      }
    } catch {
      // Non-fatal — wallet still connected locally
    }
    setWalletAddress(address);
    setAuthenticated(true);
    navigate("/dashboard");
  };

  const handleSkipWallet = () => {
    setWalletConnected(false);
    setAuthenticated(true);
    navigate("/dashboard");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6">
      <div className="pointer-events-none absolute left-1/3 top-1/3 h-80 w-80 rounded-full bg-primary/8 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-1/3 right-1/3 h-80 w-80 rounded-full bg-secondary/8 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card w-full max-w-md p-8"
      >
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">Trust<span className="gradient-text">Sphere</span></span>
        </Link>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-center text-sm text-red-400">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === "login" && (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleLogin}
              className="space-y-5"
            >
              <h2 className="text-center text-lg font-semibold">
                {isSignup ? "Create Account" : "Sign In"}
              </h2>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="you@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-border bg-muted/50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="Password (min 6 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-muted/50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-glow w-full rounded-lg py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {loading ? "Please wait..." : isSignup ? "Continue" : "Sign In"}
              </button>
              <p className="text-center text-xs text-muted-foreground">
                {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => { setIsSignup(!isSignup); setError(""); }}
                  className="text-primary hover:underline"
                >
                  {isSignup ? "Sign In" : "Sign Up"}
                </button>
              </p>
            </motion.form>
          )}

          {step === "role" && (
            <motion.div
              key="role"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <h2 className="text-center text-lg font-semibold">Select Your Role</h2>
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleRoleSelect(r.id)}
                  disabled={loading}
                  className="glass-card-hover flex w-full items-center gap-4 p-4 text-left disabled:opacity-50"
                >
                  <div className="rounded-lg bg-primary/10 p-2.5">
                    <r.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{r.label}</p>
                    <p className="text-xs text-muted-foreground">{r.desc}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}

          {step === "wallet" && (
            <motion.div
              key="wallet"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-5 text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Wallet className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">Connect Algorand Wallet</h2>
              <p className="text-sm text-muted-foreground">
                Connect your Pera Wallet for on-chain verification, or skip to continue with limited features.
              </p>
              <WalletConnectButton onConnect={handleWalletConnected} />
              <button
                onClick={handleSkipWallet}
                className="btn-outline-glow w-full rounded-lg py-2.5 text-sm font-semibold"
              >
                Skip for Now
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

