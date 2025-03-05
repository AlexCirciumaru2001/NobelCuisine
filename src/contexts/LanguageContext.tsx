import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const translations = {
  // Search
  'search.placeholder': {
    ro: 'Caută în meniu...',
    en: 'Search menu...'
  },

  // Categories
  'categories.starter': {
    ro: 'Starter',
    en: 'Starters'
  },
  'categories.carne': {
    ro: 'Carne',
    en: 'Meat'
  },
  'categories.din-gradina': {
    ro: 'Din Grădină',
    en: 'From the Garden'
  },
  'categories.supe-creme': {
    ro: 'Supe și Creme',
    en: 'Soups & Creams'
  },
  'categories.copii': {
    ro: 'Pentru Cei Mici',
    en: 'Kids Menu'
  },
  'categories.fainoase': {
    ro: 'Făinoase',
    en: 'Pasta'
  },
  'categories.dulce': {
    ro: 'Dulce',
    en: 'Desserts'
  },

  // Banner
  'banner.title': {
    ro: 'Bucătărie Rafinată',
    en: 'Refined Cuisine'
  },
  'banner.description': {
    ro: 'Descoperă o experiență culinară autentică, unde tradiția se îmbină cu inovația pentru a crea momente memorabile',
    en: 'Discover an authentic culinary experience where tradition meets innovation to create memorable moments'
  },

  // Navigation
  'nav.products': {
    ro: 'Produse',
    en: 'Products'
  },
  'nav.orders': {
    ro: 'Comenzile Mele',
    en: 'My Orders'
  },
  'nav.orders.admin': {
    ro: 'Comenzi',
    en: 'Orders'
  },
  'nav.login': {
    ro: 'Autentificare',
    en: 'Login'
  },
  'nav.logout': {
    ro: 'Ieșire',
    en: 'Logout'
  },
  'nav.booking': {
    ro: 'Rezervă Masă',
    en: 'Book a Table'
  },

  // Cart
  'cart.title': {
    ro: 'Masa Mea',
    en: 'My Table'
  },
  'cart.empty': {
    ro: 'Masa este goală',
    en: 'Table is empty'
  },
  'cart.total': {
    ro: 'Total Notă',
    en: 'Total Bill'
  },
  'cart.checkout': {
    ro: 'Finalizează Comanda',
    en: 'Complete Order'
  },
  'cart.login': {
    ro: 'Autentifică-te pentru a comanda',
    en: 'Login to order'
  },
  'cart.add': {
    ro: 'Adaugă pe Masă',
    en: 'Add to Table'
  },

  // Checkout
  'checkout.title': {
    ro: 'Finalizare Comandă',
    en: 'Complete Order'
  },
  'checkout.orderType.title': {
    ro: 'Tip Comandă',
    en: 'Order Type'
  },
  'checkout.orderType.table': {
    ro: 'La Masă',
    en: 'Table Service'
  },
  'checkout.orderType.delivery': {
    ro: 'Livrare',
    en: 'Delivery'
  },
  'checkout.phone.title': {
    ro: 'Număr de Telefon',
    en: 'Phone Number'
  },
  'checkout.phone.placeholder': {
    ro: 'Introdu numărul de telefon',
    en: 'Enter phone number'
  },
  'checkout.phone.help': {
    ro: 'Format valid: 07XX XXX XXX sau +4 07XX XXX XXX',
    en: 'Valid format: 07XX XXX XXX or +4 07XX XXX XXX'
  },
  'checkout.table.title': {
    ro: 'Selectează Masa',
    en: 'Select Table'
  },
  'checkout.delivery.title': {
    ro: 'Adresă Livrare',
    en: 'Delivery Address'
  },
  'checkout.delivery.street': {
    ro: 'Stradă și Număr',
    en: 'Street and Number'
  },
  'checkout.delivery.city': {
    ro: 'Oraș',
    en: 'City'
  },
  'checkout.delivery.county': {
    ro: 'Județ',
    en: 'County'
  },
  'checkout.notes.kitchen': {
    ro: 'Note pentru bucătar (opțional)',
    en: 'Notes for the kitchen (optional)'
  },
  'checkout.notes.delivery': {
    ro: 'Note pentru livrare (opțional)',
    en: 'Delivery notes (optional)'
  },
  'checkout.notes.kitchenPlaceholder': {
    ro: 'Ex: Fără ceapă, sos separat...',
    en: 'Ex: No onions, sauce on the side...'
  },
  'checkout.notes.deliveryPlaceholder': {
    ro: 'Ex: Bloc A3, Interfon 42...',
    en: 'Ex: Building A3, Intercom 42...'
  },
  'checkout.time.preparation': {
    ro: 'Timp Estimat Preparare',
    en: 'Estimated Preparation Time'
  },
  'checkout.time.delivery': {
    ro: 'Timp Estimat Livrare',
    en: 'Estimated Delivery Time'
  },
  'checkout.time.preparationInfo': {
    ro: 'Timpul estimat de preparare este între 15-30 de minute. Vei primi o notificare când comanda ta este preluată de bucătar.',
    en: 'Estimated preparation time is between 15-30 minutes. You will receive a notification when your order is taken by the chef.'
  },
  'checkout.time.deliveryInfo': {
    ro: 'Timpul estimat de livrare este între 30-45 de minute. Vei primi o notificare când comanda ta este preluată de restaurant.',
    en: 'Estimated delivery time is between 30-45 minutes. You will receive a notification when your order is taken by the restaurant.'
  },
  'checkout.payment.title': {
    ro: 'Metodă de Plată',
    en: 'Payment Method'
  },
  'checkout.payment.cashTable': {
    ro: 'Plată la masă - Cash',
    en: 'Table payment - Cash'
  },
  'checkout.payment.cardTable': {
    ro: 'Plată la masă - Card',
    en: 'Table payment - Card'
  },
  'checkout.payment.cashDelivery': {
    ro: 'Plată la livrare - Cash',
    en: 'Cash on delivery'
  },
  'checkout.payment.cardDelivery': {
    ro: 'Plată la livrare - Card',
    en: 'Card on delivery'
  },
  'checkout.processing': {
    ro: 'Se procesează...',
    en: 'Processing...'
  },
  'checkout.submit': {
    ro: 'Finalizează Comanda',
    en: 'Complete Order'
  },
  'checkout.errors.phone': {
    ro: 'Te rugăm să introduci un număr de telefon valid',
    en: 'Please enter a valid phone number'
  },
  'checkout.errors.emptyCart': {
    ro: 'Coșul este gol',
    en: 'Cart is empty'
  },
  'checkout.errors.generic': {
    ro: 'A apărut o eroare neașteptată. Te rugăm să încerci din nou.',
    en: 'An unexpected error occurred. Please try again.'
  },

  // Profile
  'profile.title': {
    ro: 'Profil',
    en: 'Profile'
  },
  'profile.avatar.title': {
    ro: 'Poză de Profil',
    en: 'Profile Picture'
  },
  'profile.avatar.help': {
    ro: 'Click pe iconița de cameră pentru a schimba poza de profil',
    en: 'Click the camera icon to change your profile picture'
  },
  'profile.info.title': {
    ro: 'Informații Profil',
    en: 'Profile Information'
  },
  'profile.info.name': {
    ro: 'Nume Complet',
    en: 'Full Name'
  },
  'profile.info.namePlaceholder': {
    ro: 'Introdu numele tău complet',
    en: 'Enter your full name'
  },
  'profile.info.email': {
    ro: 'Email',
    en: 'Email'
  },
  'profile.info.save': {
    ro: 'Salvează Modificările',
    en: 'Save Changes'
  },
  'profile.password.title': {
    ro: 'Schimbă Parola',
    en: 'Change Password'
  },
  'profile.password.new': {
    ro: 'Parolă Nouă',
    en: 'New Password'
  },
  'profile.password.placeholder': {
    ro: 'Introdu noua parolă',
    en: 'Enter new password'
  },
  'profile.password.save': {
    ro: 'Actualizează Parola',
    en: 'Update Password'
  },
  'profile.loading': {
    ro: 'Se procesează...',
    en: 'Processing...'
  },
  'profile.success.update': {
    ro: 'Profilul a fost actualizat cu succes',
    en: 'Profile updated successfully'
  },
  'profile.success.password': {
    ro: 'Parola a fost actualizată cu succes',
    en: 'Password updated successfully'
  },
  'profile.success.avatar': {
    ro: 'Poza de profil a fost actualizată cu succes',
    en: 'Profile picture updated successfully'
  },
  'profile.error.update': {
    ro: 'Nu s-a putut actualiza profilul',
    en: 'Could not update profile'
  },
  'profile.error.password': {
    ro: 'Nu s-a putut actualiza parola',
    en: 'Could not update password'
  },
  'profile.error.avatar': {
    ro: 'Nu s-a putut actualiza poza de profil',
    en: 'Could not update profile picture'
  },

  // Footer
  'footer.contact': {
    ro: 'Contact',
    en: 'Contact'
  },
  'footer.schedule': {
    ro: 'Program',
    en: 'Schedule'
  },
  'footer.schedule.days': {
    ro: 'Luni - Duminică',
    en: 'Monday - Sunday'
  },
  'footer.address': {
    ro: 'Adresă',
    en: 'Address'
  },
  'footer.rights': {
    ro: 'Toate drepturile rezervate',
    en: 'All rights reserved'
  },

  // Orders
  'orders.title': {
    ro: 'Comenzile Mele',
    en: 'My Orders'
  },
  'orders.empty': {
    ro: 'Nu ai nicio comandă încă',
    en: 'You have no orders yet'
  },
  'orders.number': {
    ro: 'Comandă',
    en: 'Order'
  },
  'orders.items': {
    ro: 'Produse Comandate',
    en: 'Ordered Items'
  },
  'orders.no_items': {
    ro: 'Nu există produse în această comandă',
    en: 'No items in this order'
  },
  'orders.status.completed': {
    ro: 'Finalizată',
    en: 'Completed'
  },
  'orders.status.processing': {
    ro: 'În procesare',
    en: 'Processing'
  },
  'orders.status.pending': {
    ro: 'În așteptare',
    en: 'Pending'
  },
  'orders.status.cancelled': {
    ro: 'Anulată',
    en: 'Cancelled'
  },
  'orders.delivery.table': {
    ro: 'Masa',
    en: 'Table'
  },
  'orders.delivery.address': {
    ro: 'Adresă Livrare',
    en: 'Delivery Address'
  },
  'orders.delivery.time': {
    ro: 'minute',
    en: 'minutes'
  },
  'orders.notes': {
    ro: 'Note',
    en: 'Notes'
  },
  'orders.preparation': {
    ro: 'Timp preparare',
    en: 'Preparation time'
  },
  'orders.payment.card': {
    ro: 'Plată cu cardul',
    en: 'Card payment'
  },
  'orders.payment.cash': {
    ro: 'Plată cash',
    en: 'Cash payment'
  },

  // Admin Orders
  'admin.orders.title': {
    ro: 'Administrare Comenzi',
    en: 'Order Management'
  },
  'admin.orders.empty': {
    ro: 'Nu există comenzi',
    en: 'No orders'
  },
  'admin.orders.actions.complete': {
    ro: 'Marchează ca finalizată',
    en: 'Mark as completed'
  },
  'admin.orders.actions.cancel': {
    ro: 'Anulează comanda',
    en: 'Cancel order'
  },
  'admin.orders.actions.delete': {
    ro: 'Șterge comanda',
    en: 'Delete order'
  },
  'admin.orders.actions.save': {
    ro: 'Salvează',
    en: 'Save'
  },
  'admin.orders.actions.editTime': {
    ro: 'Editează timpul',
    en: 'Edit time'
  },

  // Errors
  'errors.connection': {
    ro: 'Nu se poate conecta la server',
    en: 'Cannot connect to server'
  },
  'errors.connectionHelp': {
    ro: 'Verificați conexiunea la internet și încercați din nou',
    en: 'Check your internet connection and try again'
  },
  'errors.retry': {
    ro: 'Reîncearcă',
    en: 'Retry'
  },
  'errors.loadingProducts': {
    ro: 'Nu s-au putut încărca produsele',
    en: 'Could not load products'
  },
  'errors.addToCart': {
    ro: 'Nu s-a putut adăuga în coș',
    en: 'Could not add to cart'
  },
  
  // Loading
  'loading': {
    ro: 'Se încarcă...',
    en: 'Loading...'
  },

  // Booking
  'booking.title': {
    ro: 'Rezervare Masă',
    en: 'Table Booking'
  },
  'booking.date': {
    ro: 'Data',
    en: 'Date'
  },
  'booking.time': {
    ro: 'Ora',
    en: 'Time'
  },
  'booking.time.select': {
    ro: 'Selectează ora',
    en: 'Select time'
  },
  'booking.guests': {
    ro: 'Număr de persoane',
    en: 'Number of guests'
  },
  'booking.guest.single': {
    ro: 'persoană',
    en: 'person'
  },
  'booking.guests.multiple': {
    ro: 'persoane',
    en: 'people'
  },
  'booking.phone': {
    ro: 'Telefon',
    en: 'Phone'
  },
  'booking.phone.placeholder': {
    ro: 'Număr de telefon',
    en: 'Phone number'
  },
  'booking.phone.help': {
    ro: 'Vă vom contacta pentru confirmare',
    en: 'We will contact you for confirmation'
  },
  'booking.table.number': {
    ro: 'Număr Masă',
    en: 'Table Number'
  },
  'booking.table.placeholder': {
    ro: 'Opțional',
    en: 'Optional'
  },
  'booking.notes': {
    ro: 'Note speciale',
    en: 'Special notes'
  },
  'booking.notes.placeholder': {
    ro: 'Mențiuni speciale pentru rezervare',
    en: 'Special notes for your booking'
  },
  'booking.submit': {
    ro: 'Rezervă Masa',
    en: 'Book Table'
  },
  'booking.processing': {
    ro: 'Se procesează...',
    en: 'Processing...'
  },
  'booking.success.title': {
    ro: 'Rezervare Confirmată',
    en: 'Booking Confirmed'
  },
  'booking.success.message': {
    ro: 'Vă mulțumim pentru rezervare! Veți primi un apel pentru confirmare.',
    en: 'Thank you for your booking! You will receive a call for confirmation.'
  },
  'booking.success.button': {
    ro: 'Rezervă din nou',
    en: 'Book again'
  },
  'booking.error': {
    ro: 'Nu s-a putut efectua rezervarea. Vă rugăm să încercați din nou.',
    en: 'Could not complete the booking. Please try again.'
  },
  'booking.errors.phone': {
    ro: 'Vă rugăm să introduceți un număr de telefon valid',
    en: 'Please enter a valid phone number'
  },
  'booking.login.required': {
    ro: 'Trebuie să fiți autentificat pentru a face o rezervare',
    en: 'You must be logged in to make a booking'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState('ro');

  const t = (key: string): string => {
    const translation = translations[key as keyof typeof translations];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translation[language as keyof typeof translation] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}