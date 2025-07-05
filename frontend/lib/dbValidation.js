import mongoose from "mongoose";

export const validateReviewSchema = async () => {
  try {
    const reviewSchema = mongoose.model('Review').schema;
    
    // Check required fields
    const requiredFields = ['orderId', 'restaurantId', 'userId', 'rating'];
    requiredFields.forEach(field => {
      if (!reviewSchema.path(field)) {
        throw new Error(`Review schema missing required field: ${field}`);
      }
    });

    // Check indexes
    const indexes = await mongoose.model('Review').collection.indexes();
    if (!indexes.some(i => i.key.orderId)) {
      console.warn("No index found for orderId - creating one...");
      await mongoose.model('Review').createIndexes({ orderId: 1 });
    }

    return true;
  } catch (error) {
    console.error("Review schema validation failed:", error);
    return false;
  }
};