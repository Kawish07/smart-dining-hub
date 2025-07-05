// app/api/generate-recommendations/route.js
import connectToDb from '@/lib/mongodb';
import Recommendation from '@/models/Recommendation';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDb();
    
    // Get all active users (simplified example)
    const activeUsers = await mongoose.connection.db.collection('users')
      .distinct('email', { lastActive: { $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } });
    
    // Generate recommendations for each user
    for (const userEmail of activeUsers) {
      // ... (similar logic to individual recommendation endpoint)
      
      // Save to Recommendation collection
      await Recommendation.create({
        userId: userEmail,
        items: processedRecommendations,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
    }
    
    return Response.json({ success: true, usersProcessed: activeUsers.length });
  } catch (error) {
    console.error("Batch recommendation error:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}