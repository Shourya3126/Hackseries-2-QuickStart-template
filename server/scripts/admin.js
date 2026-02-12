require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const User = require("../models/User");

const args = process.argv.slice(2);
const command = args[0];
const target = args[1];

async function run() {
    try {
        if (command === "--delete") {
            if (!target) {
                console.log("❌ Please specify an email to delete: node server/scripts/admin.js --delete user@example.com");
            } else {
                const res = await User.deleteOne({ email: target });
                if (res.deletedCount > 0) {
                    console.log(`✅ User ${target} deleted successfully.`);
                } else {
                    console.log(`❌ User ${target} not found.`);
                }
            }
        } else if (command === "--list" || !command) {
            console.log("\n👥 Registered Users:");
            const users = await User.find({});
            if (users.length === 0) {
                console.log("No users found.");
            } else {
                console.table(users.map(u => ({
                    Email: u.email,
                    Role: u.role,
                    Wallet: u.walletAddress ? u.walletAddress.substring(0, 10) + "..." : "Not Linked",
                    Joined: u.createdAt ? new Date(u.createdAt).toISOString().split("T")[0] : "N/A",
                    ID: u._id.toString()
                })));
            }
            console.log("\ncommands:");
            console.log("  List users:   node server/scripts/admin.js");
            console.log("  Delete user:  node server/scripts/admin.js --delete <email>");
        } else {
            console.log(`Unknown command: ${command}`);
        }

    } catch (err) {
        console.error("Error:", err);
    }
}

run();
