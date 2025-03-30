import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session, AuthResponse } from '@supabase/supabase-js';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import ResetPassword from '../components/ResetPassword';
type AuthUser = User & {
  user_metadata?: {
    avatar_url?: string;
    full_name?: string;
  };
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [verificationPhone, setVerificationPhone] = useState<string | null>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);

  const safeSignOut = useCallback(async () => {
    try {
      // First check if there's a valid session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        console.log('No active session to sign out from');
        return;
      }
  
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
  
    } catch (error) {
      console.error('Sign out error:', error);
      throw error instanceof Error ? error : new Error('Sign out failed');
    } finally {
      // Always clear local state
      setUser(null);
      localStorage.removeItem('sb-auth-token');
      sessionStorage.clear();
    }
  }, []);

  const handleAuthStateChange = useCallback(async (event: string, session: Session | null) => {
    if (event === 'SIGNED_IN' && session?.user) {
      setUser(session.user);
    } else if (event === 'SIGNED_OUT') {
      setUser(null);
      localStorage.removeItem('sb-auth-token');
      sessionStorage.clear();
    }
  }, [safeSignOut]);

  const initializeAuth = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.warn('Session check error:', error.message);
        await safeSignOut();
        return;
      }

      if (!session?.user) {
        setUser(null);
        return;
      }

      if (typeof session.expires_at !== 'number') {
        console.error('Invalid session: Missing expiration timestamp');
        await safeSignOut();
        return;
      }

      const expiresAt = new Date(session.expires_at * 1000);
      if (expiresAt <= new Date()) {
        console.log('Session expired');
        await safeSignOut();
        return;
      }

      setUser(session.user);
    } catch (err) {
      console.error('Auth initialization error:', err);
      await safeSignOut();
    }
  }, [safeSignOut]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (user) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.expires_at && session.expires_at * 1000 < Date.now() + 5 * 60 * 1000) {
          await supabase.auth.refreshSession();
        }
      }
    }, 60 * 1000);

    const authChannel = new BroadcastChannel('auth');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    initializeAuth();

    authChannel.onmessage = (event) => {
      if (event.data === 'SIGNED_IN' || event.data === 'SIGNED_OUT') {
        initializeAuth();
      }
    };

    return () => {
      clearInterval(interval);
      subscription?.unsubscribe();
      authChannel.close();
    };
  }, [handleAuthStateChange, initializeAuth]);

  const signOut = useCallback(async () => {
    try {
      // Check if user exists before attempting sign out
      if (!user) {
        console.log('No user to sign out');
        return;
      }
      await safeSignOut();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }, [user, safeSignOut]);


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
            access_type: 'online',
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

  const signInWithFacebook = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      throw error instanceof Error ? error : new Error('Facebook login failed');
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

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Password reset failed');
    } finally {
    }
  };
  
  const confirmPasswordReset = async (email: string, password: string, token: string) => {
    try {
      // Validate password requirements
      if (password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        throw new Error('Password must contain at least 8 characters with uppercase, lowercase, and number');
      }
  
      // Verify OTP with email and token
      const { error: verifyError } = await supabase.auth.verifyOtp({
        type: 'recovery',
        email,    // Add email parameter
        token,    // Token from URL
      });
  
      if (verifyError) throw verifyError;
  
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
  
      return { success: true, message: 'Password updated successfully' };
    } catch (err) {
      console.error('Password reset error:', err);
      throw new Error(
        err instanceof Error 
          ? err.message.includes('invalid') ? 'Invalid or expired token' : err.message
          : 'Password reset failed'
      );
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
    verificationId,
    verificationPhone,
    signIn,
    resetPassword,
    signInWithGoogle,
    signInWithFacebook,
    signInWithPhone,
    verifyPhoneOTP,
    signUp,
    signOut,
    ResetPassword,
    confirmPasswordReset,
  };
}


