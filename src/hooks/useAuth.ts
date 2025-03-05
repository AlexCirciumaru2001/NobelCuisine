import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { User, AuthError, Session } from '@supabase/supabase-js';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

type AuthResponse = {
  data: {
    user: User | null;
    session?: Session | null;
  };
  error: AuthError | null;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [verificationPhone, setVerificationPhone] = useState<string | null>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  
    useEffect(() => {
      let isMounted = true;
      const authChannel = new BroadcastChannel('auth');
  
      const initializeAuth = async () => {
        try {
          const { data: { session }, error } = await Promise.race([
            supabase.auth.getSession(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Auth timeout')), 5000)
            )
          ]);
  
          if (!isMounted) return;
  
          if (error || !session?.user) {
            await supabase.auth.signOut();
            localStorage.clear();
            sessionStorage.clear();
          }
  
          if (session?.user) {
            const isValid = session.expires_at > Date.now() / 1000;
            setUser(isValid ? session.user : null);
          }
        } catch (err) {
          if (!isMounted) return;
          console.error('Auth init error:', err);
          await supabase.auth.signOut();
        } finally {
          if (isMounted) setLoading(false);
        }
      };
  
    const handleAuthStateChange = async (event: string, session: Session | null) => {
      if (!isMounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      authChannel.postMessage('SESSION_CHANGED');

      if (event === 'SIGNED_IN' && currentUser) {
        // Create/update user profile
        await supabase.from('profiles').upsert({
          id: currentUser.id,
          email: currentUser.email,
          phone: currentUser.phone,
          updated_at: new Date().toISOString()
        });

        // Handle Google avatar
        if (currentUser.app_metadata?.provider === 'google') {
          const avatarUrl = currentUser.user_metadata?.avatar_url;
          if (avatarUrl) {
            await updateProfilePicture(currentUser.id, avatarUrl);
          }
        }
      }
    };

    initializeAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      isMounted = false;
      authChannel.close();
      subscription?.unsubscribe();
    };
  }, []);


  const validatePassword = (password: string) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
      throw new Error('Parola trebuie să conțină minim 8 caractere, cel puțin o literă mare, o literă mică și un număr');
    }
  };

  const signIn = async (email: string, password: string): Promise<User> => {
    try {
      const { data, error }: AuthResponse = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) {
        if (error.code === 'invalid_credentials') {
          throw new Error('Email sau parolă incorectă. Verifică datele și încearcă din nou.');
        }
        throw new Error('A apărut o eroare la autentificare. Te rugăm să încerci din nou.');
      }

      if (!data?.user) {
        throw new Error('Nu s-a putut realiza autentificarea. Te rugăm să încerci din nou.');
      }

      return data.user;
    } catch (error) {
      throw error instanceof Error ? error : new Error('A apărut o eroare neașteptată.');
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      throw error instanceof Error ? error : new Error('Autentificarea cu Google a eșuat.');
    }
  };

  const signInWithPhone = async (phone: string) => {
    try {
      if (!isValidPhoneNumber(phone, 'RO')) {
        throw new Error('Numărul de telefon nu este valid. Te rugăm să folosești formatul: 07XX XXX XXX');
      }

      const parsedPhone = parsePhoneNumber(phone, 'RO');
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: parsedPhone.number
      });

      if (error) throw error;
      setVerificationPhone(parsedPhone.number);
      setVerificationId(data?.user?.id || null);
      return data;
    } catch (error) {
      throw error instanceof Error ? error : new Error('Eroare la trimiterea codului SMS.');
    }
  };

  const verifyPhoneOTP = async (otp: string) => {
    try {
      if (!verificationPhone) throw new Error('Nu există o verificare în curs.');

      const { data, error } = await supabase.auth.verifyOtp({
        phone: verificationPhone,
        token: otp,
        type: 'sms'
      });

      if (error) throw error;
      setVerificationId(null);
      setVerificationPhone(null);
      return data;
    } catch (error) {
      throw error instanceof Error ? error : new Error('Cod invalid.');
    }
  };

  const signUp = async (email: string, password: string): Promise<User> => {
    try {
      validatePassword(password);

      const { data, error }: AuthResponse = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            signup_method: 'email'
          }
        }
      });

      if (error) {
        if (error.code === 'USER_EMAIL_DUPLICATE') {
          throw new Error('Există deja un cont cu acest email.');
        }
        throw new Error('Nu s-a putut crea contul.');
      }

      if (!data?.user) {
        throw new Error('Eroare la crearea contului.');
      }

      return data.user;
    } catch (error) {
      throw error instanceof Error ? error : new Error('Eroare neașteptată.');
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      throw error instanceof Error ? error : new Error('Eroare la deconectare.');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;
    } catch (error) {
      throw error instanceof Error ? error : new Error('Eroare la trimiterea email-ului.');
    }
  };

  const confirmPasswordReset = async (password: string, token: string) => {
    try {
      console.log('Sending request with:', { token, password });
      
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
  
      const responseData = await response.text();
      console.log('Raw response:', responseData);
  
      if (!response.ok) {
        const error = responseData ? JSON.parse(responseData) : {};
        throw new Error(error.message || `HTTP error! Status: ${response.status}`);
      }
  
      return JSON.parse(responseData);
    } catch (err) {
      console.error('Full error:', err);
      throw new Error(err.message || 'Failed to reset password. Please try again.');
    }
  };

  const updateProfilePicture = async (userId: string, avatarUrl: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Eroare actualizare profil:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    verificationId,
    verificationPhone,
    signIn,
    signInWithGoogle,
    signInWithPhone,
    verifyPhoneOTP,
    signUp,
    signOut,
    resetPassword,
    confirmPasswordReset,
  };
}