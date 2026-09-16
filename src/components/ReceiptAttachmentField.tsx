import React, { useRef, useState } from 'react';
import { Paperclip, Download, Trash2, FileText, Eye, X, AlertCircle } from 'lucide-react';
import { ReceiptAttachment } from '../types';
import { saveAttachmentFile } from '../utils/fileSaver';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png'];
const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/jpeg',
  'image/png',
];

interface ReceiptAttachmentFieldProps {
  attachment?: ReceiptAttachment;
  onChange: (attachment: ReceiptAttachment | undefined) => void;
  disabled?: boolean;
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const ReceiptAttachmentField: React.FC<ReceiptAttachmentFieldProps> = ({
  attachment,
  onChange,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);

  const clearError = () => setErrorMessage(null);

  const handleFileSelected = (file: File) => {
    clearError();

    // 1. Validar tamanho (máx 5MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(`O arquivo selecionado (${formatFileSize(file.size)}) excede o limite máximo permitido de 5MB.`);
      return;
    }

    // 2. Validar formato (PDF, DOCX, JPG, PNG)
    const lowerName = file.name.toLowerCase();
    const hasValidExt = ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    const hasValidMime = file.type ? ACCEPTED_MIME_TYPES.includes(file.type) : true;

    if (!hasValidExt && !hasValidMime) {
      setErrorMessage('Formato não suportado. Formatos aceitos: PDF, DOCX, JPG e PNG.');
      return;
    }

    // 3. Ler arquivo como DataURL
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newAttachment: ReceiptAttachment = {
        id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        name: file.name,
        size: file.size,
        type: file.type || (lowerName.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'),
        dataUrl,
        uploadedAt: Date.now(),
      };
      onChange(newAttachment);
    };
    reader.onerror = () => {
      setErrorMessage('Não foi possível carregar o arquivo. Tente novamente.');
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelected(file);
    }
    // Reseta o input para permitir selecionar o mesmo arquivo novamente se desejar
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelected(file);
    }
  };

  const handleDownload = async () => {
    if (!attachment) return;
    setIsDownloading(true);
    try {
      const res = await saveAttachmentFile(attachment);
      setDownloadFeedback(res.success ? 'Comprovante salvo com sucesso!' : res.message);
      setTimeout(() => setDownloadFeedback(null), 3000);
    } catch {
      setDownloadFeedback('Falha ao baixar comprovante.');
      setTimeout(() => setDownloadFeedback(null), 3000);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRemove = () => {
    clearError();
    onChange(undefined);
  };

  const isImage =
    attachment?.type.startsWith('image/') ||
    attachment?.name.toLowerCase().endsWith('.jpg') ||
    attachment?.name.toLowerCase().endsWith('.jpeg') ||
    attachment?.name.toLowerCase().endsWith('.png');

  const isPdf =
    attachment?.type === 'application/pdf' ||
    attachment?.name.toLowerCase().endsWith('.pdf');

  return (
    <div className="space-y-1.5" id="receipt-attachment-container">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5 text-neutral-500" />
          <span>Comprovante (Opcional)</span>
        </label>
        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
          PDF, DOCX, JPG, PNG • Até 5MB
        </span>
      </div>

      {/* Input de arquivo invisível */}
      <input
        ref={fileInputRef}
        type="file"
        id="input-receipt-file"
        accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
        onChange={handleInputChange}
        disabled={disabled}
        className="hidden"
      />

      {/* Mensagem de Erro de Validação */}
      {errorMessage && (
        <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-1.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="flex-1">{errorMessage}</span>
          <button
            type="button"
            onClick={clearError}
            className="text-rose-500 hover:text-rose-700 p-0.5"
            aria-label="Fechar erro"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Feedback de Download */}
      {downloadFeedback && (
        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          {downloadFeedback}
        </div>
      )}

      {/* Card do Anexo quando já existe */}
      {attachment ? (
        <div
          id="receipt-attachment-card"
          className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between gap-2.5 transition-all"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {/* Ícone ou miniatura */}
            {isImage && attachment.dataUrl ? (
              <div
                onClick={() => setPreviewOpen(true)}
                className="w-10 h-10 rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-700 shrink-0 cursor-pointer border border-neutral-300 dark:border-neutral-600 relative group"
                title="Clique para ampliar"
              >
                <img
                  src={attachment.dataUrl}
                  alt={attachment.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
            ) : isPdf ? (
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex flex-col items-center justify-center shrink-0 text-rose-700 dark:text-rose-300">
                <FileText className="w-4 h-4" />
                <span className="text-[8px] font-black tracking-tighter uppercase mt-0.5">PDF</span>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 flex flex-col items-center justify-center shrink-0 text-blue-700 dark:text-blue-300">
                <FileText className="w-4 h-4" />
                <span className="text-[8px] font-black tracking-tighter uppercase mt-0.5">DOC</span>
              </div>
            )}

            {/* Dados do arquivo */}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate" title={attachment.name}>
                {attachment.name}
              </p>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                {formatFileSize(attachment.size)} • Anexado
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-1 shrink-0">
            {isImage && (
              <button
                type="button"
                id="btn-preview-attachment"
                onClick={() => setPreviewOpen(true)}
                title="Visualizar Comprovante"
                className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              id="btn-download-attachment"
              onClick={handleDownload}
              disabled={isDownloading}
              title="Baixar Comprovante"
              className="p-1.5 rounded-lg text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              type="button"
              id="btn-delete-attachment"
              onClick={handleRemove}
              disabled={disabled}
              title="Apagar Comprovante"
              className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Área para anexar comprovante */
        <div
          id="receipt-dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => {
            if (!disabled && fileInputRef.current) {
              fileInputRef.current.click();
            }
          }}
          className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-2xl p-3 text-center cursor-pointer transition-colors bg-neutral-50/50 dark:bg-neutral-800/40 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20"
        >
          <div className="flex items-center justify-center gap-2 text-neutral-600 dark:text-neutral-400">
            <Paperclip className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              Anexar comprovante
            </span>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
              (ou arraste o arquivo aqui)
            </span>
          </div>
        </div>
      )}

      {/* Modal de Pré-Visualização de Imagem */}
      {previewOpen && isImage && attachment?.dataUrl && (
        <div
          id="modal-preview-backdrop"
          onClick={() => setPreviewOpen(false)}
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl border border-neutral-700 flex flex-col max-h-[85vh]"
          >
            <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                {attachment.name}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  title="Baixar Comprovante"
                  className="p-1 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-2 overflow-auto flex items-center justify-center bg-neutral-950 flex-1 min-h-[250px]">
              <img
                src={attachment.dataUrl}
                alt={attachment.name}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
