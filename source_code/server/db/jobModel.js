const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    note: {
        type: String,
        default: ''
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const jobSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    client: {
        type: String,
        required: false
    },
    userId: {
        type: String,
        required: true
    },
    transactions: [transactionSchema]
});

module.exports = mongoose.model('Job', jobSchema);
