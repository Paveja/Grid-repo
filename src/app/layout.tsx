import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Number Nest | Calm math practice for curious minds',
  description: 'A playful, encouraging math practice game for young learners.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
