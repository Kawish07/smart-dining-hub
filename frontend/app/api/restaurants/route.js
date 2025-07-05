import { NextResponse } from 'next/server';
import connectToDb from '@/lib/mongodb';
import Restaurant from '@/models/Restaurant';
import mongoose from 'mongoose';
import Item from '@/models/Item';
import Category from '@/models/Category';
import Special from '@/models/special';
import Table from '@/models/Table';


// Helper function to create a URL-friendly slug
function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')    // Remove special characters
    .replace(/\s+/g, '-')        // Replace spaces with hyphens
    .replace(/-+/g, '-')         // Remove consecutive hyphens
    .trim();
}

// Helper function to ensure unique slug
async function ensureUniqueSlug(baseSlug) {
  let slug = baseSlug;
  let counter = 0;
  let existingRestaurant;
  
  do {
    // Check if this slug already exists
    existingRestaurant = await Restaurant.findOne({ slug });
    
    // If it exists, increment counter and try a new slug
    if (existingRestaurant) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }
  } while (existingRestaurant);
  
  return slug;
}


export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const id = searchParams.get("id");

    const connection = await connectToDb();
    const db = connection.connection.db;
    const restaurantsCollection = db.collection("restaurants");
    const reviewsCollection = db.collection("reviews");

    let restaurants;

    if (slug) {
      // Fetch single restaurant by slug
      const restaurant = await restaurantsCollection.findOne({ slug });
      if (!restaurant) {
        return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
      }
      restaurants = [restaurant];
    } else if (id) {
      // Fetch single restaurant by ID
      const restaurant = await restaurantsCollection.findOne({ _id: new ObjectId(id) });
      if (!restaurant) {
        return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
      }
      restaurants = [restaurant];
    } else {
      // Fetch all restaurants
      restaurants = await restaurantsCollection.find({}).toArray();
    }

    // Calculate ratings for each restaurant
    const restaurantsWithRatings = await Promise.all(
      restaurants.map(async (restaurant) => {
        try {
          // Get all reviews for this restaurant
          const reviews = await reviewsCollection.find({
            restaurantId: restaurant._id.toString()
          }).toArray();

          // Calculate overall restaurant rating from overallRating field
          const overallRatings = reviews
            .filter(review => review.overallRating && review.overallRating > 0)
            .map(review => review.overallRating);

          // If no overall ratings, calculate from item ratings
          let averageRating = 0;
          let totalReviews = 0;

          if (overallRatings.length > 0) {
            averageRating = overallRatings.reduce((sum, rating) => sum + rating, 0) / overallRatings.length;
            totalReviews = overallRatings.length;
          } else {
            // Fallback to item ratings if no overall ratings
            const allItemRatings = reviews.flatMap(review => 
              review.itemReviews ? review.itemReviews.map(ir => ir.rating) : []
            );
            
            if (allItemRatings.length > 0) {
              averageRating = allItemRatings.reduce((sum, rating) => sum + rating, 0) / allItemRatings.length;
              totalReviews = reviews.length; // Count unique reviews, not individual item ratings
            }
          }

          return {
            ...restaurant,
            rating: {
              average: parseFloat(averageRating.toFixed(1)),
              count: totalReviews
            }
          };
        } catch (error) {
          console.error(`Error calculating rating for restaurant ${restaurant._id}:`, error);
          // Return restaurant with default rating if calculation fails
          return {
            ...restaurant,
            rating: {
              average: 0,
              count: 0
            }
          };
        }
      })
    );

    // Return single restaurant or array based on request
    if (slug || id) {
      return NextResponse.json(restaurantsWithRatings[0], {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }

    return NextResponse.json(restaurantsWithRatings, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return NextResponse.json(
      { error: "Failed to fetch restaurants", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectToDb();
    const body = await request.json();
    
    console.log("Received restaurant data:", body);
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: "Restaurant name is required" },
        { status: 400 }
      );
    }
    
    // Create a slug if one wasn't provided
    let slug = body.slug || createSlug(body.name);
    
    // Ensure slug is unique
    slug = await ensureUniqueSlug(slug);
    
    // Create new restaurant with the old structure
    const newRestaurant = new Restaurant({
      name: body.name,
      slug: slug,
      path: slug, // Add path which is same as slug
      image: body.image || "/hero.jpg", // Default image path
      // Add default values for other fields that might be expected
      address: "",
      phone: "",
      description: "",
      __v: 0 // This is added automatically by Mongoose
    });
    
    await newRestaurant.save();
    console.log("Created new restaurant:", newRestaurant);
    
    return NextResponse.json(newRestaurant);
  } catch (error) {
    console.error('Error creating restaurant:', error);
    return NextResponse.json(
      { error: 'Failed to create restaurant', details: error.message },
      { status: 500 }
    );
  }
}
export async function DELETE(request) {
  try {
    await connectToDb();
    const { id } = await request.json();

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid or missing ID' },
        { status: 400 }
      );
    }

    // Delete related documents
    try {
      await Promise.all([
        Item.deleteMany({ restaurantId: id }),
        Category.deleteMany({ restaurantId: id }),
        Special.deleteMany({ restaurantId: id }),
        Table.deleteMany({ restaurantId: id }),
      ]);
    } catch (relatedDataError) {
      console.error('Failed to delete related data:', relatedDataError);
      return NextResponse.json(
        { error: 'Failed to delete related data', details: relatedDataError.message },
        { status: 500 }
      );
    }

    // Delete the restaurant
    const deletedRestaurant = await Restaurant.findByIdAndDelete(id);

    if (!deletedRestaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Restaurant and all related data deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    return NextResponse.json(
      { error: 'Failed to delete restaurant', details: error.message },
      { status: 500 }
    );
  }
}