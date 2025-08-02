'use client';
import ProtectedRoute from '@/_components/ProtectedRoute';
import Header from '@/_components/Header';
import { usePathname } from 'next/navigation';

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const hideHeader = pathname === '/login' || pathname === '/register';

  return (
    <>
      {!hideHeader && <Header />}
      <main>
        {!hideHeader ? (
          <ProtectedRoute>{children}</ProtectedRoute>
        ) : (
          children
        )}
      </main>
    </>
  );
}
