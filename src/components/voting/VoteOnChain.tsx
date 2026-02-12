import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Vote,
    CheckCircle,
    ExternalLink,
    Loader2,
    Shield,
    AlertTriangle,
} from "lucide-react";
import { useAlgorand } from "@/hooks/useAlgorand";

interface VoteOnChainProps {
    electionId: string;
    candidateIndex: number;
    candidateName: string;
    electionTitle: string;
    senderAddress: string;
    onSuccess?: (txId: string) => void;
    onError?: (err: string) => void;
}

type VoteStatus =
    | "idle"
    | "preparing"
    | "signing"
    | "submitting"
    | "confirmed"
    | "error";

export default function VoteOnChain({
    electionId,
    candidateIndex,
    candidateName,
    electionTitle,
    senderAddress,
    onSuccess,
    onError,
}: VoteOnChainProps) {
    const { signTransactions } = useAlgorand();
    const [status, setStatus] = useState<VoteStatus>("idle");
    const [txId, setTxId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

    const castVote = async () => {
        setStatus("preparing");
        setError(null);

        try {
            // ── 1. Get unsigned TX from backend ─────────────────────
            const token = localStorage.getItem("trustsphere_token");
            const prepRes = await fetch("/api/chain/vote/unsigned", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ electionId, candidateIndex, senderAddress }),
            });

            if (!prepRes.ok) {
                const data = await prepRes.json();
                throw new Error(data.error || "Failed to prepare vote transaction");
            }

            const { unsignedTxn } = await prepRes.json();

            // ── 2. Sign with Pera Wallet ────────────────────────────
            setStatus("signing");
            const txnBytes = Uint8Array.from(atob(unsignedTxn), (c) =>
                c.charCodeAt(0)
            );
            const signedTxns = await signTransactions([txnBytes]);

            if (!signedTxns || signedTxns.length === 0) {
                throw new Error("Signing cancelled or failed");
            }

            // ── 3. Submit signed TX to backend ──────────────────────
            setStatus("submitting");
            const signedBase64 = btoa(
                String.fromCharCode(...new Uint8Array(signedTxns[0]))
            );

            const submitRes = await fetch("/api/chain/vote/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    signedTxn: signedBase64,
                    electionId,
                    candidateIndex,
                }),
            });

            if (!submitRes.ok) {
                const data = await submitRes.json();
                throw new Error(data.error || "Failed to submit vote");
            }

            const result = await submitRes.json();
            setTxId(result.txId);
            
            // Show success message for 2 seconds
            setShowSuccessMessage(true);
            setTimeout(() => {
                setShowSuccessMessage(false);
                setStatus("confirmed");
            }, 2000);
            
            onSuccess?.(result.txId);
        } catch (err: any) {
            const msg = err?.message || "Vote failed";
            setError(msg);
            setStatus("error");
            onError?.(msg);
        }
    };

    // ── Status label map ───────────────────────────────────────
    const statusConfig: Record<
        VoteStatus,
        { label: string; color: string; icon: typeof Vote }
    > = {
        idle: { label: "Cast Vote", color: "text-primary", icon: Vote },
        preparing: {
            label: "Preparing transaction...",
            color: "text-yellow-400",
            icon: Loader2,
        },
        signing: {
            label: "Sign in Pera Wallet...",
            color: "text-blue-400",
            icon: Shield,
        },
        submitting: {
            label: "Recording on blockchain...",
            color: "text-yellow-400",
            icon: Loader2,
        },
        confirmed: {
            label: "Vote Confirmed!",
            color: "text-accent",
            icon: CheckCircle,
        },
        error: {
            label: "Vote Failed",
            color: "text-red-400",
            icon: AlertTriangle,
        },
    };

    const current = statusConfig[status];
    const Icon = current.icon;
    const isLoading = ["preparing", "signing", "submitting"].includes(status);

    return (
        <div className="space-y-3">
            {/* Success Message - Shows for 2 seconds */}
            {showSuccessMessage && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center justify-center rounded-xl border border-accent/20 bg-accent/10 p-8 text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20"
                    >
                        <CheckCircle className="h-10 w-10 text-accent" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-accent">Voting Successful!</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Your vote has been recorded on the blockchain
                    </p>
                </motion.div>
            )}

            {/* Vote button */}
            {status === "idle" && !showSuccessMessage && (
                <motion.button
                    onClick={castVote}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-glow flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-primary-foreground"
                >
                    <Vote className="h-4 w-4" />
                    Vote for {candidateName}
                </motion.button>
            )}

            {/* Progress / status */}
            {status !== "idle" && (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={status}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className={`flex items-center gap-3 rounded-xl border p-4 ${status === "confirmed"
                                ? "border-accent/20 bg-accent/5"
                                : status === "error"
                                    ? "border-red-500/20 bg-red-500/5"
                                    : "border-border bg-muted/30"
                            }`}
                    >
                        <Icon
                            className={`h-5 w-5 ${current.color} ${isLoading ? "animate-spin" : ""
                                }`}
                        />
                        <div className="flex-1">
                            <p className={`text-sm font-medium ${current.color}`}>
                                {current.label}
                            </p>
                            {status === "signing" && (
                                <p className="text-xs text-muted-foreground">
                                    Check your Pera Wallet app to approve
                                </p>
                            )}
                            {error && (
                                <p className="mt-1 text-xs text-red-400">{error}</p>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            )}

            {/* Success proof */}
            {status === "confirmed" && txId && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                >
                    <div className="glass-card space-y-2 p-4">
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-accent" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                                On-Chain Proof
                            </span>
                        </div>
                        <div className="space-y-1 text-xs">
                            <p>
                                <span className="text-muted-foreground">Election:</span>{" "}
                                <span className="font-medium">{electionTitle}</span>
                            </p>
                            <p>
                                <span className="text-muted-foreground">TX ID:</span>{" "}
                                <span className="font-mono">{txId.slice(0, 20)}...</span>
                            </p>
                            <p>
                                <span className="text-muted-foreground">Network:</span>{" "}
                                <span>Algorand TestNet</span>
                            </p>
                            <p>
                                <span className="text-muted-foreground">Status:</span>{" "}
                                <span className="text-accent">Immutable ✓</span>
                            </p>
                        </div>
                    </div>

                    <a
                        href={`https://testnet.explorer.perawallet.app/tx/${txId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-outline-glow flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-medium"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View on Algorand Explorer
                    </a>
                </motion.div>
            )}

            {/* Retry on error */}
            {status === "error" && (
                <button
                    onClick={() => {
                        setStatus("idle");
                        setError(null);
                    }}
                    className="btn-outline-glow w-full rounded-lg py-2 text-xs font-medium"
                >
                    Try Again
                </button>
            )}
        </div>
    );
}
