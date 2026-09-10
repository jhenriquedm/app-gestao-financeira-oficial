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
        className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-5 space-y-4 relative"
      >
        <button
          onClick={onCancel}
          className="absolute right-3.5 top-3.5 p-1 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white leading-tight">
              {title}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
              {description || 'Tem certeza que deseja excluir este item? Esta ação é definitiva.'}
            </p>
          </div>
        </div>

        {itemName && (
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/80 rounded-xl border border-neutral-200 dark:border-neutral-700/80 text-xs">
            <p className="font-bold text-neutral-800 dark:text-neutral-200 truncate">
              {itemName}
            </p>
            {itemDetails && (
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                {itemDetails}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            id="btn-cancel-delete"
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            id="btn-confirm-delete"
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-98 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Sim, Excluir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
