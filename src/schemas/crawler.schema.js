const mongoose = require("mongoose");

const crawlerSchema = new mongoose.Schema({
  cep_start: { type: String, required: true },
  cep_range: { type: Array, default: [] },
  cep_end: { type: String, required: true },
  status: { type: String, default: "pending" },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Crawler", crawlerSchema);
