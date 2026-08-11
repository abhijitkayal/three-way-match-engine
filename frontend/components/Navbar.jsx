'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem('token');
    router.push('/login');
  }

  if (pathname === '/login') return null;

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/documents', label: 'Documents' },
    { href: '/sku-master', label: 'SKU Master' },
  ];

  return (
    <nav className="bg-card shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-bold text-lg">
            Finify Match
          </Link>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm ${
                pathname === link.href
                  ? 'text-primary-600 font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-muted-foreground hover:text-red-600"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
