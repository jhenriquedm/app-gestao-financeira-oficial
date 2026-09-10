import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Share2, PlusSquare, Smartphone, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already running as installed PWA, don't show the button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const installed = await install();
      if (installed) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 3000);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // Fallback for browsers that haven't fired beforeinstallprompt yet
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      <button
        id="btn-pwa-install"
        onClick={handleInstallClick}
        title="Instalar aplicativo no celular"
        aria-label="Instalar aplicativo no celular"
        className={
          compact
            ? "p-2 text-emerald-400 hover:text-white hover:bg-neutral-800 rounded-full transition-colors cursor-pointer relative"
            : "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all cursor-pointer shadow-2xs"
        }
      >
        <Download className="w-3.5 h-3.5 text-emerald-500 animate-bounce" />
        {!compact && <span>Instalar App</span>}
      </button>

      {/* Success notification if installed */}
      <AnimatePresence>
        {installSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-lg text-xs font-bold"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Aplicativo instalado com sucesso na tela inicial!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS / General Install Guide Modal */}
      <AnimatePresence>
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-neutral-900 rounded-2xl p-5 max-w-sm w-full border border-neutral-200 dark:border-neutral-800 shadow-2xl relative"
            >
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Instalar no seu celular
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Acesso direto pela tela inicial sem navegador
                  </p>
                </div>
              </div>

              {isIOS ? (
                <div className="space-y-3 text-xs text-neutral-700 dark:text-neutral-300">
                  <div className="flex items-start gap-2.5 p-2.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/70 dark:border-neutral-700/60">
                    <div className="p-1.5 bg-blue-500 text-white rounded-lg shrink-0">
                      <Share2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-white">1. Toque em Compartilhar</p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">No menu inferior ou superior do Safari.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/70 dark:border-neutral-700/60">
                    <div className="p-1.5 bg-emerald-600 text-white rounded-lg shrink-0">
                      <PlusSquare className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-white">2. Adicionar à Tela de Início</p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Role as opções para baixo e selecione esta opção.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/70 dark:border-neutral-700/60">
                    <div className="p-1.5 bg-neutral-800 dark:bg-neutral-700 text-white rounded-lg shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-white">3. Pronto!</p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">O app abrirá em tela cheia como um aplicativo nativo.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs text-neutral-700 dark:text-neutral-300">
                  <p className="text-xs text-neutral-600 dark:text-neutral-300">
                    No seu navegador (Chrome, Edge ou Brave), clique nos <strong>3 pontinhos do menu</strong> e selecione <strong>&quot;Instalar aplicativo&quot;</strong> ou <strong>&quot;Adicionar à tela inicial&quot;</strong>.
                  </p>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                    ✨ O aplicativo funcionará mesmo quando você estiver sem internet (offline).
                  </div>
                </div>
              )}

              <button
                id="btn-close-pwa-guide"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full py-2 px-3 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-900 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Entendi
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
