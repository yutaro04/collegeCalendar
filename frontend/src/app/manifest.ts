import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'COLLEGE APP',
    short_name: 'COLLEGE APP',
    description: 'カレッジカレンダー & ランドリー',
    start_url: '/',
    display: 'standalone',
    background_color: '#fafafa',
    theme_color: '#CB1B3B',
    icons: [
      {
        src: '/app.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/app.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
  };
}
