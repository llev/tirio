import './globals.css';
import { Hanken_Grotesk, Source_Sans_3 } from 'next/font/google';

const hankenGrotesk = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-hanken',
});

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-source',
});

export const metadata = {
  title: 'Tirio — Welsh family play',
  description: 'A little Welsh, together, every day.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Tirio',
  },
};

// NOTE: deliberately NO viewportFit:'cover'. With cover, iOS pins content under
// the notch and shrinks the layout viewport to screen−top_inset, leaving a dead
// strip at the bottom. Without it, content reaches the bottom edge and the
// notch/safe-area regions are painted by the <body> canvas color (set per-screen
// in app-root). Matches the spelliegame.com approach.
export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${hankenGrotesk.variable} ${sourceSans.variable}`}>
      <head />
      <body>
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js');` }} />
        <div id="stage">
          <div id="root" style={{ position: 'absolute', inset: 0 }}>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
