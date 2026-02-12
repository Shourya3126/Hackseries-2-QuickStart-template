import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    Award,
    CheckCircle,
    XCircle,
    Shield,
    ExternalLink,
    Loader2,
    Search,
    Clock,
    User,
    Calendar,
    Hash,
    FileText,
    QrCode,
    Copy,
    Check,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────

interface CertificateData {
    student: string | null;
    event: string | null;
    role: string | null;
    ipfsHash: string | null;
    issuedBy: string | null;
    issuedAt: string | null;
    certHash: string | null;
}

interface VerifyResponse {
    verified: boolean;
    blockchain: {
        txId: string;
        sender: string | null;
        round: number | null;
        timestamp: string | null;
        errors?: string[];
    };
    certificate: CertificateData | null;
    database: {
        id: string;
        title: string;
        description: string;
        recipientEmail: string | null;
        metadata: Record<string, any>;
        issuedAt: string;
    } | null;
    links: {
        explorerUrl: string;
        qrVerifyUrl: string;
        ipfsUrl: string | null;
    };
}

interface CertificateVerifyProps {
    /** Pre-fill TX ID (e.g. from URL params) */
    txId?: string;
    /** Show in compact badge mode */
    compact?: boolean;
}

// ── Component ──────────────────────────────────────────────────

export default function CertificateVerify({
    txId: initialTxId,
    compact = false,
}: CertificateVerifyProps) {
    const [txId, setTxId] = useState(initialTxId || "");
    const [result, setResult] = useState<VerifyResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const verify = async (id?: string) => {
        const targetId = id || txId;
        if (!targetId.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch(`/api/chain/cert/verify/${targetId}`);
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Verification failed");
            }
            setResult(await res.json());
        } catch (err: any) {
            setError(err.message || "Failed to verify certificate");
        }
        setLoading(false);
    };

    // Auto-verify if txId prop provided
    useEffect(() => {
        if (initialTxId) verify(initialTxId);
    }, [initialTxId]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ── Compact badge ──────────────────────────────────────────
    if (compact && result) {
        return (
            <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${result.verified
                        ? "bg-accent/10 text-accent"
                        : "bg-red-500/10 text-red-400"
                    }`}
            >
                {result.verified ? (
                    <>
                        <CheckCircle className="h-3 w-3" /> Verified
                    </>
                ) : (
                    <>
                        <XCircle className="h-3 w-3" /> Invalid
                    </>
                )}
            </span>
        );
    }

    // ── Full public verify page ────────────────────────────────
    return (
        <div className="mx-auto max-w-xl space-y-5">
            {/* Header */}
            <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <Award className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-lg font-bold">Certificate Verification</h2>
                <p className="text-xs text-muted-foreground">
                    Verify any TrustSphere certificate on the Algorand blockchain
                </p>
            </div>

            {/* Search bar */}
            {!initialTxId && (
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Enter Transaction ID or scan QR..."
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
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            "Verify"
                        )}
                    </button>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Verifying on Algorand TestNet...
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {error}
                </div>
            )}

            {/* Result */}
            {result && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    {/* ── Verification badge ─────────────────────────────── */}
                    <div
                        className={`flex items-center gap-4 rounded-2xl p-5 ${result.verified
                                ? "bg-gradient-to-r from-accent/5 to-accent/10 border border-accent/20"
                                : "bg-gradient-to-r from-red-500/5 to-red-500/10 border border-red-500/20"
                            }`}
                    >
                        <div
                            className={`flex h-14 w-14 items-center justify-center rounded-xl ${result.verified ? "bg-accent/15" : "bg-red-500/15"
                                }`}
                        >
                            {result.verified ? (
                                <Shield className="h-7 w-7 text-accent" />
                            ) : (
                                <XCircle className="h-7 w-7 text-red-400" />
                            )}
                        </div>
                        <div>
                            <h3
                                className={`text-base font-bold ${result.verified ? "text-accent" : "text-red-400"
                                    }`}
                            >
                                {result.verified
                                    ? "✓ Certificate Verified"
                                    : "✗ Verification Failed"}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {result.verified
                                    ? "This certificate is authentic and recorded on the Algorand blockchain"
                                    : result.blockchain.errors?.join(", ") ||
                                    "Certificate data does not match expected format"}
                            </p>
                        </div>
                    </div>

                    {/* ── Certificate details (metadata viewer) ─────────── */}
                    {result.certificate && (
                        <div className="glass-card overflow-hidden rounded-2xl">
                            <div className="border-b border-border/50 bg-muted/30 px-5 py-3">
                                <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    <FileText className="h-3.5 w-3.5" />
                                    Certificate Metadata
                                </h4>
                            </div>
                            <div className="space-y-3 p-5">
                                {/* Student */}
                                <div className="flex items-start gap-3">
                                    <User className="mt-0.5 h-4 w-4 text-primary" />
                                    <div>
                                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                            Awarded To
                                        </p>
                                        <p className="text-sm font-semibold">
                                            {result.certificate.student}
                                        </p>
                                    </div>
                                </div>

                                {/* Event */}
                                <div className="flex items-start gap-3">
                                    <Award className="mt-0.5 h-4 w-4 text-primary" />
                                    <div>
                                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                            Event / Achievement
                                        </p>
                                        <p className="text-sm font-semibold">
                                            {result.certificate.event}
                                        </p>
                                    </div>
                                </div>

                                {/* Role */}
                                <div className="flex items-start gap-3">
                                    <Shield className="mt-0.5 h-4 w-4 text-primary" />
                                    <div>
                                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                            Role
                                        </p>
                                        <p className="text-sm font-medium">
                                            {result.certificate.role}
                                        </p>
                                    </div>
                                </div>

                                {/* Issued date */}
                                {result.certificate.issuedAt && (
                                    <div className="flex items-start gap-3">
                                        <Calendar className="mt-0.5 h-4 w-4 text-primary" />
                                        <div>
                                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                                Issued On
                                            </p>
                                            <p className="text-sm">
                                                {new Date(
                                                    result.certificate.issuedAt
                                                ).toLocaleDateString("en-US", {
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Cert hash */}
                                {result.certificate.certHash && (
                                    <div className="flex items-start gap-3">
                                        <Hash className="mt-0.5 h-4 w-4 text-primary" />
                                        <div>
                                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                                Certificate Hash
                                            </p>
                                            <p className="font-mono text-xs text-muted-foreground">
                                                {result.certificate.certHash.slice(0, 24)}...
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Blockchain proof ───────────────────────────────── */}
                    <div className="glass-card overflow-hidden rounded-2xl">
                        <div className="border-b border-border/50 bg-muted/30 px-5 py-3">
                            <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                <Shield className="h-3.5 w-3.5" />
                                Blockchain Proof
                            </h4>
                        </div>
                        <div className="space-y-2 p-5 text-xs">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Network</span>
                                <span className="font-medium">Algorand TestNet</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">TX ID</span>
                                <button
                                    onClick={() =>
                                        copyToClipboard(result.blockchain.txId)
                                    }
                                    className="flex items-center gap-1 font-mono hover:text-primary"
                                >
                                    {result.blockchain.txId.slice(0, 16)}...
                                    {copied ? (
                                        <Check className="h-3 w-3 text-accent" />
                                    ) : (
                                        <Copy className="h-3 w-3" />
                                    )}
                                </button>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Block</span>
                                <span className="font-mono">
                                    {result.blockchain.round || "Pending"}
                                </span>
                            </div>
                            {result.blockchain.timestamp && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Confirmed</span>
                                    <span>
                                        {new Date(
                                            result.blockchain.timestamp
                                        ).toLocaleString()}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Immutable</span>
                                <span className="text-accent font-medium">Yes ✓</span>
                            </div>
                        </div>
                    </div>

                    {/* ── QR Verification URL ────────────────────────────── */}
                    {result.links.qrVerifyUrl && (
                        <div className="glass-card flex items-center gap-3 p-4">
                            <QrCode className="h-8 w-8 text-primary" />
                            <div className="flex-1">
                                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                    QR Verification Link
                                </p>
                                <p className="font-mono text-xs text-foreground break-all">
                                    {result.links.qrVerifyUrl}
                                </p>
                            </div>
                            <button
                                onClick={() => copyToClipboard(result.links.qrVerifyUrl)}
                                className="rounded-lg p-2 hover:bg-muted"
                            >
                                {copied ? (
                                    <Check className="h-4 w-4 text-accent" />
                                ) : (
                                    <Copy className="h-4 w-4 text-muted-foreground" />
                                )}
                            </button>
                        </div>
                    )}

                    {/* ── Action buttons ─────────────────────────────────── */}
                    <div className="flex gap-2">
                        <a
                            href={result.links.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-outline-glow flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-medium"
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Algorand Explorer
                        </a>
                        {result.links.ipfsUrl && (
                            <a
                                href={result.links.ipfsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-outline-glow flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-medium"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                View on IPFS
                            </a>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
