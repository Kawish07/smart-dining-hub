// models/Table.js
import mongoose from "mongoose";

const tableSchema = new mongoose.Schema({
  number: {
    type: String,
    required: [true, "Table number is required"],
    trim: true
  },
  size: {
    type: String,
    enum: {
      values: ['small', 'medium', 'large'],
      message: 'Size must be small, medium, or large'
    },
    required: [true, "Size is required"],
    default: 'medium'
  },
  capacity: {
    type: Number,
    required: [true, "Capacity is required"],
    min: [2, "Capacity must be at least 2"],
    max: [12, "Capacity cannot exceed 12"]
  },
  description: {
    type: String,
    trim: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, "Restaurant ID is required"]
  },
  restaurantName: {
    type: String,
    required: [true, "Restaurant name is required"],
    trim: true
  },
  available: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add index for faster queries
tableSchema.index({ restaurantId: 1, number: 1 }, { unique: true });

export default mongoose.models.Table || mongoose.model("Table", tableSchema);