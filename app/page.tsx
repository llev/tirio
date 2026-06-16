'use client';
import dynamic from 'next/dynamic';

// The whole app is client-side (custom stack router, localStorage). Disable SSR
// so localStorage/window access during render is never reached on the server.
const TirioApp = dynamic(() => import('@/app-root'), { ssr: false });

export default function Page() {
  return <TirioApp />;
}
