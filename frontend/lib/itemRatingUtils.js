// lib/itemRatingUtils.js
import connectToDb from './mongodb';

export async function updateItemRating(itemId) {
  try {
    const connection = await connectToDb();
    const db = connection.connection.db;
    const reviewsCollection = db.collection('reviews');
    const itemsCollection = db.collection('items');

    // Get all reviews for this item
    const reviews = await reviewsCollection.find({
      'itemReviews.itemId': itemId
    }).toArray();

    // Extract all ratings for this item
    const itemRatings = reviews.flatMap(review => 
      review.itemReviews
        .filter(ir => ir.itemId === itemId && ir.rating >= 1 && ir.rating <= 5)
        .map(ir => ir.rating)
    );

    const totalReviews = itemRatings.length;
    const averageRating = totalReviews > 0 
      ? itemRatings.reduce((sum, rating) => sum + rating, 0) / totalReviews
      : 0;

    // Update the item with new rating data
    await itemsCollection.updateOne(
      { _id: itemId },
      { 
        $set: { 
          averageRating: parseFloat(averageRating.toFixed(1)),
          totalReviews 
        } 
      }
    );

    return { success: true, averageRating, totalReviews };
  } catch (error) {
    console.error('Error updating item rating:', error);
    throw error;
  }
}