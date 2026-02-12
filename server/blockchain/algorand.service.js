/**
 * ──────────────────────────────────────────────────────────────
 *  TrustSphere — Algorand Blockchain Service Layer
 * ──────────────────────────────────────────────────────────────
 *
 *  Handles on-chain operations for:
 *    • Attendance   – session check-in records
 *    • Voting       – anonymous ballot proofs
 *    • Complaints   – anonymised complaint hashes
 *    • Certificates – NFT-style credential minting
 *
 *  Network : Algorand TestNet (Algonode public endpoints)
 *  Storage : Note-field JSON (max 1 KB)
 *  Security: Server never holds a private key.
 *            Users sign via Pera Wallet on the frontend.
 *
 *  Exported API:
 *    createUnsignedTx(data, address) → base64 string
 *    submitSignedTx(blob)            → { txId, confirmed, round }
 *    readTx(txId)                    → decoded note + tx metadata
 *    verifyRecord(txId, type)        → { valid, record, ... }
 * ──────────────────────────────────────────────────────────────
 */

const algosdk = require("algosdk");

// ── Configuration ─────────────────────────────────────────────
const ALGO_SERVER =
    process.env.ALGO_SERVER || "https://testnet-api.algonode.cloud";
const ALGO_PORT = Number(process.env.ALGO_PORT) || 443;
const ALGO_TOKEN = process.env.ALGO_TOKEN || "";

const ALGO_INDEXER_SERVER =
    process.env.ALGO_INDEXER_SERVER || "https://testnet-idx.algonode.cloud";
const ALGO_INDEXER_PORT = Number(process.env.ALGO_INDEXER_PORT) || 443;

const APP_TAG = "TrustSphere";
const VALID_TYPES = ["attendance", "vote", "complaint", "certificate"];
const MAX_NOTE_BYTES = 1024; // Algorand note field limit

// ── Rate-limiter (simple in-memory, per-address) ──────────────
const _rateBuckets = new Map(); // address → { count, resetAt }
const RATE_WINDOW_MS = 60_000; // 1 minute
const RATE_MAX_PER_WINDOW = 10; // max 10 tx-builds per minute per address

function _checkRate(address) {
    const now = Date.now();
    let bucket = _rateBuckets.get(address);

    if (!bucket || now > bucket.resetAt) {
        bucket = { count: 0, resetAt: now + RATE_WINDOW_MS };
        _rateBuckets.set(address, bucket);
    }

    bucket.count += 1;
    if (bucket.count > RATE_MAX_PER_WINDOW) {
        const err = new Error(
            `Rate limit exceeded: max ${RATE_MAX_PER_WINDOW} transactions per minute`
        );
        err.status = 429;
        throw err;
    }
}

// ── Client singletons ─────────────────────────────────────────
let _algod = null;
let _indexer = null;

function algod() {
    if (!_algod) {
        _algod = new algosdk.Algodv2(ALGO_TOKEN, ALGO_SERVER, ALGO_PORT);
    }
    return _algod;
}

function indexer() {
    if (!_indexer) {
        _indexer = new algosdk.Indexer(ALGO_TOKEN, ALGO_INDEXER_SERVER, ALGO_INDEXER_PORT);
    }
    return _indexer;
}

// ── Validation helpers ────────────────────────────────────────

/**
 * Validate the data payload before building a transaction.
 * Throws on invalid input.
 */
function _validatePayload(data, address) {
    if (!address || typeof address !== "string" || address.length !== 58) {
        throw Object.assign(
            new Error("Invalid Algorand address: must be a 58-character string"),
            { status: 400 }
        );
    }

    if (!data || typeof data !== "object") {
        throw Object.assign(new Error("data must be a non-null object"), {
            status: 400,
        });
    }

    if (!data.type || !VALID_TYPES.includes(data.type)) {
        throw Object.assign(
            new Error(
                `Invalid type "${data.type}". Must be one of: ${VALID_TYPES.join(", ")}`
            ),
            { status: 400 }
        );
    }

    // Type-specific field validation
    switch (data.type) {
        case "attendance":
            if (!data.data?.sessionId) {
                throw Object.assign(new Error("attendance requires data.sessionId"), {
                    status: 400,
                });
            }
            if (!data.data?.studentId) {
                throw Object.assign(new Error("attendance requires data.studentId"), {
                    status: 400,
                });
            }
            break;

        case "vote":
            if (!data.data?.electionId) {
                throw Object.assign(new Error("vote requires data.electionId"), {
                    status: 400,
                });
            }
            if (!data.data?.anonymousToken) {
                throw Object.assign(new Error("vote requires data.anonymousToken"), {
                    status: 400,
                });
            }
            break;

        case "complaint":
            if (!data.data?.hash) {
                throw Object.assign(
                    new Error("complaint requires data.hash (SHA-256 of original text)"),
                    { status: 400 }
                );
            }
            break;

        case "certificate":
            if (!data.data?.title) {
                throw Object.assign(new Error("certificate requires data.title"), {
                    status: 400,
                });
            }
            if (!data.data?.recipientId) {
                throw Object.assign(
                    new Error("certificate requires data.recipientId"),
                    { status: 400 }
                );
            }
            break;
    }
}

// ──────────────────────────────────────────────────────────────
//  PUBLIC API
// ──────────────────────────────────────────────────────────────

/**
 * Build an unsigned Algorand transaction with a structured JSON note.
 *
 * @param {object}  data    – Must include `type` and `data` sub-object.
 *   Schema:
 *   {
 *     type: "attendance" | "vote" | "complaint" | "certificate",
 *     data: { ... type-specific fields ... }
 *   }
 *
 * @param {string}  address – Sender's Algorand wallet address (58 chars).
 *
 * @returns {string} Base64-encoded unsigned transaction bytes.
 */
async function createUnsignedTx(data, address) {
    // 1. Validate
    _validatePayload(data, address);

    // 2. Rate-limit
    _checkRate(address);

    // 3. Build the note payload
    const noteObj = {
        app: APP_TAG,
        type: data.type,
        data: data.data,
        timestamp: new Date().toISOString(),
    };

    const noteBytes = new Uint8Array(Buffer.from(JSON.stringify(noteObj)));
    if (noteBytes.length > MAX_NOTE_BYTES) {
        throw Object.assign(
            new Error(
                `Note payload (${noteBytes.length} bytes) exceeds Algorand limit of ${MAX_NOTE_BYTES} bytes`
            ),
            { status: 400 }
        );
    }

    // 4. Fetch suggested params from TestNet
    const params = await algod().getTransactionParams().do();

    // 5. Create a 0-ALGO self-transfer (we only care about the note)
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: address,
        to: address,
        amount: 0,
        note: noteBytes,
        suggestedParams: params,
    });

    // 6. Encode and return as base64
    const txnBytes = algosdk.encodeUnsignedTransaction(txn);
    return Buffer.from(txnBytes).toString("base64");
}

/**
 * Broadcast a user-signed transaction blob to Algorand TestNet.
 *
 * @param {string} blob – Base64-encoded signed transaction bytes.
 * @returns {{ txId: string, confirmed: boolean, round: number }}
 */
async function submitSignedTx(blob) {
    if (!blob || typeof blob !== "string") {
        throw Object.assign(new Error("blob must be a non-empty base64 string"), {
            status: 400,
        });
    }

    let signedBytes;
    try {
        signedBytes = new Uint8Array(Buffer.from(blob, "base64"));
    } catch {
        throw Object.assign(new Error("Invalid base64 encoding"), { status: 400 });
    }

    if (signedBytes.length === 0) {
        throw Object.assign(new Error("Signed transaction blob is empty"), {
            status: 400,
        });
    }

    const client = algod();
    const { txId } = await client.sendRawTransaction(signedBytes).do();
    const result = await algosdk.waitForConfirmation(client, txId, 4);

    return {
        txId,
        confirmed: true,
        round: result["confirmed-round"],
    };
}

/**
 * Read a transaction from the Algorand TestNet and decode its note.
 *
 * @param {string} txId – Transaction ID to look up.
 * @returns {{ txId, sender, round, timestamp, note, raw }}
 */
async function readTx(txId) {
    if (!txId || typeof txId !== "string") {
        throw Object.assign(new Error("txId is required"), { status: 400 });
    }

    // Try indexer first (works for confirmed txns)
    try {
        const response = await indexer().lookupTransactionByID(txId).do();
        const tx = response.transaction;

        let note = null;
        if (tx.note) {
            try {
                const decoded = Buffer.from(tx.note, "base64").toString("utf-8");
                note = JSON.parse(decoded);
            } catch {
                note = { raw: tx.note };
            }
        }

        return {
            txId: tx.id,
            sender: tx.sender,
            round: tx["confirmed-round"],
            timestamp: tx["round-time"]
                ? new Date(tx["round-time"] * 1000).toISOString()
                : null,
            note,
            raw: tx,
        };
    } catch (indexerErr) {
        // Fallback to algod pending tx info (for very recent txns)
        try {
            const pending = await algod().pendingTransactionInformation(txId).do();

            let note = null;
            if (pending.txn?.txn?.note) {
                try {
                    const decoded = Buffer.from(pending.txn.txn.note).toString("utf-8");
                    note = JSON.parse(decoded);
                } catch {
                    note = { raw: pending.txn.txn.note };
                }
            }

            return {
                txId,
                sender: pending.txn?.txn?.snd
                    ? algosdk.encodeAddress(pending.txn.txn.snd)
                    : null,
                round: pending["confirmed-round"] || null,
                timestamp: null,
                note,
                raw: pending,
            };
        } catch {
            throw Object.assign(
                new Error(`Transaction ${txId} not found on Algorand TestNet`),
                { status: 404 }
            );
        }
    }
}

/**
 * Verify that a transaction is a valid TrustSphere record of a given type.
 *
 * Checks:
 *  1. Transaction exists and is confirmed
 *  2. Note field contains valid JSON with `app === "TrustSphere"`
 *  3. `type` matches the expected type
 *  4. Required data fields are present for that type
 *
 * @param {string} txId – Transaction ID to verify.
 * @param {string} type – Expected record type.
 * @returns {{ valid, txId, sender, round, timestamp, record, errors }}
 */
async function verifyRecord(txId, type) {
    const errors = [];

    if (!VALID_TYPES.includes(type)) {
        errors.push(`Invalid type "${type}". Must be one of: ${VALID_TYPES.join(", ")}`);
        return { valid: false, txId, sender: null, round: null, timestamp: null, record: null, errors };
    }

    let tx;
    try {
        tx = await readTx(txId);
    } catch (err) {
        errors.push(`Transaction lookup failed: ${err.message}`);
        return { valid: false, txId, sender: null, round: null, timestamp: null, record: null, errors };
    }

    // 1. Must be confirmed
    if (!tx.round) {
        errors.push("Transaction is not confirmed");
    }

    // 2. Must have a valid TrustSphere note
    if (!tx.note || typeof tx.note !== "object") {
        errors.push("Transaction has no decodable JSON note");
        return { valid: false, txId, sender: tx.sender, round: tx.round, timestamp: tx.timestamp, record: null, errors };
    }

    if (tx.note.app !== APP_TAG) {
        errors.push(`Note app tag is "${tx.note.app}", expected "${APP_TAG}"`);
    }

    // 3. Type must match
    if (tx.note.type !== type) {
        errors.push(`Note type is "${tx.note.type}", expected "${type}"`);
    }

    // 4. Type-specific data validation
    const d = tx.note.data || {};
    switch (type) {
        case "attendance":
            if (!d.sessionId) errors.push("Missing data.sessionId");
            if (!d.studentId) errors.push("Missing data.studentId");
            break;
        case "vote":
            if (!d.electionId) errors.push("Missing data.electionId");
            if (!d.anonymousToken) errors.push("Missing data.anonymousToken");
            break;
        case "complaint":
            if (!d.hash) errors.push("Missing data.hash");
            break;
        case "certificate":
            if (!d.title) errors.push("Missing data.title");
            if (!d.recipientId) errors.push("Missing data.recipientId");
            break;
    }

    return {
        valid: errors.length === 0,
        txId,
        sender: tx.sender,
        round: tx.round,
        timestamp: tx.timestamp,
        record: tx.note,
        errors: errors.length > 0 ? errors : undefined,
    };
}

// ──────────────────────────────────────────────────────────────
module.exports = {
    createUnsignedTx,
    submitSignedTx,
    readTx,
    verifyRecord,
    // Constants exported for use in controllers / tests
    VALID_TYPES,
    APP_TAG,
};
