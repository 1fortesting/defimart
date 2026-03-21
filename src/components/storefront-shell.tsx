'use client';

import { usePathname } from 'next/navigation';

export function StorefrontShell({
  header,
  bottomNav,
  children,
}: {
  header: React.ReactNode;
  bottomNav: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');
  
  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="pb-20 md:pb-0 min-h-screen flex flex-col">
        {header}
        {children}
      </div>
      {bottomNav}
    </>
  );
}
