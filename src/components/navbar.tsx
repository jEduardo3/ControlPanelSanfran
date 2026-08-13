'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { hasPermission } from '../lib/permissions';
import { clearClientSession, fetchCurrentSession } from '../lib/client-session';
import { navigateFresh } from '../lib/navigation';

type CurrentUser = {
  id: string;
  fullName: string;
  roleCode?: string | null;
  roleName?: string | null;
  permissions: string[];
};

export default function Navbar() {
  const pathname = usePathname();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  async function loadMe() {
    try {
      const session = await fetchCurrentSession<CurrentUser>();
      if (!session.ok) {
        setCurrentUser(null);
        return;
      }
      setCurrentUser(session.user);
    } catch (error) {
      console.error(error);
      setCurrentUser(null);
    }
  }

  useEffect(() => {
    setMenuOpen(false);
    void loadMe();
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  async function logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error(error);
    } finally {
      clearClientSession();
      navigateFresh('/acceso');
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
        <div className="topbar-main-row">
          <a
            href={isLoggedIn ? '/dashboard' : '/acceso'}
            className="brand"
            onClick={(event) => {
              event.preventDefault();
              navigateFresh(isLoggedIn ? '/dashboard' : '/acceso');
            }}
          >
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
          </a>

          {isLoggedIn ? (
            <button
              type="button"
              className="menu-toggle"
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuOpen}
              aria-controls="main-navigation"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="menu-toggle-icon" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span>{menuOpen ? 'Cerrar' : 'Menú'}</span>
            </button>
          ) : null}
        </div>

        {isLoggedIn ? (
          <div className={`topbar-right ${menuOpen ? 'menu-open' : ''}`}>
            <nav className="nav-links" id="main-navigation" aria-label="Navegación principal">
              {navItems.map((item) => {
                const active = pathname === item.href;

                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`nav-link ${active ? 'active' : ''}`}
                    onClick={(event) => {
                      event.preventDefault();
                      setMenuOpen(false);
                      navigateFresh(item.href);
                    }}
                  >
                    {item.label}
                  </a>
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
