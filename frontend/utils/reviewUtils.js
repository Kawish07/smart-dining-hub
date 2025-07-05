import Review from "@/models/Review";
import Restaurant from "@/models/Restaurant";

// Update restaurant rating stats when a review is created/updated
export const updateRestaurantRatings = async (restaurantId) => {
  try {
    const stats = await Review.getRestaurantStats(restaurantId);
    
    if (stats.length > 0) {
      const { 
        avgFoodQuality, 
        avgDelivery, 
        avgPackaging, 
        avgOverall, 
        reviewCount 
      } = stats[0];

      await Restaurant.findByIdAndUpdate(restaurantId, {
        ratingStats: {
          avgFoodQuality: parseFloat(avgFoodQuality.toFixed(1)),
          avgDelivery: parseFloat(avgDelivery.toFixed(1)),
          avgPackaging: parseFloat(avgPackaging.toFixed(1)),
          avgOverall: parseFloat(avgOverall.toFixed(1)),
          reviewCount
        },
        $inc: { totalReviews: 1 } // Optional: keep separate count
      });
    }
  } catch (error) {
    console.error("Error updating restaurant ratings:", error);
    throw error;
  }
};

// Validate review submission
export const validateReview = async (userId, orderId) => {
  // Check if user already reviewed this order
  const existingReview = await Review.findOne({ order: orderId, user: userId });
  if (existingReview) {
    throw new Error("You have already reviewed this order");
  }
};