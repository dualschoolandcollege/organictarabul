import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification 
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserRole } from '../types';
import { LogIn, Mail, Lock, UserPlus, ArrowRight } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export default function Login() {
  const { user, isAdmin, isVerified, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'signup') setIsLogin(false);
    else setIsLogin(true);
    setError(null);
    setMessage(null);
    setIsUnverified(false);
  }, [searchParams]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isUnverified, setIsUnverified] = useState(false);

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setMessage('ভেরিফিকেশন ইমেইল পুনরায় পাঠানো হয়েছে। আপনার ইনবক্স চেক করুন।');
    } catch (err) {
      setError('ইমেইল পাঠাতে সমস্যা হয়েছে। একটু পর আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        setMessage('ইমেইল ভেরিফাই হয়েছে! এখন আপনি লগইন করতে পারবেন।');
        setError(null);
        setIsUnverified(false);
      } else {
        setError('ইমেইল এখনও ভেরিফাই করা হয়নি। দয়া করে আপনার ইনবক্স চেক করুন।');
      }
    } catch (err) {
      setError('স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      navigate('/admin');
    }
  }, [user, isAdmin, navigate]);

  useEffect(() => {
    if (user && !isVerified && !isAdmin) {
      setError('আপনার ইমেইল ভেরিফাই করা হয়নি। দয়া করে আপনার ইনবক্স চেক করুন।');
      setIsUnverified(true);
    } else {
      setIsUnverified(false);
      if (user && (isVerified || isAdmin)) {
        setError(null);
      }
    }
  }, [user, isVerified, isAdmin]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // AuthContext will handle profile and navigation if needed, 
      // but we can help it here.
      navigate('/'); 
    } catch (err: any) {
      console.error(err);
      setError('গুগল লগইন করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const trimmedEmail = email.trim();
      if (isLogin) {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
        // Login success, AuthContext handles the rest
        navigate('/');
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(result.user);
        
        // Don't sign out immediately, let AuthContext create the profile
        // The user will see a message and can then verify.
        setMessage('আপনার ইমেইলে একটি ভেরিফিকেশন লিঙ্ক পাঠানো হয়েছে। দয়া করে ইমেইল ভেরিফাই করে লগইন করুন।');
        setIsLogin(true);
        // We'll let them stay logged in for the profile creation to happen, 
        // but they will be blocked by verification if they aren't admin.
      }
    } catch (err: any) {
      console.error('Full Auth Error Object:', err);
      const errorCode = err.code || 'unknown-error';
      const errorMessage = err.message || 'Unknown error occurred';
      
      if (errorCode === 'auth/email-already-in-use') setError('এই ইমেইলটি ইতিমধ্যে ব্যবহৃত হচ্ছে।');
      else if (errorCode === 'auth/weak-password') setError('পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।');
      else if (['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'].includes(errorCode)) setError('ইমেইল বা পাসওয়ার্ড সঠিক নয়।');
      else if (errorCode === 'auth/operation-not-allowed') setError(`ইমেইল/পাসওয়ার্ড লগইন ফায়ারবেস কনসোলে এনাবল করা নেই। দয়া করে নিশ্চিত করুন যে আপনি "${auth.app.options.projectId}" প্রোজেক্টে এটি এনাবল করেছেন।`);
      else if (errorCode === 'auth/network-request-failed') setError('নেটওয়ার্ক সমস্যা। আপনার ইন্টারনেট কানেকশন চেক করুন।');
      else setError(`অথেন্টিকেশন ব্যর্থ হয়েছে: ${errorCode} - ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
          {isLogin ? <LogIn className="w-8 h-8" /> : <UserPlus className="w-8 h-8" />}
        </div>
        <h1 className="text-2xl font-bold text-slate-800 font-bengali">
          {isLogin ? 'লগইন করুন' : 'নতুন অ্যাকাউন্ট খুলুন'}
        </h1>
        <p className="text-slate-500 mt-2 font-bengali text-sm">
          অর্গানিক তারাবুলের অর্গানিক পণ্যের জগতে প্রবেশ করুন
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-center text-sm font-bengali">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-600 rounded-lg text-center text-sm font-bengali">
          {message}
        </div>
      )}

      {isUnverified && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-100 rounded-lg text-center">
          <p className="text-yellow-700 text-sm font-bengali mb-2">আপনি কি ইমেইল পাননি?</p>
          <div className="flex flex-col gap-2">
            <button 
              onClick={handleCheckVerification}
              disabled={loading}
              className="w-full bg-yellow-100 text-yellow-800 font-bold py-2 rounded-lg font-bengali text-sm hover:bg-yellow-200 disabled:opacity-50"
            >
              আমি ইমেইল ভেরিফাই করেছি
            </button>
            <button 
              onClick={handleResendVerification}
              disabled={loading}
              className="text-green-600 font-bold hover:underline font-bengali text-sm disabled:opacity-50"
            >
              ভেরিফিকেশন ইমেইল পুনরায় পাঠান
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 font-bengali uppercase">ইমেইল</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 font-sans"
              placeholder="example@mail.com"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 font-bengali uppercase">পাসওয়ার্ড</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 font-sans"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-4 rounded-xl font-bold font-bengali hover:bg-green-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLogin ? 'লগইন' : 'রেজিস্টার করুন'}
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-sans">Or continue with</span></div>
      </div>

      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 border-2 border-slate-100 rounded-xl hover:border-green-200 hover:bg-green-50 transition-all disabled:opacity-50"
      >
        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
        <span className="font-medium text-slate-700 font-bengali">গুগল দিয়ে লগইন</span>
      </button>

      <p className="mt-8 text-center text-sm text-slate-500 font-bengali">
        {isLogin ? 'অ্যাকাউন্ট নেই?' : 'ইতিমধ্যে অ্যাকাউন্ট আছে?'} {' '}
        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="text-green-600 font-bold hover:underline"
        >
          {isLogin ? 'নতুন অ্যাকাউন্ট খুলুন' : 'লগইন করুন'}
        </button>
      </p>
    </div>
  );
}
