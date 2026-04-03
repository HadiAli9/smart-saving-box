import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, handleFirestoreError, OperationType } from '../lib/utils';
import { Plus, Shield, ArrowRight, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function Vault() {
  const { user } = useAuth();
  const [vaults, setVaults] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newVault, setNewVault] = useState({ 
    name: '', 
    description: '', 
    colorTheme: '#6366f1', 
    currency: localStorage.getItem('currency') || 'IQD' 
  });

  useEffect(() => {
    if (!user) return;
    // We filter for boxes with goalAmount == 0 which we treat as "Vaults"
    const q = query(collection(db, 'savingBoxes'), where('userId', '==', user.uid), where('goalAmount', '==', 0));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setVaults(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'savingBoxes', { currentUser: user }));
    return unsubscribe;
  }, [user]);

  const handleCreateVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await addDoc(collection(db, 'savingBoxes'), {
        userId: user.uid,
        name: newVault.name,
        goalAmount: 0, // 0 means unlimited/vault
        currentAmount: 0,
        description: newVault.description,
        colorTheme: newVault.colorTheme,
        currency: newVault.currency,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setIsModalOpen(false);
      setNewVault({ 
        name: '', 
        description: '', 
        colorTheme: '#6366f1', 
        currency: localStorage.getItem('currency') || 'IQD' 
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'savingBoxes', { currentUser: user });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">الخزن المفتوحة</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">تخزين مبالغ بدون حد أقصى</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5 ml-2" />
          خزنة جديدة
        </button>
      </div>

      {vaults.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
          <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">لا توجد خزن مفتوحة بعد</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">ابدأ بإنشاء خزنة لتخزين مبالغك بدون حد أقصى</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            إنشاء أول خزنة
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {vaults.map((vault, index) => (
              <motion.div
                key={vault.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Link to={`/boxes/${vault.id}`} className="block group h-full">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow relative overflow-hidden h-full flex flex-col">
                    <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: vault.colorTheme }}></div>
                    <div className="flex justify-between items-start mb-4 mt-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">{vault.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{vault.description || 'خزنة مفتوحة'}</p>
                      </div>
                      <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg" style={{ color: vault.colorTheme }}>
                        <Wallet className="w-6 h-6" />
                      </div>
                    </div>
                    
                    <div className="mb-4 flex-grow">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">الرصيد الحالي</div>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white" dir="ltr">{formatCurrency(vault.currentAmount, vault.currency)}</div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-50 dark:border-gray-700 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center">
                        <Shield className="w-3 h-3 ml-1 text-green-500" />
                        خزنة مؤمنة
                      </span>
                      <span className="flex items-center group-hover:text-indigo-600 transition-colors">
                        عرض التفاصيل <ArrowRight className="w-3 h-3 mr-1 rotate-180" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
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
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl"
            >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">إنشاء خزنة مفتوحة</h2>
            <form onSubmit={handleCreateVault} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم</label>
                <input
                  required
                  type="text"
                  value={newVault.name}
                  onChange={e => setNewVault({...newVault, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="مثال: خزنة الطوارئ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العملة</label>
                <select
                  value={newVault.currency}
                  onChange={e => setNewVault({...newVault, currency: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوصف (اختياري)</label>
                <input
                  type="text"
                  value={newVault.description}
                  onChange={e => setNewVault({...newVault, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="مثال: خزنة لتخزين المبالغ الزائدة"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">لون الخزنة</label>
                <input
                  type="color"
                  value={newVault.colorTheme}
                  onChange={e => setNewVault({...newVault, colorTheme: e.target.value})}
                  className="w-full h-10 p-1 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                />
              </div>
              <div className="flex justify-end space-x-3 space-x-reverse mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  إنشاء الخزنة
                </button>
              </div>
            </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
