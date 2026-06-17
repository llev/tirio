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

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${hankenGrotesk.variable} ${sourceSans.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body>
        <div id="stage">
          <div id="root" style={{ position: 'absolute', inset: 0 }}>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
