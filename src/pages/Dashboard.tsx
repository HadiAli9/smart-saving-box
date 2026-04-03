import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, handleFirestoreError, OperationType } from '../lib/utils';
import { TrendingUp, Target, Award, Calendar as CalendarIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, isSameDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { motion } from 'motion/react';

export default function Dashboard() {
  const { user } = useAuth();
  const [boxes, setBoxes] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const boxesQuery = query(collection(db, 'savingBoxes'), where('userId', '==', user.uid));
    const unsubscribeBoxes = onSnapshot(boxesQuery, (snapshot) => {
      setBoxes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.GET, 'savingBoxes', { currentUser: user });
    });

    const txQuery = query(collection(db, 'transactions'), where('userId', '==', user.uid));
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
      unsubscribeBoxes();
      unsubscribeTx();
    };
  }, [user]);

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
        <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
        <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
      </div>
    </div>;
  }

  const totalSavings = boxes.reduce((acc, box) => acc + box.currentAmount, 0);
  const totalGoal = boxes.reduce((acc, box) => acc + box.goalAmount, 0);
  const progress = totalGoal > 0 ? (totalSavings / totalGoal) * 100 : 0;

  const today = new Date();
  const dailySavings = transactions
    .filter(t => t.type === 'add' && isSameDay(new Date(t.date), today))
    .reduce((acc, t) => acc + t.amount, 0);

  const weeklySavings = transactions
    .filter(t => t.type === 'add' && new Date(t.date) >= startOfWeek(today) && new Date(t.date) <= endOfWeek(today))
    .reduce((acc, t) => acc + t.amount, 0);

  const monthlySavings = transactions
    .filter(t => t.type === 'add' && new Date(t.date) >= startOfMonth(today) && new Date(t.date) <= endOfMonth(today))
    .reduce((acc, t) => acc + t.amount, 0);

  // Chart data for last 7 days
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(today, 6 - i);
    const amount = transactions
      .filter(t => t.type === 'add' && isSameDay(new Date(t.date), d))
      .reduce((acc, t) => acc + t.amount, 0);
    return {
      name: format(d, 'EEE'),
      amount
    };
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            مرحباً بك مجدداً، {user?.displayName?.split(' ')[0] || 'يا صديقي'} 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm md:text-base">
            إليك نظرة عامة على مدخراتك وأهدافك المالية اليوم. استمر في التألق!
          </p>
        </div>
        <div className="hidden md:block">
          <div className="relative">
            <img src={user?.photoURL || 'https://ui-avatars.com/api/?name=' + user?.email} alt="Profile" className="w-16 h-16 rounded-full border-4 border-white dark:border-gray-800 shadow-md object-cover" />
            <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Hero Stats */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-3xl p-6 text-white shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-primary-100 font-medium">إجمالي المدخرات</h2>
          <TrendingUp className="w-6 h-6 text-primary-200" />
        </div>
        <div className="text-4xl font-bold mb-2">{formatCurrency(totalSavings)}</div>
        
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2 text-primary-100">
            <span>نسبة الإنجاز</span>
            <span dir="ltr">{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-primary-900/50 rounded-full h-2" dir="ltr">
            <div className="bg-white h-2 rounded-full transition-all duration-500 float-right" style={{ width: `${Math.min(progress, 100)}%` }}></div>
          </div>
          <div className="text-xs text-primary-200 mt-2 text-left">
            الهدف: <span dir="ltr">{formatCurrency(totalGoal)}</span>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'اليوم', amount: dailySavings, icon: CalendarIcon },
          { title: 'هذا الأسبوع', amount: weeklySavings, icon: Target },
          { title: 'هذا الشهر', amount: monthlySavings, icon: Award }
        ].map((stat, index) => (
          <motion.div 
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center text-gray-500 dark:text-gray-400 mb-2">
              <stat.icon className="w-5 h-5 ml-2" />
              <span className="text-sm font-medium">{stat.title}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stat.amount)}</div>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
      >
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">آخر 7 أيام</h3>
        <div className="h-64" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} tickFormatter={(value) => `${value / 1000}k`} orientation="right" />
              <Tooltip 
                cursor={{ fill: '#F3F4F6' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                formatter={(value: number) => [formatCurrency(value), 'تم توفيره']}
              />
              <Bar dataKey="amount" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Individual Box Progress */}
      {boxes.filter(b => b.goalAmount > 0).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">تقدم القاصات</h3>
          <div className="space-y-6">
            {boxes.filter(b => b.goalAmount > 0).map(box => {
              const boxProgress = (box.currentAmount / box.goalAmount) * 100;
              return (
                <div key={box.id}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">{box.name}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400" dir="ltr">
                      {formatCurrency(box.currentAmount, box.currency)} / {formatCurrency(box.goalAmount, box.currency)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5" dir="ltr">
                    <div 
                      className="h-2.5 rounded-full transition-all duration-500 float-right" 
                      style={{ width: `${Math.min(boxProgress, 100)}%`, backgroundColor: box.colorTheme || '#0ea5e9' }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-left" dir="ltr">
                    {boxProgress.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
