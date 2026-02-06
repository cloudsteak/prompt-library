import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="text-center py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-gray-600 mb-6">Page not found</p>
      <Link
        to="/"
        className="text-blue-600 hover:text-blue-800 font-medium"
      >
        Go back home
      </Link>
    </div>
  );
}
