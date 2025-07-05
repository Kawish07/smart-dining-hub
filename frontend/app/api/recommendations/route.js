// app/api/recommendations/route.js
import connectToDb from '@/lib/mongodb';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDb();
    const db = mongoose.connection.db;

    // Get ALL orders and count item occurrences
    const itemCounts = await db.collection('orders').aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items._id',
          name: { $first: '$items.name' },
          price: { $first: '$items.price' },
          restaurantId: { $first: '$restaurantId' },
          restaurantName: { $first: '$restaurantName' },
          count: { $sum: 1 } // Count how many orders contain this item
        }
      },
      { $sort: { count: -1 } }, // Sort by most frequent
      { $limit: 5 } // Only get top 5 most repeated items
    ]).toArray();

    // Filter to only include items ordered more than once
    const frequentItems = itemCounts.filter(item => item.count >= 5);

    return Response.json({
      success: true,
      recommendations: frequentItems.map(item => ({
        ...item,
        type: 'frequent',
        reason: `Ordered ${item.count} times`
      }))
    });

  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}