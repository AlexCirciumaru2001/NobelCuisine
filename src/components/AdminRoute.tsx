// AdminRoute.tsx
import { Navigate, Outlet, NavLink, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { ChefHat, ClipboardList, Calendar, Utensils } from 'lucide-react';
import LoadingScreen from './LoadingScreen';

type Role = 'admin' | 'manager';

interface Props {
  allowedRoles?: Role[];
  children?: React.ReactNode;
}

export default function AdminRoute({ allowedRoles = ['admin'], children }: Props) {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const role = user?.user_metadata?.role as Role;

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user || !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-white shadow-sm border-r border-gray-200 p-4 fixed h-full">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-primary mb-6 px-2">
            {t('adminPanel.title')}
          </h2>

          <nav className="space-y-2">
            <NavLink 
              to="/admin" 
              end
              className={({ isActive }) => `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                isActive ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ChefHat className="h-5 w-5" />
              <span>{t('nav.products')}</span>
            </NavLink>

            <NavLink
              to="/admin/orders"
              className={({ isActive }) => `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                isActive ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Utensils className="h-5 w-5" />
              <span>{t('nav.orders.admin')}</span>
            </NavLink>

            <NavLink
              to="/admin/bookings"
              className={({ isActive }) => `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                isActive ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Calendar className="h-5 w-5" />
              <span>{t('nav.bookings.admin')}</span>
            </NavLink>

            <Link
              to="/"
              className="flex items-center space-x-3 p-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors mt-8"
            >
              <ClipboardList className="h-5 w-5" />
              <span>{t('nav.backToSite')}</span>
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        {children || <Outlet />}
      </main>
    </div>
  );
}