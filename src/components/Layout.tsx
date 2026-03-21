import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { LayoutGrid, Repeat, Target, Brain, BarChart3, Shield, Settings, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isSeeded } from '@/lib/store';
import { seedAllData } from '@/lib/seedData';

const navItems = [
  { path: '/dashboard', label: 'Command Center', icon: LayoutGrid },
  { path: '/habits', label: 'Habits Command', icon: Repeat },
  { path: '/goals', label: 'Goals Nexus', icon: Target },
  { path: '/mindlab', label: 'Mind Lab', icon: Brain },
  { path: '/analytics', label: 'Intelligence Deck', icon: BarChart3 },
  { path: '/identity', label: 'Identity Forge', icon: Shield },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isSeeded()) { seedAllData(); }
    if (location.pathname === '/') navigate('/dashboard', { replace: true });
  }, []);

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen
        glass border-r border-border flex flex-col
        transition-all duration-300 ease-out
        ${collapsed ? 'w-16' : 'w-60'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-border gap-2">
          {!collapsed && (
            <span className="font-mono text-sm font-bold text-primary tracking-wider glow-text-mint">
              TRACK<span className="text-foreground">ME</span>
            </span>
          )}
          <button onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }} className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
            {collapsed ? <Menu size={18} /> : <X size={18} className="lg:hidden" />}
            {!collapsed && <Menu size={18} className="hidden lg:block" />}
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200
                  ${active
                    ? 'text-primary bg-primary/10 border-l-2 border-primary glow-mint'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border-l-2 border-transparent'
                  }
                `}
              >
                <item.icon size={18} className={active ? 'text-primary' : ''} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="p-4 border-t border-border">
            <p className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">SOMS v1.0</p>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="h-14 flex items-center px-4 border-b border-border lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="text-muted-foreground hover:text-foreground">
            <Menu size={20} />
          </button>
          <span className="ml-3 font-mono text-sm font-bold text-primary tracking-wider glow-text-mint">
            TRACK<span className="text-foreground">ME</span>
          </span>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-[1200px] mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
