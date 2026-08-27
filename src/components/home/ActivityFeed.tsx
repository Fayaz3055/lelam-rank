'use client';

import React from 'react';
import Link from 'next/link';
import { Flame, Zap, Rocket, PlusCircle, ArrowUpRight } from 'lucide-react';
import { ActivityEvent } from '@/types';
import { formatINR, formatTimeAgo } from '@/lib/ranking';

interface ActivityFeedProps {
  activities: ActivityEvent[];
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  const displayList = activities.slice(0, 8);

  const getEventBadge = (event: ActivityEvent) => {
    switch (event.event_type) {
      case 'rank_up':
        return {
          icon: <Flame className="w-3.5 h-3.5 text-amber-400" />,
          bg: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
          label: `Moved to #${event.new_rank}`,
        };
      case 'new_entry':
        return {
          icon: <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />,
          bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
          label: `Claimed #${event.new_rank}`,
        };
      case 'outbid':
      case 'new_bid':
      default:
        return {
          icon: <Zap className="w-3.5 h-3.5 text-sky-400" />,
          bg: 'bg-sky-500/10 border-sky-500/20 text-sky-300',
          label: `Bid #${event.new_rank}`,
        };
    }
  };

  return (
    <section className="py-12 border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#E5C158]">
                REAL-TIME PULSE
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              Live Activity Feed
            </h2>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline-block">
            Verified database transactions only
          </span>
        </div>

        {displayList.length === 0 ? (
          <div className="bg-[#0E1017] border border-white/[0.08] rounded-xl p-6 text-center text-xs text-slate-400">
            No live bidding activity recorded yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayList.map((act) => {
              const badge = getEventBadge(act);
              return (
                <div
                  key={act.id}
                  className="bg-[#0D0F15] border border-white/[0.07] hover:border-white/[0.15] rounded-xl p-4 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] shrink-0">
                      {badge.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/${act.entry_slug}`}
                          className="text-xs sm:text-sm font-bold text-white hover:text-[#E5C158] truncate transition-colors"
                        >
                          {act.entry_name}
                        </Link>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${badge.bg} shrink-0`}>
                          {badge.label}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {formatTimeAgo(act.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-[#E5C158] font-mono">
                      {formatINR(act.amount)}
                    </div>
                    <Link
                      href={`/${act.entry_slug}`}
                      className="text-[10px] text-slate-400 hover:text-white inline-flex items-center gap-0.5"
                    >
                      <span>View</span>
                      <ArrowUpRight className="w-2.5 h-2.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
