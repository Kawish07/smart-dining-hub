import mongoose from "mongoose";

const tabletSchema = new mongoose.Schema({
  number: { type: Number, required: true },
  status: { type: String, default: "Available" },
});

export default mongoose.models.Tablet || mongoose.model("Tablet", tabletSchema);