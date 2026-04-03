import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, deleteField, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/utils';
import { User, CheckCircle, Settings as SettingsIcon, DollarSign, AlertTriangle, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Settings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [currency, setCurrency] = useState('IQD');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
          setPinCode(docSnap.data().pinCode || '');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`, { currentUser: user });
      }
    };
    fetchProfile();

    // Check dark mode preference
    if (document.documentElement.classList.contains('dark')) {
      setIsDarkMode(true);
    }
    
    // Get currency preference
    const savedCurrency = localStorage.getItem('currency') || 'IQD';
    setCurrency(savedCurrency);
  }, [user]);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setIsDarkMode(!isDarkMode);
  };

  const saveSettings = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        pinCode: pinCode,
      }, { merge: true });
      
      localStorage.setItem('currency', currency);
      
      setSuccessMessage('تم حفظ الإعدادات بنجاح!');
      setTimeout(() => {
        setSuccessMessage('');
        window.location.reload();
      }, 1500);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`, { currentUser: user });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetData = async () => {
    if (!user) return;
    setIsResetting(true);
    try {
      const deletePromises: Promise<void>[] = [];
      
      // Get all transactions
      const txQuery = query(collection(db, 'transactions'), where('userId', '==', user.uid));
      const txSnapshot = await getDocs(txQuery);
      txSnapshot.docs.forEach(doc => deletePromises.push(deleteDoc(doc.ref)));
      
      // Get all saving boxes
      const boxesQuery = query(collection(db, 'savingBoxes'), where('userId', '==', user.uid));
      const boxesSnapshot = await getDocs(boxesQuery);
      boxesSnapshot.docs.forEach(doc => deletePromises.push(deleteDoc(doc.ref)));

      // Get all achievements
      const achQuery = query(collection(db, 'achievements'), where('userId', '==', user.uid));
      const achSnapshot = await getDocs(achQuery);
      achSnapshot.docs.forEach(doc => deletePromises.push(deleteDoc(doc.ref)));

      // Reset user stats
      const userRef = doc(db, 'users', user.uid);
      const updatePromise = updateDoc(userRef, {
        totalPoints: 0,
        currentStreak: 0,
        lastSavedDate: deleteField()
      });

      await Promise.all([...deletePromises, updatePromise]);
      
      setIsResetModalOpen(false);
      setSuccessMessage('تم تصفير الخزن بنجاح!');
      setTimeout(() => {
        setSuccessMessage('');
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error resetting data", error);
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/data`, { currentUser: user });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-3xl mx-auto"
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">الإعدادات</h1>
        
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-4 py-2 rounded-lg"
            >
              <CheckCircle className="w-5 h-5 ml-2" />
              <span className="text-sm font-medium">{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Profile Section */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <User className="w-5 h-5 ml-2 text-primary-500" />
          الملف الشخصي
        </h2>
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 sm:space-x-reverse p-6 bg-gradient-to-l from-primary-50 to-transparent dark:from-primary-900/10 dark:to-transparent rounded-2xl border border-primary-100 dark:border-primary-900/30">
          <div className="relative">
            <img src={user?.photoURL || 'https://ui-avatars.com/api/?name=' + user?.email} alt="Profile" className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 shadow-lg object-cover" />
            <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-4 border-white dark:border-gray-800 rounded-full"></div>
          </div>
          <div className="text-center sm:text-right pt-2">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{user?.displayName || 'مستخدم'}</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-3" dir="ltr">{user?.email}</p>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium">
              <CheckCircle className="w-4 h-4 ml-1.5" />
              حساب نشط وموثق
            </div>
          </div>
        </div>
      </div>

      {/* App Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
          <SettingsIcon className="w-5 h-5 ml-2 text-primary-500" />
          التفضيلات
        </h2>

        <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
          <div>
            <div className="font-medium text-gray-900 dark:text-white">الوضع الليلي</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">تبديل مظهر التطبيق للوضع الداكن</div>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${isDarkMode ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`}
            dir="ltr"
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className="py-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center mb-2">
            <DollarSign className="w-5 h-5 ml-2 text-gray-400" />
            <div className="font-medium text-gray-900 dark:text-white">العملة</div>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">اختر العملة المفضلة لعرض المبالغ</div>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full max-w-xs px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="IQD">دينار عراقي (IQD)</option>
            <option value="USD">دولار أمريكي (USD)</option>
            <option value="EUR">يورو (EUR)</option>
            <option value="SAR">ريال سعودي (SAR)</option>
            <option value="AED">درهم إماراتي (AED)</option>
            <option value="EGP">جنيه مصري (EGP)</option>
            <option value="JOD">دينار أردني (JOD)</option>
          </select>
        </div>

        <div className="py-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center mb-2">
            <Lock className="w-5 h-5 ml-2 text-gray-400" />
            <div className="font-medium text-gray-900 dark:text-white">قفل التطبيق برمز PIN</div>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">قم بتعيين رمز PIN مكون من 4 أرقام لتأمين تطبيقك</div>
          <input
            type="password"
            maxLength={4}
            value={pinCode}
            onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
            placeholder="****"
            className="w-full max-w-xs px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-center tracking-widest text-lg"
            dir="ltr"
          />
        </div>

        <div className="py-4 border-t border-gray-100 dark:border-gray-700 mt-4">
          <div className="flex items-center mb-2">
            <AlertTriangle className="w-5 h-5 ml-2 text-red-500" />
            <div className="font-medium text-red-600 dark:text-red-400">منطقة الخطر</div>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">تصفير الخزن سيؤدي إلى مسح جميع القاصات والمعاملات الخاصة بك بشكل نهائي.</div>
          <button 
            onClick={() => setIsResetModalOpen(true)} 
            className="px-4 py-2 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
          >
            تصفير الخزن (مسح جميع البيانات)
          </button>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </div>

      {/* Reset Data Modal */}
      <AnimatePresence>
        {isResetModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl text-center"
            >
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">تصفير الخزن</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">هل أنت متأكد من رغبتك في تصفير الخزن؟ سيتم مسح جميع القاصات والمبالغ المدخرة نهائياً ولا يمكن التراجع عن هذا الإجراء.</p>
              
              <div className="flex justify-center space-x-3 space-x-reverse">
                <button
                  onClick={() => setIsResetModalOpen(false)}
                  disabled={isResetting}
                  className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleResetData}
                  disabled={isResetting}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                >
                  {isResetting ? 'جاري التصفير...' : 'نعم، قم بالتصفير'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
