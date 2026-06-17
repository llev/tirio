import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tirio — Welsh family play',
    short_name: 'Tirio',
    description: 'A little Welsh, together, every day.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f4f1e8',
    theme_color: '#f4f1e8',
    icons: [],
  };
}
