import { NextResponse } from 'next/server';
import connectToDb from '@/lib/mongodb';
import Item from '@/models/Item';
import Category from '@/models/Category';
import mongoose from 'mongoose';

export async function POST(request) {
  try {
    await connectToDb();
    const body = await request.json();
    const requiredFields = ['name', 'price', 'category', 'restaurantId'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json({ error: "Missing required fields", missingFields }, { status: 400 });
    }

    const price = parseFloat(body.price);
    if (isNaN(price)) {
      return NextResponse.json({ error: "Price must be a valid number" }, { status: 400 });
    }

    let categoryField;
    if (mongoose.Types.ObjectId.isValid(body.category)) {
      categoryField = new mongoose.Types.ObjectId(body.category);
    } else {
      const category = await Category.findOne({
        name: body.category,
        restaurantId: new mongoose.Types.ObjectId(body.restaurantId)
      });

      categoryField = category ? category._id : body.category;
    }

    const newItem = new Item({
      name: body.name,
      price: price,
      description: body.description || "",
      category: categoryField,
      restaurantId: new mongoose.Types.ObjectId(body.restaurantId),
      image: body.image || "",
    });

    const savedItem = await newItem.save();
    return NextResponse.json(savedItem, { status: 201 });
  } catch (error) {
    console.error('Error adding item:', error);
    return NextResponse.json({ error: 'Failed to add item', details: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    await connectToDb();
    const url = new URL(request.url);
    const restaurantId = url.searchParams.get('restaurantId');
    const categoryName = url.searchParams.get('category');

    let items;

    if (restaurantId && categoryName) {
      // Both restaurantId and category provided: filter by both
      if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
        return NextResponse.json({ error: "Invalid restaurantId" }, { status: 400 });
      }
      items = await Item.find({
        restaurantId: new mongoose.Types.ObjectId(restaurantId),
        category: categoryName
      }).lean();

      if (items.length > 0) {
        return NextResponse.json(items);
      }

      // Try to find category by name (case-insensitive)
      const category = await Category.findOne({
        name: { $regex: new RegExp(`^${categoryName}$`, 'i') },
        restaurantId: new mongoose.Types.ObjectId(restaurantId)
      });

      if (!category) {
        return NextResponse.json({ error: `Category not found: ${categoryName}` }, { status: 404 });
      }

      items = await Item.find({
        restaurantId: new mongoose.Types.ObjectId(restaurantId),
        category: category._id
      }).lean();

      return NextResponse.json(items);
    } else if (restaurantId) {
      // Only restaurantId provided: return all items for that restaurant
      if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
        return NextResponse.json({ error: "Invalid restaurantId" }, { status:400 });
      }
      items = await Item.find({ restaurantId: new mongoose.Types.ObjectId(restaurantId) }).lean();
      return NextResponse.json(items);
    } else if (categoryName) {
      // Only category provided: return all items in that category (across restaurants)
      items = await Item.find({ category: categoryName }).lean();
      return NextResponse.json(items);
    } else {
      // No filters: return all items
      items = await Item.find({}).lean();
      return NextResponse.json(items);
    }
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json({ error: 'Failed to fetch items', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectToDb();
    const { id } = await request.json();

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid or missing ID" }, { status: 400 });
    }

    const deletedItem = await Item.findByIdAndDelete(id);

    if (!deletedItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Item deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ error: 'Failed to delete item', details: error.message }, { status: 500 });
  }
}
