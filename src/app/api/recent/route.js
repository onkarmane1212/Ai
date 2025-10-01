import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Interaction from '../../../models/Interaction';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    await dbConnect();

    const items = await Interaction.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .select('question responses createdAt')
      .lean();

    return NextResponse.json({ items }, { status: 200 });
  } catch (err) {
    console.error('GET /api/recent error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

