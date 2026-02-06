import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, LogOut } from 'lucide-react';

export function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-semibold text-gray-900 dark:text-white">
              Sigil Deck
            </Link>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <nav className="flex space-x-4">
                {/* Navigation links removed as Prompts is now the Home page */}
              </nav>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>

              {user && (
                <div className="flex items-center space-x-2 sm:space-x-3 ml-2 sm:ml-4 pl-2 sm:pl-4 border-l border-gray-200 dark:border-gray-700">
                  {user.picture_url && (
                    <img
                      src={user.picture_url}
                      alt={user.name || 'User'}
                      className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600"
                    />
                  )}
                  <span className="hidden sm:inline text-sm text-gray-700 dark:text-gray-300">
                    {user.name || user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="p-2 sm:px-3 sm:py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                    title="Logout"
                  >
                    <LogOut size={18} />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
