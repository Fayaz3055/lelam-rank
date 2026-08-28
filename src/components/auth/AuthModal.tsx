'use client';

import React, { useState } from 'react';
import { X, Mail, Lock, User, CheckCircle2, ArrowRight, Shield, AlertCircle, AtSign, Eye } from 'lucide-react';
import { authService } from '@/services/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const withTimeout = async <T,>(promise: Promise<T>, timeoutMs = 25000): Promise<T> => {
    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Request timed out. Please try again.')), timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (tab === 'forgot') {
        const result = await withTimeout(authService.resetPassword(email));
        if (result.error) {
          setError(result.error);
        } else {
          setMessage('A password reset link has been sent to your email address.');
        }
      } else if (tab === 'signup') {
        const result = await withTimeout(authService.signUp(username, email, password));
        if (result.error) {
          setError(result.error);
        } else {
          setMessage('Account successfully created! You are now logged in.');
          setTimeout(() => {
            onSuccess?.();
            onClose();
          }, 300);
        }
      } else {
        const result = await withTimeout(authService.signIn(email, password));
        if (result.error) {
          setError(result.error);
        } else {
          onSuccess?.();
          onClose();
        }
      }
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'An authentication error occurred.';
      setError(errMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const result = await authService.signInAnonymously();
      if (result.error) {
        setError(result.error);
      } else {
        setMessage('Browsing as Guest');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 150);
      }
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'Guest sign-in failed.';
      setError(errMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0F1117] border border-white/[0.1] rounded-2xl p-6 md:p-8 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] cursor-pointer"
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
            {tab === 'signup' && 'Choose your public username and register instantly'}
            {tab === 'forgot' && 'Enter your account email to receive instructions'}
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
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
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
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Public Username *
                </label>
                <span className="text-[10px] text-amber-400 font-medium">Public on Leaderboard</span>
              </div>
              <div className="relative">
                <AtSign className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={25}
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="e.g. arun_varma, tech_kerala"
                  className="w-full bg-[#151822] border border-white/[0.1] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Letters, numbers, and underscores (3-25 chars).
              </p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">
                {tab === 'signup' ? 'Private Email Address *' : 'Email or Username'}
              </label>
              {tab === 'signup' && (
                <span className="text-[10px] text-slate-400">Kept Private</span>
              )}
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type={tab === 'signup' ? 'email' : 'text'}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={tab === 'signup' ? 'founder@company.com' : 'Email or @username'}
                className="w-full bg-[#151822] border border-white/[0.1] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          {tab !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Password *
                </label>
                {tab === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setTab('forgot')}
                    className="text-[11px] text-amber-400 hover:underline cursor-pointer"
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
            className="w-full py-2.5 rounded-lg gold-gradient-button text-black font-bold text-sm flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>
                  {tab === 'signin' && 'Sign In'}
                  {tab === 'signup' && 'Create Account & Enter'}
                  {tab === 'forgot' && 'Send Reset Link'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Guest Access Option */}
        {tab !== 'forgot' && (
          <div className="mt-4 pt-4 border-t border-white/[0.06] text-center">
            <div className="relative flex items-center justify-center mb-3">
              <div className="border-t border-white/[0.06] w-full" />
              <span className="bg-[#0F1117] px-2 text-[10px] uppercase font-bold tracking-widest text-slate-500">
                OR
              </span>
              <div className="border-t border-white/[0.06] w-full" />
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={handleGuestSignIn}
              className="w-full py-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 hover:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>Continue as Guest</span>
            </button>
          </div>
        )}

        {tab === 'forgot' && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setTab('signin')}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
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
