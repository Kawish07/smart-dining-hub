// app/api/restaurants/ratings/route.js
import { NextResponse } from 'next/server';
import connectToDb from '@/lib/mongodb';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectToDb();
    
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    
    if (!restaurantId) {
      return NextResponse.json(
        { error: 'restaurantId parameter is required' },
        { status: 400 }
      );
    }

    const [ratingData, itemRatings] = await Promise.all([
      // Overall restaurant rating
      mongoose.connection.db.collection('reviews').aggregate([
        { $match: { restaurantId } },
        { 
          $group: { 
            _id: null, 
            average: { $avg: "$overallRating" },
            count: { $sum: 1 },
            breakdown: {
              $push: {
                rating: "$overallRating",
                count: { $sum: 1 }
              }
            }
          }
        }
      ]).toArray(),
      
      // Item ratings
      mongoose.connection.db.collection('reviews').aggregate([
        { $match: { restaurantId, "itemReviews.0": { $exists: true } } },
        { $unwind: "$itemReviews" },
        {
          $group: {
            _id: "$itemReviews.itemId",
            average: { $avg: "$itemReviews.rating" },
            count: { $sum: 1 },
            name: { $first: "$itemReviews.itemName" }
          }
        }
      ]).toArray()
    ]);

    return NextResponse.json({
      overall: {
        average: ratingData[0]?.average ? parseFloat(ratingData[0].average.toFixed(1)) : 0,
        count: ratingData[0]?.count || 0,
        breakdown: ratingData[0]?.breakdown || []
      },
      items: itemRatings.map(item => ({
        itemId: item._id,
        name: item.name,
        average: parseFloat(item.average.toFixed(1)),
        count: item.count
      }))
    });
  } catch (error) {
    console.error('Error fetching restaurant ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ratings', details: error.message },
      { status: 500 }
    );
  }
}