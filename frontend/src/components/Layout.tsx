import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, LogOut } from 'lucide-react';
import { CookieConsent } from './CookieConsent';

export function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-sigil-obsidian transition-colors duration-200">
      <header className="bg-white dark:bg-sigil-obsidian shadow-sm border-b border-gray-100 dark:border-white/10 transition-colors duration-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center self-center">
              <a href="https://cloudmentor.hu" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group transition-all min-h-[44px]">
                <svg className="h-[28px] sm:h-[32px] w-auto text-sigil-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.5 19c.3 0 .5-.1.7-.2.6-.4.8-1.2.4-1.8l-1.5-2.5c-.2-.3-.5-.5-.9-.5H7.8c-.4 0-.7.2-.9.5L5.4 17c-.4.6-.2 1.4.4 1.8.2.1.4.2.7.2h11zM12 5c-3.3 0-6 2.7-6 6 0 .3 0 .5.1.8-.6.5-1 1.2-1 2.1 0 1.6 1.3 3 3 3h4c1.7 0 3-1.4 3-3 0-.9-.4-1.7-1.1-2.2.1-.3.1-.5.1-.8 0-3.3-2.7-6-6-6z" />
                </svg>
                <span className="text-gray-900 dark:text-white font-montserrat font-bold tracking-tight text-base sm:text-lg group-hover:text-sigil-teal transition-colors flex items-center">Cloud Mentor</span>
              </a>
              <div className="h-6 w-px bg-sigil-silver/30 mx-3 sm:mx-4 hidden sm:block self-center"></div>
              <Link to="/" className="flex items-center gap-2 self-center min-h-[44px]">
                <span className="text-xs sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] font-michroma text-sigil-teal uppercase flex items-center">Sigil Deck</span>
              </Link>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-6">
              <nav className="hidden md:flex space-x-6 text-[10px] tracking-widest text-sigil-silver font-montserrat font-semibold opacity-60">
                <Link to="/privacy" className="hover:text-sigil-teal transition-colors uppercase">Privacy & Cookies</Link>
                <a href="#" className="hover:text-sigil-teal transition-colors uppercase">Support</a>
              </nav>

              <div className="h-4 w-px bg-sigil-silver/20 mx-2 hidden md:block"></div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-400 hover:text-sigil-teal hover:bg-white/5 transition-all"
                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>

              {user && (
                <div className="flex items-center space-x-2 sm:space-x-3 ml-2 sm:ml-4 pl-2 sm:pl-4 border-l border-gray-200 dark:border-white/10">
                  {user.picture_url && (
                    <img
                      src={user.picture_url}
                      alt={user.name || 'User'}
                      className="w-7 h-7 rounded-full border border-gray-200 dark:border-white/20"
                    />
                  )}
                  <span className="hidden sm:inline text-[11px] font-montserrat font-semibold text-gray-700 dark:text-sigil-silver tracking-wide">
                    {user.name || user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="p-2 sm:px-3 sm:py-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-sigil-teal text-[10px] tracking-wider uppercase font-michroma rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
                    title="Logout"
                  >
                    <LogOut size={14} />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-700">
          <Outlet />
        </div>
      </main>
      <CookieConsent />
    </div>
  );
}
