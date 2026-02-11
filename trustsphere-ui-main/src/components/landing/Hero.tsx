import { motion } from "framer-motion";
import { ArrowRight, Blocks } from "lucide-react";
import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-16">
      {/* Gradient orbs */}
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-secondary/10 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm"
        >
          <Blocks className="h-4 w-4 text-primary" />
          Powered by Blockchain Technology
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-6 text-5xl font-extrabold leading-tight tracking-tight md:text-7xl"
        >
          Decentralized
          <br />
          <span className="gradient-text">Campus Governance</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl"
        >
          Secure attendance, anonymous voting, AI-powered complaints, and
          verifiable certificates — all on-chain. Trustless. Transparent.
          Unstoppable.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link
            to="/auth"
            className="btn-glow inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-semibold text-primary-foreground"
          >
            Enter App
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#features"
            className="btn-outline-glow inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-semibold"
          >
            Learn More
          </a>
        </motion.div>
      </div>
    </section>
  );
}
