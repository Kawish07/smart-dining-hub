import { NextResponse } from 'next/server';
import  connectToDB  from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    await connectToDB();
    const users = await User.find({});
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}