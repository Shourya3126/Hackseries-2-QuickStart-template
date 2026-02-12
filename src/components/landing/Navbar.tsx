import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";

export default function Navbar() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="nav-glass"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="h-7 w-7 text-primary" />
          <span className="text-lg font-bold tracking-tight">
            Trust<span className="gradient-text">Sphere</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <a href="#features" className="transition-colors hover:text-foreground">Features</a>
          <a href="#stats" className="transition-colors hover:text-foreground">Stats</a>
          <a href="#about" className="transition-colors hover:text-foreground">About</a>
        </div>

        <Link
          to="/auth"
          className="btn-glow rounded-lg px-5 py-2 text-sm font-semibold text-primary-foreground"
        >
          Enter App
        </Link>
      </div>
    </motion.nav>
  );
}
