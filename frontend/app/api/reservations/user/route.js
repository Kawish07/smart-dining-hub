// app/api/reservations/user/route.js
import { NextResponse } from 'next/server';
import  connectToDb  from '@/lib/mongodb';
import Reservation from '@/models/Reservation';

export async function GET(request) {
  try {
    // Connect to database
    await connectToDb();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const status = searchParams.get('status');
    
    // Validate email parameter
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email parameter is required' }, 
        { status: 400 }
      );
    }

    // Build query
    const query = { customerEmail: email.toLowerCase().trim() };
    
    // Add status filter if provided
    if (status === 'active') {
      query.status = { $in: ['Confirmed', 'In Process'] };
    } else if (status === 'history') {
      query.status = { $in: ['Completed', 'Cancelled'] };
    }
    
    // Fetch reservations with proper error handling
    let reservations;
    try {
      reservations = await Reservation.find(query)
        .sort({ createdAt: -1 })
        .lean()
        .exec();
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Database operation failed',
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        },
        { status: 500 }
      );
    }

    // Validate data format
    if (!Array.isArray(reservations)) {
      console.error('Invalid data format received:', reservations);
      return NextResponse.json(
        { success: false, error: 'Invalid data format' },
        { status: 500 }
      );
    }

    // Return successful response
    return NextResponse.json({
      success: true,
      data: reservations // Changed from 'reservations' to 'data' for consistency
    });

  } catch (error) {
    console.error('API endpoint error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}