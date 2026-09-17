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
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white select-none px-6"
    >
      {/* Background ambient lighting */}
      <div className="absolute w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none -top-10" />
      <div className="absolute w-60 h-60 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none -bottom-10" />

      <motion.div
        initial={{ opacity: 0, scale: 0.82, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="flex flex-col items-center relative z-10"
      >
        {/* Wallet App Icon */}
        <div className="relative mb-6">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[26px] shadow-[0_20px_45px_-10px_rgba(5,150,105,0.4)] ring-1 ring-emerald-500/30 overflow-hidden bg-slate-900 flex items-center justify-center">
            <img 
              src="/wallet-icon.svg" 
              alt="Ícone Carteira Gestão Financeira"
              className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
          </div>
          {/* Subtle pulse ring around wallet icon */}
          <div className="absolute -inset-1.5 rounded-[30px] border border-emerald-500/20 animate-pulse pointer-events-none" />
        </div>

        {/* App Title and Branding */}
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
          <span>Gestão Financeira</span>
        </h1>
        <p className="text-xs text-emerald-400/90 font-medium tracking-wide mt-1">
          Controle Pessoal Inteligente
        </p>

        {/* Loading Spinner & Status */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
          <span className="text-[11px] text-slate-400 font-medium tracking-tight animate-pulse">
            {message}
          </span>
        </div>
      </motion.div>
    </div>
  );
};
