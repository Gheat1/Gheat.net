import './globals.css';

export const metadata = {
  title: 'gheat.net',
  description:
    'gheat.net — projects, experiments, and a lot of random stuff by Jaeden (gheat).',
  icons: { icon: '/favicon.png' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
