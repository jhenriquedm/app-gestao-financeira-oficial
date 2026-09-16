import React, { useRef, useState } from 'react';
import { Paperclip, Download, Trash2, FileText, Eye, X, AlertCircle, Plus } from 'lucide-react';
import { ReceiptAttachment } from '../types';
import { saveAttachmentFile } from '../utils/fileSaver';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB por arquivo
const DEFAULT_MAX_FILES = 4; // Até 4 comprovantes permitidos

const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png'];
const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/jpeg',
  'image/png',
];

interface ReceiptAttachmentFieldProps {
  attachments?: ReceiptAttachment[];
  attachment?: ReceiptAttachment; // Compatibilidade retroativa
  onChange: (attachments: ReceiptAttachment[]) => void;
  disabled?: boolean;
  maxFiles?: number;
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const ReceiptAttachmentField: React.FC<ReceiptAttachmentFieldProps> = ({
  attachments,
  attachment,
  onChange,
  disabled = false,
  maxFiles = DEFAULT_MAX_FILES,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<ReceiptAttachment | null>(null);
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);

  // Normaliza lista de anexos (suporta tanto attachments[] quanto attachment singular)
  const currentList: ReceiptAttachment[] = attachments && attachments.length > 0
    ? attachments
    : attachment
    ? [attachment]
    : [];

  const clearError = () => setErrorMessage(null);

  const processFiles = (files: FileList | File[]) => {
    clearError();
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const availableSlots = maxFiles - currentList.length;
    if (availableSlots <= 0) {
      setErrorMessage(`Limite máximo de ${maxFiles} comprovantes atingido.`);
      return;
    }

    const filesToProcess = fileArray.slice(0, availableSlots);
    if (fileArray.length > availableSlots) {
      setErrorMessage(`É permitido anexar no máximo ${maxFiles} comprovantes. Apenas os primeiros ${availableSlots} foram adicionados.`);
    }

    const validNewAttachments: ReceiptAttachment[] = [];
    let pendingCount = filesToProcess.length;

    filesToProcess.forEach((file) => {
      // 1. Validar tamanho (máx 5MB)
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setErrorMessage(`O arquivo "${file.name}" (${formatFileSize(file.size)}) excede o limite máximo de 5MB.`);
        pendingCount--;
        if (pendingCount === 0 && validNewAttachments.length > 0) {
          onChange([...currentList, ...validNewAttachments]);
        }
        return;
      }

      // 2. Validar formato (PDF, DOCX, JPG, PNG)
      const lowerName = file.name.toLowerCase();
      const hasValidExt = ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
      const hasValidMime = file.type ? ACCEPTED_MIME_TYPES.includes(file.type) : true;

      if (!hasValidExt && !hasValidMime) {
        setErrorMessage(`Formato de "${file.name}" não suportado. Formatos aceitos: PDF, DOCX, JPG e PNG.`);
        pendingCount--;
        if (pendingCount === 0 && validNewAttachments.length > 0) {
          onChange([...currentList, ...validNewAttachments]);
        }
        return;
      }

      // 3. Ler arquivo como DataURL
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const newAttachment: ReceiptAttachment = {
          id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
          name: file.name,
          size: file.size,
          type: file.type || (lowerName.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'),
          dataUrl,
          uploadedAt: Date.now(),
        };
        validNewAttachments.push(newAttachment);
        pendingCount--;

        if (pendingCount === 0) {
          onChange([...currentList, ...validNewAttachments]);
        }
      };

      reader.onerror = () => {
        setErrorMessage(`Não foi possível carregar o arquivo "${file.name}".`);
        pendingCount--;
        if (pendingCount === 0 && validNewAttachments.length > 0) {
          onChange([...currentList, ...validNewAttachments]);
        }
      };

      reader.readAsDataURL(file);
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
    // Reseta o input para permitir selecionar novos arquivos se desejado
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled || currentList.length >= maxFiles) return;
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDownload = async (att: ReceiptAttachment) => {
    setDownloadingId(att.id);
    try {
      const res = await saveAttachmentFile(att);
      setDownloadFeedback(res.success ? 'Comprovante baixado com sucesso!' : res.message);
      setTimeout(() => setDownloadFeedback(null), 3000);
    } catch {
      setDownloadFeedback('Falha ao baixar comprovante.');
      setTimeout(() => setDownloadFeedback(null), 3000);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRemove = (idToRemove: string) => {
    clearError();
    const updated = currentList.filter((a) => a.id !== idToRemove);
    onChange(updated);
  };

  const checkIsImage = (att: ReceiptAttachment) => {
    return (
      att.type.startsWith('image/') ||
      att.name.toLowerCase().endsWith('.jpg') ||
      att.name.toLowerCase().endsWith('.jpeg') ||
      att.name.toLowerCase().endsWith('.png')
    );
  };

  const checkIsPdf = (att: ReceiptAttachment) => {
    return att.type === 'application/pdf' || att.name.toLowerCase().endsWith('.pdf');
  };

  return (
    <div className="space-y-1.5" id="receipt-attachment-container">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5 text-neutral-500" />
          <span>Comprovantes (Opcional)</span>
          {currentList.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-full">
              {currentList.length}/{maxFiles}
            </span>
          )}
        </label>
        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
          PDF, DOCX, JPG, PNG • Até 4 arquivos
        </span>
      </div>

      {/* Input de arquivo invisível com suporte a seleção múltipla */}
      <input
        ref={fileInputRef}
        type="file"
        id="input-receipt-file"
        multiple
        accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
        onChange={handleInputChange}
        disabled={disabled || currentList.length >= maxFiles}
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
            className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer"
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

      {/* Lista de Comprovantes Anexados com Barra de Rolagem */}
      {currentList.length > 0 && (
        <div
          id="receipt-attachments-scroll-list"
          className="max-h-36 sm:max-h-44 overflow-y-auto space-y-1.5 pr-1 focus:outline-hidden overscroll-contain"
        >
          {currentList.map((item) => {
            const isImage = checkIsImage(item);
            const isPdf = checkIsPdf(item);

            return (
              <div
                key={item.id}
                id={`receipt-attachment-card-${item.id}`}
                className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between gap-2 transition-all shadow-2xs"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {/* Ícone ou miniatura */}
                  {isImage && item.dataUrl ? (
                    <div
                      onClick={() => setPreviewAttachment(item)}
                      className="w-9 h-9 rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-700 shrink-0 cursor-pointer border border-neutral-300 dark:border-neutral-600 relative group"
                      title="Clique para ampliar"
                    >
                      <img
                        src={item.dataUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  ) : isPdf ? (
                    <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex flex-col items-center justify-center shrink-0 text-rose-700 dark:text-rose-300">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="text-[7.5px] font-black tracking-tighter uppercase mt-0.5">PDF</span>
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 flex flex-col items-center justify-center shrink-0 text-blue-700 dark:text-blue-300">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="text-[7.5px] font-black tracking-tighter uppercase mt-0.5">DOC</span>
                    </div>
                  )}

                  {/* Dados do arquivo */}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200 truncate" title={item.name}>
                      {item.name}
                    </p>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                      {formatFileSize(item.size)}
                    </p>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex items-center gap-1 shrink-0">
                  {isImage && (
                    <button
                      type="button"
                      onClick={() => setPreviewAttachment(item)}
                      title="Visualizar Comprovante"
                      className="p-1 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDownload(item)}
                    disabled={downloadingId === item.id}
                    title="Baixar Comprovante"
                    className="p-1 rounded-lg text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    disabled={disabled}
                    title="Remover Comprovante"
                    className="p-1 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ações de Inclusão: Dropzone ou Botão de Adicionar Mais */}
      {currentList.length === 0 ? (
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
              Anexar comprovantes
            </span>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
              (até 4 arquivos)
            </span>
          </div>
        </div>
      ) : currentList.length < maxFiles ? (
        <div className="flex items-center justify-between pt-0.5">
          <button
            type="button"
            id="btn-add-more-receipts"
            onClick={() => {
              if (!disabled && fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
            disabled={disabled}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar outro comprovante ({currentList.length}/{maxFiles})</span>
          </button>
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
            Restam {maxFiles - currentList.length}
          </span>
        </div>
      ) : (
        <div className="text-center py-1">
          <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500">
            Limite máximo de 4 comprovantes atingido para este lançamento.
          </span>
        </div>
      )}

      {/* Modal de Pré-Visualização de Imagem */}
      {previewAttachment && checkIsImage(previewAttachment) && previewAttachment.dataUrl && (
        <div
          id="modal-preview-backdrop"
          onClick={() => setPreviewAttachment(null)}
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl border border-neutral-700 flex flex-col max-h-[85vh]"
          >
            <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                {previewAttachment.name}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownload(previewAttachment)}
                  title="Baixar Comprovante"
                  className="p-1 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewAttachment(null)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-2 overflow-auto flex items-center justify-center bg-neutral-950 flex-1 min-h-[250px]">
              <img
                src={previewAttachment.dataUrl}
                alt={previewAttachment.name}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
