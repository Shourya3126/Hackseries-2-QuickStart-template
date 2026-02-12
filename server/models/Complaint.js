const db = require("../utils/mockDb");

class MockQuery {
    constructor(items) {
        this.items = items;
    }
    sort(criteria) {
        // Simple sort implementation for createdAt
        const key = Object.keys(criteria)[0]; // e.g., 'createdAt'
        const dir = criteria[key]; // 1 or -1
        this.items.sort((a, b) => {
            const valA = new Date(a[key]).getTime() || a[key];
            const valB = new Date(b[key]).getTime() || b[key];
            return dir === -1 ? (valA > valB ? -1 : 1) : (valA > valB ? 1 : -1);
        });
        return this;
    }
    select(fields) { return this; }
    then(resolve, reject) { resolve(this.items.map(i => new Complaint(i))); }
    async exec() { return this.items.map(i => new Complaint(i)); }
}

class Complaint {
    constructor(data) {
        Object.assign(this, data);
    }

    static find(query = {}) {
        const items = db.find("complaints", query);
        return new MockQuery(items);
    }

    static async create(data) {
        const item = db.addItem("complaints", data);
        return new Complaint(item);
    }
}

module.exports = Complaint;
