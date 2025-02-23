const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    name: String,
    client: String,
    income: Number,
    expenses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

module.exports = mongoose.model('Job', JobSchema);
