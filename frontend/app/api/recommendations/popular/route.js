// pages/api/recommendations/popular.js
import { connectToDatabase } from '@/lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    
    const popularItems = await db.collection('orders').aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items._id',
          name: { $first: '$items.name' },
          price: { $first: '$items.price' },
          image: { $first: '$items.image' },
          restaurantId: { $first: '$items.restaurantId' },
          restaurantName: { $first: '$restaurantName' },
          count: { $sum: '$items.quantity' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { orderCount: -1, count: -1 } },
      { $limit: 20 },
      {
        $project: {
          _id: 1,
          name: 1,
          price: 1,
          image: 1,
          restaurantId: 1,
          restaurantName: 1,
          type: 'popular',
          orderCount: 1
        }
      }
    ]).toArray();

    return res.status(200).json({
      success: true,
      recommendations: popularItems
    });

  } catch (error) {
    console.error('Popular items error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch popular items'
    });
  }
}