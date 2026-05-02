export default function manifest() {
  return {
    name: 'Fresh As Ever',
    short_name: 'Fresh As Ever',
    description: 'Surplus food rescue marketplace in Colombo.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f7f6f2',
    theme_color: '#01696f',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
