'use client';

import React from 'react';
import { Trophy, TrendingUp, Layers, CheckCircle2 } from 'lucide-react';
import { LeaderboardStats } from '@/types';
import { formatINR } from '@/lib/ranking';

interface StatsBarProps {
  stats: LeaderboardStats;
}

export default function StatsBar({ stats }: StatsBarProps) {
  const statItems = [
    {
      label: 'REIGNING #1 BID',
      value: formatINR(stats.championBid),
      subtext: stats.championName,
      icon: <Trophy className="w-4 h-4 text-[#E5C158]" />,
      highlight: true,
    },
    {
      label: 'TOTAL BID VOLUME',
      value: formatINR(stats.totalBidVolume),
      subtext: 'Accumulated active pool',
      icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
    },
    {
      label: 'ACTIVE CONTENDERS',
      value: `${stats.totalEntries} Startups`,
      subtext: 'Global single board',
      icon: <Layers className="w-4 h-4 text-sky-400" />,
    },
    {
      label: 'VERIFIED TRANSACTIONS',
      value: `${stats.totalVerifiedBids}`,
      subtext: '100% database backed',
      icon: <CheckCircle2 className="w-4 h-4 text-amber-400" />,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((item, idx) => (
          <div
            key={idx}
            className={`rounded-2xl p-5 border transition-all ${
              item.highlight
                ? 'bg-gradient-to-br from-[#161925] to-[#0D0F15] border-amber-500/30 shadow-lg shadow-amber-500/5'
                : 'bg-[#0E1017] border-white/[0.07]'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {item.label}
              </span>
              <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                {item.icon}
              </div>
            </div>

            <div className={`text-xl sm:text-2xl font-black ${
              item.highlight ? 'text-[#E5C158]' : 'text-white'
            }`}>
              {item.value}
            </div>

            <div className="text-[11px] text-slate-400 mt-1 truncate">
              {item.subtext}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
