import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Award,
    Loader2,
    Shield,
    User,
    Calendar,
    CheckCircle,
    AlertTriangle,
    QrCode,
} from "lucide-react";
import { useAlgorand } from "@/hooks/useAlgorand";
import WalletConnectButton from "@/components/wallet/WalletConnectButton";

export default function MintCertificate() {
    const { address, signTransactions } = useAlgorand();

    const [recipientId, setRecipientId] = useState("");
    const [studentName, setStudentName] = useState("");
    const [event, setEvent] = useState("");
    const [role, setRole] = useState("Participant");

    const [status, setStatus] = useState<"idle" | "preparing" | "signing" | "submitting" | "confirmed" | "error">("idle");
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleMint = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!address) return;
        setStatus("preparing");
        setError(null);

        const token = localStorage.getItem("trustsphere_token");

        try {
            // 1. Prepare unsigned TX
            const prepRes = await fetch("/api/chain/cert/mint-unsigned", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    recipientId,
                    student: studentName,
                    event,
                    role,
                    senderAddress: address,
                }),
            });

            if (!prepRes.ok) {
                const data = await prepRes.json();
                throw new Error(data.error || "Failed to prepare certificate");
            }
            const { unsignedTxn } = await prepRes.json();

            // 2. Sign
            setStatus("signing");
            const txnBytes = Uint8Array.from(atob(unsignedTxn), (c) => c.charCodeAt(0));
            const signedTxns = await signTransactions([txnBytes]);
            if (!signedTxns || !signedTxns.length) throw new Error("Signing cancelled");

            // 3. Submit
            setStatus("submitting");
            const signedBase64 = btoa(String.fromCharCode(...new Uint8Array(signedTxns[0])));

            const submitRes = await fetch("/api/chain/cert/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    signedTxn: signedBase64,
                    recipientId,
                    student: studentName,
                    event,
                    role,
                }),
            });

            if (!submitRes.ok) throw new Error("Failed to submit certificate");
            const resData = await submitRes.json();

            setResult(resData);
            setStatus("confirmed");

            // Clear form except maybe event to allow bulk minting? 
            // I'll clear sensitive fields
            setRecipientId("");
            setStudentName("");
        } catch (err: any) {
            setError(err.message || "Minting failed");
            setStatus("error");
        }
    };

    if (!address) {
        return (
            <div className="glass-card flex flex-col items-center gap-4 p-8 text-center bg-card/60 backdrop-blur-sm border border-border">
                <div className="p-4 bg-primary/10 rounded-full">
                    <Award className="h-8 w-8 text-primary" />
                </div>
                <div>
                    <h2 className="text-xl font-bold">Issue Blockchain Certificate</h2>
                    <p className="max-w-md mx-auto mt-2 text-sm text-muted-foreground">
                        Connect your teacher wallet to issue verifiable credentials.
                        Certificates are permanently recorded on Algorand.
                    </p>
                </div>
                <WalletConnectButton />
            </div>
        );
    }

    if (status === "confirmed" && result) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card flex flex-col items-center p-8 text-center"
            >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                    <CheckCircle className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-lg font-semibold">Certificate Minted!</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Successfully issued on Algorand blockchain.
                </p>

                <div className="mt-6 w-full space-y-3 rounded-xl bg-muted/40 p-4 text-left">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Transaction ID</span>
                        <span className="font-mono">{result.certificate.txHash.slice(0, 12)}...</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Verify URL</span>
                        <a
                            href={result.verification.verifyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-primary hover:underline hover:text-primary/80 truncate max-w-[200px]"
                        >
                            {result.verification.verifyUrl}
                        </a>
                    </div>
                </div>

                <button
                    onClick={() => { setStatus("idle"); setResult(null); }}
                    className="btn-outline-glow mt-6 rounded-lg px-6 py-2.5 text-sm font-semibold"
                >
                    Issue Another
                </button>
            </motion.div>
        );
    }

    return (
        <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleMint}
            className="glass-card space-y-5 p-6"
        >
            <div className="flex items-start gap-3 rounded-xl bg-primary/5 p-4 text-xs text-primary border border-primary/10">
                <Shield className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                    <span className="font-semibold block mb-0.5">Issuer Authority</span>
                    You are minting a permanent digital asset on Algorand. This action cannot be undone.
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium">Student User ID</label>
                    <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={recipientId}
                            onChange={(e) => setRecipientId(e.target.value)}
                            placeholder="e.g. 64d3f..."
                            className="w-full rounded-lg border border-border bg-muted/50 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                            required
                        />
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">The recipient's MongoDB ID.</p>
                </div>

                <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium">Student Name</label>
                    <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="Reviewer Name"
                        className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        required
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium">Event / Course</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={event}
                            onChange={(e) => setEvent(e.target.value)}
                            placeholder="Hackathon 2026"
                            className="w-full rounded-lg border border-border bg-muted/50 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium">Role / Achievement</label>
                    <div className="relative">
                        <Award className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            placeholder="Winner / Participant"
                            className="w-full rounded-lg border border-border bg-muted/50 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            required
                        />
                    </div>
                </div>
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
                        <Award className="h-4 w-4" /> Mint Certificate
                    </>
                ) : status === "preparing" ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Preparing Metadata...
                    </>
                ) : status === "signing" ? (
                    <>
                        <Shield className="h-4 w-4 animate-pulse" /> Sign in Wallet...
                    </>
                ) : (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Minting on Algorand...
                    </>
                )}
            </button>
        </motion.form>
    );
}
