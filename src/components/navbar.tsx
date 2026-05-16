'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { hasPermission } from '../lib/permissions';

type CurrentUser = {
  id: string;
  fullName: string;
  roleCode?: string | null;
  roleName?: string | null;
  permissions: string[];
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  async function loadMe() {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!res.ok) {
        setCurrentUser(null);
        return;
      }

      const data = await res.json();
      setCurrentUser(data.user ?? null);
    } catch (error) {
      console.error(error);
      setCurrentUser(null);
    }
  }

  useEffect(() => {
    void loadMe();
  }, [pathname]);

  async function logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error(error);
    } finally {
      router.push('/login');
      router.refresh();
    }
  }

  const permissions = currentUser?.permissions ?? [];
  const isLoggedIn = Boolean(currentUser);

  const navItems = [
    hasPermission(permissions, 'dashboard.view') ||
    hasPermission(permissions, 'dashboard.view.own')
      ? { href: '/dashboard', label: 'Dashboard' }
      : null,

    hasPermission(permissions, 'users.view')
      ? { href: '/users', label: 'Usuarios' }
      : null,

    hasPermission(permissions, 'activities.view') ||
    hasPermission(permissions, 'activities.view.own')
      ? { href: '/activities', label: 'Actividades' }
      : null,

    hasPermission(permissions, 'treasury.view') ||
    hasPermission(permissions, 'treasury.view.own')
      ? { href: '/treasury', label: 'Tesorería' }
      : null,

    hasPermission(permissions, 'payments.view') ||
    hasPermission(permissions, 'payments.view.own')
      ? { href: '/payments', label: 'Pagos' }
      : null,

    hasPermission(permissions, 'attendance.view') ||
    hasPermission(permissions, 'attendance.view.own')
      ? { href: '/attendance', label: 'Asistencia' }
      : null,

    hasPermission(permissions, 'excuses.view') ||
    hasPermission(permissions, 'excuses.view.own') ||
    hasPermission(permissions, 'excuses.create')
      ? { href: '/excuses', label: 'Excusas' }
      : null,

    hasPermission(permissions, 'reports.view')
      ? { href: '/reports', label: 'Reportes' }
      : null,
  ].filter(Boolean) as Array<{ href: string; label: string }>;

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link href={isLoggedIn ? '/dashboard' : '/login'} className="brand">
          <div className="brand-logo-wrap">
            <Image
              src="/branding/logo.png"
              alt="Logo Hermandad"
              width={58}
              height={58}
              className="brand-logo"
              priority
            />
          </div>

          <div className="brand-text-wrap">
            <Image
              src="/branding/hermandad.png"
              alt="Hermandad"
              width={290}
              height={60}
              className="brand-text"
              priority
            />
            <Image
              src="/branding/jueves.png"
              alt="Jesús Nazareno del Perdón"
              width={360}
              height={48}
              className="brand-subtext"
              priority
            />
          </div>
        </Link>

        {isLoggedIn ? (
          <div className="topbar-right">
            <nav className="nav-links">
              {navItems.map((item) => {
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link ${active ? 'active' : ''}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <button type="button" className="logout-button" onClick={logout}>
              Salir
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}