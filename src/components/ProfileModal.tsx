import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  User as UserIcon, 
  Mail, 
  CreditCard, 
  Lock, 
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle, 
  ShieldAlert,
  LogOut,
  Save,
  Camera,
  Trash2,
  Upload,
  Crop
} from 'lucide-react';
import { User } from '../types';
import { authOperations } from '../db/localDatabase';
import { sanitizePersonName } from '../utils/textSanitizer';
import { formatCpf, unmaskCpf, validateCpf } from '../utils/cpfValidator';
import { FirestoreSyncService } from '../services/firestoreSyncService';
import { ImageCropperModal } from './ImageCropperModal';
import { validateImageSize, validateImageType } from '../utils/photoValidator';
import { APP_VERSION } from '../version';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  onLogout,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [rawImageForCropping, setRawImageForCropping] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const feedbackTimerRef = React.useRef<any>(null);
  const prevIsOpenRef = useRef(false);

  const setTimedFeedback = (fb: { type: 'success' | 'error'; message: string } | null) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setFeedback(fb);
    if (fb) {
      feedbackTimerRef.current = setTimeout(() => {
        setFeedback(null);
      }, 3000);
    }
  };

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const [syncStatus, setSyncStatus] = useState<{ hasPending: boolean; pendingCount: number; lastError: string | null }>({
    hasPending: false,
    pendingCount: 0,
    lastError: null,
  });

  // Populate data ONLY when modal opens (transition from closed to open)
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current && user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setCpf(user.cpf ? formatCpf(user.cpf) : '');
      setPhotoUrl(user.photoUrl || null);
      setRawImageForCropping(null);
      setIsCropperOpen(false);
      setNewPassword('');
      setConfirmPassword('');
      setFeedback(null);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);

      // Check sync status silently
      FirestoreSyncService.getSyncStatus(user.id).then((st) => {
        setSyncStatus(st);
      }).catch(() => {});
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, user]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10MB limit)
    const sizeCheck = validateImageSize(file.size);
    if (!sizeCheck.valid) {
      setTimedFeedback({
        type: 'error',
        message: sizeCheck.error || 'O tamanho da foto não pode ultrapassar 10MB.',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate image type
    const typeCheck = validateImageType(file.type, file.name);
    if (!typeCheck.valid) {
      setTimedFeedback({
        type: 'error',
        message: typeCheck.error || 'Por favor, selecione um formato de foto válido (PNG, JPG, WEBP, etc.).',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setRawImageForCropping(result);
        setIsCropperOpen(true);
        if (feedback) setTimedFeedback(null);
      }
    };
    reader.onerror = () => {
      setTimedFeedback({
        type: 'error',
        message: 'Falha ao processar a foto selecionada. Tente outro arquivo.',
      });
    };
    reader.readAsDataURL(file);

    // Reset input so re-selecting same file triggers onChange
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    setPhotoUrl(croppedDataUrl);
    setIsCropperOpen(false);
    if (feedback) setTimedFeedback(null);
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(null);
    setRawImageForCropping(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (feedback) setTimedFeedback(null);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(sanitizePersonName(e.target.value));
    if (feedback) setTimedFeedback(null);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value.trim());
    if (feedback) setTimedFeedback(null);
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCpf(e.target.value));
    if (feedback) setTimedFeedback(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setTimedFeedback(null);

    const cleanName = name.trim();
    if (!cleanName || cleanName.length < 2) {
      setTimedFeedback({ type: 'error', message: 'O nome completo deve conter ao menos 2 caracteres.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.toLowerCase())) {
      setTimedFeedback({ type: 'error', message: 'Por favor, informe um endereço de e-mail válido.' });
      return;
    }

    const cleanCpf = unmaskCpf(cpf);
    if (cleanCpf && (cleanCpf.length !== 11 || !validateCpf(cleanCpf))) {
      setTimedFeedback({ type: 'error', message: 'O CPF informado é inválido. Verifique os números digitados.' });
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        setTimedFeedback({ type: 'error', message: 'A nova senha deve possuir no mínimo 6 caracteres.' });
        return;
      }
      if (newPassword !== confirmPassword) {
        setTimedFeedback({ type: 'error', message: 'As senhas informadas não conferem.' });
        return;
      }
    }

    setIsLoading(true);
    try {
      const result = await authOperations.updateProfile(user.id, {
        name: cleanName,
        email: email.toLowerCase(),
        cpf: cleanCpf,
        photoUrl: photoUrl,
        newPassword: newPassword ? newPassword.trim() : undefined,
      });

      if (result.success && result.user) {
        onUpdateUser(result.user);
        if ((result as any).syncedToCloud) {
          setTimedFeedback({ type: 'success', message: 'Alterações salvas e sincronizadas com a nuvem com sucesso!' });
        } else {
          const cloudErrMsg = (result as any).cloudError || 'Limite de cota de gravações do Firebase excedido ou sem conexão.';
          setTimedFeedback({
            type: 'error',
            message: `Dados salvos localmente! A nuvem não pôde ser atualizada no momento: ${cloudErrMsg}`,
          });
        }
        setNewPassword('');
        setConfirmPassword('');
        FirestoreSyncService.getSyncStatus(result.user.id).then((st) => {
          setSyncStatus(st);
        }).catch(() => {});
      } else {
        setTimedFeedback({ type: 'error', message: result.error || 'Erro ao atualizar dados do perfil.' });
      }
    } catch (err: any) {
      setTimedFeedback({ type: 'error', message: err?.message || 'Erro inesperado ao salvar alterações.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  const displayPhotoUrl = (photoUrl && !photoUrl.includes('googleusercontent.com')) ? photoUrl : null;

  const initials = (name || user.name)
    ? (name || user.name)
        .trim()
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n.charAt(0).toUpperCase())
        .join('')
    : 'U';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="profile-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          id="profile-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <motion.div
            key="profile-modal-card"
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            id="profile-modal-card"
            className="bg-white dark:bg-[#152238] rounded-[28px] max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
          >
          {/* Sesame Wavy Slate-Navy Header */}
          <div className="relative bg-[#1c2838] dark:bg-[#0f172a] text-white pt-5 pb-8 px-5 overflow-hidden">
            {/* Background Wavy SVG */}
            <div className="absolute inset-0 pointer-events-none opacity-40">
              <svg className="w-full h-full object-cover" viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                <path d="M-50 60 C100 10, 250 110, 450 40 L450 -50 L-50 -50 Z" fill="#293b52" />
                <path d="M-20 140 C120 80, 280 180, 430 100 L430 -50 L-20 -50 Z" fill="#223348" />
              </svg>
            </div>

            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Meu Perfil</h3>
                <p className="text-xs text-slate-300 font-medium">Gestão Financeira Pessoal</p>
              </div>
              <button
                onClick={onClose}
                className="w-8.5 h-8.5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Form Content with Floating Avatar */}
          <form onSubmit={handleSubmit} className="px-5 pb-5 -mt-6 space-y-4 overflow-y-auto relative z-10">
            
            {/* Floating Avatar & Fast Action Pill (Sesame Profile Header look) */}
            <div className="flex items-end justify-between gap-3">
              <div className="relative group shrink-0">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  title="Clique para escolher uma foto"
                  className="w-18 h-18 rounded-full overflow-hidden bg-slate-700 text-white font-bold text-xl flex items-center justify-center ring-4 ring-white dark:ring-[#152238] shadow-lg cursor-pointer group-hover:ring-emerald-400 transition-all relative"
                >
                  {displayPhotoUrl ? (
                    <img
                      src={displayPhotoUrl}
                      alt={name || 'Foto de perfil'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                    <Camera className="w-5 h-5" />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Alterar foto"
                  aria-label="Alterar foto de perfil"
                  className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-[#152238] cursor-pointer transition-all"
                >
                  <Camera className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center gap-2 pb-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Foto</span>
                </button>

                {photoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      if (rawImageForCropping || photoUrl) {
                        setRawImageForCropping(rawImageForCropping || photoUrl);
                        setIsCropperOpen(true);
                      }
                    }}
                    className="p-1.5 rounded-full text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all cursor-pointer"
                    title="Enquadrar Foto"
                  >
                    <Crop className="w-3.5 h-3.5 text-emerald-500" />
                  </button>
                )}

                {photoUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="p-1.5 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 transition-all cursor-pointer"
                    title="Remover Foto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml,image/avif,image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            {/* Sync Alert (Only shown if real failure occurred) */}
            {syncStatus.hasPending && (
              <div
                id="alert-profile-sync-pending"
                className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200"
              >
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">Pendência de Sincronização</p>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    Existem dados pendentes de sincronização com a nuvem devido a instabilidade recente de conexão. Assim que normalizada, seus dados serão sincronizados automaticamente.
                  </p>
                </div>
              </div>
            )}

            {/* Sesame Employee Info Card */}
            <div className="bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-3.5 space-y-2.5">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Empresa</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{user?.company || 'Finanças Pessoais'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Departamento</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{user?.department || 'Finanças'}</span>
                </div>
              </div>
            </div>

            {/* Nome Completo */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                Nome Completo
              </label>
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                required
                maxLength={60}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-medium"
                placeholder="Seu nome completo"
              />
            </div>

            {/* E-mail */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-medium"
                placeholder="seu.email@exemplo.com"
              />
            </div>

            {/* CPF */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                CPF
              </label>
              <input
                type="text"
                value={cpf}
                onChange={handleCpfChange}
                required
                maxLength={14}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-mono"
                placeholder="000.000.000-00"
              />
            </div>

            {/* Alterar Senha (Opcional) */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Trocar Senha (Opcional)
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Deixe os campos abaixo em branco caso deseje manter a senha atual.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Nova Senha</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={6}
                      maxLength={32}
                      placeholder="Mínimo 6 dígitos"
                      className="w-full px-3 py-2 pr-9 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Confirmar Nova Senha</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={6}
                      maxLength={32}
                      placeholder="Repita a senha"
                      className="w-full px-3 py-2 pr-9 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Feedback message (Bottom - above buttons) */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  key="feedback-bottom"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  id="feedback-profile-bottom"
                  className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-sm ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                      : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  )}
                  <span>{feedback.message}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Buttons */}
            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                id="btn-logout-from-profile"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/30 hover:bg-rose-100 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair da Conta</span>
              </button>

              <button
                type="submit"
                id="btn-save-profile"
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Salvando...' : 'Salvar Alterações'}</span>
              </button>
            </div>

            {/* Version Information */}
            <div className="pt-2 text-center">
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                Gestão Financeira • Versão {APP_VERSION}
              </span>
            </div>
          </form>
        </motion.div>
      </motion.div>
    )}

      {/* Image Cropper & Repositioning Modal */}
      <ImageCropperModal
        key="profile-image-cropper"
        isOpen={isCropperOpen}
        imageSrc={rawImageForCropping}
        onClose={() => setIsCropperOpen(false)}
        onCropComplete={handleCropComplete}
      />
    </AnimatePresence>
  );
};
