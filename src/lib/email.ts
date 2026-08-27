import { formatINR } from './ranking';

export interface BidConfirmedEmailParams {
  toEmail: string;
  entryName: string;
  entrySlug: string;
  bidAmount: number;
  newRank: number;
}

export interface OutbidEmailParams {
  toEmail: string;
  entryName: string;
  entrySlug: string;
  previousRank: number;
  newRank: number;
  currentLeaderBid: number;
}

// In-memory set to prevent duplicate email sends on webhook retries
const processedEmailEvents = new Set<string>();

export const emailService = {
  async sendBidConfirmedEmail(params: BidConfirmedEmailParams): Promise<boolean> {
    const eventKey = `bid_confirmed_${params.entrySlug}_${params.bidAmount}`;
    if (processedEmailEvents.has(eventKey)) {
      return true;
    }
    processedEmailEvents.add(eventKey);

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.EMAIL_FROM || 'updates@lelamrank.in';

    // If no external API key is configured or in test mode, log gracefully
    if (!apiKey || apiKey.includes('placeholder')) {
      console.log('[Email Mock: BID CONFIRMED]', {
        to: params.toEmail,
        entry: params.entryName,
        bid: formatINR(params.bidAmount),
        rank: `#${params.newRank}`,
      });
      return true;
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `LELAM RANK <${fromEmail}>`,
          to: params.toEmail,
          subject: `BID CONFIRMED: #${params.newRank} for ${params.entryName}`,
          html: `
            <div style="font-family: sans-serif; background: #08090C; color: #F8F9FA; padding: 32px; border-radius: 12px;">
              <h2 style="color: #E5C158; margin-top: 0;">BID CONFIRMED</h2>
              <p>Your bid has been successfully verified on the live Kerala leaderboard.</p>
              <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
                <tr><td style="color: #94A3B8; padding: 8px 0;">Entry:</td><td style="font-weight: bold; color: #FFF;">${params.entryName}</td></tr>
                <tr><td style="color: #94A3B8; padding: 8px 0;">Verified Bid:</td><td style="font-weight: bold; color: #E5C158;">${formatINR(params.bidAmount)}</td></tr>
                <tr><td style="color: #94A3B8; padding: 8px 0;">Current Rank:</td><td style="font-weight: bold; color: #FFF;">#${params.newRank}</td></tr>
              </table>
              <a href="https://lelamrank.in/${params.entrySlug}" style="display: inline-block; background: #E5C158; color: #000; font-weight: bold; padding: 12px 24px; text-decoration: none; border-radius: 8px;">View Your Spot</a>
              <p style="margin-top: 24px; font-size: 11px; color: #64748B;">LELAM RANK • Bid. Rank. Rise.</p>
            </div>
          `,
        }),
      });
      return res.ok;
    } catch (error) {
      console.error('[Email Error sendBidConfirmedEmail]:', error);
      return false;
    }
  },

  async sendOutbidEmail(params: OutbidEmailParams): Promise<boolean> {
    const eventKey = `outbid_${params.entrySlug}_${params.newRank}_${params.currentLeaderBid}`;
    if (processedEmailEvents.has(eventKey)) {
      return true;
    }
    processedEmailEvents.add(eventKey);

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.EMAIL_FROM || 'updates@lelamrank.in';

    if (!apiKey || apiKey.includes('placeholder')) {
      console.log('[Email Mock: YOU HAVE BEEN OUTBID]', {
        to: params.toEmail,
        entry: params.entryName,
        fromRank: `#${params.previousRank}`,
        toRank: `#${params.newRank}`,
        holdingBid: formatINR(params.currentLeaderBid),
      });
      return true;
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `LELAM RANK <${fromEmail}>`,
          to: params.toEmail,
          subject: `YOU'VE BEEN OUTBID: ${params.entryName} moved to #${params.newRank}`,
          html: `
            <div style="font-family: sans-serif; background: #08090C; color: #F8F9FA; padding: 32px; border-radius: 12px;">
              <h2 style="color: #F87171; margin-top: 0;">YOU'VE BEEN OUTBID</h2>
              <p>Another contender has placed a higher verified bid on LELAM RANK.</p>
              <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
                <tr><td style="color: #94A3B8; padding: 8px 0;">Entry:</td><td style="font-weight: bold; color: #FFF;">${params.entryName}</td></tr>
                <tr><td style="color: #94A3B8; padding: 8px 0;">Previous Rank:</td><td style="font-weight: bold; color: #94A3B8;">#${params.previousRank}</td></tr>
                <tr><td style="color: #94A3B8; padding: 8px 0;">New Rank:</td><td style="font-weight: bold; color: #F87171;">#${params.newRank}</td></tr>
                <tr><td style="color: #94A3B8; padding: 8px 0;">Current Leader Bid:</td><td style="font-weight: bold; color: #E5C158;">${formatINR(params.currentLeaderBid)}</td></tr>
              </table>
              <a href="https://lelamrank.in/${params.entrySlug}" style="display: inline-block; background: #E5C158; color: #000; font-weight: bold; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Bid Again to Reclaim Spot</a>
              <p style="margin-top: 24px; font-size: 11px; color: #64748B;">LELAM RANK • Bid. Rank. Rise.</p>
            </div>
          `,
        }),
      });
      return res.ok;
    } catch (error) {
      console.error('[Email Error sendOutbidEmail]:', error);
      return false;
    }
  },
};
