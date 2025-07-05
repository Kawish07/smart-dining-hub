import { NextResponse } from 'next/server';
import  connectToDB  from '@/lib/mongodb';
import Staff from '@/models/Staff';

export async function GET() {
  try {
    await connectToDB();
    const staff = await Staff.find({});
    return NextResponse.json(staff);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    await connectToDB();
    const newStaff = new Staff(data);
    await newStaff.save();
    return NextResponse.json(newStaff);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();
    await connectToDB();
    await Staff.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}