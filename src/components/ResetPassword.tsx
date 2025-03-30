import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AlertCircle, Check, Lock } from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetParams, setResetParams] = useState<{ token?: string; email?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const parametersSet = useRef(false);
  const { confirmPasswordReset } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (parametersSet.current) return;
    
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    const token = params.get('token') || hashParams.get('token') || 
                  params.get('code') || hashParams.get('code');
    const email = decodeURIComponent(
      params.get('email') || hashParams.get('email') || 
      params.get('email_address') || hashParams.get('email_address') || ''
    );
    
    if (!token || !email) {
      setError('Link invalid sau expirat. Te rugăm să soliciți un link nou.');
    }
    
    setResetParams({ token, email });
    parametersSet.current = true;
    window.history.replaceState({}, document.title, window.location.pathname);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    const { token, email } = resetParams;
    
    try {
      if (!token || !email) {
        throw new Error('Parametrii de resetare lipsă');
      }

      if (password !== confirmPassword) {
        throw new Error('Parolele nu coincid!');
      }

      if (password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        throw new Error('Parola trebuie să conțină minim 8 caractere, o literă mare, o literă mică și un număr');
      }

      await confirmPasswordReset(email, password, token);
      setSuccess('Parola a fost resetată cu succes! Redirecționare...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la resetarea parolei');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-20rem)] flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="text-3xl font-light text-center text-gray-900">
            Resetare parolă
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Introdu noua parolă pentru contul tău
          </p>
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
            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Parolă nouă
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm pr-10"
                  placeholder="Minim 8 caractere"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-primary"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="relative">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmă parola
              </label>
              <div className="relative mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm pr-10"
                  placeholder="Introdu din nou parola"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-primary"
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
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
              ) : (
                <>
                  <Lock className="h-5 w-5 mr-2" />
                  Resetează parola
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-primary hover:text-primary-dark transition-colors text-sm"
            >
              Înapoi la autentificare
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}