import { useState } from "react";
import { motion } from "framer-motion";
import {
    CheckCircle,
    XCircle,
    Shield,
    ExternalLink,
    Loader2,
    Search,
    Clock,
    Hash,
    User,
} from "lucide-react";

interface VerificationResult {
    verified: boolean;
    blockchain: {
        txId: string;
        sender: string | null;
        round: number | null;
        timestamp: string | null;
        record: {
            app: string;
            type: string;
            data: {
                studentHash: string;
                sessionId: string;
                faceHash: string;
                deviceHash: string;
                time: string;
            };
            timestamp: string;
        } | null;
        errors?: string[];
    };
    database: {
        sessionTitle: string;
        sessionDate: string;
        markedAt: string;
    } | null;
    explorerUrl: string;
}

interface AttendanceVerificationProps {
    /** Pre-fill with a TX ID (optional) */
    txId?: string;
    /** Compact inline mode */
    compact?: boolean;
}

export default function AttendanceVerification({
    txId: initialTxId,
    compact = false,
}: AttendanceVerificationProps) {
    const [txId, setTxId] = useState(initialTxId || "");
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const verify = async (id?: string) => {
        const targetId = id || txId;
        if (!targetId.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch(`/api/chain/attendance/verify/${targetId}`);
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Verification failed");
            }
            const data: VerificationResult = await res.json();
            setResult(data);
        } catch (err: any) {
            setError(err.message || "Failed to verify");
        }
        setLoading(false);
    };

    // Auto-verify if txId prop provided
    if (initialTxId && !result && !loading && !error) {
        verify(initialTxId);
    }

    // ── Compact badge mode ─────────────────────────────────────
    if (compact && result) {
        return (
            <div className="inline-flex items-center gap-1.5">
                {result.verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                        <CheckCircle className="h-3 w-3" />
                        Verified
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400">
                        <XCircle className="h-3 w-3" />
                        Invalid
                    </span>
                )}
            </div>
        );
    }

    // ── Full verification UI ───────────────────────────────────
    return (
        <div className="space-y-4">
            {/* Search bar */}
            {!initialTxId && (
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Enter Transaction ID..."
                            value={txId}
                            onChange={(e) => setTxId(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && verify()}
                            className="w-full rounded-lg border border-border bg-muted/50 py-2 pl-9 pr-4 font-mono text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                    </div>
                    <button
                        onClick={() => verify()}
                        disabled={loading || !txId.trim()}
                        className="btn-glow rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                    </button>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying on Algorand TestNet...
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {error}
                </div>
            )}

            {/* Result */}
            {result && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    {/* Verification badge */}
                    <div
                        className={`flex items-center gap-3 rounded-xl p-4 ${result.verified
                                ? "bg-accent/5 border border-accent/20"
                                : "bg-red-500/5 border border-red-500/20"
                            }`}
                    >
                        {result.verified ? (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                                <Shield className="h-6 w-6 text-accent" />
                            </div>
                        ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                                <XCircle className="h-6 w-6 text-red-400" />
                            </div>
                        )}
                        <div>
                            <h3
                                className={`font-semibold ${result.verified ? "text-accent" : "text-red-400"
                                    }`}
                            >
                                {result.verified
                                    ? "✓ Attendance Verified On-Chain"
                                    : "✗ Verification Failed"}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {result.verified
                                    ? "This attendance record is immutable and confirmed on Algorand TestNet"
                                    : result.blockchain.errors?.join(", ") || "Record does not match expected format"}
                            </p>
                        </div>
                    </div>

                    {/* On-chain details */}
                    {result.blockchain.record && (
                        <div className="glass-card space-y-3 p-4">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Blockchain Record
                            </h4>
                            <div className="grid gap-2 text-xs">
                                <div className="flex items-center gap-2">
                                    <Hash className="h-3.5 w-3.5 text-primary" />
                                    <span className="text-muted-foreground">TX ID:</span>
                                    <span className="font-mono text-foreground">
                                        {result.blockchain.txId.slice(0, 16)}...
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <User className="h-3.5 w-3.5 text-primary" />
                                    <span className="text-muted-foreground">Student Hash:</span>
                                    <span className="font-mono text-foreground">
                                        {result.blockchain.record.data.studentHash.slice(0, 16)}...
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-3.5 w-3.5 text-primary" />
                                    <span className="text-muted-foreground">Time:</span>
                                    <span className="text-foreground">
                                        {new Date(result.blockchain.record.data.time).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Shield className="h-3.5 w-3.5 text-primary" />
                                    <span className="text-muted-foreground">Block:</span>
                                    <span className="font-mono text-foreground">
                                        {result.blockchain.round || "Pending"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DB cross-reference */}
                    {result.database && (
                        <div className="glass-card space-y-2 p-4">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Session Info
                            </h4>
                            <p className="text-sm font-medium">{result.database.sessionTitle}</p>
                            <p className="text-xs text-muted-foreground">
                                Marked at: {new Date(result.database.markedAt).toLocaleString()}
                            </p>
                        </div>
                    )}

                    {/* Explorer link */}
                    <a
                        href={result.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-outline-glow flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-medium"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View on Algorand Explorer
                    </a>
                </motion.div>
            )}
        </div>
    );
}
