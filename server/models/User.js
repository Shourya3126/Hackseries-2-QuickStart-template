const db = require("../utils/mockDb");

class User {
    constructor(data) {
        Object.assign(this, data);
    }

    static async findOne(query) {
        const item = db.findOne("users", query);
        return item ? new User(item) : null;
    }

    static async findById(id) {
        const item = db.findById("users", id);
        return item ? new User(item) : null;
    }

    static async find(query = {}) {
        const items = db.find("users", query);
        return items.map(i => new User(i));
    }

    static async create(data) {
        const item = db.addItem("users", data);
        return new User(item);
    }

    // Support for deleteOne({ email: ... })
    static async deleteOne(query) {
        return db.deleteOne("users", query);
    }

    async save() {
        if (this._id) {
            db.updateById("users", this._id, this);
        } else {
            const newItem = db.addItem("users", this);
            this._id = newItem._id;
        }
        return this;
    }
}

module.exports = User;
