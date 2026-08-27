import { ImageResponse } from 'next/og';
import { dbService } from '@/services/db';
import { formatINR } from '@/lib/ranking';

export const runtime = 'nodejs';
export const alt = 'LELAM RANK — Public Ranking';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const resolved = await params;
  const slug = resolved.slug;
  const entry = await dbService.getEntryBySlug(slug);

  const name = entry?.name || slug.toUpperCase();
  const rank = entry?.current_rank ? `#${entry.current_rank}` : '#1';
  const bid = entry?.current_bid ? formatINR(entry.current_bid) : '₹50';

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #08090C 0%, #12141D 50%, #08090C 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '60px 80px',
          fontFamily: 'sans-serif',
          border: '4px solid rgba(212, 175, 55, 0.4)',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: '#FFFFFF',
                letterSpacing: '2px',
              }}
            >
              LELAM<span style={{ color: '#E5C158' }}>RANK</span>
            </div>
            <div
              style={{
                background: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                color: '#E5C158',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              ലേലം
            </div>
          </div>
          <div
            style={{
              fontSize: 16,
              color: '#94A3B8',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              fontFamily: 'monospace',
            }}
          >
            KERALA LEADERBOARD
          </div>
        </div>

        {/* Center Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              background: 'rgba(212, 175, 55, 0.2)',
              border: '2px solid rgba(212, 175, 55, 0.5)',
              color: '#E5C158',
              padding: '8px 24px',
              borderRadius: '9999px',
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: '2px',
              marginBottom: '16px',
            }}
          >
            🏆 {rank} IN KERALA
          </div>

          <div
            style={{
              fontSize: 56,
              fontWeight: 900,
              color: '#FFFFFF',
              letterSpacing: '-1px',
              marginBottom: '12px',
              maxWidth: '900px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </div>

          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: '#E5C158',
              letterSpacing: '-1px',
              marginBottom: '12px',
            }}
          >
            {bid}
          </div>

          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: '#F3D374',
              letterSpacing: '4px',
              textTransform: 'uppercase',
            }}
          >
            CAN YOU BEAT ME?
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            borderTop: '2px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '20px',
            fontSize: 16,
            color: '#64748B',
          }}
        >
          <div>lelamrank.in/{slug}</div>
          <div style={{ color: '#E5C158', fontWeight: 700, letterSpacing: '2px' }}>
            BID. RANK. RISE.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
