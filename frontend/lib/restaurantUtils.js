// lib/restaurantUtils.js
import connectToDb from "@/lib/mongodb";

export async function updateRestaurantRating(restaurantId) {
  try {
    const connection = await connectToDb();
    const db = connection.connection.db;
    const reviewsCollection = db.collection("reviews");
    const restaurantsCollection = db.collection("restaurants");

    // Get all reviews for this restaurant that have overall ratings
    const ratingData = await reviewsCollection.aggregate([
      {
        $match: {
          restaurantId: restaurantId,
          overallRating: { $exists: true, $ne: null, $gte: 1, $lte: 5 }
        }
      },
      {
        $group: {
          _id: null,
          average: { $avg: "$overallRating" },
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    // Handle case where no ratings exist or average is null
    const newRating = ratingData.length > 0 && ratingData[0].average !== null ? {
      average: parseFloat(ratingData[0].average.toFixed(1)),
      count: ratingData[0].count
    } : { average: 0, count: 0 };

    // Update restaurant with new rating
    await restaurantsCollection.updateOne(
      { _id: restaurantId },
      {
        $set: {
          averageRating: newRating.average,
          totalReviews: newRating.count,
          updatedAt: new Date()
        }
      }
    );

    console.log(`Updated restaurant ${restaurantId} rating to ${newRating.average} (${newRating.count} reviews)`);
    return newRating;
  } catch (error) {
    console.error('Error updating restaurant rating:', error);
    throw error;
  }
}