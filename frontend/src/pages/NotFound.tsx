import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="text-center py-12">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 transition-colors">404</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6 transition-colors">Page not found</p>
      <Link
        to="/"
        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors"
      >
        Go back to deck
      </Link>
    </div>
  );
}
