import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Lock } from 'lucide-react';

export default function PinLock({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [pinCode, setPinCode] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [inputPin, setInputPin] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const checkPin = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().pinCode) {
          setPinCode(docSnap.data().pinCode);
          setIsLocked(true);
        }
      } catch (e) {
        console.error("Error fetching PIN", e);
      } finally {
        setLoading(false);
      }
    };

    checkPin();
  }, [user]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPin === pinCode) {
      setIsLocked(false);
      setError(false);
    } else {
      setError(true);
      setInputPin('');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>;
  }

  if (isLocked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-900/30 mb-6">
            <Lock className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">التطبيق مقفل</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">يرجى إدخال رمز PIN للوصول إلى التطبيق</p>
          
          <form onSubmit={handlePinSubmit} className="space-y-6">
            <div>
              <input
                type="password"
                maxLength={4}
                value={inputPin}
                onChange={(e) => {
                  setInputPin(e.target.value.replace(/\D/g, ''));
                  setError(false);
                }}
                className={`w-full max-w-xs mx-auto px-4 py-3 text-2xl tracking-[1em] text-center border rounded-xl focus:ring-2 focus:outline-none dark:bg-gray-700 dark:text-white ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'}`}
                placeholder="****"
                autoFocus
                dir="ltr"
              />
              {error && <p className="text-red-500 text-sm mt-2">رمز PIN غير صحيح. حاول مرة أخرى.</p>}
            </div>
            <button
              type="submit"
              disabled={inputPin.length !== 4}
              className="w-full max-w-xs mx-auto flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
            >
              إلغاء القفل
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
