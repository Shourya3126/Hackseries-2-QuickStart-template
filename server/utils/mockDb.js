const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '../data/db.json');
// Default structure
const DEFAULT_DATA = {
    users: [],
    sessions: [],
    elections: [],
    complaints: [],
    certificates: []
};

// Ensure directory and file exist
if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DATA, null, 2));
}

class MockDb {
    constructor() {
        this.refresh();
    }

    refresh() {
        this.data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    }

    save() {
        fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2));
    }

    // Generic helpers
    collection(name) {
        return this.data[name] || [];
    }

    addItem(collectionName, item) {
        if (!item._id) item._id = crypto.randomUUID();
        if (!item.createdAt) item.createdAt = new Date();
        if (!item.updatedAt) item.updatedAt = new Date();

        this.data[collectionName].push(item);
        this.save();
        return item;
    }

    findOne(collectionName, query) {
        return this.collection(collectionName).find(item => {
            for (let key in query) {
                if (item[key] !== query[key]) return false;
            }
            return true;
        });
    }

    find(collectionName, query = {}) {
        return this.collection(collectionName).filter(item => {
            for (let key in query) {
                if (item[key] !== query[key]) return false;
            }
            return true;
        });
    }

    findById(collectionName, id) {
        if (!id) return null;
        return this.collection(collectionName).find(item => item._id === id.toString() || item._id === id);
    }

    updateById(collectionName, id, updates) {
        const idx = this.collection(collectionName).findIndex(i => i._id === id);
        if (idx === -1) return null;

        const current = this.data[collectionName][idx];
        const updated = { ...current, ...updates, updatedAt: new Date() };
        this.data[collectionName][idx] = updated;
        this.save();
        return updated;
    }

    deleteById(collectionName, id) {
        const initialLen = this.collection(collectionName).length;
        this.data[collectionName] = this.collection(collectionName).filter(i => i._id !== id);
        this.save();
        return initialLen !== this.data[collectionName].length;
    }

    deleteOne(collectionName, query) {
        const idx = this.collection(collectionName).findIndex(item => {
            for (let key in query) {
                if (item[key] !== query[key]) return false;
            }
            return true;
        });
        if (idx !== -1) {
            this.data[collectionName].splice(idx, 1);
            this.save();
            return { deletedCount: 1 };
        }
        return { deletedCount: 0 };
    }
}

const db = new MockDb();
module.exports = db;
