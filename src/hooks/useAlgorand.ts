import { useCallback, useEffect, useRef, useState } from "react";

// ── Algorand TestNet via Algonode (public, no token needed) ─────
const ALGOD_SERVER = "https://testnet-api.algonode.cloud";
const ALGOD_PORT = 443;
const ALGOD_TOKEN = "";

// ── Lazy-loaded singletons ─────────────────────────────────────
let algodClient: any = null;
let peraWallet: any = null;

function getAlgodClient() {
    if (!algodClient) {
        // algosdk is imported at top but client created lazily
        const algosdk = require("algosdk");
        algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);
    }
    return algodClient;
}

async function getPeraWallet() {
    if (!peraWallet) {
        const { PeraWalletConnect } = await import("@perawallet/connect");
        peraWallet = new PeraWalletConnect({ chainId: 416002 });
    }
    return peraWallet;
}

// ── Types ──────────────────────────────────────────────────────
export interface UseAlgorandReturn {
    address: string | null;
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;
    connect: () => Promise<string | null>;
    disconnect: () => void;
    signTransactions: (unsignedTxns: Uint8Array[]) => Promise<Uint8Array[]>;
}

// ── Hook ───────────────────────────────────────────────────────
export function useAlgorand(): UseAlgorandReturn {
    const [address, setAddress] = useState<string | null>(() => {
        try { return localStorage.getItem("pera_address"); } catch { return null; }
    });
    const [isConnected, setIsConnected] = useState(!!address);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const reconnectedRef = useRef(false);

    // Reconnect on mount if address is saved
    useEffect(() => {
        if (reconnectedRef.current) return;
        reconnectedRef.current = true;

        const saved = localStorage.getItem("pera_address");
        if (!saved) return;

        getPeraWallet()
            .then((pera) => pera.reconnectSession())
            .then((accounts: string[]) => {
                if (accounts.length > 0) {
                    setAddress(accounts[0]);
                    setIsConnected(true);
                } else {
                    localStorage.removeItem("pera_address");
                    setAddress(null);
                    setIsConnected(false);
                }
            })
            .catch(() => {
                localStorage.removeItem("pera_address");
                setAddress(null);
                setIsConnected(false);
            });
    }, []);

    // ── Connect ──────────────────────────────────────────────────
    const connect = useCallback(async (): Promise<string | null> => {
        setIsConnecting(true);
        setError(null);

        try {
            const pera = await getPeraWallet();
            const accounts: string[] = await pera.connect();

            if (accounts.length === 0) {
                setError("No accounts returned from Pera Wallet");
                setIsConnecting(false);
                return null;
            }

            const addr = accounts[0];
            setAddress(addr);
            setIsConnected(true);
            localStorage.setItem("pera_address", addr);

            // Listen for disconnect
            pera.connector?.on("disconnect", () => {
                setAddress(null);
                setIsConnected(false);
                localStorage.removeItem("pera_address");
            });

            setIsConnecting(false);
            return addr;
        } catch (err: any) {
            if (err?.data?.type !== "CONNECT_MODAL_CLOSED") {
                setError(err?.message || "Failed to connect wallet");
            }
            setIsConnecting(false);
            return null;
        }
    }, []);

    // ── Disconnect ───────────────────────────────────────────────
    const disconnect = useCallback(async () => {
        try {
            const pera = await getPeraWallet();
            pera.disconnect();
        } catch {
            // ignore
        }
        setAddress(null);
        setIsConnected(false);
        localStorage.removeItem("pera_address");
    }, []);

    // ── Sign Transactions ────────────────────────────────────────
    const signTransactions = useCallback(
        async (unsignedTxns: Uint8Array[]): Promise<Uint8Array[]> => {
            if (!isConnected || !address) {
                throw new Error("Wallet not connected");
            }

            const pera = await getPeraWallet();
            const algosdk = await import("algosdk");

            const txnsToSign = unsignedTxns.map((txnBytes) => ({
                txn: algosdk.decodeUnsignedTransaction(txnBytes),
            }));

            const signedTxns = await pera.signTransaction([
                txnsToSign.map((t: any) => ({ txn: t.txn })),
            ]);

            return signedTxns;
        },
        [isConnected, address]
    );

    return {
        address,
        isConnected,
        isConnecting,
        error,
        connect,
        disconnect,
        signTransactions,
    };
}

export default useAlgorand;
