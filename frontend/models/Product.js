// models/Product.js
import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  image: { type: String },
  // Add any other fields you need for your product
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);

export default Product;