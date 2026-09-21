import React from 'react';
import { Trash2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  itemName?: string;
  itemDetails?: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  itemName,
  itemDetails,
  description,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="confirm-delete-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
    >
      <div
        id="confirm-delete-dialog-box"
        className="w-full max-w-sm bg-white dark:bg-[#152238] border border-slate-200/90 dark:border-slate-700/80 rounded-3xl shadow-2xl p-5 space-y-4 relative text-slate-900 dark:text-slate-100"
      >
        <button
          onClick={onCancel}
          className="absolute right-3.5 top-3.5 w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {description || 'Tem certeza que deseja excluir este item? Esta ação é definitiva.'}
            </p>
          </div>
        </div>

        {itemName && (
          <div className="p-3.5 bg-slate-50 dark:bg-[#0e1726] rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs">
            <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
              {itemName}
            </p>
            {itemDetails && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {itemDetails}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center gap-2.5 pt-1">
          <button
            id="btn-cancel-delete"
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            id="btn-confirm-delete"
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:scale-[0.98] rounded-xl shadow-md shadow-rose-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Sim, Excluir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
