import { NextResponse } from 'next/server';
import { lelamStore } from '@/lib/store';

export async function GET() {
  try {
    const entries = lelamStore.getEntries();
    const stats = lelamStore.getStats();
    const activity = lelamStore.getActivity();

    return NextResponse.json({
      success: true,
      data: {
        entries,
        stats,
        activity,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}
