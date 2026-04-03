import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, runTransaction, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, numberToArabicWords, handleFirestoreError, OperationType } from '../lib/utils';
import { ArrowLeft, Plus, Minus, Trash2, Edit2, Calendar, FileText, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';

export default function BoxDetails() {
  const { boxId } = useParams<{ boxId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [box, setBox] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txType, setTxType] = useState<'add' | 'withdraw'>('add');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  
  const [isDeleteBoxModalOpen, setIsDeleteBoxModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editGoal, setEditGoal] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editCurrency, setEditCurrency] = useState('IQD');
  const [txToDelete, setTxToDelete] = useState<{id: string, amount: number, type: 'add'|'withdraw'} | null>(null);

  useEffect(() => {
    if (!user || !boxId) return;

    const boxRef = doc(db, 'savingBoxes', boxId);
    const unsubscribeBox = onSnapshot(boxRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBox({ id: docSnap.id, ...data });
        setEditName(data.name);
        setEditGoal(data.goalAmount.toString());
        setEditDescription(data.description || '');
        setEditColor(data.colorTheme);
        setEditCurrency(data.currency || 'IQD');
      } else {
        navigate('/boxes');
      }
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.GET, `savingBoxes/${boxId}`, { currentUser: user });
    });

    const txQuery = query(collection(db, 'transactions'), where('boxId', '==', boxId), where('userId', '==', user.uid));
    const unsubscribeTx = onSnapshot(txQuery, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      txs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(txs);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.GET, 'transactions', { currentUser: user });
    });

    return () => {
      unsubscribeBox();
      unsubscribeTx();
    };
  }, [user, boxId, navigate]);

  const playSound = () => {
    if (typeof window !== 'undefined' && window.Audio) {
      const audio = new window.Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
      audio.play().catch(() => {});
    }
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !boxId || !box) return;

    const numAmount = Number(amount);
    if (numAmount <= 0) return;

    try {
      await runTransaction(db, async (transaction) => {
        const boxRef = doc(db, 'savingBoxes', boxId);
        const boxDoc = await transaction.get(boxRef);
        if (!boxDoc.exists()) throw new Error("Box does not exist!");

        const currentAmount = boxDoc.data().currentAmount;
        const newAmount = txType === 'add' ? currentAmount + numAmount : currentAmount - numAmount;

        if (newAmount < 0) throw new Error("Insufficient funds");

        transaction.update(boxRef, {
          currentAmount: newAmount,
          updatedAt: new Date().toISOString()
        });

        const newTxRef = doc(collection(db, 'transactions'));
        transaction.set(newTxRef, {
          userId: user.uid,
          boxId: boxId,
          amount: numAmount,
          type: txType,
          note: note,
          date: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });
      });

      if (txType === 'add') {
        playSound();
        if (box.currentAmount + numAmount >= box.goalAmount && box.currentAmount < box.goalAmount) {
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }
      }

      setIsTxModalOpen(false);
      setAmount('');
      setNote('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `savingBoxes/${boxId}`, { currentUser: user });
    }
  };

  const handleUpdateBox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !boxId) return;

    try {
      const boxRef = doc(db, 'savingBoxes', boxId);
      await updateDoc(boxRef, {
        name: editName,
        goalAmount: Number(editGoal),
        description: editDescription,
        colorTheme: editColor,
        currency: editCurrency,
        updatedAt: new Date().toISOString()
      });
      setIsEditModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `savingBoxes/${boxId}`, { currentUser: user });
    }
  };

  const handleDeleteBox = async () => {
    if (!user || !boxId) return;
    try {
      // Get all transactions for this box
      const txQuery = query(collection(db, 'transactions'), where('boxId', '==', boxId), where('userId', '==', user.uid));
      const txSnapshot = await getDocs(txQuery);
      
      const deletePromises: Promise<void>[] = [];
      
      // Add transactions to delete promises
      txSnapshot.docs.forEach((txDoc) => {
        deletePromises.push(deleteDoc(txDoc.ref));
      });
      
      // Add box to delete promises
      deletePromises.push(deleteDoc(doc(db, 'savingBoxes', boxId)));
      
      // Execute all deletions
      await Promise.all(deletePromises);
      
      navigate('/boxes');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `savingBoxes/${boxId}`, { currentUser: user });
    }
  };

  const handleDeleteTransaction = async () => {
    if (!user || !boxId || !box || !txToDelete) return;
    try {
      await runTransaction(db, async (transaction) => {
        const boxRef = doc(db, 'savingBoxes', boxId);
        const boxDoc = await transaction.get(boxRef);
        if (!boxDoc.exists()) throw new Error("Box does not exist!");

        const currentAmount = boxDoc.data().currentAmount;
        // Reverse the operation
        let newAmount = txToDelete.type === 'add' ? currentAmount - txToDelete.amount : currentAmount + txToDelete.amount;
        
        // Ensure amount doesn't go below zero
        if (newAmount < 0) newAmount = 0;

        transaction.update(boxRef, {
          currentAmount: newAmount,
          updatedAt: new Date().toISOString()
        });

        const txRef = doc(db, 'transactions', txToDelete.id);
        transaction.delete(txRef);
      });
      setTxToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `transactions/${txToDelete.id}`, { currentUser: user });
    }
  };

  if (loading || !box) {
    return <div className="animate-pulse h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>;
  }

  const progress = box.goalAmount > 0 ? (box.currentAmount / box.goalAmount) * 100 : 0;
  
  const isIQD = box.currency === 'IQD' || !box.currency;
  const minAmount = isIQD ? 250 : 1;
  const stepAmount = isIQD ? 250 : 1;
  const quickAddValues = isIQD ? [5000, 10000, 25000] : [10, 50, 100];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/boxes')} className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors">
          <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
          العودة للقاصات
        </button>
        <div className="flex items-center space-x-2 space-x-reverse">
          <button onClick={() => setIsEditModalOpen(true)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Edit2 className="w-5 h-5" />
          </button>
          <button onClick={() => setIsDeleteBoxModalOpen(true)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Box Header */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-3" style={{ backgroundColor: box.colorTheme }}></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{box.name}</h1>
            <p className="text-gray-500 dark:text-gray-400">{box.description || 'لا يوجد وصف'}</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={() => { setTxType('withdraw'); setIsTxModalOpen(true); }}
              className="flex-1 md:flex-none flex items-center justify-center px-6 py-3 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-xl font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            >
              <Minus className="w-5 h-5 ml-2" />
              سحب
            </button>
            <button
              onClick={() => { setTxType('add'); setIsTxModalOpen(true); }}
              className="flex-1 md:flex-none flex items-center justify-center px-6 py-3 text-white rounded-xl font-medium transition-colors shadow-md hover:shadow-lg"
              style={{ backgroundColor: box.colorTheme }}
            >
              <Plus className="w-5 h-5 ml-2" />
              إضافة مبلغ
            </button>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex justify-between items-end mb-2">
            <div>
              <div className="text-4xl font-bold text-gray-900 dark:text-white" dir="ltr">{formatCurrency(box.currentAmount, box.currency)}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">تم توفيره حتى الآن</div>
            </div>
            {box.goalAmount > 0 && (
              <div className="text-left">
                <div className="text-xl font-semibold text-gray-700 dark:text-gray-300" dir="ltr">{formatCurrency(box.goalAmount, box.currency)}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">الهدف</div>
              </div>
            )}
          </div>
          {box.goalAmount > 0 && (
            <>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4 mt-4" dir="ltr">
                <div className="h-4 rounded-full transition-all duration-1000 ease-out relative float-right" style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: box.colorTheme }}>
                  {progress >= 100 && <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>}
                </div>
              </div>
              <div className="flex justify-between mt-2 text-sm font-medium" style={{ color: box.colorTheme }}>
                <span dir="ltr">{progress.toFixed(1)}% مكتمل</span>
                <span>المتبقي <span dir="ltr">{formatCurrency(Math.max(0, box.goalAmount - box.currentAmount), box.currency)}</span></span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">سجل المعاملات</h2>
        
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>لا توجد معاملات بعد. ابدأ التوفير!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {transactions.map((tx, index) => (
                <motion.div 
                  key={tx.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                >
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className={`p-3 rounded-full ${tx.type === 'add' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {tx.type === 'add' ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {tx.type === 'add' ? 'إضافة' : 'سحب'}
                      </div>
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <Calendar className="w-3 h-3 ml-1" />
                        <span dir="ltr">{format(new Date(tx.date), 'yyyy/MM/dd - h:mm a')}</span>
                      </div>
                      {tx.note && <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">{tx.note}</div>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className={`font-bold ${tx.type === 'add' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} dir="ltr">
                      {tx.type === 'add' ? '+' : '-'}{formatCurrency(tx.amount, box.currency)}
                    </div>
                    <button 
                      onClick={() => setTxToDelete({ id: tx.id, amount: tx.amount, type: tx.type })}
                      className="p-2 text-gray-400 hover:text-red-500 md:opacity-0 md:group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      <AnimatePresence>
        {isTxModalOpen && (
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
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {txType === 'add' ? 'إضافة مبلغ' : 'سحب مبلغ'}
              </h2>
            
            {/* Quick Add Buttons */}
            {txType === 'add' && (
              <div className="grid grid-cols-3 gap-3 mb-6" dir="ltr">
                {quickAddValues.map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val.toString())}
                    className="py-2 px-1 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 rounded-lg font-medium hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors text-sm"
                  >
                    +{new Intl.NumberFormat('ar-IQ').format(val)}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المبلغ ({box.currency})</label>
                <input
                  required
                  type="number"
                  min={minAmount}
                  step={stepAmount}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full px-4 py-3 text-lg font-bold border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                  dir="ltr"
                />
                {amount && Number(amount) > 0 && (
                  <p className="mt-2 text-sm text-primary-600 dark:text-primary-400 font-medium">
                    {numberToArabicWords(Number(amount), box.currency)}
                  </p>
                )}
                {txType === 'withdraw' && amount && Number(amount) > box.currentAmount && (
                  <p className="mt-2 text-sm text-red-500 font-medium flex items-center">
                    <AlertTriangle className="w-4 h-4 ml-1" />
                    المبلغ المطلوب سحبه يتجاوز الرصيد الحالي للقاصة.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ملاحظة (اختياري)</label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="مثال: توفير أسبوعي"
                />
              </div>
              
              <div className="flex justify-end space-x-3 space-x-reverse mt-6">
                <button
                  type="button"
                  onClick={() => { setIsTxModalOpen(false); setAmount(''); setNote(''); }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!amount || Number(amount) < minAmount || (txType === 'withdraw' && Number(amount) > box.currentAmount)}
                  className="px-6 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: txType === 'add' ? box.colorTheme : '#ef4444' }}
                >
                  تأكيد
                </button>
              </div>
            </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Box Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
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
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">تعديل القاصة</h2>
              <form onSubmit={handleUpdateBox} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم القاصة</label>
                  <input
                    required
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المبلغ المستهدف</label>
                  <input
                    required
                    type="number"
                    value={editGoal}
                    onChange={e => setEditGoal(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العملة</label>
                  <select
                    value={editCurrency}
                    onChange={e => setEditCurrency(e.target.value)}
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
                  <textarea
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">لون القاصة</label>
                  <div className="flex gap-3 mt-2">
                    {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setEditColor(color)}
                        className={`w-8 h-8 rounded-full transition-transform ${editColor === color ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : ''}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 space-x-reverse mt-6">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    حفظ التغييرات
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Box Modal */}
      <AnimatePresence>
        {isDeleteBoxModalOpen && (
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
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">حذف القاصة</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">هل أنت متأكد من حذف هذه القاصة؟ سيتم حذف جميع المعاملات المرتبطة بها نهائياً ولن تظهر في التقويم.</p>
              
              <div className="flex justify-center space-x-3 space-x-reverse">
                <button
                  onClick={() => setIsDeleteBoxModalOpen(false)}
                  className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDeleteBox}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  حذف القاصة
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Transaction Modal */}
      <AnimatePresence>
        {txToDelete && (
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
                <Trash2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">حذف المعاملة</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">هل أنت متأكد من حذف هذه المعاملة؟ سيتم تحديث رصيد القاصة تلقائياً.</p>
              
              <div className="flex justify-center space-x-3 space-x-reverse">
                <button
                  onClick={() => setTxToDelete(null)}
                  className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDeleteTransaction}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  حذف المعاملة
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
