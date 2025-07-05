// app/api/categories/route.js
import { NextResponse } from 'next/server';
import connectToDb from '@/lib/mongodb';
import Category from '@/models/Category';
import Item from '@/models/Item';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    await connectToDb();
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    let categories;
    if (restaurantId) {
      if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
        return NextResponse.json(
          { error: "Invalid restaurant ID format" },
          { status: 400 }
        );
      }
      categories = await Category.find({ restaurantId }).lean();
    } else {
      // No restaurantId: return all categories
      categories = await Category.find({}).lean();
    }

    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch categories', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectToDb();
    const body = await request.json();
    
    console.log("Incoming request body:", body);

    if (!body.name || !body.restaurantId) {
      console.log("Missing fields - name:", body.name, "restaurantId:", body.restaurantId);
      return NextResponse.json(
        { error: "Missing required fields: name and restaurantId" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(body.restaurantId)) {
      console.log("Invalid restaurantId format:", body.restaurantId);
      return NextResponse.json(
        { error: "Invalid restaurant ID format" },
        { status: 400 }
      );
    }

    // Store restaurantId as a string to match the GET query format
    const newCategory = new Category({
      name: body.name,
      restaurantId: body.restaurantId
    });

    const savedCategory = await newCategory.save();
    console.log("Saved category:", savedCategory);
    
    return NextResponse.json(savedCategory, { status: 201 });
  } catch (error) {
    console.error('Error adding category:', error);
    return NextResponse.json(
      { error: 'Failed to add category', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await connectToDb();
    const { id, restaurantId } = await request.json();

    if (!id || !restaurantId) {
      return NextResponse.json(
        { error: "Both id and restaurantId are required" },
        { status: 400 }
      );
    }

    // Use consistent format for restaurantId
    await Category.deleteOne({ 
      _id: id, 
      restaurantId: restaurantId 
    });
    
    await Item.deleteMany({ 
      category: id, 
      restaurantId: restaurantId 
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category', details: error.message },
      { status: 500 }
    );
  }
}