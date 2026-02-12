import { Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border/40 py-10 px-6">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">TrustSphere</span>
        </div>
        <p>© 2026 TrustSphere. Decentralized Campus Governance.</p>
      </div>
    </footer>
  );
}
