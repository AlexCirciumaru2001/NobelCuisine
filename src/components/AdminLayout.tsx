// components/AdminLayout.tsx
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { ChefHat, Utensils, Calendar, ClipboardList } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';

export default function AdminLayout() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user?.user_metadata?.role === 'admin' && 
       !window.location.pathname.startsWith('/admin')) {
      navigate('/admin');
    }
  }, [user, navigate]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
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

      {/* Main content area - This Outlet is crucial */}
      <main className="flex-1 ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
}