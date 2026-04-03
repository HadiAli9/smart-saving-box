import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, handleFirestoreError, OperationType } from '../lib/utils';
import { Plus, Target, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function Boxes() {
  const { user } = useAuth();
  const [boxes, setBoxes] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBox, setNewBox] = useState({ name: '', goalAmount: '', description: '', colorTheme: '#0ea5e9', currency: localStorage.getItem('currency') || 'IQD' });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'savingBoxes'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBoxes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'savingBoxes', { currentUser: user }));
    return unsubscribe;
  }, [user]);

  const handleCreateBox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await addDoc(collection(db, 'savingBoxes'), {
        userId: user.uid,
        name: newBox.name,
        goalAmount: newBox.goalAmount ? Number(newBox.goalAmount) : 0,
        currentAmount: 0,
        description: newBox.description,
        colorTheme: newBox.colorTheme,
        currency: newBox.currency,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setIsModalOpen(false);
      setNewBox({ name: '', goalAmount: '', description: '', colorTheme: '#0ea5e9', currency: localStorage.getItem('currency') || 'IQD' });
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">قاصات التوفير</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5 ml-2" />
          قاصة جديدة
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {boxes.map((box, index) => {
            const progress = box.goalAmount > 0 ? (box.currentAmount / box.goalAmount) * 100 : 0;
            return (
              <motion.div
                key={box.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Link to={`/boxes/${box.id}`} className="block group h-full">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow relative overflow-hidden h-full flex flex-col">
                    <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: box.colorTheme }}></div>
                    <div className="flex justify-between items-start mb-4 mt-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{box.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{box.description}</p>
                      </div>
                      <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg" style={{ color: box.colorTheme }}>
                        <Target className="w-6 h-6" />
                      </div>
                    </div>
                    
                    <div className="mb-4 flex-grow">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1" dir="ltr">{formatCurrency(box.currentAmount, box.currency)}</div>
                      {box.goalAmount > 0 && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">من <span dir="ltr">{formatCurrency(box.goalAmount, box.currency)}</span></div>
                      )}
                    </div>

                    <div className="mt-auto">
                      {box.goalAmount > 0 ? (
                        <>
                          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-2" dir="ltr">
                            <div className="h-2 rounded-full transition-all duration-500 float-right" style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: box.colorTheme }}></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span dir="ltr">{progress.toFixed(1)}%</span>
                            <span className="flex items-center group-hover:text-primary-600 transition-colors">
                              عرض التفاصيل <ArrowRight className="w-3 h-3 mr-1 rotate-180" />
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-end text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center group-hover:text-primary-600 transition-colors">
                            عرض التفاصيل <ArrowRight className="w-3 h-3 mr-1 rotate-180" />
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

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
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">إنشاء قاصة توفير</h2>
            <form onSubmit={handleCreateBox} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم</label>
                <input
                  required
                  type="text"
                  value={newBox.name}
                  onChange={e => setNewBox({...newBox, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="مثال: سيارة جديدة"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المبلغ المستهدف (اختياري)</label>
                <input
                  type="number"
                  min="0"
                  value={newBox.goalAmount}
                  onChange={e => setNewBox({...newBox, goalAmount: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="اتركه فارغاً لقاصة بدون حد"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العملة</label>
                <select
                  value={newBox.currency}
                  onChange={e => setNewBox({...newBox, currency: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
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
                  value={newBox.description}
                  onChange={e => setNewBox({...newBox, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="مثال: التوفير لشراء سيارة جديدة"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">لون القاصة</label>
                <input
                  type="color"
                  value={newBox.colorTheme}
                  onChange={e => setNewBox({...newBox, colorTheme: e.target.value})}
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
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  إنشاء القاصة
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
