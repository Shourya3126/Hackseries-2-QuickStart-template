import { motion } from "framer-motion";
import { Wallet, LogOut, Copy, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useAlgorand } from "@/hooks/useAlgorand";

interface WalletConnectButtonProps {
    onConnect?: (address: string) => void;
    onDisconnect?: () => void;
    compact?: boolean;
}

export default function WalletConnectButton({
    onConnect,
    onDisconnect,
    compact = false,
}: WalletConnectButtonProps) {
    const { address, isConnected, isConnecting, error, connect, disconnect } =
        useAlgorand();
    const [copied, setCopied] = useState(false);

    const handleConnect = async () => {
        const addr = await connect();
        if (addr && onConnect) {
            onConnect(addr);
        }
    };

    const handleDisconnect = () => {
        disconnect();
        if (onDisconnect) onDisconnect();
    };

    const copyAddress = () => {
        if (address) {
            navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const truncate = (addr: string) =>
        `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    // ── Connected state ──────────────────────────────────────────
    if (isConnected && address) {
        if (compact) {
            return (
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5">
                        <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                        <span className="font-mono text-xs text-accent">
                            {truncate(address)}
                        </span>
                    </div>
                    <button
                        onClick={handleDisconnect}
                        className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        title="Disconnect wallet"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                    </button>
                </div>
            );
        }

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card space-y-3 p-4"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-accent animate-pulse" />
                        <span className="text-xs font-medium text-accent">Connected</span>
                    </div>
                    <span className="rounded bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground">
                        TestNet
                    </span>
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    <span className="flex-1 font-mono text-xs text-foreground">
                        {truncate(address)}
                    </span>
                    <button
                        onClick={copyAddress}
                        className="rounded p-1 transition-colors hover:bg-muted"
                        title="Copy address"
                    >
                        {copied ? (
                            <CheckCircle className="h-3.5 w-3.5 text-accent" />
                        ) : (
                            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                    </button>
                </div>

                <button
                    onClick={handleDisconnect}
                    className="btn-outline-glow w-full rounded-lg py-2 text-xs font-medium"
                >
                    Disconnect Wallet
                </button>
            </motion.div>
        );
    }

    // ── Disconnected / connecting state ──────────────────────────
    return (
        <div className="space-y-2">
            <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="btn-glow w-full rounded-lg py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
                {isConnecting ? (
                    <span className="flex items-center justify-center gap-2">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent"
                        />
                        Connecting...
                    </span>
                ) : (
                    <span className="flex items-center justify-center gap-2">
                        <Wallet className="h-4 w-4" />
                        Connect Pera Wallet
                    </span>
                )}
            </button>
            {error && (
                <p className="text-center text-xs text-red-400">{error}</p>
            )}
        </div>
    );
}
