// App.tsx
import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Utensils, Phone, User, ChefHat, LogOut, Menu as MenuIcon, ClipboardList, Calendar } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useLanguage } from './contexts/LanguageContext';
import { supabase } from '../src/lib/supabase';

// Components
import Menu from './components/Menu';
import Cart from './components/Cart';
import AdminPanel from './components/AdminPanel';
import AdminOrders from './components/AdminOrders';
import AdminBookings from './components/AdminBookings';
import Login from './components/Login';
import Checkout from './components/Checkout';
import OrderSuccess from './components/OrderSuccess';
import Orders from './components/Orders';
import TableBooking from './components/TableBooking';
import LoadingScreen from './components/LoadingScreen';
import LanguageSwitch from './components/LanguageSwitch';
import Profile from './components/Profile';
import ResetPassword from './components/ResetPassword';

const TodosPage = () => {
  const [todos, setTodos] = useState<any[]>([]);

  useEffect(() => {
    const fetchTodos = async () => {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching todos:', error);
        return;
      }

      if (data) setTodos(data);
    };

    fetchTodos();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-light mb-6">Todos</h2>
      <div className="space-y-4">
        {todos.map((todo) => (
          <div 
            key={todo.id}
            className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="font-medium text-gray-800">{todo.title}</h3>
            {todo.description && (
              <p className="mt-2 text-gray-600">{todo.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut, loading } = useAuth();
  const { t } = useLanguage();

  const isAdmin = user?.user_metadata?.role === 'admin';
  const phoneNumber = '0787295537';

  const handleSignOut = () => {
    signOut();
    setIsMobileMenuOpen(false);
  };

  const handlePhoneClick = (e: React.MouseEvent) => {
    if (window.innerWidth > 768) {
      e.preventDefault();
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Navigation */}
        <nav className="bg-white shadow-sm relative z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 md:h-20 items-center">
              <Link to="/" className="text-xl md:text-2xl font-light text-primary hover:text-primary-dark transition-colors">
                Nobel Cuisine
              </Link>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-primary transition-colors"
              >
                <MenuIcon className="h-6 w-6" />
              </button>

              <div className="hidden md:flex items-center space-x-6">
                <LanguageSwitch />
                <Link
                  to="/booking"
                  className="flex items-center text-gray-600 hover:text-primary transition-colors"
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  <span>{t('nav.booking')}</span>
                </Link>
                <a 
                  href={`tel:${phoneNumber}`}
                  onClick={handlePhoneClick}
                  className="flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors"
                >
                  <Phone className="h-5 w-5 text-primary" />
                  <span>{phoneNumber.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}</span>
                </a>
                {user ? (
                  <div className="flex items-center space-x-4">
                    <Link
                      to="/profile"
                      className="text-gray-600 hover:text-primary transition-colors flex items-center"
                    >
                      <User className="h-5 w-5 mr-1" />
                      <span>{t('profile.title')}</span>
                    </Link>
                    {isAdmin ? (
                      <>
                        <Link 
                          to="/admin" 
                          className="text-gray-600 hover:text-primary transition-colors flex items-center"
                        >
                          <ChefHat className="h-5 w-5 mr-1" />
                          <span>{t('nav.products')}</span>
                        </Link>
                        <Link 
                          to="/admin/orders" 
                          className="text-gray-600 hover:text-primary transition-colors flex items-center"
                        >
                          <Utensils className="h-5 w-5 mr-1" />
                          <span>{t('nav.orders.admin')}</span>
                        </Link>
                        <Link 
                          to="/admin/bookings" 
                          className="text-gray-600 hover:text-primary transition-colors flex items-center"
                        >
                          <Calendar className="h-5 w-5 mr-1" />
                          <span>Rezervări</span>
                        </Link>
                      </>
                    ) : (
                      <Link 
                        to="/orders" 
                        className="text-gray-600 hover:text-primary transition-colors flex items-center"
                      >
                        <ClipboardList className="h-5 w-5 mr-1" />
                        <span>{t('nav.orders')}</span>
                      </Link>
                    )}
                    <button 
                      onClick={handleSignOut}
                      className="text-gray-600 hover:text-primary transition-colors flex items-center"
                    >
                      <LogOut className="h-5 w-5 mr-1" />
                      <span>{t('nav.logout')}</span>
                    </button>
                  </div>
                ) : (
                  <Link to="/login" className="flex items-center text-gray-600 hover:text-primary transition-colors">
                    <User className="h-5 w-5 mr-2" />
                    <span>{t('nav.login')}</span>
                  </Link>
                )}
                <button 
                  onClick={() => setIsCartOpen(true)}
                  className="flex items-center text-gray-600 hover:text-primary transition-colors"
                >
                  <Utensils className="h-6 w-6 cart-icon" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className={`md:hidden absolute w-full bg-white shadow-lg transition-all duration-200 ease-in-out ${
            isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
          }`}>
            <div className="px-4 pt-2 pb-3 space-y-1">
              <div className="p-3">
                <LanguageSwitch />
              </div>
              <Link
                to="/booking"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors p-3"
              >
                <Calendar className="h-5 w-5" />
                <span>{t('nav.booking')}</span>
              </Link>
              <a
                href={`tel:${phoneNumber}`}
                className="flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors p-3"
              >
                <Phone className="h-5 w-5 text-primary" />
                <span>{phoneNumber.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}</span>
              </a>
              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors p-3"
                  >
                    <User className="h-5 w-5" />
                    <span>{t('profile.title')}</span>
                  </Link>
                  {isAdmin ? (
                    <>
                      <Link
                        to="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors p-3"
                      >
                        <ChefHat className="h-5 w-5" />
                        <span>{t('nav.products')}</span>
                      </Link>
                      <Link
                        to="/admin/orders"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors p-3"
                      >
                        <Utensils className="h-5 w-5" />
                        <span>{t('nav.orders.admin')}</span>
                      </Link>
                      <Link
                        to="/admin/bookings"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors p-3"
                      >
                        <Calendar className="h-5 w-5" />
                        <span>Rezervări</span>
                      </Link>
                    </>
                  ) : (
                    <Link
                      to="/orders"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors p-3"
                    >
                      <ClipboardList className="h-5 w-5" />
                      <span>{t('nav.orders')}</span>
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors w-full p-3"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>{t('nav.logout')}</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors p-3"
                >
                  <User className="h-5 w-5" />
                  <span>{t('nav.login')}</span>
                </Link>
              )}
              <button
                onClick={() => {
                  setIsCartOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors w-full p-3"
              >
                <Utensils className="h-5 w-5" />
                <span>{t('cart.title')}</span>
              </button>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Menu />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/reset-password" 
            element={!user ? <ResetPassword /> : <Navigate to="/" />} 
          />
          <Route path="/booking" element={<TableBooking />} />
          <Route path="/checkout" element={user ? <Checkout /> : <Navigate to="/login" />} />
          <Route path="/order-success" element={user ? <OrderSuccess /> : <Navigate to="/login" />} />
          <Route path="/orders" element={user ? <Orders /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
          <Route 
            path="/admin" 
            element={isAdmin ? <AdminPanel /> : <Navigate to="/" />} 
          />
          <Route 
            path="/admin/orders" 
            element={isAdmin ? <AdminOrders /> : <Navigate to="/" />} 
          />
          <Route 
            path="/admin/bookings" 
            element={isAdmin ? <AdminBookings /> : <Navigate to="/" />} 
          />
          <Route path="/todos" element={<TodosPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

        {/* Footer */}
        <footer className="mt-auto bg-primary text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
              <div>
                <h4 className="text-xl mb-4 font-light">{t('footer.contact')}</h4>
                <div className="space-y-2">
                  <a
                    href={`tel:${phoneNumber}`}
                    onClick={handlePhoneClick}
                    className="flex items-center justify-center md:justify-start hover:text-white/80 transition-colors"
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    {phoneNumber.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}
                  </a>
                </div>
              </div>
              <div>
                <h4 className="text-xl mb-4 font-light">{t('footer.schedule')}</h4>
                <p>{t('footer.schedule.days')}</p>
                <p>11:00 - 22:00</p>
              </div>
              <div>
                <h4 className="text-xl mb-4 font-light">{t('footer.address')}</h4>
                <p>Strada Principatele Unite 21</p>
                <p>Craiova 200138</p>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-primary-light/20 text-center">
              <p>&copy; 2024 Nobel Cuisine. {t('footer.rights')}.</p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}