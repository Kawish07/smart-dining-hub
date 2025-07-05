import connectToDb from "@/lib/mongodb";
import { NextResponse } from "next/server";
import mongoose from 'mongoose';
import { updateRestaurantRating } from '@/lib/restaurantUtils';
import { updateItemRating } from '@/lib/itemRatingUtils';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  const itemId = searchParams.get("itemId");

  if (!orderId && !itemId) {
    return NextResponse.json(
      { error: "Either orderId or itemId query parameter is required" },
      { status: 400 }
    );
  }

  try {
    const connection = await connectToDb();
    const db = connection.connection.db;
    const reviewsCollection = db.collection("reviews");

    let review;
    
    if (orderId) {
      // Get order review
      review = await reviewsCollection.findOne(
        { orderId },
        { projection: { _id: 0, orderId: 1, overallRating: 1, overallComment: 1, itemReviews: 1, createdAt: 1, restaurantId: 1 } }
      );
    } else if (itemId) {
      // Get reviews for specific item
      const reviews = await reviewsCollection.find(
        { "itemReviews.itemId": itemId },
        { 
          projection: { 
            userId: 1, 
            itemReviews: { $elemMatch: { itemId: itemId } },
            createdAt: 1 
          } 
        }
      ).toArray();

      review = reviews.map(r => ({
        userId: r.userId,
        ...r.itemReviews[0],
        createdAt: r.createdAt
      }));
    }

    return NextResponse.json(review || null, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    console.error('GET review error:', error);
    return NextResponse.json(
      { error: "Failed to fetch review", details: error.message },
      { status: 500 }
    );
  }
}

async function updateItemRatings(itemIds, restaurantId) {
  try {
    const connection = await connectToDb();
    const db = connection.connection.db;
    const reviewsCollection = db.collection("reviews");
    const itemsCollection = db.collection("items");

    // Get all reviews for these items
    const reviews = await reviewsCollection.find({
      restaurantId,
      "itemReviews.itemId": { $in: itemIds }
    }).toArray();

    // Prepare bulk write operations
    const bulkOps = itemIds.map(itemId => {
      const itemReviews = reviews.flatMap(review => 
        review.itemReviews.filter(ir => ir.itemId === itemId && ir.rating && ir.rating >= 1 && ir.rating <= 5)
      );
      
      const totalReviews = itemReviews.length;
      const averageRating = totalReviews > 0 
        ? itemReviews.reduce((sum, ir) => sum + ir.rating, 0) / totalReviews
        : 0;

      return {
        updateOne: {
          filter: { _id: itemId },
          update: {
            $set: {
              averageRating: parseFloat(averageRating.toFixed(1)),
              totalReviews,
              updatedAt: new Date()
            }
          }
        }
      };
    });

    // Execute bulk update
    if (bulkOps.length > 0) {
      await itemsCollection.bulkWrite(bulkOps);
    }

    return true;
  } catch (error) {
    console.error('Error updating item ratings:', error);
    throw error;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.orderId || !body.userId || !body.restaurantId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const connection = await connectToDb();
    const db = connection.connection.db;
    const reviewsCollection = db.collection("reviews");
    const ordersCollection = db.collection("orders");

    const reviewData = {
      orderId: body.orderId,
      userId: body.userId,
      restaurantId: body.restaurantId,
      overallRating: body.overallRating ? Number(body.overallRating) : null,
      overallComment: body.overallComment?.trim() || "",
      itemReviews: body.itemReviews || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Upsert the review
    const result = await reviewsCollection.updateOne(
      { orderId: body.orderId, userId: body.userId },
      { $set: reviewData },
      { upsert: true }
    );

    // Get the full updated review document
    const updatedReview = await reviewsCollection.findOne(
      { orderId: body.orderId, userId: body.userId }
    );

    // Update the order document to include the review reference
    const updatedOrder = await ordersCollection.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(body.orderId) },
      { $set: { review: updatedReview } },
      { returnDocument: "after" }
    );

    // Update ratings in the background
    Promise.resolve().then(async () => {
      try {
        // Update restaurant rating if overall rating exists
        if (body.overallRating && body.overallRating >= 1 && body.overallRating <= 5) {
          await updateRestaurantRating(body.restaurantId);
        }

        // Update item ratings if item reviews exist
        if (body.itemReviews && body.itemReviews.length > 0) {
          const itemIds = body.itemReviews
            .filter(ir => ir.rating && ir.rating >= 1 && ir.rating <= 5)
            .map(ir => ir.itemId);
          
          if (itemIds.length > 0) {
            await updateItemRatings(itemIds, body.restaurantId);
          }
        }
      } catch (ratingError) {
        console.error('Background rating update error:', ratingError);
      }
    });

    // Format the response
    const responseData = {
      success: true,
      order: {
        ...updatedOrder.value,
        _id: updatedOrder.value?._id?.toString(),
        review: {
          ...updatedReview,
          _id: updatedReview?._id?.toString(),
          createdAt: updatedReview?.createdAt?.toISOString(),
          updatedAt: updatedReview?.updatedAt?.toISOString()
        }
      },
      operation: result.upsertedId ? "created" : "updated"
    };

    return NextResponse.json(
      responseData,
      { 
        status: result.upsertedId ? 201 : 200,
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    );
  } catch (error) {
    console.error('Review submission error:', error);
    return NextResponse.json(
      { error: "Failed to submit review", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { orderId, userId, overallRating, overallComment, itemReviews, restaurantId } = body;

    if (!orderId || !userId || !restaurantId) {
      return NextResponse.json(
        { error: "orderId, userId, and restaurantId are required" },
        { status: 400 }
      );
    }

    const connection = await connectToDb();
    const db = connection.connection.db;
    const reviewsCollection = db.collection("reviews");

    const updateData = {
      updatedAt: new Date()
    };

    if (overallRating !== undefined && overallRating !== null) {
      const numericRating = Number(overallRating);
      if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
        return NextResponse.json(
          { error: "Overall rating must be a number between 1 and 5" },
          { status: 400 }
        );
      }
      updateData.overallRating = numericRating;
      updateData.overallComment = overallComment?.trim() || "";
    }

    if (itemReviews && itemReviews.length > 0) {
      updateData.itemReviews = itemReviews;
    }

    const result = await reviewsCollection.updateOne(
      { orderId, userId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // Update ratings after successful review update
    try {
      // Update restaurant rating if overall rating was modified
      if (overallRating !== undefined && overallRating !== null) {
        await updateRestaurantRating(restaurantId);
      }

      // Update item ratings if item reviews were modified
      if (itemReviews && itemReviews.length > 0) {
        const itemIds = itemReviews
          .filter(ir => ir.rating && ir.rating >= 1 && ir.rating <= 5)
          .map(ir => ir.itemId);
        
        if (itemIds.length > 0) {
          await updateItemRatings(itemIds, restaurantId);
        }
      }
    } catch (ratingError) {
      console.error('Error updating ratings after review update:', ratingError);
    }

    return NextResponse.json(
      { 
        success: true,
        review: { ...updateData, orderId, userId, restaurantId },
        operation: "updated"
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('PUT review error:', error);
    return NextResponse.json(
      { error: "Failed to update review", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const userId = searchParams.get("userId");
    const restaurantId = searchParams.get("restaurantId");

    if (!orderId || !userId || !restaurantId) {
      return NextResponse.json(
        { error: "orderId, userId, and restaurantId query parameters are required" },
        { status: 400 }
      );
    }

    const connection = await connectToDb();
    const db = connection.connection.db;
    const reviewsCollection = db.collection("reviews");

    // Get the review before deleting to know which items to update
    const existingReview = await reviewsCollection.findOne({ orderId, userId });

    const result = await reviewsCollection.deleteOne({ orderId, userId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // Update ratings after successful review deletion
    try {
      // Update restaurant rating if overall rating existed
      if (existingReview?.overallRating) {
        await updateRestaurantRating(restaurantId);
      }

      // Update item ratings if item reviews existed
      if (existingReview?.itemReviews && existingReview.itemReviews.length > 0) {
        const itemIds = existingReview.itemReviews
          .filter(ir => ir.rating && ir.rating >= 1 && ir.rating <= 5)
          .map(ir => ir.itemId);
        
        if (itemIds.length > 0) {
          await updateItemRatings(itemIds, restaurantId);
        }
      }
    } catch (ratingError) {
      console.error('Error updating ratings after review deletion:', ratingError);
    }

    return NextResponse.json(
      { 
        success: true,
        message: "Review deleted successfully"
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE review error:', error);
    return NextResponse.json(
      { error: "Failed to delete review", details: error.message },
      { status: 500 }
    );
  }
}