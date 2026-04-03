import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Box, Calendar, Settings, LogOut, Menu, Shield } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { name: 'الرئيسية', path: '/', icon: Home },
    { name: 'قاصات التوفير', path: '/boxes', icon: Box },
    { name: 'الخزن المفتوحة', path: '/vault', icon: Shield },
    { name: 'التقويم', path: '/calendar', icon: Calendar },
    { name: 'الإعدادات', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 right-0 z-50 w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <span className="text-xl font-bold text-primary-600 dark:text-primary-400">القاصة الذكية</span>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden">
            <Menu className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="mb-8 p-4 rounded-2xl bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 border border-primary-100/50 dark:border-gray-700 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-bl-full -mr-8 -mt-8 opacity-50"></div>
            <div className="flex items-center space-x-3 space-x-reverse relative z-10">
              <div className="relative">
                <img src={user?.photoURL || 'https://ui-avatars.com/api/?name=' + user?.email} alt="Profile" className="w-12 h-12 rounded-full border-2 border-white dark:border-gray-700 shadow-sm object-cover" />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.displayName || 'مستخدم'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5" dir="ltr">{user?.email}</p>
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                    isActive 
                      ? "bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300" 
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className={cn("w-5 h-5 ml-3", isActive ? "text-primary-600 dark:text-primary-400" : "text-gray-400")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-5 h-5 ml-3" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between h-16 px-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 md:hidden">
          <button onClick={() => setIsMobileMenuOpen(true)}>
            <Menu className="w-6 h-6 text-gray-500" />
          </button>
          <span className="text-lg font-bold text-primary-600 dark:text-primary-400">القاصة الذكية</span>
          <div className="w-6"></div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
