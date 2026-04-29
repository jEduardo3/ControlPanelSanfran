import './globals.css';
import type { Metadata } from 'next';
import NavbarWrapper from '@/components/navbar-wrapper';

export const metadata: Metadata = {
  title: 'Hermandad',
  description: 'Sistema interno de la hermandad',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <div className="app-shell">
          <NavbarWrapper />
          <main className="app-main">{children}</main>
        </div>
      </body>
    </html>
  );
}