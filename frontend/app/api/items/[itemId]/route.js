// app/api/items/[itemId]/route.js
import connectToDb from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { itemId } = params;

  if (!itemId) {
    return NextResponse.json(
      { error: "Item ID is required" },
      { status: 400 }
    );
  }

  try {
    const connection = await connectToDb();
    const db = connection.connection.db;
    const itemsCollection = db.collection("items");
    const reviewsCollection = db.collection("reviews");
    
    // Get current user session
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Get item details
    const item = await itemsCollection.findOne({ _id: itemId });

    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    // Get aggregated ratings for this item
    const ratingAggregation = await reviewsCollection.aggregate([
      {
        $match: {
          "itemReviews.itemId": itemId
        }
      },
      {
        $unwind: "$itemReviews"
      },
      {
        $match: {
          "itemReviews.itemId": itemId,
          "itemReviews.rating": { $exists: true, $ne: null, $gte: 1, $lte: 5 }
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$itemReviews.rating" },
          totalReviews: { $sum: 1 },
          ratings: { $push: "$itemReviews.rating" }
        }
      }
    ]).toArray();

    // Get user's specific rating if logged in
    let userRating = null;
    if (userId) {
      const userReview = await reviewsCollection.findOne(
        {
          userId: userId,
          "itemReviews.itemId": itemId
        },
        {
          projection: {
            "itemReviews": {
              $elemMatch: { itemId: itemId }
            }
          }
        }
      );

      if (userReview && userReview.itemReviews && userReview.itemReviews.length > 0) {
        userRating = {
          rating: userReview.itemReviews[0].rating || 0,
          comment: userReview.itemReviews[0].comment || "",
          createdAt: userReview.createdAt
        };
      }
    }

    // Get recent reviews for this item (for display)
    const recentReviews = await reviewsCollection.aggregate([
      {
        $match: {
          "itemReviews.itemId": itemId
        }
      },
      {
        $unwind: "$itemReviews"
      },
      {
        $match: {
          "itemReviews.itemId": itemId,
          "itemReviews.rating": { $exists: true, $ne: null }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $project: {
          rating: "$itemReviews.rating",
          comment: "$itemReviews.comment",
          createdAt: 1,
          userName: { $arrayElemAt: ["$user.name", 0] }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: 10
      }
    ]).toArray();

    // Prepare rating summary
    const ratingSummary = ratingAggregation.length > 0 ? {
      averageRating: parseFloat(ratingAggregation[0].averageRating.toFixed(1)),
      totalReviews: ratingAggregation[0].totalReviews,
      ratingDistribution: calculateRatingDistribution(ratingAggregation[0].ratings)
    } : {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };

    // Update item's stored ratings if they're different
    if (item.averageRating !== ratingSummary.averageRating || item.totalReviews !== ratingSummary.totalReviews) {
      await itemsCollection.updateOne(
        { _id: itemId },
        {
          $set: {
            averageRating: ratingSummary.averageRating,
            totalReviews: ratingSummary.totalReviews,
            updatedAt: new Date()
          }
        }
      );
    }

    const response = {
      item: {
        ...item,
        averageRating: ratingSummary.averageRating,
        totalReviews: ratingSummary.totalReviews
      },
      ratings: ratingSummary,
      userRating,
      recentReviews
    };

    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=30'
      }
    });
  } catch (error) {
    console.error('GET item details error:', error);
    return NextResponse.json(
      { error: "Failed to fetch item details", details: error.message },
      { status: 500 }
    );
  }
}

function calculateRatingDistribution(ratings) {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  ratings.forEach(rating => {
    const roundedRating = Math.round(rating);
    if (roundedRating >= 1 && roundedRating <= 5) {
      distribution[roundedRating]++;
    }
  });
  
  return distribution;
}