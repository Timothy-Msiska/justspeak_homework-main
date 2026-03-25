'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, Home, FileText, Users, BarChart3, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

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
    <aside className="w-64 border-r border-border bg-card flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="h-16 border-b border-border flex items-center px-6 gap-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-bold">JustSpeak</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          // Exact match for dashboard root, prefix match for sub-pages
          const isActive =
            link.href === `/dashboard/${user.role}`
              ? pathname === link.href
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
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
      <div className="border-t border-border p-4 space-y-3">
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
          onClick={handleLogout}
          disabled={signingOut}
          className="w-full justify-start gap-2"
        >
          <LogOut className="w-4 h-4" />
          {signingOut ? 'Signing out...' : 'Sign Out'}
        </Button>
      </div>
    </aside>
  );
}