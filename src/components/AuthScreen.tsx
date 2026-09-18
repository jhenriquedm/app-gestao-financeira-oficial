import React, { useState, useMemo } from 'react';
import { 
  Lock, 
  Mail, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Check,
  X,
  CreditCard,
  KeyRound
} from 'lucide-react';
import { User } from '../types';
import { authOperations } from '../db/localDatabase';
import { sanitizePersonName } from '../utils/textSanitizer';
import { formatCpf, unmaskCpf, validateCpf } from '../utils/cpfValidator';
import { APP_VERSION } from '../version';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
  isDarkMode?: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Touched state for realtime validation display
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedCpf, setTouchedCpf] = useState(false);
  const [touchedConfirmPassword, setTouchedConfirmPassword] = useState(false);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Statuses
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-dismiss error alert after 5 seconds
  React.useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Auto-dismiss success alert after 5 seconds
  React.useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Password Recovery via E-mail or CPF Modal States
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<1 | 2>(1);
  const [recoveryCpf, setRecoveryCpf] = useState('');
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [recoveryUserName, setRecoveryUserName] = useState('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState('');
  const [showRecoveryNewPassword, setShowRecoveryNewPassword] = useState(false);
  const [showRecoveryConfirmPassword, setShowRecoveryConfirmPassword] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  // Real-time validations
  const emailRegex = useMemo(() => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, []);
  
  const isEmailValid = useMemo(() => {
    if (!email.trim()) return false;
    return emailRegex.test(email.trim().toLowerCase());
  }, [email, emailRegex]);

  const isCpfValid = useMemo(() => {
    const unmasked = unmaskCpf(cpf);
    return unmasked.length === 11 && validateCpf(unmasked);
  }, [cpf]);

  const isRecoveryInputValid = useMemo(() => {
    const val = (recoveryIdentifier || recoveryCpf).trim();
    if (!val) return false;
    if (val.includes('@')) {
      return emailRegex.test(val.toLowerCase());
    }
    const unmasked = unmaskCpf(val);
    return unmasked.length === 11 && validateCpf(unmasked);
  }, [recoveryIdentifier, recoveryCpf, emailRegex]);

  const isPasswordValidLength = useMemo(() => {
    return password.length >= 6 && password.length <= 32;
  }, [password]);

  const doPasswordsMatch = useMemo(() => {
    if (!confirmPassword) return false;
    return password === confirmPassword && password.length >= 6;
  }, [password, confirmPassword]);

  const passwordsMismatch = useMemo(() => {
    if (!confirmPassword) return false;
    return password !== confirmPassword;
  }, [password, confirmPassword]);

  const doRecoveryPasswordsMatch = useMemo(() => {
    if (!recoveryConfirmPassword) return false;
    return recoveryNewPassword === recoveryConfirmPassword && recoveryNewPassword.length >= 6;
  }, [recoveryNewPassword, recoveryConfirmPassword]);

  // Special characters filter and sentence-case for 'Nome completo'
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanValue = sanitizePersonName(e.target.value);
    setName(cleanValue);
    if (errorMessage) setErrorMessage(null);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setTouchedEmail(true);
    if (errorMessage) setErrorMessage(null);
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCpf(e.target.value);
    setCpf(formatted);
    setTouchedCpf(true);
    if (errorMessage) setErrorMessage(null);
  };

  const handleRecoveryIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (!raw.includes('@') && /^[0-9.\-\s]+$/.test(raw)) {
      const formatted = formatCpf(raw);
      setRecoveryIdentifier(formatted);
      setRecoveryCpf(formatted);
    } else {
      setRecoveryIdentifier(raw);
      setRecoveryCpf(raw);
    }
    if (recoveryError) setRecoveryError(null);
  };

  const handleRecoveryCpfChange = handleRecoveryIdentifierChange;

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errorMessage) setErrorMessage(null);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    setTouchedConfirmPassword(true);
    if (errorMessage) setErrorMessage(null);
  };

  // Password recovery handlers
  const handleVerifyCpfForRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);

    const inputVal = (recoveryIdentifier || recoveryCpf).trim();
    if (!inputVal) {
      setRecoveryError('Informe o e-mail ou CPF cadastrado para continuar.');
      return;
    }

    if (inputVal.includes('@')) {
      if (!emailRegex.test(inputVal.toLowerCase())) {
        setRecoveryError('Informe um endereço de e-mail válido (ex: usuario@email.com).');
        return;
      }
    } else {
      const cleanCpf = unmaskCpf(inputVal);
      if (!cleanCpf || cleanCpf.length !== 11) {
        setRecoveryError('Digite os 11 dígitos do CPF ou informe seu e-mail.');
        return;
      }
      if (!validateCpf(cleanCpf)) {
        setRecoveryError('O CPF informado possui dígitos verificadores inválidos.');
        return;
      }
    }

    setRecoveryLoading(true);
    try {
      const result = await authOperations.verifyUserForRecovery(inputVal);
      if (result.exists) {
        setRecoveryUserName(result.userName || 'Usuário');
        setRecoveryStep(2);
      } else {
        setRecoveryError(result.error || 'Nenhum usuário cadastrado com este e-mail ou CPF foi localizado.');
      }
    } catch (err: any) {
      setRecoveryError(err?.message || 'Erro ao consultar banco de dados.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);

    if (recoveryNewPassword.length < 6) {
      setRecoveryError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (recoveryNewPassword.length > 32) {
      setRecoveryError('A nova senha não pode exceder 32 caracteres.');
      return;
    }

    if (recoveryNewPassword !== recoveryConfirmPassword) {
      setRecoveryError('As novas senhas digitadas não coincidem.');
      return;
    }

    setRecoveryLoading(true);
    try {
      const inputVal = (recoveryIdentifier || recoveryCpf).trim();
      const result = await authOperations.resetPasswordForUser(inputVal, recoveryNewPassword);
      if (result.success) {
        setIsRecoveryModalOpen(false);
        setMode('login');
        setErrorMessage(null);
        setSuccessMessage('Senha alterada com sucesso! Faça login com a sua nova senha.');
        setRecoveryIdentifier('');
        setRecoveryCpf('');
        setRecoveryNewPassword('');
        setRecoveryConfirmPassword('');
        setRecoveryStep(1);
      } else {
        setRecoveryError(result.error || 'Não foi possível redefinir a senha.');
      }
    } catch (err: any) {
      setRecoveryError(err?.message || 'Erro ao atualizar senha.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsGoogleLoading(true);

    try {
      const result = await authOperations.loginWithGoogle();
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.error || 'Falha ao autenticar com a Conta Google.');
      }
    } catch (err: any) {
      console.error('Google auth error:', err);
      setErrorMessage(err?.message || 'Falha ao conectar com o Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Client-side validations
    if (mode === 'register') {
      const cleanName = name.trim();
      if (!cleanName || cleanName.length < 2) {
        setErrorMessage('O nome completo deve ter no mínimo 2 caracteres.');
        return;
      }
      if (cleanName.length > 50) {
        setErrorMessage('O nome não pode ultrapassar 50 caracteres.');
        return;
      }
      if (/[^a-zA-ZÀ-ÿ\s]/.test(cleanName)) {
        setErrorMessage('O nome não pode conter números ou caracteres especiais.');
        return;
      }

      // CPF Validation
      const cleanCpf = unmaskCpf(cpf);
      if (!cleanCpf) {
        setErrorMessage('O campo CPF é obrigatório no cadastro.');
        return;
      }
      if (cleanCpf.length !== 11) {
        setErrorMessage('O CPF deve conter exatamente 11 dígitos.');
        return;
      }
      if (!validateCpf(cleanCpf)) {
        setErrorMessage('O CPF informado é inválido. Digite um CPF válido.');
        return;
      }
    }

    if (!cleanEmail) {
      setErrorMessage('Por favor, informe seu endereço de e-mail.');
      return;
    }

    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Formato de e-mail inválido. Ex: seu.nome@exemplo.com');
      return;
    }

    if (cleanEmail.length > 80) {
      setErrorMessage('O e-mail deve ter no máximo 80 caracteres.');
      return;
    }

    if (!cleanPassword) {
      setErrorMessage('Por favor, digite sua senha.');
      return;
    }

    if (cleanPassword.length < 6) {
      setErrorMessage('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    if (cleanPassword.length > 32) {
      setErrorMessage('A senha deve ter no máximo 32 caracteres.');
      return;
    }

    if (mode === 'register') {
      if (cleanPassword !== confirmPassword.trim()) {
        setErrorMessage('As senhas digitadas não coincidem. Verifique a confirmação.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === 'register') {
        const cleanCpf = unmaskCpf(cpf);
        const result = await authOperations.register(name, cleanEmail, cleanPassword, cleanCpf);
        if (result.success && result.user) {
          setSuccessMessage('Cadastro realizado com sucesso! Redirecionando para seu painel...');
          setTimeout(() => {
            onLoginSuccess(result.user!);
          }, 400);
        } else {
          const errText = result.error || 'Não foi possível realizar o cadastro.';
          setErrorMessage(errText);
          if (errText.toLowerCase().includes('cadastrado')) {
            setTimeout(() => {
              setMode('login');
            }, 2000);
          }
        }
      } else {
        const result = await authOperations.login(cleanEmail, cleanPassword);
        if (result.success && result.user) {
          setSuccessMessage('Login efetuado com sucesso!');
          setTimeout(() => {
            onLoginSuccess(result.user!);
          }, 400);
        } else {
          setErrorMessage(result.error || 'Credenciais inválidas, tente novamente!');
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
    setTouchedEmail(false);
    setTouchedCpf(false);
    setTouchedConfirmPassword(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-3 sm:px-4 py-6 sm:py-10 select-none overflow-y-auto">
      {/* Background soft glow effects */}
      <div className="fixed top-12 left-1/2 -translate-x-1/2 w-64 sm:w-80 h-64 sm:h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-[420px] my-auto">
        {/* App Logo & Header */}
        <div className="text-center mb-5 sm:mb-7">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shadow-xl shadow-emerald-500/20 mb-3.5 ring-2 ring-emerald-500/30 overflow-hidden bg-slate-900">
            <img 
              src="/wallet-icon.svg" 
              alt="Ícone Carteira Gestão Financeira" 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Gestão Financeira
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Controle financeiro pessoal, metas e gastos 100% offline
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl w-full">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-950/70 rounded-2xl mb-5 border border-slate-800">
            <button
              type="button"
              id="btn-tab-login"
              onClick={() => switchMode('login')}
              className={`py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Entrar na Conta
            </button>
            <button
              type="button"
              id="btn-tab-register"
              onClick={() => switchMode('register')}
              className={`py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Criar Nova Conta
            </button>
          </div>

          {/* Feedback Alerts (Bounded & responsive within screen) */}
          {errorMessage && (
            <div 
              id="auth-error-alert" 
              className="mb-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-start gap-2.5 text-rose-300 text-xs w-full max-w-full break-words animate-in fade-in slide-in-from-top-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div 
              id="auth-success-alert"
              className="mb-4 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-start gap-2.5 text-emerald-300 text-xs w-full max-w-full break-words animate-in fade-in slide-in-from-top-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <span className="leading-snug">{successMessage}</span>
            </div>
          )}

          {/* Google Authentication Button & Divider */}
          <div className="mb-4">
            <button
              type="button"
              id={mode === 'login' ? 'btn-google-login' : 'btn-google-register'}
              onClick={handleGoogleAuth}
              disabled={isLoading || isGoogleLoading}
              className="w-full py-3 px-4 bg-white hover:bg-slate-100 active:scale-[0.98] text-slate-800 font-semibold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-3 transition-all cursor-pointer border border-slate-200 disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>
                    {mode === 'login' ? 'Continuar com o Google' : 'Cadastrar com o Google'}
                  </span>
                </>
              )}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[11px]">
                <span className="bg-slate-900 px-3 text-slate-400 font-medium">
                  {mode === 'login' ? 'ou entre com e-mail e senha' : 'ou preencha os dados abaixo'}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 w-full">
            {/* Nome Completo (Register only) */}
            {mode === 'register' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Nome Completo
                  </label>
                  <span className="text-[10px] text-slate-500">
                    Apenas letras (sem símbolos)
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="input-auth-name"
                    required
                    maxLength={50}
                    value={name}
                    onChange={handleNameChange}
                    placeholder="Ex: João Henrique"
                    className="w-full pl-10 pr-3.5 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            {/* CPF (Register only - Mandatory with Mask & Validation) */}
            {mode === 'register' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    CPF <span className="text-rose-400">*</span>
                  </label>
                  {/* Real-time CPF Validation Indicator */}
                  {touchedCpf && cpf.length > 0 && (
                    <span className={`text-[11px] font-medium flex items-center gap-1 ${
                      isCpfValid ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {isCpfValid ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>CPF válido</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          <span>{unmaskCpf(cpf).length < 11 ? 'Incompleto' : 'CPF inválido'}</span>
                        </>
                      )}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="input-auth-cpf"
                    required
                    maxLength={14}
                    inputMode="numeric"
                    value={cpf}
                    onChange={handleCpfChange}
                    onBlur={() => setTouchedCpf(true)}
                    placeholder="000.000.000-00"
                    className={`w-full pl-10 pr-9 py-3 bg-slate-950/70 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                      touchedCpf && cpf.length > 0
                        ? isCpfValid
                          ? 'border-emerald-500/50 focus:ring-emerald-500'
                          : 'border-amber-500/50 focus:ring-amber-500'
                        : 'border-slate-800 focus:ring-emerald-500'
                    }`}
                  />
                  {touchedCpf && cpf.length > 0 && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      {isCpfValid ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                  )}
                </div>
                {touchedCpf && cpf.length > 0 && !isCpfValid && (
                  <p className="mt-1 text-[11px] text-amber-400/90 leading-tight">
                    Digite um CPF válido com 11 dígitos para recuperação e segurança da conta.
                  </p>
                )}
              </div>
            )}

            {/* E-mail */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  E-mail
                </label>
                {/* Real-time Email Validation Status Indicator */}
                {touchedEmail && email.length > 0 && (
                  <span className={`text-[11px] font-medium flex items-center gap-1 ${
                    isEmailValid ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {isEmailValid ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Formato válido</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3" />
                        <span>E-mail incompleto</span>
                      </>
                    )}
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  id="input-auth-email"
                  required
                  maxLength={80}
                  autoComplete="email"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={() => setTouchedEmail(true)}
                  placeholder="seu.email@exemplo.com"
                  className={`w-full pl-10 pr-9 py-3 bg-slate-950/70 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                    touchedEmail && email.length > 0
                      ? isEmailValid
                        ? 'border-emerald-500/50 focus:ring-emerald-500'
                        : 'border-amber-500/50 focus:ring-amber-500'
                      : 'border-slate-800 focus:ring-emerald-500'
                  }`}
                />
                {touchedEmail && email.length > 0 && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    {isEmailValid ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                )}
              </div>
              {touchedEmail && email.length > 0 && !isEmailValid && (
                <p className="mt-1 text-[11px] text-amber-400/90 leading-tight">
                  Insira um e-mail válido (ex: nome@dominio.com).
                </p>
              )}
            </div>

            {/* Senha */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Senha
                </label>
                {mode === 'register' && (
                  <span className={`text-[11px] ${
                    isPasswordValidLength ? 'text-emerald-400' : 'text-slate-500'
                  }`}>
                    {password.length >= 6 ? '✓ Mínimo 6 dígitos' : `${password.length}/6 dígitos`}
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="input-auth-password"
                  required
                  minLength={6}
                  maxLength={32}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Esqueci Minha Senha (Login mode only) */}
            {mode === 'login' && (
              <div className="flex items-center justify-end -mt-1">
                <button
                  type="button"
                  id="btn-forgot-password"
                  onClick={() => {
                    setIsRecoveryModalOpen(true);
                    setRecoveryStep(1);
                    setRecoveryCpf('');
                    setRecoveryError(null);
                    setRecoveryNewPassword('');
                    setRecoveryConfirmPassword('');
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors cursor-pointer"
                >
                  Esqueci minha senha
                </button>
              </div>
            )}

            {/* Confirmar Senha (Register only with Real-time Match Validation) */}
            {mode === 'register' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Confirmar Senha
                  </label>
                  {/* Real-time Match Status */}
                  {touchedConfirmPassword && confirmPassword.length > 0 && (
                    <span className={`text-[11px] font-medium flex items-center gap-1 ${
                      doPasswordsMatch ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {doPasswordsMatch ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Senhas coincidem</span>
                        </>
                      ) : (
                        <>
                          <X className="w-3 h-3" />
                          <span>Senhas diferentes</span>
                        </>
                      )}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="input-auth-confirm-password"
                    required
                    minLength={6}
                    maxLength={32}
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    onBlur={() => setTouchedConfirmPassword(true)}
                    placeholder="Repita sua senha"
                    className={`w-full pl-10 pr-10 py-3 bg-slate-950/70 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                      touchedConfirmPassword && confirmPassword.length > 0
                        ? doPasswordsMatch
                          ? 'border-emerald-500/50 focus:ring-emerald-500'
                          : 'border-rose-500/50 focus:ring-rose-500'
                        : 'border-slate-800 focus:ring-emerald-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {touchedConfirmPassword && confirmPassword.length > 0 && passwordsMismatch && (
                  <p className="mt-1 text-[11px] text-rose-400 leading-tight">
                    As senhas não são iguais. Digite a mesma senha informada acima.
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              id="btn-auth-submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] disabled:opacity-60 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[46px]"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Acessar Meu Painel' : 'Concluir Cadastro'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Privacy & Multi-User notice */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-2 text-slate-400 text-[11px] text-center">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Banco de dados local criptografado e isolado por usuário.</span>
          </div>
        </div>

        {/* App Version */}
        <div className="mt-3 text-center">
          <span className="text-[11px] font-medium text-slate-500">
            Versão {APP_VERSION}
          </span>
        </div>
      </div>

      {/* Password Recovery Modal via CPF */}
      {isRecoveryModalOpen && (
        <div 
          id="modal-password-recovery"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsRecoveryModalOpen(false);
              setRecoveryError(null);
              setRecoveryStep(1);
            }
          }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs transition-all duration-200 overflow-y-auto"
        >
          <div className="relative w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-[28px] sm:rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 sm:zoom-in-95">
            {/* Mobile Drag Indicator */}
            <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden shrink-0" />

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-4 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-white truncate">
                    {recoveryStep === 1 ? 'Recuperar Senha' : 'Criar Nova Senha'}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                    {recoveryStep === 1 ? 'Passo 1 de 2: Identificação da Conta' : 'Passo 2 de 2: Nova Senha de Acesso'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="btn-close-recovery-modal"
                onClick={() => {
                  setIsRecoveryModalOpen(false);
                  setRecoveryError(null);
                  setRecoveryStep(1);
                }}
                className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
                aria-label="Fechar modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="overflow-y-auto max-h-[calc(92vh-100px)] sm:max-h-[calc(88vh-110px)] px-1.5 py-1 space-y-4">
              {/* Error / Informative in Recovery Modal */}
              {recoveryError && (
                <div
                  id="recovery-error-alert"
                  className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-amber-300 text-xs w-full break-words animate-in fade-in"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                  <span className="leading-snug">{recoveryError}</span>
                </div>
              )}

              {/* Step 1: Input E-mail or CPF */}
              {recoveryStep === 1 && (
                <form onSubmit={handleVerifyCpfForRecovery} className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                      Informe o seu e-mail ou CPF cadastrado. O sistema fará a busca local e na nuvem para identificar sua conta e permitir a alteração da sua senha.
                    </p>
                    <label className="text-xs font-medium text-slate-300 block mb-1.5">
                      E-mail ou CPF Cadastrado <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        {recoveryCpf.includes('@') ? (
                          <Mail className="w-4 h-4" />
                        ) : (
                          <CreditCard className="w-4 h-4" />
                        )}
                      </div>
                      <input
                        type="text"
                        id="input-recovery-identifier"
                        required
                        autoFocus
                        maxLength={80}
                        value={recoveryCpf}
                        onChange={handleRecoveryCpfChange}
                        placeholder="seu.email@exemplo.com ou 000.000.000-00"
                        className="w-full pl-10 pr-4 py-3 min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-inset transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRecoveryModalOpen(false);
                        setRecoveryError(null);
                      }}
                      className="flex-1 py-2.5 px-3 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      id="btn-verify-recovery-identifier"
                      disabled={recoveryLoading || !isRecoveryInputValid}
                      className="flex-1 py-2.5 px-3 min-h-[44px] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {recoveryLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Buscar Conta</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Step 2: Set New Password */}
              {recoveryStep === 2 && (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs sm:text-sm text-emerald-300 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                    <span className="leading-snug">
                      Usuário localizado: <strong className="text-white">{recoveryUserName}</strong>. Digite sua nova senha de acesso abaixo.
                    </span>
                  </div>

                  {/* Nova Senha */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-slate-300">
                        Nova Senha <span className="text-rose-400">*</span>
                      </label>
                      <span className="text-[11px] text-slate-400">
                        {recoveryNewPassword.length >= 6 ? '✓ Mínimo 6 dígitos' : `${recoveryNewPassword.length}/6`}
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showRecoveryNewPassword ? 'text' : 'password'}
                        id="input-recovery-new-password"
                        required
                        autoFocus
                        minLength={6}
                        maxLength={32}
                        value={recoveryNewPassword}
                        onChange={(e) => setRecoveryNewPassword(e.target.value)}
                        placeholder="Mínimo 6 dígitos"
                        className="w-full pl-10 pr-10 py-3 min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-inset transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRecoveryNewPassword(!showRecoveryNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer min-h-[44px]"
                        tabIndex={-1}
                        aria-label="Alternar visibilidade da senha"
                      >
                        {showRecoveryNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirmar Nova Senha */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-slate-300">
                        Confirmar Nova Senha <span className="text-rose-400">*</span>
                      </label>
                      {recoveryConfirmPassword.length > 0 && (
                        <span className={`text-[11px] font-medium flex items-center gap-1 ${
                          doRecoveryPasswordsMatch ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {doRecoveryPasswordsMatch ? '✓ Senhas coincidem' : '✗ Senhas diferentes'}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showRecoveryConfirmPassword ? 'text' : 'password'}
                        id="input-recovery-confirm-password"
                        required
                        minLength={6}
                        maxLength={32}
                        value={recoveryConfirmPassword}
                        onChange={(e) => setRecoveryConfirmPassword(e.target.value)}
                        placeholder="Repita sua nova senha"
                        className="w-full pl-10 pr-10 py-3 min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-inset transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRecoveryConfirmPassword(!showRecoveryConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer min-h-[44px]"
                        tabIndex={-1}
                        aria-label="Alternar visibilidade da confirmação de senha"
                      >
                        {showRecoveryConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRecoveryStep(1);
                        setRecoveryError(null);
                      }}
                      className="flex-1 py-2.5 px-3 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center"
                    >
                      Voltar
                    </button>
                    <button
                      type="submit"
                      id="btn-save-new-password"
                      disabled={recoveryLoading || recoveryNewPassword.length < 6 || !doRecoveryPasswordsMatch}
                      className="flex-1 py-2.5 px-3 min-h-[44px] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {recoveryLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Salvar Nova Senha</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
