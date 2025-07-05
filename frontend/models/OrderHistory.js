import mongoose from "mongoose";

const OrderHistorySchema = new mongoose.Schema({
  originalOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  items: [{
    _id: String,
    name: String,
    price: Number,
    quantity: Number,
    specialInstructions: String
  }],
  totalPrice: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true
  },
  transactionId: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    default: "Delivered"
  },
  kitchenStatusAtArchive: {
    type: String
  },
  orderNumber: {
    type: String,
    required: true,
    index: true
  },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  estimatedPreparationTime: Number,
  customerNotes: String,
  archivedReason: {
    type: String,
    enum: ["Auto-Delivered", "Manual-Archive", "System-Cleanup"],
    default: "Auto-Delivered"
  },
  archivedBy: {
    type: String,
    default: "system"
  },
  originalCreatedAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  }
});

// Indexes for optimized history queries
OrderHistorySchema.index({ userId: 1, createdAt: -1 });
OrderHistorySchema.index({ orderNumber: 1 });
OrderHistorySchema.index({ originalOrderId: 1 });

const OrderHistory = mongoose.models.OrderHistory || 
  mongoose.model("OrderHistory", OrderHistorySchema, "orderhistories");

export default OrderHistory;