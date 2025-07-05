// models/Reservation.js
import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  restaurantSlug: {
    type: String,
    required: true
  },
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  persons: {
    type: Number,
    required: true
  },
  customerEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  specialRequests: String,
  status: {
    type: String,
    default: "Confirmed"
  },
  source: String,
  transactionId: {
    type: String,
    default: ""
  },
  paymentMethod: {
    type: String,
    default: ""
  },
  paymentAmount: {
    type: Number,
    default: 0
  },
  paymentCurrency: {
    type: String,
    default: "PKR"
  },
  paymentStatus: {
    type: String,
    default: "pending"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Reservation || 
       mongoose.model("Reservation", reservationSchema);