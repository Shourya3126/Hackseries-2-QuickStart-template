const db = require("../utils/mockDb");

class Session {
    constructor(data) {
        Object.assign(this, data);
    }

    static async findOne(query) {
        const item = db.findOne("sessions", query);
        return item ? new Session(item) : null;
    }

    static async findById(id) {
        const item = db.findById("sessions", id);
        return item ? new Session(item) : null;
    }

    static async create(data) {
        const item = db.addItem("sessions", data);
        return new Session(item);
    }

    // Support instance save (e.g. adding attendee)
    async save() {
        if (this._id) {
            db.updateById("sessions", this._id, this);
        } else {
            const newItem = db.addItem("sessions", this);
            this._id = newItem._id;
        }
        return this;
    }
}

module.exports = Session;
