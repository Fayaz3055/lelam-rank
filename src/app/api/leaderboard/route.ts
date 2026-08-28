import { NextResponse } from 'next/server';
import { dbService } from '@/services/db';

export async function GET() {
  try {
    const [entries, stats, activity] = await Promise.all([
      dbService.getLeaderboardEntries(),
      dbService.getStats(),
      dbService.getActivityFeed(),
    ]);

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

