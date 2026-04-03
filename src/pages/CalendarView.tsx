import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, handleFirestoreError, OperationType } from '../lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function CalendarView() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!user) return;
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    
    // Fetch transactions for the current month
    const q = query(collection(db, 'transactions'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(txs);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'transactions', { currentUser: user }));

    return unsubscribe;
  }, [user, currentDate]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "MMMM yyyy";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const onDateClick = (day: Date) => setSelectedDate(day);

  const selectedTransactions = selectedDate 
    ? transactions.filter(t => isSameDay(new Date(t.date), selectedDate))
    : [];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">التقويم</h1>

      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center mb-6" dir="ltr">
          <button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {format(currentDate, dateFormat)}
          </h2>
          <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <ChevronRight className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 gap-2 mb-2" dir="ltr">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-semibold text-gray-500 dark:text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2" dir="ltr">
          {days.map((day, i) => {
            const dayTransactions = transactions.filter(t => isSameDay(new Date(t.date), day));
            const totalSaved = dayTransactions.filter(t => t.type === 'add').reduce((acc, t) => acc + t.amount, 0);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, monthStart);

            return (
              <div
                key={day.toString()}
                onClick={() => onDateClick(day)}
                className={`min-h-[80px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between
                  ${!isCurrentMonth ? 'bg-gray-50 dark:bg-gray-900/50 text-gray-400 dark:text-gray-600 border-transparent' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-100 dark:border-gray-700'}
                  ${isSelected ? 'ring-2 ring-primary-500 border-transparent shadow-md' : 'hover:border-primary-300 dark:hover:border-primary-700'}
                `}
              >
                <div className="text-right text-sm font-medium">{format(day, 'd')}</div>
                {totalSaved > 0 && (
                  <div className="text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 rounded px-1 py-0.5 mt-1 truncate text-center">
                    +{new Intl.NumberFormat('ar-IQ').format(totalSaved)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Details */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mt-6 overflow-hidden"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <CalendarIcon className="w-5 h-5 ml-2 text-primary-500" />
              معاملات يوم <span dir="ltr" className="mr-1">{format(selectedDate, 'yyyy/MM/dd')}</span>
            </h3>
            
            {selectedTransactions.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">لا توجد معاملات في هذا اليوم.</p>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {selectedTransactions.map((tx, index) => (
                    <motion.div 
                      key={tx.id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                    >
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {tx.type === 'add' ? 'إضافة للقاصة' : 'سحب من القاصة'}
                        </div>
                        {tx.note && <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{tx.note}</div>}
                      </div>
                      <div className={`font-bold ${tx.type === 'add' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} dir="ltr">
                        {tx.type === 'add' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
