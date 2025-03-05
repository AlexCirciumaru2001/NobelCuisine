import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { Calendar, Clock, Users, CheckCircle, XCircle, AlertCircle, Phone, Trash2, User } from 'lucide-react';

interface Booking {
  id: string;
  user_id: string;
  booking_date: string;
  booking_time: string;
  guests: number;
  table_number: number | null;
  phone: string;
  notes: string;
  status: string;
  created_at: string;
  user_email: string;
  user_full_name: string | null;
  user_avatar_url: string | null;
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();

  useEffect(() => {
    fetchBookings();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('admin_bookings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'table_bookings' },
        () => fetchBookings()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchBookings() {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('extended_bookings')
        .select('*')
        .order('booking_date', { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Nu s-au putut încărca rezervările');
    } finally {
      setLoading(false);
    }
  }

  async function updateBookingStatus(bookingId: string, status: string) {
    try {
      setError(null);
      const { error } = await supabase
        .from('table_bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;
      await fetchBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
      setError('Nu s-a putut actualiza statusul rezervării');
    }
  }

  async function updateTableNumber(bookingId: string, tableNumber: number) {
    try {
      setError(null);
      const { error } = await supabase
        .from('table_bookings')
        .update({ table_number: tableNumber })
        .eq('id', bookingId);

      if (error) throw error;
      await fetchBookings();
    } catch (error) {
      console.error('Error updating table number:', error);
      setError('Nu s-a putut actualiza numărul mesei');
    }
  }

  async function deleteBooking(bookingId: string) {
    if (window.confirm('Ești sigur că vrei să ștergi această rezervare?')) {
      try {
        setError(null);
        const { error } = await supabase
          .from('table_bookings')
          .delete()
          .eq('id', bookingId);

        if (error) throw error;
        await fetchBookings();
      } catch (error) {
        console.error('Error deleting booking:', error);
        setError('Nu s-a putut șterge rezervarea');
      }
    }
  }

  const handlePhoneClick = (e: React.MouseEvent, phone: string) => {
    if (window.innerWidth > 768) {
      e.preventDefault();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-light mb-8">Administrare Rezervări</h1>

      {error && (
        <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-auto p-1 hover:bg-red-100 rounded-full"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Nu există rezervări</p>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-gray-500">
                    Rezervare #{booking.id.slice(0, 8)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(booking.created_at).toLocaleDateString(
                      language === 'ro' ? 'ro-RO' : 'en-US',
                      {
                        hour: '2-digit',
                        minute: '2-digit'
                      }
                    )}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                    className="p-2 rounded-full hover:bg-green-100 text-green-600 transition-colors"
                    title="Confirmă rezervarea"
                  >
                    <CheckCircle className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                    className="p-2 rounded-full hover:bg-red-100 text-red-600 transition-colors"
                    title="Anulează rezervarea"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => deleteBooking(booking.id)}
                    className="p-2 rounded-full hover:bg-red-100 text-red-600 transition-colors"
                    title="Șterge rezervarea"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    booking.status === 'confirmed'
                      ? 'bg-green-100 text-green-800'
                      : booking.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {booking.status === 'confirmed' ? 'Confirmată' : 
                     booking.status === 'pending' ? 'În așteptare' : 'Anulată'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-primary mr-2" />
                  <span className="font-medium">
                    {new Date(booking.booking_date).toLocaleDateString(
                      language === 'ro' ? 'ro-RO' : 'en-US',
                      { dateStyle: 'long' }
                    )}
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-primary mr-2" />
                  <span className="font-medium">{booking.booking_time}</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-primary mr-2" />
                  <span className="font-medium">
                    {booking.guests} {booking.guests === 1 ? 'persoană' : 'persoane'}
                  </span>
                </div>
                <div className="flex items-center">
                  {booking.user_avatar_url ? (
                    <img
                      src={booking.user_avatar_url}
                      alt={booking.user_full_name || booking.user_email}
                      className="h-8 w-8 rounded-full object-cover mr-2"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-2">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    {booking.user_full_name && (
                      <span className="font-medium">{booking.user_full_name}</span>
                    )}
                    <span className="text-sm text-gray-600">{booking.user_email}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-primary mr-2" />
                  <a
                    href={`tel:${booking.phone}`}
                    onClick={(e) => handlePhoneClick(e, booking.phone)}
                    className="font-medium hover:text-primary transition-colors"
                  >
                    {booking.phone}
                  </a>
                </div>
              </div>

              {booking.notes && (
                <p className="text-gray-600 mb-4">
                  Note: {booking.notes}
                </p>
              )}

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <span className="mr-2 text-sm font-medium text-gray-700">Număr Masă:</span>
                  <input
                    type="number"
                    value={booking.table_number || ''}
                    onChange={(e) => updateTableNumber(booking.id, parseInt(e.target.value))}
                    min="1"
                    max="30"
                    className="w-20 p-1 border rounded focus:ring-primary focus:border-primary"
                    placeholder="Opțional"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}