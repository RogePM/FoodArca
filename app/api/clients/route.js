import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Client } from '@/lib/models/ClientModel';

// --- GET: List Clients (You already have this) ---
export async function GET(req) {
  try {
    const pantryId = req.headers.get('x-pantry-id');
    if (!pantryId) return NextResponse.json({ message: 'Pantry ID required' }, { status: 400 });

    await connectDB();
    const clients = await Client.find({ pantryId }).sort({ lastVisit: -1 }).limit(100);
    return NextResponse.json({ count: clients.length, data: clients });
  } catch (error) {
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}

// --- POST: Create New Client Manually ---
export async function POST(req) {
  try {
    const data = await req.json();
    const pantryId = req.headers.get('x-pantry-id');
    if (!pantryId) return NextResponse.json({ message: 'Pantry ID required' }, { status: 400 });

    await connectDB();

    // Generate ID if missing
    const finalClientId = data.clientId || `MANUAL-${Date.now().toString().slice(-6)}`;

    const newClient = await Client.create({
      ...data,
      pantryId,
      clientId: finalClientId,
      // Ensure names are saved correctly
      firstName: data.firstName, 
      lastName: data.lastName || '',
      lastVisit: new Date(),
    });

    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    // Handle duplicate ID error
    if (error.code === 11000) {
      return NextResponse.json({ message: 'Client ID already exists' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}

// --- PUT: Update Client Profile ---
export async function PUT(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const data = await req.json();
    const pantryId = req.headers.get('x-pantry-id');

    if (!id || !pantryId) return NextResponse.json({ message: 'ID required' }, { status: 400 });

    await connectDB();

    const updatedClient = await Client.findOneAndUpdate(
      { _id: id, pantryId },
      { $set: data }, // Update only the fields sent
      { new: true }
    );

    if (!updatedClient) return NextResponse.json({ message: 'Client not found' }, { status: 404 });

    return NextResponse.json({ message: 'Updated', data: updatedClient });
  } catch (error) {
    return NextResponse.json({ message: 'Update Failed' }, { status: 500 });
  }
}

// --- DELETE: Remove Client ---
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const pantryId = req.headers.get('x-pantry-id');

    if (!id || !pantryId) return NextResponse.json({ message: 'ID required' }, { status: 400 });

    await connectDB();
    await Client.findOneAndDelete({ _id: id, pantryId });

    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    return NextResponse.json({ message: 'Delete Failed' }, { status: 500 });
  }
}