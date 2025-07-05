import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await connectDB();
    
    // Test database connection
    await db.connection.db.command({ ping: 1 });
    
    // Test collections exist
    const collections = await db.connection.db.listCollections().toArray();
    const requiredCollections = ['reviews', 'orders'];
    const missingCollections = requiredCollections.filter(
      col => !collections.some(c => c.name === col)
    );
    
    if (missingCollections.length > 0) {
      return NextResponse.json(
        {
          status: 'degraded',
          missingCollections,
          message: 'Some required collections are missing'
        },
        { status: 200 }
      );
    }
    
    return NextResponse.json(
      { status: 'healthy', collections: collections.map(c => c.name) },
      { status: 200 }
    );
    
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : null
      },
      { status: 500 }
    );
  }
}