'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, Home, FileText, Users, BarChart3, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function SidebarContent({
  links,
  user,
  pathname,
  signingOut,
  onLogout,
  onLinkClick,
}: {
  links: SidebarLink[];
  user: { name: string; email: string; role: string };
  pathname: string;
  signingOut: boolean;
  onLogout: () => void;
  onLinkClick?: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className="h-16 border-b border-border flex items-center px-6 gap-2 flex-shrink-0">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-bold">JustSpeak</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive =
            link.href === `/dashboard/${user.role}`
              ? pathname === link.href
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onLinkClick}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors text-sm font-medium ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* User + Sign Out */}
      <div className="border-t border-border p-4 space-y-3 flex-shrink-0">
        <div className="px-2">
          <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">
            {user.role === 'teacher' ? 'Teacher' : 'Student'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onLogout}
          disabled={signingOut}
          className="w-full justify-start gap-2"
        >
          <LogOut className="w-4 h-4" />
          {signingOut ? 'Signing out...' : 'Sign Out'}
        </Button>
      </div>
    </>
  );
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  if (!user) return null;

  const teacherLinks: SidebarLink[] = [
    { href: '/dashboard/teacher', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
    { href: '/dashboard/teacher/assignments', label: 'Assignments', icon: <FileText className="w-5 h-5" /> },
    { href: '/dashboard/teacher/submissions', label: 'Submissions', icon: <FileText className="w-5 h-5" /> },
    { href: '/dashboard/teacher/students', label: 'Students', icon: <Users className="w-5 h-5" /> },
    { href: '/dashboard/teacher/analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
  ];

  const learnerLinks: SidebarLink[] = [
    { href: '/dashboard/learner', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
    { href: '/dashboard/learner/assignments', label: 'Assignments', icon: <FileText className="w-5 h-5" /> },
    { href: '/dashboard/learner/submissions', label: 'Submissions', icon: <FileText className="w-5 h-5" /> },
    { href: '/dashboard/learner/grades', label: 'Grades', icon: <BarChart3 className="w-5 h-5" /> },
  ];

  const links = user.role === 'teacher' ? teacherLinks : learnerLinks;

  async function handleLogout() {
    setSigningOut(true);
    try {
      await logout();
      router.push('/auth/login');
    } catch {
      setSigningOut(false);
    }
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 border-r border-border bg-card flex-col h-screen sticky top-0">
        <SidebarContent
          links={links}
          user={user}
          pathname={pathname}
          signingOut={signingOut}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-card border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm">JustSpeak</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-md hover:bg-muted transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`md:hidden fixed top-0 left-0 z-50 h-full w-72 bg-card border-r border-border flex flex-col transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-muted transition-colors"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>

        <SidebarContent
          links={links}
          user={user}
          pathname={pathname}
          signingOut={signingOut}
          onLogout={handleLogout}
          onLinkClick={() => setMobileOpen(false)}
        />
      </aside>
    </>
  );
}