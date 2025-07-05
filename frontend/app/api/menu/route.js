import { NextResponse } from "next/server";
import connectToDb from "@/lib/mongodb";
import Item from "@/models/Item";
import Category from "@/models/Category";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");
    const category = searchParams.get("category");

    await connectToDb();

    // Get categories first
    const categories = await Category.find({ restaurantId });
    const categoryNames = categories.map(c => c.name);

    // Get items
    const query = { restaurantId };
    if (category) query.category = { $in: categoryNames, $regex: new RegExp(category, 'i') };

    const items = await Item.find(query).sort({ category: 1, name: 1 });

    // Group by category
    const menu = {};
    categoryNames.forEach(cat => {
      const catItems = items.filter(item => 
        item.category.toLowerCase() === cat.toLowerCase()
      );
      if (catItems.length > 0) {
        menu[cat] = catItems;
      }
    });

    return NextResponse.json(menu);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch menu", details: error.message },
      { status: 500 }
    );
  }
}