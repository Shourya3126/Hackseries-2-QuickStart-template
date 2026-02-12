import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    Shield,
    CheckCircle,
    XCircle,
    ExternalLink,
    Loader2,
    Hash,
    Scale,
    FileCheck,
    Copy,
    Check,
} from "lucide-react";

interface ComplaintVerifyProps {
    txId: string;
}

interface VerifyResult {
    verified: boolean;
    integrityMatch: boolean;
    blockchain: {
        txId: string;
        round: number;
        timestamp: string;
        record?: {
            data: {
                hash: string;
                category: string;
                priority: string;
            };
        };
    };
    database: {
        category: string;
        priority: string;
        createdAt: string;
    } | null;
    explorerUrl: string;
}

export default function ComplaintVerify({ txId }: ComplaintVerifyProps) {
    const [result, setResult] = useState<VerifyResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!txId) return;

        let mounted = true;
        setLoading(true);

        fetch(`/api/chain/complaint/verify/${txId}`)
            .then((res) => {
                if (!res.ok) throw new Error("Verification failed");
                return res.json();
            })
            .then((data) => {
                if (mounted) setResult(data);
            })
            .catch((err) => {
                if (mounted) setError(err.message);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [txId]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying integrity proof on Algorand...
            </div>
        );
    }

    if (error || !result) {
        return (
            <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
                Verification Error: {error || "Proof not found"}
            </div>
        );
    }

    const isIntegrityVerified = result.verified && result.integrityMatch;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-5"
        >
            {/* ── Header Badge ───────────────────────────────────── */}
            <div className="mb-4 flex items-center gap-3">
                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${isIntegrityVerified ? "bg-accent/10" : "bg-red-500/10"
                        }`}
                >
                    {isIntegrityVerified ? (
                        <Shield className="h-5 w-5 text-accent" />
                    ) : (
                        <XCircle className="h-5 w-5 text-red-400" />
                    )}
                </div>
                <div>
                    <h3
                        className={`font-bold ${isIntegrityVerified ? "text-accent" : "text-red-400"
                            }`}
                    >
                        {isIntegrityVerified
                            ? "Complaint Integrity Verified"
                            : "Integrity Check Failed"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        {isIntegrityVerified
                            ? "The on-chain hash matches the database record perfectly."
                            : "The database record does not match the on-chain proof hash."}
                    </p>
                </div>
            </div>

            {/* ── Details Grid ───────────────────────────────────── */}
            <div className="mb-4 grid gap-4 rounded-lg bg-muted/40 p-4 sm:grid-cols-2">
                {/* On-Chain Hash */}
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <Hash className="h-3 w-3" />
                        On-Chain Hash
                    </div>
                    <div className="flex items-center gap-2">
                        <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs text-foreground">
                            {result.blockchain.record?.data.hash.slice(0, 16)}...
                        </code>
                        {isIntegrityVerified && (
                            <CheckCircle className="h-3 w-3 text-accent" />
                        )}
                    </div>
                </div>

                {/* Timestamp */}
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <Scale className="h-3 w-3" />
                        Block Time
                    </div>
                    <p className="text-sm font-medium">
                        {new Date(result.blockchain.timestamp).toLocaleString()}
                    </p>
                </div>

                {/* Category Match */}
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <FileCheck className="h-3 w-3" />
                        Category Match
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                            {result.blockchain.record?.data.category}
                        </span>
                        {result.database?.category ===
                            result.blockchain.record?.data.category && (
                                <CheckCircle className="h-3 w-3 text-accent" />
                            )}
                    </div>
                </div>
            </div>

            {/* ── Footer / Explorer Link ─────────────────────────── */}
            <div className="flex items-center justify-between border-t border-border pt-4">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">TX ID:</span>
                    <button
                        onClick={() => copyToClipboard(result.blockchain.txId)}
                        className="flex items-center gap-1.5 rounded hover:bg-muted px-1.5 py-0.5 text-xs font-mono transition-colors"
                    >
                        {result.blockchain.txId.slice(0, 12)}...
                        {copied ? (
                            <Check className="h-3 w-3 text-accent" />
                        ) : (
                            <Copy className="h-3 w-3 text-muted-foreground" />
                        )}
                    </button>
                </div>
                <a
                    href={result.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80"
                >
                    View on Explorer
                    <ExternalLink className="h-3 w-3" />
                </a>
            </div>
        </motion.div>
    );
}
