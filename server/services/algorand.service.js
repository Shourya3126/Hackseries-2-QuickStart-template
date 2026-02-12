/**
 * Algorand Blockchain Service
 * Uses algosdk to interact with Algorand TestNet via Algonode public endpoints.
 */
const algosdk = require("algosdk");

// ── Client singletons ──────────────────────────────────
let _algodClient = null;

function getAlgodClient() {
    if (!_algodClient) {
        const token = process.env.ALGO_TOKEN || "";
        const server = process.env.ALGO_SERVER || "https://testnet-api.algonode.cloud";
        const port = process.env.ALGO_PORT || 443;
        _algodClient = new algosdk.Algodv2(token, server, port);
    }
    return _algodClient;
}

// ── Helpers ────────────────────────────────────────────

/**
 * Recover an Algorand account from the server-side mnemonic in env.
 * This is the "master" demo account that funds transactions on TestNet.
 */
function getMasterAccount() {
    const mnemonic = process.env.ALGO_MNEMONIC;
    if (!mnemonic || mnemonic.includes("your-25-word")) {
        return null; // not configured – blockchain calls will be stubbed
    }
    return algosdk.mnemonicToSecretKey(mnemonic);
}

// ── Public API ─────────────────────────────────────────

/**
 * Generate a fresh Algorand keypair.
 * Returns { addr, sk, mnemonic }
 */
function createAccount() {
    const account = algosdk.generateAccount();
    const mnemonic = algosdk.secretKeyToMnemonic(account.sk);
    return { addr: account.addr, sk: account.sk, mnemonic };
}

/**
 * Submit a zero-ALGO payment transaction with an arbitrary note field.
 * Uses the master account as sender so students don't need funds.
 */
async function submitTransaction(note) {
    const master = getMasterAccount();
    if (!master) {
        // Stub mode — return a fake tx id
        return { txId: `stub-tx-${Date.now()}`, confirmed: false };
    }

    const client = getAlgodClient();
    const params = await client.getTransactionParams().do();

    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: master.addr,
        to: master.addr, // self-transfer (0 ALGO) – we only care about the note
        amount: 0,
        note: new Uint8Array(Buffer.from(JSON.stringify(note))),
        suggestedParams: params,
    });

    const signed = txn.signTxn(master.sk);
    const { txId } = await client.sendRawTransaction(signed).do();
    await algosdk.waitForConfirmation(client, txId, 4);
    return { txId, confirmed: true };
}

/**
 * Write attendance record on-chain.
 */
async function writeAttendance(sessionId, studentId, timestamp) {
    return submitTransaction({
        type: "attendance",
        sessionId,
        studentId,
        timestamp: timestamp || new Date().toISOString(),
    });
}

/**
 * Record a vote on-chain (note contains election + anonymised token).
 */
async function castVote(electionId, anonymousToken) {
    return submitTransaction({
        type: "vote",
        electionId,
        token: anonymousToken,
        timestamp: new Date().toISOString(),
    });
}

/**
 * Store a complaint hash on-chain.
 */
async function storeComplaintHash(complaintHash) {
    return submitTransaction({
        type: "complaint",
        hash: complaintHash,
        timestamp: new Date().toISOString(),
    });
}

/**
 * Mint a certificate as an Algorand Standard Asset (ASA) — NFT style.
 * total = 1, decimals = 0  → non-fungible.
 */
async function mintCertificate(recipientAddr, metadata) {
    const master = getMasterAccount();
    if (!master) {
        return {
            assetId: Math.floor(Math.random() * 1e9),
            txId: `stub-mint-${Date.now()}`,
            confirmed: false,
        };
    }

    const client = getAlgodClient();
    const params = await client.getTransactionParams().do();

    const metadataStr = JSON.stringify(metadata);

    const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
        from: master.addr,
        total: 1,
        decimals: 0,
        assetName: (metadata.title || "TrustSphere Cert").substring(0, 32),
        unitName: "TSCERT",
        assetURL: "https://trustsphere.app/cert",
        note: new Uint8Array(Buffer.from(metadataStr)),
        defaultFrozen: false,
        manager: master.addr,
        reserve: master.addr,
        freeze: master.addr,
        clawback: master.addr,
        suggestedParams: params,
    });

    const signed = txn.signTxn(master.sk);
    const { txId } = await client.sendRawTransaction(signed).do();
    const result = await algosdk.waitForConfirmation(client, txId, 4);
    const assetId = result["asset-index"];
    return { assetId, txId, confirmed: true };
}

/**
 * Look up a transaction by ID (for verification).
 */
async function lookupTransaction(txId) {
    if (txId.startsWith("stub-")) {
        return { id: txId, note: "stub-mode", confirmedRound: 0 };
    }
    const client = getAlgodClient();
    try {
        const txInfo = await client.pendingTransactionInformation(txId).do();
        return txInfo;
    } catch {
        return null;
    }
}

// ── Pera Wallet Flow (unsigned TX → user signs → broadcast) ───

/**
 * Build an unsigned transaction for the user to sign with Pera Wallet.
 * The user's address is the sender — NO private keys on the server.
 *
 * @param {string} type - Transaction type (attendance, vote, complaint, certificate)
 * @param {string} senderAddress - User's Algorand wallet address
 * @param {object} data - Payload data to embed in the note field
 * @returns {Transaction} algosdk unsigned transaction object
 */
async function buildUnsignedTransaction(type, senderAddress, data) {
    const client = getAlgodClient();
    const params = await client.getTransactionParams().do();

    const notePayload = {
        app: "TrustSphere",
        type,
        timestamp: new Date().toISOString(),
        ...data,
    };
    // Remove fields that shouldn't be in the note
    delete notePayload.senderAddress;
    delete notePayload.signedTxn;

    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: senderAddress,
        to: senderAddress, // self-transfer (0 ALGO), we only care about the note
        amount: 0,
        note: new Uint8Array(Buffer.from(JSON.stringify(notePayload))),
        suggestedParams: params,
    });

    return txn;
}

/**
 * Broadcast a signed transaction blob to Algorand TestNet.
 * Accepts the raw signed bytes (from Pera Wallet).
 *
 * @param {Uint8Array} signedBytes - Signed transaction bytes
 * @returns {{ txId: string, confirmed: boolean }}
 */
async function broadcastSignedTransaction(signedBytes) {
    const client = getAlgodClient();
    const { txId } = await client.sendRawTransaction(signedBytes).do();
    const result = await algosdk.waitForConfirmation(client, txId, 4);
    return { txId, confirmed: true, confirmedRound: result["confirmed-round"] };
}

module.exports = {
    createAccount,
    submitTransaction,
    writeAttendance,
    castVote,
    storeComplaintHash,
    mintCertificate,
    lookupTransaction,
    lookupTransaction,
    buildUnsignedTransaction,
    createUnsignedTx: buildUnsignedTransaction,
    broadcastSignedTransaction,
};

