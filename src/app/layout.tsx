import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-heading',
});

export const metadata: Metadata = {
  title: 'LELAM RANK — Bid. Rank. Rise.',
  description:
    'Kerala’s competitive leaderboard where startups, SaaS products, AI tools, and digital ventures compete for visibility by placing bids. 100% deterministic ranking.',
  openGraph: {
    title: 'LELAM RANK — Bid. Rank. Rise.',
    description:
      'Where Kerala startups, businesses and digital products compete for the top.',
    url: 'https://lelamrank.in',
    siteName: 'LELAM RANK',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LELAM RANK — Bid. Rank. Rise.',
    description:
      'Kerala’s competitive leaderboard for startups, businesses, SaaS, AI tools and emerging digital products.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} dark`}>
      <body className="min-h-screen bg-[#08090C] text-[#F8F9FA] flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-200">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
