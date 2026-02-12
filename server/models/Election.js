const db = require("../utils/mockDb");

class Election {
    constructor(data) {
        Object.assign(this, data);
    }

    static async find(query = {}) {
        const items = db.find("elections", query);
        return items.map(item => new Election(item));
    }

    static async findOne(query) {
        const item = db.findOne("elections", query);
        return item ? new Election(item) : null;
    }

    static async findById(id) {
        const item = db.findById("elections", id);
        return item ? new Election(item) : null;
    }

    static async create(data) {
        const item = db.addItem("elections", data);
        return new Election(item);
    }

    async save() {
        if (this._id) {
            db.updateById("elections", this._id, this);
        } else {
            const newItem = db.addItem("elections", this);
            this._id = newItem._id;
        }
        return this;
    }

    static async deleteById(id) {
        return db.deleteById("elections", id);
    }
}

module.exports = Election;
