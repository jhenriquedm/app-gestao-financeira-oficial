import React from 'react';
import { motion } from 'motion/react';

interface SplashScreenProps {
  message?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  message = 'Carregando suas finanças...' 
}) => {
  return (
    <div 
      id="app-splash-screen"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#ddf6f0] via-[#f1f5f9] to-[#d6cbfb] dark:from-[#0b1320] dark:via-[#0f172a] dark:to-[#1e1738] text-slate-900 dark:text-white select-none px-6"
    >
      {/* Background ambient lighting */}
      <div className="absolute w-72 h-72 rounded-full bg-emerald-400/20 dark:bg-emerald-500/10 blur-3xl pointer-events-none -top-10" />
      <div className="absolute w-60 h-60 rounded-full bg-purple-400/20 dark:bg-purple-600/10 blur-3xl pointer-events-none -bottom-10" />

      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex flex-col items-center relative z-10"
      >
        {/* App Icon */}
        <div className="relative mb-5">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[28px] shadow-xl bg-[#1c2838] dark:bg-slate-900 ring-2 ring-emerald-500/30 p-3 flex items-center justify-center">
            <img 
              src="/icon.svg" 
              alt="Logo Gestão Financeira"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Brand Name */}
        <h1 className="text-2xl font-extrabold tracking-tight text-[#1c2838] dark:text-white">
          Gestão financeira
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wide mt-1">
          Gestão Financeira Pessoal
        </p>

        {/* Loading Spinner & Status */}
        <div className="mt-8 flex flex-col items-center gap-2.5">
          <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-600 dark:border-t-emerald-400 rounded-full animate-spin" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {message}
          </span>
        </div>
      </motion.div>
    </div>
  );
};

