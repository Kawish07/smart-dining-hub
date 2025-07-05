import mongoose from "mongoose";

const itemReviewSchema = new mongoose.Schema({
  itemId: {
    type: String,
    required: true
  },
  itemName: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    default: ""
  }
});

const reviewSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    index: true
  },
  restaurantId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  // Keep overall order rating for restaurant rating calculation
  overallRating: {
    type: Number,
    min: 1,
    max: 5
  },
  overallComment: {
    type: String,
    default: ""
  },
  // Individual item reviews
  itemReviews: [itemReviewSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Add compound index for better query performance
reviewSchema.index({ orderId: 1, userId: 1 }, { unique: true });
reviewSchema.index({ restaurantId: 1 });
reviewSchema.index({ "itemReviews.itemId": 1 });

const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);

export default Review;