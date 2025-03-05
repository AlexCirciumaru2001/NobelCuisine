import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { Calendar, Clock, Users, AlertCircle, Phone } from 'lucide-react';

interface BookingFormData {
  date: string;
  time: string;
  guests: number;
  notes: string;
  table_number: number | null;
  phone: string;
}

interface AvailableTable {
  table_number: number;
}

export default function TableBooking() {
  const [formData, setFormData] = useState<BookingFormData>({
    date: '',
    time: '',
    guests: 2,
    notes: '',
    table_number: null,
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [availableTables, setAvailableTables] = useState<number[]>([]);
  const { user } = useAuth();
  const { t } = useLanguage();

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];
  
  // Get date 30 days from now for max date
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateString = maxDate.toISOString().split('T')[0];

  // Available time slots
  const timeSlots = [
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
    '19:00', '19:30', '20:00', '20:30', '21:00'
  ];

  useEffect(() => {
    if (formData.date && formData.time) {
      fetchAvailableTables();
    } else {
      setAvailableTables([]);
    }
  }, [formData.date, formData.time]);

  const fetchAvailableTables = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_available_tables', {
          p_booking_date: formData.date,
          p_booking_time: formData.time
        });

      if (error) throw error;

      setAvailableTables(data.map((table: AvailableTable) => table.table_number));
    } catch (error) {
      console.error('Error fetching available tables:', error);
      setError(t('booking.errors.tables'));
    }
  };

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^(\+4|)?(07[0-8]{1}[0-9]{1}|02[0-9]{2}|03[0-9]{2}){1}?(\s|\.|\-)?([0-9]{3}(\s|\.|\-|)){2}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (!validatePhoneNumber(formData.phone)) {
      setError(t('booking.errors.phone'));
      setLoading(false);
      return;
    }

    if (!formData.table_number) {
      setError(t('booking.errors.table'));
      setLoading(false);
      return;
    }

    try {
      // Check table availability again before submitting
      const { data: isAvailable, error: checkError } = await supabase
        .rpc('check_table_availability', {
          p_table_number: formData.table_number,
          p_booking_date: formData.date,
          p_booking_time: formData.time
        });

      if (checkError) throw checkError;

      if (!isAvailable) {
        setError(t('booking.errors.tableNotAvailable'));
        return;
      }

      const { error: bookingError } = await supabase
        .from('table_bookings')
        .insert({
          user_id: user?.id,
          booking_date: formData.date,
          booking_time: formData.time,
          guests: formData.guests,
          notes: formData.notes,
          table_number: formData.table_number,
          phone: formData.phone,
          status: 'pending'
        });

      if (bookingError) throw bookingError;

      setSuccess(true);
      setFormData({
        date: '',
        time: '',
        guests: 2,
        notes: '',
        table_number: null,
        phone: ''
      });
    } catch (err) {
      if (err instanceof Error && err.message.includes('unique_table_booking')) {
        setError(t('booking.errors.tableNotAvailable'));
      } else {
        setError(t('booking.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-20rem)] flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-light mb-4">{t('booking.login.required')}</h2>
          <a href="/login" className="text-primary hover:text-primary-dark">
            {t('nav.login')}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-light mb-8">{t('booking.title')}</h1>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-6 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          {error}
        </div>
      )}

      {success ? (
        <div className="bg-green-50 text-green-700 p-6 rounded-lg text-center">
          <h2 className="text-2xl font-light mb-4">{t('booking.success.title')}</h2>
          <p className="mb-4">{t('booking.success.message')}</p>
          <button
            onClick={() => setSuccess(false)}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            {t('booking.success.button')}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Calendar className="h-5 w-5 text-primary mr-2" />
                  {t('booking.date')}
                </label>
                <input
                  type="date"
                  required
                  min={today}
                  max={maxDateString}
                  value={formData.date}
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      date: e.target.value,
                      table_number: null // Reset table selection when date changes
                    });
                  }}
                  className="w-full p-2 border rounded-lg focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Clock className="h-5 w-5 text-primary mr-2" />
                  {t('booking.time')}
                </label>
                <select
                  required
                  value={formData.time}
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      time: e.target.value,
                      table_number: null // Reset table selection when time changes
                    });
                  }}
                  className="w-full p-2 border rounded-lg focus:ring-primary focus:border-primary"
                >
                  <option value="">{t('booking.time.select')}</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              {/* Number of Guests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Users className="h-5 w-5 text-primary mr-2" />
                  {t('booking.guests')}
                </label>
                <select
                  required
                  value={formData.guests}
                  onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded-lg focus:ring-primary focus:border-primary"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? t('booking.guest.single') : t('booking.guests.multiple')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Phone className="h-5 w-5 text-primary mr-2" />
                  {t('booking.phone')}
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-primary focus:border-primary"
                  placeholder={t('booking.phone.placeholder')}
                />
                <p className="text-xs text-gray-500 mt-1">{t('booking.phone.help')}</p>
              </div>

              {/* Table Selection */}
              {formData.date && formData.time && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('booking.table.number')}
                  </label>
                  <div className="grid grid-cols-5 gap-4">
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((tableNum) => {
                      const isAvailable = availableTables.includes(tableNum);
                      return (
                        <button
                          key={tableNum}
                          type="button"
                          onClick={() => setFormData(prev => ({ 
                            ...prev, 
                            table_number: tableNum 
                          }))}
                          disabled={!isAvailable}
                          className={`aspect-square rounded-lg border-2 flex items-center justify-center text-lg font-medium transition-colors ${
                            formData.table_number === tableNum
                              ? 'border-primary bg-primary/5 text-primary'
                              : isAvailable
                                ? 'border-gray-200 hover:border-primary/50'
                                : 'border-red-200 bg-red-50 text-red-300 cursor-not-allowed'
                          }`}
                        >
                          {tableNum}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {t('booking.table.help')}
                  </p>
                </div>
              )}

              {/* Special Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('booking.notes')}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-primary focus:border-primary"
                  rows={3}
                  placeholder={t('booking.notes.placeholder')}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !formData.table_number}
            className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                {t('booking.processing')}
              </span>
            ) : (
              t('booking.submit')
            )}
          </button>
        </form>
      )}
    </div>
  );
}