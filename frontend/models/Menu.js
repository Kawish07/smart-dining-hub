import mongoose from "mongoose";

const menuSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
});

export default mongoose.models.Menu || mongoose.model("Menu", menuSchema);