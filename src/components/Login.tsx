import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogIn, UserPlus, AlertCircle, Phone, Facebook, Mail, Check, Lock } from 'lucide-react';
import { Provider } from '@supabase/supabase-js';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const { signIn, signUp, signInWithProvider, signInWithPhone, verifyPhoneOTP, verificationId, resetPassword } = useAuth();
  const navigate = useNavigate();

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)} ${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (isForgotPassword) {
        if (!email) throw new Error('Te rugăm să introduci adresa de email');
        if (!isValidEmail(email)) throw new Error('Te rugăm să introduci o adresă de email validă');
        
        await resetPassword(email);
        setSuccess('Instrucțiuni pentru resetarea parolei au fost trimise pe email!');
        setIsForgotPassword(false);
        return;
      }

      if (authMethod === 'phone') {
        if (verificationId) {
          await verifyPhoneOTP(otp);
          navigate('/');
        } else {
          await signInWithPhone(phone);
          setSuccess('Cod de verificare trimis! Te rugăm să introduci codul primit prin SMS.');
        }
      } else {
        // Form validation
        if (!email || (!isForgotPassword && !password)) {
          throw new Error('Te rugăm să completezi toate câmpurile.');
        }

        if (!isValidEmail(email)) {
          throw new Error('Te rugăm să introduci o adresă de email validă.');
        }

        if (!isForgotPassword && password.length < 6) {
          throw new Error('Parola trebuie să conțină cel puțin 6 caractere.');
        }

        if (isSignUp) {
          await signUp(email, password);
          setSuccess('Cont creat cu succes! Te poți autentifica acum.');
          setIsSignUp(false);
          setPassword('');
        } else {
          await signIn(email, password);
          navigate('/');
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'A apărut o eroare neașteptată';
      setError(message);
      
      if (message.includes('există deja un cont')) {
        setIsSignUp(false);
      }
    } finally {
      setIsLoading(false);
    }
  }

  const handleSocialSignIn = async (provider: "google") => {
    try {
      setError('');
      setIsLoading(true);
      await signInWithProvider(provider);
    } catch (error) {
      setError('A apărut o eroare la autentificare. Te rugăm să încerci din nou.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setIsForgotPassword(false);
    setError('');
    setSuccess('');
    setPassword('');
  };

  const toggleForgotPassword = () => {
    setIsForgotPassword(!isForgotPassword);
    setError('');
    setSuccess('');
    setPassword('');
  };

  return (
    <div className="min-h-[calc(100vh-20rem)] flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="text-3xl font-light text-center text-gray-900">
            {isForgotPassword 
              ? 'Resetare parolă'
              : isSignUp 
                ? 'Creează cont nou' 
                : 'Autentificare'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isForgotPassword
              ? 'Introdu adresa de email asociată contului tău'
              : isSignUp 
                ? 'Completează datele pentru a crea un cont nou'
                : 'Introdu datele tale pentru a te autentifica'}
          </p>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setAuthMethod('email')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              authMethod === 'email'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Mail className="h-5 w-5 mr-2" />
            Email
          </button>
          <button
            onClick={() => setAuthMethod('phone')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              authMethod === 'phone'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Phone className="h-5 w-5 mr-2" />
            Telefon
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {(error || success) && (
            <div className={`p-4 rounded-md flex items-start space-x-2 ${
              success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-500'
            }`}>
              {success ? (
                <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              )}
              <span>{success || error}</span>
            </div>
          )}

          <div className="space-y-4">
            {authMethod === 'email' ? (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                    placeholder="nume@exemplu.com"
                  />
                </div>
                {!isForgotPassword && (
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Parolă
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete={isSignUp ? 'new-password' : 'current-password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                      placeholder="Minim 6 caractere"
                    />
                  </div>
                )}
              </>
            ) : (
              <div>
                {verificationId ? (
                  <div>
                    <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                      Cod de verificare
                    </label>
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                      placeholder="Introdu codul primit prin SMS"
                      maxLength={6}
                    />
                  </div>
                ) : (
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Număr de telefon
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={handlePhoneChange}
                      className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                      placeholder="07XX XXX XXX"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <span className="absolute left-1/2 -translate-x-1/2 flex items-center">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Se încarcă...
                </span>
              ) : isForgotPassword ? (
                <>
                  <Lock className="h-5 w-5 mr-2" />
                  Trimite link de resetare
                </>
              ) : authMethod === 'phone' ? (
                verificationId ? (
                  'Verifică codul'
                ) : (
                  'Trimite cod de verificare'
                )
              ) : isSignUp ? (
                <>
                  <UserPlus className="h-5 w-5 mr-2" />
                  Creează cont
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Autentificare
                </>
              )}
            </button>
          </div>

          {authMethod === 'email' && (
            <div className="text-center space-y-2">
              {!isForgotPassword && (
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-primary hover:text-primary-dark transition-colors block w-full"
                >
                  {isSignUp
                    ? 'Ai deja cont? Autentifică-te'
                    : 'Nu ai cont? Creează unul nou'}
                </button>
              )}
              {!isSignUp && !isForgotPassword && (
                <button
                  type="button"
                  onClick={toggleForgotPassword}
                  className="text-primary hover:text-primary-dark transition-colors text-sm"
                >
                  Ai uitat parola?
                </button>
              )}
              {isForgotPassword && (
                <button
                  type="button"
                  onClick={toggleForgotPassword}
                  className="text-primary hover:text-primary-dark transition-colors text-sm"
                >
                  Înapoi la autentificare
                </button>
              )}
            </div>
          )}

          {!verificationId && !isForgotPassword && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    sau continuă cu
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSocialSignIn('google')}
                  className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialSignIn('facebook')}
                  className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-white bg-[#1877F2] hover:bg-[#166fe5]"
                >
                  <Facebook className="h-5 w-5 mr-2" />
                  Facebook
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}