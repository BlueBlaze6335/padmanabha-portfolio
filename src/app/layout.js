import './globals.css';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata = {
  title: 'Padmanabha Banerjee — Signal in the Noise',
  description: 'AI/ML Researcher, builder, musician, artist. Building systems that see, hear, speak, and create.',
  metadataBase: new URL('https://padmanabha.ai'),
  openGraph: {
    title: 'Padmanabha Banerjee — Signal in the Noise',
    description: 'AI/ML Researcher, builder, musician, artist.',
    url: 'https://padmanabha.ai',
    siteName: 'Padmanabha Banerjee',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen relative">
        <div className="grain" aria-hidden="true" />
        <div className="orb orb-indigo" style={{ top: '20%', left: '10%', width: 300, height: 300 }} aria-hidden="true" />
        <div className="orb orb-gold" style={{ bottom: '15%', right: '8%', width: 240, height: 240 }} aria-hidden="true" />
        <main className="relative z-10">{children}</main>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
