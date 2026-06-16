import './globals.css';

export const metadata = {
  title: 'Tirio — Welsh family play',
  description: 'A little Welsh, together, every day.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

// Fit the fixed-size iPad frame into the viewport (letterboxed on black).
const FIT_SCRIPT = `(function () {
  var FW = 836 + 32, FH = 1196 + 32, MARGIN = 24;
  function fit() {
    var ipad = document.getElementById('ipad');
    if (!ipad) return;
    var s = Math.min((window.innerWidth - MARGIN) / FW, (window.innerHeight - MARGIN) / FH);
    s = Math.min(s, 1);
    ipad.style.transform = 'scale(' + s + ')';
  }
  window.addEventListener('resize', fit);
  fit(); setTimeout(fit, 60); setTimeout(fit, 300);
})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800;900&family=Source+Sans+3:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div id="stage">
          <div className="ipad" id="ipad">
            <div className="ipad__screen">
              <div id="root" style={{ position: 'absolute', inset: 0 }}>
                {children}
              </div>
            </div>
          </div>
        </div>
        <script dangerouslySetInnerHTML={{ __html: FIT_SCRIPT }} />
      </body>
    </html>
  );
}
