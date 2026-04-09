import React, { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { signInWithGoogle } from '../firebase';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      await signInWithGoogle();
      onLoginSuccess();
    } catch (err) {
      console.error('Google login error:', err);
      setError('Failed to login with Google.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-6">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">PM Scenario Lab</h1>
          <p className="text-neutral-400">Sign in to track your performance and progress.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm text-center">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-white hover:bg-neutral-200 disabled:opacity-50 text-black px-6 py-4 rounded-xl font-bold transition-colors"
        >
          {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Sign in with Google'}
          {!isSubmitting && <ArrowRight size={18} />}
        </button>
      </div>
    </div>
  );
}
