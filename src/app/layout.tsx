import './globals.css';
import type { Metadata } from 'next';
import NavbarWrapper from '../components/navbar-wrapper';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const criticalStyles = `
  :root {
    --text-main: #f7f4fb;
    --text-soft: rgba(247, 244, 251, 0.78);
    --primary: #8b5cf6;
    --primary-hover: #7c3aed;
  }
  *, *::before, *::after { box-sizing: border-box; min-width: 0; }
  html, body { margin: 0; padding: 0; min-height: 100%; }
  body {
    min-height: 100vh;
    overflow-x: hidden;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: var(--text-main);
    background:
      radial-gradient(circle at top left, rgba(139, 92, 246, 0.24), transparent 28%),
      radial-gradient(circle at top right, rgba(107, 33, 168, 0.16), transparent 24%),
      linear-gradient(180deg, #2b0d4d 0%, #12071f 28%, #050507 100%);
  }
  a { color: inherit; text-decoration: none; }
  button, input { font: inherit; }
  img { max-width: 100%; height: auto; }
  .app-shell { min-height: 100vh; }
  .app-main { width: min(1400px, calc(100% - 32px)); margin: 0 auto; padding: 24px 0 40px; }
  .card {
    border-radius: 20px;
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
  }
  h1, h2, h3 { color: #fff; margin: 0; }
  p { margin: 0; color: var(--text-soft); }
  form { display: grid; gap: 14px; }
  label { display: inline-block; margin-bottom: 8px; color: var(--text-soft); font-size: 14px; font-weight: 600; }
  .input {
    width: 100%;
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: rgba(6, 7, 12, 0.72);
    color: var(--text-main);
    border-radius: 14px;
    padding: 12px 14px;
    outline: none;
  }
  .input::placeholder { color: rgba(247, 244, 251, 0.42); }
  .input:focus { border-color: rgba(139, 92, 246, 0.55); box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.12); }
  .button {
    border: 0;
    border-radius: 14px;
    padding: 12px 16px;
    cursor: pointer;
    font-weight: 700;
    color: #fff;
    background: linear-gradient(135deg, var(--primary), var(--primary-hover));
    box-shadow: 0 10px 22px rgba(124, 58, 237, 0.28);
  }
  @media (max-width: 640px) {
    .app-main { width: calc(100% - 20px); padding: 18px 0 28px; }
  }
`;

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
      <head>
        <style dangerouslySetInnerHTML={{ __html: criticalStyles }} />
      </head>
      <body>
        <div className="app-shell">
          <NavbarWrapper />
          <main className="app-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
