const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
  username: { type: String, default: 'admin' }, // optional
  password: { type: String, required: true }
});

module.exports = mongoose.model('Admin', AdminSchema);
