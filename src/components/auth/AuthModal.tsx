'use client';

import React, { useState } from 'react';
import { X, Mail, Lock, User, CheckCircle2, ArrowRight, Shield, AlertCircle } from 'lucide-react';
import { authService } from '@/services/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (tab === 'forgot') {
        const result = await authService.resetPassword(email);
        setLoading(false);
        if (result.error) {
          setError(result.error);
        } else {
          setMessage('A password reset link has been sent to your email address.');
        }
      } else if (tab === 'signup') {
        const result = await authService.signUp(email, password, name || 'Founder');
        setLoading(false);
        if (result.error) {
          setError(result.error);
        } else {
          if (result.requiresEmailVerification) {
            setMessage('Account created! Please check your email to verify your address before placing live bids.');
          } else {
            setMessage('Account successfully created and signed in.');
          }
          setTimeout(() => {
            onSuccess?.();
            onClose();
          }, 1500);
        }
      } else {
        const result = await authService.signIn(email, password);
        setLoading(false);
        if (result.error) {
          setError(result.error);
        } else {
          onSuccess?.();
          onClose();
        }
      }
    } catch (err: unknown) {
      setLoading(false);
      const errMessage = err instanceof Error ? err.message : 'An authentication error occurred.';
      setError(errMessage);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0F1117] border border-white/[0.1] rounded-2xl p-6 md:p-8 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#E5C158] mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">
            {tab === 'signin' && 'Sign in to LELAM RANK'}
            {tab === 'signup' && 'Create Founder Account'}
            {tab === 'forgot' && 'Reset Your Password'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {tab === 'signin' && 'Manage your entries and outbid competitors'}
            {tab === 'signup' && 'Claim your spot on Kerala\'s competitive leaderboard'}
            {tab === 'forgot' && 'Enter your verified email to receive instructions'}
          </p>
        </div>

        {/* Tab Switcher */}
        {tab !== 'forgot' && (
          <div className="flex rounded-lg bg-black/40 p-1 mb-6 border border-white/[0.05]">
            <button
              onClick={() => {
                setTab('signin');
                setError(null);
                setMessage(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                tab === 'signin'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setTab('signup');
                setError(null);
                setMessage(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                tab === 'signup'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>
        )}

        {/* Feedback Alerts */}
        {message && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Full Name / Founder Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Arun Varma"
                  className="w-full bg-[#151822] border border-white/[0.1] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Work / Founder Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="founder@yourstartup.com"
                className="w-full bg-[#151822] border border-white/[0.1] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          {tab !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Password
                </label>
                {tab === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setTab('forgot')}
                    className="text-[11px] text-amber-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#151822] border border-white/[0.1] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg gold-gradient-button text-black font-bold text-sm flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>
                  {tab === 'signin' && 'Sign In'}
                  {tab === 'signup' && 'Create Account'}
                  {tab === 'forgot' && 'Send Reset Link'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {tab === 'forgot' && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setTab('signin')}
              className="text-xs text-slate-400 hover:text-white"
            >
              Back to Sign In
            </button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-white/[0.06] text-center text-[11px] text-slate-400">
          By continuing, you agree to the{' '}
          <a href="/terms" className="underline hover:text-slate-300">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/rules" className="underline hover:text-slate-300">
            Rules
          </a>
          .
        </div>
      </div>
    </div>
  );
}
