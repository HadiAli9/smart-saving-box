import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Wallet, ShieldCheck, TrendingUp } from 'lucide-react';

export default function Login() {
  const { user, signInWithGoogle } = useAuth();

  if (user) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen flex w-full bg-white dark:bg-gray-950">
      {/* Right Side - Branding/Image (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary-900">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1616514197671-15d99ce7a6f8?auto=format&fit=crop&q=80" 
            alt="Savings Background" 
            className="object-cover w-full h-full opacity-30"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-950 via-primary-900/80 to-transparent"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 h-full w-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center gap-3 text-white"
          >
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
              <Wallet className="w-7 h-7 text-primary-300" />
            </div>
            <span className="text-2xl font-bold tracking-tight">القاصة الذكية</span>
          </motion.div>

          <div className="space-y-8 max-w-lg">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl md:text-5xl font-extrabold text-white leading-tight"
            >
              طريقك الأذكى نحو <span className="text-primary-300">الاستقلال المالي</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-lg text-primary-100/80 leading-relaxed"
            >
              تتبع مدخراتك، حدد أهدافك المالية، وحقق أحلامك بخطوات بسيطة وآمنة. نحن هنا لمساعدتك في كل خطوة.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-2 gap-6 pt-8 border-t border-white/10"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary-800/50 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-primary-300" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">أمان تام</h3>
                  <p className="text-sm text-primary-200/70">بياناتك محمية بأعلى معايير التشفير</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary-800/50 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5 text-primary-300" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">نمو مستمر</h3>
                  <p className="text-sm text-primary-200/70">راقب نمو مدخراتك يوماً بعد يوم</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Left Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative">
        {/* Mobile Logo */}
        <div className="absolute top-8 left-8 right-8 flex justify-between items-center lg:hidden">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">القاصة الذكية</span>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center lg:text-right">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              مرحباً بعودتك 👋
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              سجل دخولك للمتابعة إلى حسابك
            </p>
          </div>

          <div className="mt-10 space-y-6">
            <button
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 py-4 px-4 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-900 text-lg"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              المتابعة باستخدام حساب جوجل
            </button>
            
            <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-6 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              تسجيل الدخول متاح حالياً عبر حساب جوجل فقط لضمان أعلى مستويات الأمان والسرعة.
            </p>
          </div>
        </motion.div>
        
        {/* Footer */}
        <div className="absolute bottom-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© {new Date().getFullYear()} القاصة الذكية. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </div>
  );
}
