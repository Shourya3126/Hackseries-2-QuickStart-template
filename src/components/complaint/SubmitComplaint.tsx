import { useState } from "react";
import { motion } from "framer-motion";
import {
    Send,
    Loader2,
    Shield,
    EyeOff,
    AlertTriangle,
    CheckCircle,
} from "lucide-react";
import { useAlgorand } from "@/hooks/useAlgorand";
import WalletConnectButton from "@/components/wallet/WalletConnectButton";

export default function SubmitComplaint() {
    const { address, signTransactions } = useAlgorand();
    const [complaintText, setComplaintText] = useState("");
    const [category, setCategory] = useState("Infrastructure");

    const [status, setStatus] = useState<"idle" | "preparing" | "signing" | "submitting" | "confirmed" | "error">("idle");
    const [txId, setTxId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!address) return;
        setStatus("preparing");
        setError(null);

        const token = localStorage.getItem("trustsphere_token");

        try {
            // 1. Prepare unsigned TX
            const prepRes = await fetch("/api/chain/complaint/submit-unsigned", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    text: complaintText,
                    category,
                    senderAddress: address,
                }),
            });

            if (!prepRes.ok) throw new Error("Failed to prepare complaint");
            const { unsignedTxn } = await prepRes.json();

            // 2. Sign
            setStatus("signing");
            const txnBytes = Uint8Array.from(atob(unsignedTxn), (c) => c.charCodeAt(0));
            const signedTxns = await signTransactions([txnBytes]);
            if (!signedTxns || !signedTxns.length) throw new Error("Signing cancelled");

            // 3. Submit
            setStatus("submitting");
            const signedBase64 = btoa(String.fromCharCode(...new Uint8Array(signedTxns[0])));

            const submitRes = await fetch("/api/chain/complaint/submit-signed", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    signedTxn: signedBase64,
                    text: complaintText,
                    category,
                }),
            });

            if (!submitRes.ok) throw new Error("Failed to submit complaint");
            const result = await submitRes.json();

            setTxId(result.txId);
            setStatus("confirmed");
            setComplaintText(""); // Clear form
        } catch (err: any) {
            setError(err.message || "Submission failed");
            setStatus("error");
        }
    };

    if (!address) {
        return (
            <div className="glass-card flex flex-col items-center gap-4 p-8 text-center bg-card/60 backdrop-blur-sm border border-border">
                <div className="p-4 bg-muted/30 rounded-full">
                    <EyeOff className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                    <h2 className="text-xl font-bold">Anonymous Complaints</h2>
                    <p className="max-w-md mx-auto mt-2 text-sm text-muted-foreground">
                        Connect your wallet to create an immutable proof of your complaint.
                        Your identity remains hidden, but the integrity of your report is guaranteed by the blockchain.
                    </p>
                </div>
                <WalletConnectButton />
            </div>
        );
    }

    if (status === "confirmed") {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card flex flex-col items-center p-8 text-center"
            >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                    <CheckCircle className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-lg font-semibold">Complaint Submitted</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Your complaint is anonymized and secured on Algorand.
                </p>
                {txId && (
                    <div className="mt-4 rounded-lg bg-muted/40 px-3 py-2 text-xs font-mono">
                        TX: {txId.slice(0, 12)}...
                    </div>
                )}
                <button
                    onClick={() => setStatus("idle")}
                    className="btn-outline-glow mt-6 rounded-lg px-6 py-2.5 text-sm font-semibold"
                >
                    Submit Another
                </button>
            </motion.div>
        );
    }

    return (
        <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="glass-card space-y-5 p-6"
        >
            <div className="flex items-start gap-3 rounded-xl bg-primary/5 p-4 text-xs text-primary border border-primary/10">
                <Shield className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                    <span className="font-semibold block mb-0.5">Blockchain Integrity Proof</span>
                    We calculate a unique hash of your complaint and store it on-chain to prove it hasn't been tampered with. Your text remains private.
                </div>
            </div>

            <div>
                <label className="mb-1.5 block text-sm font-medium">Category</label>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                >
                    <option>Infrastructure</option>
                    <option>Academic</option>
                    <option>Hostel</option>
                    <option>Faculty</option>
                    <option>Other</option>
                </select>
            </div>

            <div>
                <label className="mb-1.5 block text-sm font-medium">Complaint</label>
                <textarea
                    value={complaintText}
                    onChange={(e) => setComplaintText(e.target.value)}
                    rows={5}
                    disabled={status !== "idle" && status !== "error"}
                    placeholder="Describe your issue in detail... (min 10 chars)"
                    className="w-full resize-none rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/50"
                    required
                    minLength={10}
                />
            </div>

            {error && (
                <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-500 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <button
                type="submit"
                disabled={status !== "idle" && status !== "error"}
                className="btn-glow w-full flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-primary-foreground disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
                {status === "idle" || status === "error" ? (
                    <>
                        <Send className="h-4 w-4" /> Submit Anonymously
                    </>
                ) : status === "preparing" ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Preparing Proof...
                    </>
                ) : status === "signing" ? (
                    <>
                        <Shield className="h-4 w-4 animate-pulse" /> Check Wallet App...
                    </>
                ) : (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                    </>
                )}
            </button>
        </motion.form>
    );
}
