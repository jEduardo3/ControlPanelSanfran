'use client';

import { usePathname } from 'next/navigation';
import Navbar from './navbar';

export default function NavbarWrapper() {
  const pathname = usePathname();

  const hiddenRoutes = ['/login', '/acceso'];

  const shouldHideNavbar = hiddenRoutes.includes(pathname);

  if (shouldHideNavbar) {
    return null;
  }

  return <Navbar />;
}
