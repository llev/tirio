'use client';
// ⚠️ TEMPORARY diagnostic overlay — measures what iOS actually reports for the
// viewport in browser vs standalone. Remove once the viewport issue is resolved.
//
//  • Red 2px border at position:fixed;inset:0 marks the TRUE fixed-viewport bounds.
//    If its bottom edge sits ABOVE the cream strip, the fixed viewport itself
//    isn't reaching the screen bottom (OS-level) — which rules CSS out.
//  • The green panel shows the live numbers. Tap it to hide.
import { useState, useEffect } from 'react';

export function ViewportDebug() {
  const [m, setM] = useState(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // Hidden probe whose padding resolves env() insets to px (reading the CSS
    // custom property directly returns the literal "env(...)" string instead).
    const probe = document.createElement('div');
    probe.style.cssText =
      'position:fixed;top:0;left:0;visibility:hidden;pointer-events:none;' +
      'padding-top:env(safe-area-inset-top);padding-right:env(safe-area-inset-right);' +
      'padding-bottom:env(safe-area-inset-bottom);padding-left:env(safe-area-inset-left)';
    document.body.appendChild(probe);

    // Probes that resolve each viewport-height unit to px. Whichever equals
    // screen.height is the unit that reaches the full physical screen.
    const mkUnit = (h) => {
      const el = document.createElement('div');
      el.style.cssText = `position:fixed;top:0;left:0;width:1px;height:${h};visibility:hidden;pointer-events:none`;
      document.body.appendChild(el);
      return el;
    };
    const uSvh = mkUnit('100svh');
    const uLvh = mkUnit('100lvh');
    const uDvh = mkUnit('100dvh');
    const uVh = mkUnit('100vh');

    const read = () => {
      const cs = getComputedStyle(probe);
      const vv = window.visualViewport;
      const stage = document.getElementById('stage');
      const sr = stage ? stage.getBoundingClientRect() : null;
      const px = (v) => Math.round(parseFloat(v) || 0);
      const uh = (el) => Math.round(el.getBoundingClientRect().height);
      setM({
        inner: `${window.innerWidth} x ${window.innerHeight}`,
        screen: `${screen.width} x ${screen.height}`,
        avail: `${screen.availWidth} x ${screen.availHeight}`,
        visual: vv ? `${Math.round(vv.width)} x ${Math.round(vv.height)}` : 'n/a',
        client: `${document.documentElement.clientWidth} x ${document.documentElement.clientHeight}`,
        stage: sr ? `${Math.round(sr.width)} x ${Math.round(sr.height)} @${Math.round(sr.top)},${Math.round(sr.left)}` : 'n/a',
        insets: `${px(cs.paddingTop)}/${px(cs.paddingRight)}/${px(cs.paddingBottom)}/${px(cs.paddingLeft)}`,
        units: `svh${uh(uSvh)} lvh${uh(uLvh)} dvh${uh(uDvh)} vh${uh(uVh)}`,
        dpr: window.devicePixelRatio,
        sa: `nav=${'standalone' in navigator ? navigator.standalone : '?'} dm=${window.matchMedia('(display-mode: standalone)').matches}`,
      });
    };

    read();
    const vv = window.visualViewport;
    window.addEventListener('resize', read);
    window.addEventListener('orientationchange', read);
    vv?.addEventListener('resize', read);
    vv?.addEventListener('scroll', read);
    const id = window.setInterval(read, 1000); // catch async chrome changes iOS doesn't fire events for
    return () => {
      window.removeEventListener('resize', read);
      window.removeEventListener('orientationchange', read);
      vv?.removeEventListener('resize', read);
      vv?.removeEventListener('scroll', read);
      window.clearInterval(id);
      probe.remove();
      uSvh.remove(); uLvh.remove(); uDvh.remove(); uVh.remove();
    };
  }, []);

  if (hidden || !m) return null;

  const text = [
    `inner   ${m.inner}`,
    `screen  ${m.screen}`,
    `avail   ${m.avail}`,
    `visual  ${m.visual}`,
    `client  ${m.client}`,
    `#stage  ${m.stage}`,
    `insets  ${m.insets}`,
    `units   ${m.units}`,
    `dpr     ${m.dpr}`,
    `mode    ${m.sa}`,
    `(tap to hide)`,
  ].join('\n');

  return (
    <>
      {/* True fixed-viewport bounds — should hug all four screen edges */}
      <div style={{ position: 'fixed', inset: 0, border: '2px solid red', pointerEvents: 'none', zIndex: 2147483600 }} />
      {/* Bottom marker: bright blue 4px bar pinned to the fixed bottom */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, height: 4, background: '#00aaff', pointerEvents: 'none', zIndex: 2147483600 }} />
      <div
        onClick={() => setHidden(true)}
        style={{
          position: 'fixed',
          top: 'env(safe-area-inset-top)',
          left: 0,
          zIndex: 2147483601,
          margin: 8,
          padding: '8px 10px',
          borderRadius: 8,
          background: 'rgba(0,0,0,.82)',
          color: '#0f0',
          font: '12px/1.45 ui-monospace,Menlo,monospace',
          whiteSpace: 'pre',
          maxWidth: 'calc(100vw - 16px)',
          pointerEvents: 'auto',
        }}
      >
        {text}
      </div>
    </>
  );
}
