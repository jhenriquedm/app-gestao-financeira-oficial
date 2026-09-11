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
  Wallet,
  Check,
  X
} from 'lucide-react';
import { User } from '../types';
import { authOperations } from '../db/localDatabase';
import { sanitizePersonName } from '../utils/textSanitizer';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
  isDarkMode?: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Touched state for realtime validation display
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedConfirmPassword, setTouchedConfirmPassword] = useState(false);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Statuses
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Real-time validations
  const emailRegex = useMemo(() => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, []);
  
  const isEmailValid = useMemo(() => {
    if (!email.trim()) return false;
    return emailRegex.test(email.trim().toLowerCase());
  }, [email, emailRegex]);

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

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errorMessage) setErrorMessage(null);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    setTouchedConfirmPassword(true);
    if (errorMessage) setErrorMessage(null);
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
        const result = await authOperations.register(name, cleanEmail, cleanPassword);
        if (result.success && result.user) {
          setSuccessMessage('Cadastro realizado com sucesso! Faça login com seu e-mail e senha para acessar.');
          setMode('login');
          setName('');
          setPassword('');
          setConfirmPassword('');
          setTouchedEmail(false);
          setTouchedConfirmPassword(false);
        } else {
          setErrorMessage(result.error || 'Não foi possível realizar o cadastro.');
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
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-500/25 mb-3.5 ring-4 ring-emerald-500/20">
            <Wallet className="w-7 h-7 sm:w-8 sm:h-8" />
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
      </div>
    </div>
  );
};
