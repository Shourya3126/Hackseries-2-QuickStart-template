const db = require("../utils/mockDb");

class MockQuery {
    constructor(items) {
        this.items = items;
    }
    sort(criteria) {
        const key = Object.keys(criteria)[0];
        const dir = criteria[key];
        this.items.sort((a, b) => {
            const valA = new Date(a[key]).getTime() || a[key];
            const valB = new Date(b[key]).getTime() || b[key];
            return dir === -1 ? (valA > valB ? -1 : 1) : (valA > valB ? 1 : -1);
        });
        return this;
    }
    select(fields) { return this; }
    then(resolve, reject) { resolve(this.items.map(i => new Certificate(i))); }
    async exec() { return this.items.map(i => new Certificate(i)); }
}

class Certificate {
    constructor(data) {
        Object.assign(this, data);
    }

    static find(query = {}) {
        const items = db.find("certificates", query);
        return new MockQuery(items);
    }

    static async findOne(query) {
        const item = db.findOne("certificates", query);
        return item ? new Certificate(item) : null;
    }

    static async create(data) {
        const item = db.addItem("certificates", data);
        return new Certificate(item);
    }
}

module.exports = Certificate;
