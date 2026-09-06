import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '3D Body & Regional Anatomy | Visible Medicine',
  description: 'Explore source-based 3D anatomy by body region, with selectable bones, muscles, organs and partial nervous-system coverage.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
