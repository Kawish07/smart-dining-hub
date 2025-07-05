// app/api/recommendations/track/route.js
import connectToDb from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { userId, itemId, action } = await request.json();
    
    if (!userId || !itemId || !action) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectToDb();
    const db = mongoose.connection.db;
    
    // Create or update recommendation tracking
    await db.collection('recommendation_tracking').updateOne(
      { userId, itemId },
      { 
        $set: { lastUpdated: new Date() },
        $inc: { [action]: 1 },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );
    
    return Response.json({ success: true });

  } catch (error) {
    console.error("Tracking error:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}