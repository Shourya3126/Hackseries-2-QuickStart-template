import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, Camera, CheckCircle, Loader2, Scan } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAppStore } from "@/store/useAppStore";
import { Navigate } from "react-router-dom";

const steps = ["Scan QR", "Selfie Capture", "Liveness Check", "Confirmed"];

export default function AttendancePage() {
  const { isAuthenticated } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);

  if (!isAuthenticated) return <Navigate to="/auth" replace />;

  const nextStep = () => setCurrentStep((s) => Math.min(s + 1, steps.length - 1));

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Join Attendance</h1>
          <p className="text-sm text-muted-foreground">Complete all verification steps to mark attendance.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                i <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {i < currentStep ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`hidden text-xs sm:block ${i <= currentStep ? "text-foreground" : "text-muted-foreground"}`}>
                {step}
              </span>
              {i < steps.length - 1 && (
                <div className={`h-0.5 w-8 transition-colors ${i < currentStep ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-auto max-w-md"
          >
            {currentStep === 0 && (
              <div className="glass-card flex flex-col items-center p-8 text-center">
                <div className="relative mb-6 flex h-48 w-48 items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-muted/20">
                  <Scan className="h-16 w-16 text-primary/40 animate-pulse-glow" />
                  <div className="absolute inset-4 rounded-xl border border-primary/20" />
                </div>
                <h3 className="text-lg font-semibold">Scan QR Code</h3>
                <p className="mt-1 text-sm text-muted-foreground">Point your camera at the session QR code.</p>
                <button onClick={nextStep} className="btn-glow mt-6 rounded-lg px-6 py-2.5 text-sm font-semibold text-primary-foreground">
                  Simulate Scan
                </button>
              </div>
            )}

            {currentStep === 1 && (
              <div className="glass-card flex flex-col items-center p-8 text-center">
                <div className="relative mb-6 flex h-48 w-48 items-center justify-center overflow-hidden rounded-full border-2 border-secondary/40 bg-muted/20">
                  <Camera className="h-16 w-16 text-secondary/40" />
                  <div className="absolute inset-0 animate-pulse-glow rounded-full border-2 border-secondary/20" />
                </div>
                <h3 className="text-lg font-semibold">Capture Selfie</h3>
                <p className="mt-1 text-sm text-muted-foreground">Take a selfie for identity verification.</p>
                <button onClick={nextStep} className="btn-glow mt-6 rounded-lg px-6 py-2.5 text-sm font-semibold text-primary-foreground">
                  Capture
                </button>
              </div>
            )}

            {currentStep === 2 && (
              <div className="glass-card flex flex-col items-center p-8 text-center">
                <div className="relative mb-6 flex h-48 w-48 items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-2 border-t-accent border-r-transparent border-b-transparent border-l-transparent"
                  />
                  <Loader2 className="h-12 w-12 text-accent animate-spin" />
                </div>
                <h3 className="text-lg font-semibold">Liveness Detection</h3>
                <p className="mt-1 text-sm text-muted-foreground">Verifying you're a real person…</p>
                <button onClick={nextStep} className="btn-glow mt-6 rounded-lg px-6 py-2.5 text-sm font-semibold text-primary-foreground">
                  Verify
                </button>
              </div>
            )}

            {currentStep === 3 && (
              <div className="glass-card flex flex-col items-center p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 10 }}
                  className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-accent/10"
                >
                  <CheckCircle className="h-12 w-12 text-accent" />
                </motion.div>
                <h3 className="text-lg font-semibold">Attendance Confirmed!</h3>
                <p className="mt-1 text-sm text-muted-foreground">Your attendance has been logged on-chain.</p>
                <p className="mt-3 font-mono text-xs text-muted-foreground">TX: 0x3f8a...b2c1</p>
                <button
                  onClick={() => setCurrentStep(0)}
                  className="btn-outline-glow mt-6 rounded-lg px-6 py-2.5 text-sm font-semibold"
                >
                  Done
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
