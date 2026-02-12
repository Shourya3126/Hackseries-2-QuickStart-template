import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useAlgorand } from "@/hooks/useAlgorand";

interface SignTransactionProps {
    /** The type of transaction to prepare (attendance, vote, complaint, certificate) */
    txType: "attendance" | "vote" | "complaint" | "certificate";
    /** Data payload sent to backend to build the unsigned transaction */
    payload: Record<string, any>;
    /** Called after successful broadcast with the txId */
    onSuccess?: (txId: string) => void;
    /** Called on error */
    onError?: (error: string) => void;
    /** Button label */
    label?: string;
    /** Additional CSS classes for the button */
    className?: string;
}

type TxStatus = "idle" | "preparing" | "signing" | "broadcasting" | "confirmed" | "error";

export default function SignTransaction({
    txType,
    payload,
    onSuccess,
    onError,
    label = "Sign & Submit",
    className = "",
}: SignTransactionProps) {
    const { address, isConnected, signTransactions } = useAlgorand();
    const [status, setStatus] = useState<TxStatus>("idle");
    const [txId, setTxId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const getToken = () => localStorage.getItem("trustsphere_token") || "";

    const handleSign = async () => {
        if (!isConnected || !address) {
            setError("Connect your wallet first");
            return;
        }

        setStatus("preparing");
        setError(null);

        try {
            // 1. Ask backend to prepare an unsigned transaction
            const prepareRes = await fetch("/api/tx/prepare", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({
                    type: txType,
                    senderAddress: address,
                    ...payload,
                }),
            });

            if (!prepareRes.ok) {
                const data = await prepareRes.json();
                throw new Error(data.error || "Failed to prepare transaction");
            }

            const { unsignedTxn } = await prepareRes.json();

            // 2. Convert base64 → Uint8Array and sign with Pera
            setStatus("signing");
            const txnBytes = Uint8Array.from(atob(unsignedTxn), (c) => c.charCodeAt(0));
            const signedTxns = await signTransactions([txnBytes]);

            if (!signedTxns || signedTxns.length === 0) {
                throw new Error("Transaction signing was cancelled");
            }

            // 3. Send signed blob to backend for broadcast
            setStatus("broadcasting");
            const signedBase64 = btoa(
                String.fromCharCode(...new Uint8Array(signedTxns[0]))
            );

            const broadcastRes = await fetch("/api/tx/broadcast", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({
                    signedTxn: signedBase64,
                    type: txType,
                    ...payload,
                }),
            });

            if (!broadcastRes.ok) {
                const data = await broadcastRes.json();
                throw new Error(data.error || "Failed to broadcast transaction");
            }

            const result = await broadcastRes.json();
            setTxId(result.txId);
            setStatus("confirmed");

            if (onSuccess) onSuccess(result.txId);
        } catch (err: any) {
            const msg = err?.message || "Transaction failed";
            setError(msg);
            setStatus("error");
            if (onError) onError(msg);
        }
    };

    const reset = () => {
        setStatus("idle");
        setTxId(null);
        setError(null);
    };

    // ── Confirmed state ──────────────────────────────────────────
    if (status === "confirmed" && txId) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-2 rounded-lg bg-accent/5 p-4"
            >
                <CheckCircle className="h-8 w-8 text-accent" />
                <p className="text-sm font-medium text-accent">Transaction Confirmed</p>
                <p className="font-mono text-[10px] text-muted-foreground">
                    TX: {txId.slice(0, 12)}...{txId.slice(-6)}
                </p>
                <a
                    href={`https://testnet.explorer.perawallet.app/tx/${txId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                >
                    View on Explorer →
                </a>
                <button onClick={reset} className="mt-1 text-xs text-muted-foreground hover:text-foreground">
                    Done
                </button>
            </motion.div>
        );
    }

    // ── Error state ──────────────────────────────────────────────
    if (status === "error") {
        return (
            <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                </div>
                <button
                    onClick={reset}
                    className="btn-outline-glow w-full rounded-lg py-2 text-xs font-medium"
                >
                    Try Again
                </button>
            </div>
        );
    }

    // ── Loading states ───────────────────────────────────────────
    const isLoading = ["preparing", "signing", "broadcasting"].includes(status);
    const statusLabels: Record<string, string> = {
        preparing: "Preparing transaction...",
        signing: "Sign in Pera Wallet...",
        broadcasting: "Broadcasting to Algorand...",
    };

    return (
        <button
            onClick={handleSign}
            disabled={isLoading || !isConnected}
            className={`btn-glow flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 ${className}`}
        >
            {isLoading ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {statusLabels[status]}
                </>
            ) : (
                <>
                    <Send className="h-4 w-4" />
                    {label}
                </>
            )}
        </button>
    );
}
