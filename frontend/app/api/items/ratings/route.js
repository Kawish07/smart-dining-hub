import { NextResponse } from 'next/server';
import connectToDb from '@/lib/mongodb';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectToDb();
    
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const category = searchParams.get('category');
    const userId = searchParams.get('userId');
    
    if (!restaurantId) {
      return NextResponse.json(
        { error: 'restaurantId parameter is required' },
        { status: 400 }
      );
    }

    // First fetch items from your existing /api/items endpoint
    const itemsResponse = await fetch(
      `${process.env.NEXTAUTH_URL}/api/items?restaurantId=${restaurantId}${
        category ? `&category=${category}` : ''
      }`
    );
    
    if (!itemsResponse.ok) {
      throw new Error('Failed to fetch items');
    }
    
    let items = await itemsResponse.json();
    
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json([]);
    }

    const itemIds = items.map(item => item._id);

    // Then get ratings data
    const ratingsData = await mongoose.connection.db.collection('reviews')
      .aggregate([
        { $match: { 'itemReviews.itemId': { $in: itemIds } } },
        { $unwind: '$itemReviews' },
        { $match: { 'itemReviews.itemId': { $in: itemIds } } },
        {
          $group: {
            _id: '$itemReviews.itemId',
            averageRating: { $avg: '$itemReviews.rating' },
            totalReviews: { $sum: 1 },
            userRatings: {
              $push: {
                $cond: [
                  { $eq: ['$userId', userId] },
                  '$itemReviews.rating',
                  null
                ]
              }
            }
          }
        },
        {
          $project: {
            _id: 1,
            averageRating: { $ifNull: ['$averageRating', 0] },
            totalReviews: 1,
            userRating: {
              $ifNull: [
                { $arrayElemAt: [
                  { $filter: {
                    input: '$userRatings',
                    cond: { $ne: ['$$this', null] }
                  }},
                  0
                ]},
                0
              ]
            }
          }
        }
      ])
      .toArray();

    // Create ratings map
    const ratingsMap = {};
    ratingsData.forEach(rating => {
      ratingsMap[rating._id.toString()] = {
        averageRating: rating.averageRating,
        totalReviews: rating.totalReviews,
        userRating: rating.userRating
      };
    });

    // Merge ratings into items
    const itemsWithRatings = items.map(item => ({
      ...item,
      _id: item._id.toString(),
      averageRating: ratingsMap[item._id.toString()]?.averageRating || 0,
      totalReviews: ratingsMap[item._id.toString()]?.totalReviews || 0,
      userRating: ratingsMap[item._id.toString()]?.userRating || 0
    }));

    return NextResponse.json(itemsWithRatings);
  } catch (error) {
    console.error('Error fetching ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ratings', details: error.message },
      { status: 500 }
    );
  }
}