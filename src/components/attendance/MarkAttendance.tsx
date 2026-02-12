import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Scan,
    CheckCircle,
    Loader2,
    Shield,
    AlertTriangle,
    ArrowRight,
} from "lucide-react";
import { useAlgorand } from "@/hooks/useAlgorand";
import WalletConnectButton from "@/components/wallet/WalletConnectButton";

interface MarkAttendanceProps {
    sessionId: string;
    qrCode?: string;
    selfieBase64?: string;
    onSuccess?: (txId: string) => void;
}

type Step = "idle" | "preparing" | "signing" | "submitting" | "confirmed" | "error";

export default function MarkAttendance({
    sessionId,
    qrCode = "MOCK-QR",
    selfieBase64 = "",
    onSuccess,
}: MarkAttendanceProps) {
    const { address, signTransactions } = useAlgorand();
    const [status, setStatus] = useState<Step>("idle");
    const [txId, setTxId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const markAttendance = async () => {
        if (!address) return;
        setStatus("preparing");
        setError(null);

        try {
            // 1. Prepare unsigned transaction
            const token = localStorage.getItem("trustsphere_token");
            const prepRes = await fetch("/api/chain/attendance/create-unsigned", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    sessionId,
                    qrCode,
                    selfieBase64,
                    senderAddress: address,
                }),
            });

            if (!prepRes.ok) {
                const data = await prepRes.json();
                throw new Error(data.error || "Failed to prepare attendance");
            }

            const { unsignedTxn } = await prepRes.json();

            // 2. Sign transaction
            setStatus("signing");
            const txnBytes = Uint8Array.from(atob(unsignedTxn), (c) =>
                c.charCodeAt(0)
            );
            const signedTxns = await signTransactions([txnBytes]);

            if (!signedTxns || signedTxns.length === 0) {
                throw new Error("Signing cancelled or failed");
            }

            // 3. Submit signed transaction
            setStatus("submitting");
            const signedBase64 = btoa(
                String.fromCharCode(...new Uint8Array(signedTxns[0]))
            );

            const submitRes = await fetch("/api/chain/attendance/submit-signed", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    signedTxn: signedBase64,
                    sessionId,
                }),
            });

            if (!submitRes.ok) {
                const data = await submitRes.json();
                throw new Error(data.error || "Failed to submit attendance");
            }

            const result = await submitRes.json();
            setTxId(result.txId);
            setStatus("confirmed");
            onSuccess?.(result.txId);
        } catch (err: any) {
            setError(err.message || "Attendance failed");
            setStatus("error");
        }
    };

    if (!address) {
        return (
            <div className="flex flex-col items-center gap-3 p-4 text-center">
                <div className="rounded-full bg-accent/10 p-3">
                    <Shield className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-sm font-semibold">Connect Wallet</h3>
                <p className="text-xs text-muted-foreground">
                    You need to connect your Pera Wallet to mark verified attendance on-chain.
                </p>
                <WalletConnectButton />
            </div>
        );
    }

    return (
        <div className="w-full space-y-4">
            <AnimatePresence mode="wait">
                {status === "idle" && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center gap-4 py-4"
                    >
                        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
                            <Shield className="h-5 w-5 text-accent" />
                            <div className="text-left">
                                <p className="text-sm font-semibold">Verified on Algorand</p>
                                <p className="text-xs text-muted-foreground">
                                    Your attendance will be permanently recorded.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={markAttendance}
                            className="btn-glow flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-primary-foreground"
                        >
                            Sign & Confirm Attendance <ArrowRight className="h-4 w-4" />
                        </button>
                    </motion.div>
                )}

                {(status === "preparing" || status === "submitting") && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center py-8"
                    >
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="mt-4 text-sm font-medium">
                            {status === "preparing" ? "Preparing transaction..." : "Recording on blockchain..."}
                        </p>
                    </motion.div>
                )}

                {status === "signing" && (
                    <motion.div
                        key="signing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center gap-4 py-8 text-center"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 animate-ping rounded-full bg-accent/20" />
                            <Shield className="relative h-10 w-10 text-accent" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Check Pera Wallet</h3>
                            <p className="text-sm text-muted-foreground">
                                Please approve the transaction in your wallet app.
                            </p>
                        </div>
                    </motion.div>
                )}

                {status === "error" && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center"
                    >
                        <AlertTriangle className="mx-auto h-8 w-8 text-red-500" />
                        <h3 className="mt-2 text-sm font-semibold text-red-500">Failed</h3>
                        <p className="text-xs text-red-400/80">{error}</p>
                        <button
                            onClick={() => setStatus("idle")}
                            className="mt-4 w-full rounded-lg bg-red-500/10 py-2 text-xs font-medium text-red-500 hover:bg-red-500/20"
                        >
                            Try Again
                        </button>
                    </motion.div>
                )}

                {status === "confirmed" && (
                    <motion.div
                        key="confirmed"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center py-6 text-center"
                    >
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                            <CheckCircle className="h-8 w-8 text-accent" />
                        </div>
                        <h3 className="text-lg font-bold text-accent">Attendance Verified!</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Permanently recorded on Algorand.
                        </p>
                        {txId && (
                            <a
                                href={`https://testnet.explorer.perawallet.app/tx/${txId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 rounded-full border border-border px-4 py-1 text-xs text-muted-foreground hover:bg-muted"
                            >
                                TX: {txId.slice(0, 8)}...
                            </a>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
