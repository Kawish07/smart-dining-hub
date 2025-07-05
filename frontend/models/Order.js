import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  specialInstructions: {
    type: String,
    trim: true,
    default: ""
  },
  restaurantId: { type: String, required: true },
  restaurantName: { type: String, required: true },
  restaurantSlug: { type: String, required: true }
});

const orderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  restaurantId: {
    type: String,
    index: true,
    required: true
  },
  restaurantName: {
    type: String,
    required: true
  },
  restaurantSlug: {
    type: String,
    required: true
  },
  items: {
    type: [orderItemSchema],
    required: true,
    validate: {
      validator: (v) => Array.isArray(v) && v.length > 0,
      message: "At least one item is required"
    }
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: [
      "EasyPaisa", 
      "JazzCash", 
      "NayaPay", 
      "SadaPay", 
      "Allied Bank", 
      "Cash",
      "Credit Card",
      "Debit Card",
      "Online Payment",
      "Mobile Wallet"
    ],
    index: true
  },
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Payment status fields
  paymentStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending',
    index: true
  },
  paymentConfirmedAt: {
    type: Date,
    index: true
  },
  paymentConfirmedBy: {
    type: String
  },
  transactionVerified: {
    type: Boolean,
    default: false,
    index: true
  },
  verificationTimestamp: {
    type: Date,
    index: true
  },
  verifiedBy: {
    type: String
  },
  
  status: {
    type: String,
    enum: ["Pending", "Confirmed", "Preparing", "Ready", "Delivered", "Cancelled"],
    default: "Pending",
    index: true
  },
  kitchenStatus: {
    type: String,
    enum: ["Pending", "Preparing", "Ready", "Delivered"],
    default: "Pending",
    index: true
  },
  kitchenPriority: {
    type: Boolean,
    default: false,
    index: true
  },
  kitchenHidden: {
    type: Boolean,
    default: true,
    index: true
  },
  sentToKitchen: {
    type: Boolean,
    default: false,
    index: true
  },
  sentToKitchenAt: {
    type: Date,
    index: true
  },
  orderNumber: {
    type: String,
    unique: true,
    required: true,
    index: true,
    default: function() {
      const datePart = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      return `ORD-${datePart}-${randomPart}`;
    }
  },
  estimatedPreparationTime: {
    type: Number,
    min: 5,
    default: 15
  },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: "Pakistan"
    }
  },
  customerNotes: {
    type: String,
    trim: true,
    default: ""
  },
  staffNotes: {
    type: String,
    trim: true,
    default: ""
  },
  reviewed: {
    type: Boolean,
    default: false,
    index: true
  },
  archivedToHistory: {
    type: Boolean,
    default: false,
    index: true
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
  },
  toObject: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  }
});

// Indexes
orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ restaurantId: 1, status: 1 });
orderSchema.index({ orderNumber: 1, status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ paymentStatus: 1, sentToKitchen: 1 });
orderSchema.index({ paymentStatus: 1, restaurantId: 1, createdAt: -1 });
orderSchema.index({ sentToKitchen: 1, kitchenHidden: 1, status: 1 });
orderSchema.index({ transactionVerified: 1, paymentStatus: 1 }); // New index

// Pre-save hook
orderSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    this.kitchenPriority = this.items.some(item => item.specialInstructions) || 
                          this.items.length > 3;
    this.estimatedPreparationTime = 5 + (this.items.length * 2);
  }
  next();
});

// Static Methods
orderSchema.statics.getKitchenOrders = function(restaurantId = null) {
  const query = {
    paymentStatus: 'confirmed',
    sentToKitchen: true,
    kitchenHidden: { $ne: true },
    status: { $nin: ['Delivered', 'Cancelled'] }
  };
  
  if (restaurantId) {
    query.restaurantId = restaurantId;
  }
  
  return this.find(query)
    .sort({ paymentConfirmedAt: -1, createdAt: -1 })
    .lean();
};

orderSchema.statics.getPendingPaymentOrders = function(restaurantId = null) {
  const query = {
    paymentStatus: 'pending',
    status: { $nin: ['Cancelled', 'Delivered'] }
  };
  
  if (restaurantId) {
    query.restaurantId = restaurantId;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .lean();
};

orderSchema.statics.getVerifiedTransactions = function(restaurantId = null) {
  const query = {
    transactionVerified: true,
    paymentStatus: 'confirmed'
  };
  
  if (restaurantId) {
    query.restaurantId = restaurantId;
  }
  
  return this.find(query)
    .sort({ verificationTimestamp: -1 })
    .lean();
};

// Instance Methods
orderSchema.methods.isReadyForKitchen = function() {
  return this.paymentStatus === 'confirmed' && 
         this.sentToKitchen && 
         !this.kitchenHidden &&
         !['Delivered', 'Cancelled'].includes(this.status);
};

orderSchema.methods.confirmPaymentAndSendToKitchen = function(staffId = null, verifyTransaction = true) {
  this.paymentStatus = 'confirmed';
  this.status = 'Confirmed';
  this.paymentConfirmedAt = new Date();
  this.paymentConfirmedBy = staffId;
  this.sentToKitchen = true;
  this.sentToKitchenAt = new Date();
  this.kitchenHidden = false;
  
  if (verifyTransaction) {
    this.transactionVerified = true;
    this.verificationTimestamp = new Date();
    this.verifiedBy = staffId;
  }
  
  return this.save();
};

orderSchema.methods.verifyTransaction = function(staffId) {
  if (this.paymentStatus !== 'confirmed') {
    throw new Error('Cannot verify transaction for unconfirmed payment');
  }
  
  this.transactionVerified = true;
  this.verificationTimestamp = new Date();
  this.verifiedBy = staffId;
  
  return this.save();
};

orderSchema.methods.updateKitchenStatus = function(newStatus) {
  if (!this.isReadyForKitchen()) {
    throw new Error('Order is not ready for kitchen operations');
  }
  
  this.kitchenStatus = newStatus;
  
  if (newStatus === 'Preparing') {
    this.status = 'Preparing';
  } else if (newStatus === 'Ready') {
    this.status = 'Ready';
  } else if (newStatus === 'Delivered') {
    this.status = 'Delivered';
  }
  
  return this.save();
};

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;