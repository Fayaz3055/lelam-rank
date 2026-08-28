'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldCheck,
  Star,
  ExternalLink,
  Lock,
  LogOut,
  Users,
  Layers,
  CreditCard,
  CheckCircle2,
  Clock,
  Activity,
  Trophy,
  Search,
  RefreshCw,
  AlertTriangle,
  Flame,
  Check,
  X,
} from 'lucide-react';
import { Entry, Payment, ActivityEvent } from '@/types';
import { formatINR, formatTimeAgo } from '@/lib/ranking';

interface AdminStats {
  totalUsers: number;
  totalEntries: number;
  activeEntries: number;
  pendingEntries: number;
  verifiedPaymentsCount: number;
  pendingPaymentsCount: number;
  totalVerifiedVolume: number;
  championBid: number;
  championName: string;
}

interface AdminEntry extends Entry {
  owner_email?: string;
  owner_name?: string;
}

interface AdminPayment {
  id: string;
  user_id: string;
  user_email: string;
  entry_id: string;
  entry_name: string;
  amount: number;
  provider: string;
  provider_order_id: string;
  provider_payment_id?: string;
  status: string;
  created_at: string;
}

interface AdminUser {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  role: string;
  created_at: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<
    'overview' | 'entries' | 'pending-payments' | 'verified-payments' | 'users' | 'moderation' | 'leaderboard' | 'audit'
  >('overview');

  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalEntries: 0,
    activeEntries: 0,
    pendingEntries: 0,
    verifiedPaymentsCount: 0,
    pendingPaymentsCount: 0,
    totalVerifiedVolume: 0,
    championBid: 0,
    championName: '',
  });

  const [entries, setEntries] = useState<AdminEntry[]>([]);
  const [pendingPayments, setPendingPayments] = useState<AdminPayment[]>([]);
  const [verifiedPayments, setVerifiedPayments] = useState<AdminPayment[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchAdminData = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/admin/data');
      if (res.status === 401 || res.status === 403) {
        router.push('/admin/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || {});
        setEntries(data.entries || []);
        setPendingPayments(data.pendingPayments || []);
        setVerifiedPayments(data.verifiedPayments || []);
        setUsers(data.users || []);
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('[Admin fetch error]:', error);
    } finally {
      setRefreshing(false);
      setCheckingAuth(false);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch('/api/admin/verify-session');
        if (!authRes.ok) {
          router.push('/admin/login');
          return;
        }
        await fetchAdminData();
      } catch {
        router.push('/admin/login');
      }
    }
    init();
  }, [router]);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => {
      setActionMessage(null);
    }, 4000);
  };

  const handleModerate = async (entryId: string, action: 'activate' | 'suspend' | 'remove' | 'feature' | 'unfeature') => {
    setActionLoading(`${entryId}_${action}`);
    try {
      const res = await fetch('/api/admin/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId, action }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(`Entry updated: ${action}`);
        await fetchAdminData();
      } else {
        showNotification(data.error || 'Failed to update entry', 'error');
      }
    } catch {
      showNotification('Network error executing action', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  };

  // Filtered Entries
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase().trim();
    return entries.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.slug.toLowerCase().includes(q) ||
        e.owner_email?.toLowerCase().includes(q) ||
        e.owner_name?.toLowerCase().includes(q)
    );
  }, [entries, searchQuery]);

  if (checkingAuth) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-amber-500/20 border-t-[#E5C158] animate-spin"></div>
        <span className="text-xs text-slate-400 font-mono">Verifying server administrator authorization...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#E5C158] text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>AUTHORITATIVE ADMIN CONSOLE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Platform Moderation & Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time management for entries, users, payments, and deterministic rankings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchAdminData}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 text-xs font-semibold border border-white/[0.08] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#E5C158]' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/"
            className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 text-xs font-semibold border border-white/[0.08] transition-colors"
          >
            View Live Site
          </Link>
          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/20 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Integrity Assurance Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-200/90">
        <Lock className="w-4 h-4 text-[#E5C158] shrink-0 mt-0.5" />
        <div>
          <strong className="text-white block mb-0.5">Leaderboard Integrity Protected:</strong>
          Admin accounts can moderate entries (activate, suspend, remove, feature) but cannot arbitrarily edit bid amounts. All bids remain strictly bound to verified payment records.
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-white/[0.08] pb-1">
        <button
          onClick={() => setTab('overview')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            tab === 'overview'
              ? 'bg-amber-500/15 text-[#E5C158] border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setTab('entries')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            tab === 'entries'
              ? 'bg-amber-500/15 text-[#E5C158] border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Entries ({entries.length})
        </button>
        <button
          onClick={() => setTab('pending-payments')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            tab === 'pending-payments'
              ? 'bg-amber-500/15 text-[#E5C158] border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Pending Payments ({pendingPayments.length})
        </button>
        <button
          onClick={() => setTab('verified-payments')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            tab === 'verified-payments'
              ? 'bg-amber-500/15 text-[#E5C158] border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Verified Payments ({verifiedPayments.length})
        </button>
        <button
          onClick={() => setTab('users')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            tab === 'users'
              ? 'bg-amber-500/15 text-[#E5C158] border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Users ({users.length})
        </button>
        <button
          onClick={() => setTab('moderation')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            tab === 'moderation'
              ? 'bg-amber-500/15 text-[#E5C158] border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Moderation Queue
        </button>
        <button
          onClick={() => setTab('leaderboard')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            tab === 'leaderboard'
              ? 'bg-amber-500/15 text-[#E5C158] border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Live Rankings Preview
        </button>
        <button
          onClick={() => setTab('audit')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            tab === 'audit'
              ? 'bg-amber-500/15 text-[#E5C158] border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Audit Log ({activities.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {tab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-2xl bg-[#0E1017] border border-white/[0.08]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">TOTAL USERS</span>
              <div className="text-2xl font-black text-white mt-1">{stats.totalUsers}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Registered accounts</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0E1017] border border-white/[0.08]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">TOTAL ENTRIES</span>
              <div className="text-2xl font-black text-white mt-1">{stats.totalEntries}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">All created entities</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0E1017] border border-white/[0.08]">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block font-mono">ACTIVE RANKED</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">{stats.activeEntries}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Live on board</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0E1017] border border-white/[0.08]">
              <span className="text-[10px] uppercase font-bold text-amber-400 block font-mono">PENDING/SUSPENDED</span>
              <div className="text-2xl font-black text-amber-400 mt-1">{stats.pendingEntries}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Offline/Pending</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0E1017] border border-white/[0.08]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">VERIFIED PAYMENTS</span>
              <div className="text-2xl font-black text-white mt-1">{stats.verifiedPaymentsCount}</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">100% verified</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0E1017] border border-white/[0.08]">
              <span className="text-[10px] uppercase font-bold text-[#E5C158] block font-mono">TOTAL VOLUME</span>
              <div className="text-2xl font-black text-[#E5C158] mt-1">{formatINR(stats.totalVerifiedVolume)}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Verified gross</div>
            </div>
          </div>

          {/* Reigning Champion Spotlight */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-[#181B26] to-[#0D0F16] border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#E5C158] flex items-center justify-center font-black">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider font-mono">
                  CURRENT REIGNING #1
                </span>
                <div className="text-lg font-bold text-white">
                  {stats.championName || 'No Contender Yet'}
                </div>
                <div className="text-xs text-slate-400">
                  Current Holding Bid: <strong className="text-[#E5C158] font-mono">{formatINR(stats.championBid)}</strong>
                </div>
              </div>
            </div>

            <Link
              href="/"
              className="px-4 py-2 rounded-xl gold-gradient-button text-black font-extrabold text-xs inline-flex items-center gap-1.5 self-start sm:self-auto"
            >
              <span>View Live Ranking</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* TAB 2: ENTRIES */}
      {tab === 'entries' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search entries by name, slug, owner..."
                className="w-full bg-[#10121A] border border-white/[0.1] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Showing {filteredEntries.length} of {entries.length} entries
            </span>
          </div>

          <div className="rounded-2xl bg-[#0E1017] border border-white/[0.08] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#141720] text-[10px] uppercase tracking-wider text-slate-400 border-b border-white/[0.06]">
                  <tr>
                    <th className="p-4">Rank</th>
                    <th className="p-4">Entity</th>
                    <th className="p-4">Owner</th>
                    <th className="p-4">Holding Bid</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Featured</th>
                    <th className="p-4">Created</th>
                    <th className="p-4 text-right">Moderation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                        No matching entries found.
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 font-mono font-bold text-amber-400">
                          {entry.current_rank ? `#${entry.current_rank}` : '—'}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#08090C] border border-white/[0.1] overflow-hidden flex items-center justify-center shrink-0">
                              {entry.logo_url ? (
                                <Image
                                  src={entry.logo_url}
                                  alt={entry.name}
                                  width={32}
                                  height={32}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="font-bold text-[10px] text-white">
                                  {entry.name.slice(0, 2).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>{entry.name}</span>
                                <Link
                                  href={`/${entry.slug}`}
                                  target="_blank"
                                  className="text-slate-400 hover:text-white"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              </div>
                              <span className="text-[11px] text-slate-400 font-mono">/{entry.slug}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-white font-medium">{entry.owner_name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{entry.owner_email}</div>
                        </td>
                        <td className="p-4 font-mono font-bold text-white">
                          {formatINR(entry.current_bid)}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                              entry.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : entry.status === 'suspended'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                            }`}
                          >
                            {entry.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleModerate(entry.id, entry.featured ? 'unfeature' : 'feature')}
                            disabled={actionLoading === `${entry.id}_feature` || actionLoading === `${entry.id}_unfeature`}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              entry.featured
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                                : 'bg-white/[0.04] border-white/[0.08] text-slate-500 hover:text-slate-300'
                            }`}
                            title="Toggle Featured Badge"
                          >
                            <Star className="w-3.5 h-3.5 fill-current" />
                          </button>
                        </td>
                        <td className="p-4 text-[11px] text-slate-400 font-mono whitespace-nowrap">
                          {formatTimeAgo(entry.created_at)}
                        </td>
                        <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                          {entry.status === 'active' ? (
                            <button
                              onClick={() => handleModerate(entry.id, 'suspend')}
                              disabled={actionLoading === `${entry.id}_suspend`}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 cursor-pointer"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleModerate(entry.id, 'activate')}
                              disabled={actionLoading === `${entry.id}_activate`}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 cursor-pointer"
                            >
                              Activate
                            </button>
                          )}
                          <button
                            onClick={() => handleModerate(entry.id, 'remove')}
                            disabled={actionLoading === `${entry.id}_remove`}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-rose-300 border border-white/[0.06] cursor-pointer"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PENDING PAYMENTS */}
      {tab === 'pending-payments' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#0E1017] border border-white/[0.08] overflow-hidden">
            <div className="p-4 border-b border-white/[0.06] flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Unverified / Pending Payment Transactions</span>
              <span className="text-amber-400 font-mono">{pendingPayments.length} records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#141720] text-[10px] uppercase tracking-wider text-slate-400 border-b border-white/[0.06]">
                  <tr>
                    <th className="p-4">Razorpay Order ID</th>
                    <th className="p-4">Target Entry</th>
                    <th className="p-4">User</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {pendingPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                        No pending unverified payment records.
                      </td>
                    </tr>
                  ) : (
                    pendingPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-white/[0.02]">
                        <td className="p-4 font-mono text-amber-400 font-bold">{p.provider_order_id}</td>
                        <td className="p-4 font-medium text-white">{p.entry_name}</td>
                        <td className="p-4 text-slate-400 font-mono">{p.user_email}</td>
                        <td className="p-4 font-mono font-bold text-white">{formatINR(p.amount)}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                            {p.status}
                          </span>
                        </td>
                        <td className="p-4 text-[11px] text-slate-400 font-mono">{formatTimeAgo(p.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: VERIFIED PAYMENTS */}
      {tab === 'verified-payments' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#0E1017] border border-white/[0.08] overflow-hidden">
            <div className="p-4 border-b border-white/[0.06] flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Authoritative Verified Transaction Log</span>
              <span className="text-emerald-400 font-mono">{verifiedPayments.length} verified</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#141720] text-[10px] uppercase tracking-wider text-slate-400 border-b border-white/[0.06]">
                  <tr>
                    <th className="p-4">Payment ID</th>
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Entity</th>
                    <th className="p-4">User</th>
                    <th className="p-4">Verified Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {verifiedPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                        No verified payment records yet.
                      </td>
                    </tr>
                  ) : (
                    verifiedPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-white/[0.02]">
                        <td className="p-4 font-mono text-emerald-400 font-bold">
                          {p.provider_payment_id || p.id.slice(0, 8)}
                        </td>
                        <td className="p-4 font-mono text-slate-400">{p.provider_order_id}</td>
                        <td className="p-4 font-medium text-white">{p.entry_name}</td>
                        <td className="p-4 text-slate-400 font-mono">{p.user_email}</td>
                        <td className="p-4 font-mono font-bold text-[#E5C158]">{formatINR(p.amount)}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                            VERIFIED
                          </span>
                        </td>
                        <td className="p-4 text-[11px] text-slate-400 font-mono">{formatTimeAgo(p.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: USERS */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#0E1017] border border-white/[0.08] overflow-hidden">
            <div className="p-4 border-b border-white/[0.06] flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Registered User Accounts</span>
              <span className="text-slate-400 font-mono">{users.length} users</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#141720] text-[10px] uppercase tracking-wider text-slate-400 border-b border-white/[0.06]">
                  <tr>
                    <th className="p-4">Email</th>
                    <th className="p-4">Name / Username</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">User ID</th>
                    <th className="p-4">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02]">
                      <td className="p-4 font-bold text-white">{u.email}</td>
                      <td className="p-4 text-slate-300">{u.full_name || u.username || '—'}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                            u.role === 'admin'
                              ? 'bg-amber-500/20 text-[#E5C158] border border-amber-500/30'
                              : 'bg-white/[0.05] text-slate-300 border border-white/[0.08]'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-[11px] text-slate-500">{u.id}</td>
                      <td className="p-4 text-[11px] text-slate-400 font-mono">{formatTimeAgo(u.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: MODERATION QUEUE */}
      {tab === 'moderation' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#0E1017] border border-white/[0.08] space-y-4">
            <h3 className="text-sm font-bold text-white">Active Moderation Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {entries.slice(0, 10).map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs truncate">{entry.name}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-mono ${
                          entry.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {entry.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Bid: {formatINR(entry.current_bid)} • Rank #{entry.current_rank || 'N/A'}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleModerate(entry.id, entry.status === 'active' ? 'suspend' : 'activate')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        entry.status === 'active'
                          ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20'
                      }`}
                    >
                      {entry.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleModerate(entry.id, entry.featured ? 'unfeature' : 'feature')}
                      className={`p-1.5 rounded-lg border cursor-pointer ${
                        entry.featured
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          : 'bg-white/[0.04] border-white/[0.08] text-slate-500'
                      }`}
                      title="Toggle Feature"
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: LIVE LEADERBOARD PREVIEW */}
      {tab === 'leaderboard' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#0E1017] border border-white/[0.08]">
            <h3 className="text-sm font-bold text-white mb-4">Current Deterministic Rankings View</h3>
            <div className="space-y-2">
              {entries
                .filter((e) => e.status === 'active')
                .map((entry, idx) => (
                  <div
                    key={entry.id}
                    className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.06] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-amber-400 w-8">
                        #{entry.current_rank || idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-white">{entry.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">/{entry.slug}</div>
                      </div>
                    </div>
                    <div className="font-mono font-bold text-[#E5C158]">
                      {formatINR(entry.current_bid)}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: AUDIT LOG */}
      {tab === 'audit' && (
        <div className="rounded-2xl bg-[#0E1017] border border-white/[0.08] p-6 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-white/[0.06] text-xs">
            <span className="text-slate-400 font-medium">Real-Time Platform Event Stream</span>
            <span className="text-slate-500 font-mono">{activities.length} logged events</span>
          </div>

          {activities.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No activity events recorded yet.</div>
          ) : (
            activities.map((act) => (
              <div
                key={act.id}
                className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.05] flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-white">{act.entry_name}</span>{' '}
                  <span className="text-slate-400">triggered</span>{' '}
                  <span className="font-bold text-amber-400 uppercase font-mono">{act.event_type}</span>{' '}
                  <span className="text-slate-400">and reached rank #{act.new_rank}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[#E5C158] font-bold">{formatINR(act.amount)}</span>
                  <span className="text-slate-500 text-[11px] font-mono">{formatTimeAgo(act.created_at)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
