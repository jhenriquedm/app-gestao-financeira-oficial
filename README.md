# 💰 Gestão Financeira

> **Aplicativo completo e moderno de controle financeiro pessoal, desenvolvido para Web (PWA) e Android Nativo.**

[![Versão](https://img.shields.io/badge/versão-1.4.1-emerald.svg)](package.json)
[![Build](https://img.shields.io/badge/build-33-blue.svg)](android/app/build.gradle)
[![Android](https://img.shields.io/badge/Android-APK%20Disponível-brightgreen.svg?logo=android)](https://github.com/jhenriquedm/app-gestao-financeira-oficial/releases/tag/latest-apk)
[![Stack](https://img.shields.io/badge/stack-React%20%7C%20TypeScript%20%7C%20Capacitor-purple.svg)](package.json)

---

## 📌 Visão Geral

O **Gestão Financeira** é uma solução completa para controle financeiro inteligente, projetada com foco em agilidade, segurança, privacidade e usabilidade mobile-first. Ele combina o poder de um aplicativo web progressivo (**PWA**) com uma experiência nativa no **Android** através do **Capacitor**, garantindo funcionamento 100% autônomo offline e sincronização em nuvem com o **Firebase Firestore**.

---

## ✨ Funcionalidades Principais

### 🔐 Autenticação & Segurança
- **Login e Cadastro Local/Nuvem:** Autenticação por e-mail e senha com criptografia SHA-256 nativa via Web Crypto API.
- **Validação Completa de CPF:** Cadastro com validação matemática e máscara automática de dígitos do CPF.
- **Login com Conta Google:**
  - **Android Nativo:** Integração com `@codetrix-studio/capacitor-google-auth` e seletor de contas do dispositivo.
  - **Web / PWA:** Autenticação via pop-up e redirecionamento seguro com Firebase Auth.
- **Recuperação de Senha Segura:** Redefinição direta com validação de CPF ou E-mail e sincronização imediata em nuvem.
- **Proteção de Privacidade:**
  - Botão para ocultar/revelar saldos e montantes na tela com um clique.
  - Bloqueio de restauração de sessão desnecessária via `allowBackup="false"`.

### 📊 Painel & Saúde Financeira
- **Cards de Resumo:** Saldo em Conta, Total de Receitas, Total de Despesas, Economias e Investimentos.
- **Navegação por Competência:** Filtro ágil por mês e ano para análise histórica ou planejamento futuro.
- **Indicador de Saúde Financeira:** Avaliação automatizada da saúde financeira baseada no percentual de comprometimento de renda.
- **Gráficos Interativos (Recharts):**
  - Distribuição de despesas por categoria (gráfico de rosca/pizza).
  - Comparativo mensal de entradas vs. saídas (gráfico de barras).

### 💳 Transações, Parcelamentos & Gastos Fixos
- **Lançamentos Rápidos:** Registro de receitas e despesas com categorização, data, observações e status de pagamento.
- **Despesas e Receitas Fixas:** Lançamentos recorrentes mensais automatizados.
- **Controle de Parcelamentos:**
  - Lançamento inteligente de compras parceladas no cartão ou boletos.
  - Cálculo dinâmico de parcelas restantes, valor pago e quitação antecipada.

### 🎯 Planejamento: Orçamentos & Metas
- **Orçamentos Mensais por Categoria:** Definição de limites de gastos por categoria com barras de progresso e alertas visuais de teto orçamentário.
- **Metas de Poupança (Savings Goals):** Acompanhamento de objetivos com prazos, depósitos parciais e cálculo percentual de realização.

### 👤 Perfil & Customização
- **Gerenciador de Categorias:** Criação, edição e exclusão de categorias personalizadas com paleta de cores e ícones temáticos.
- **Avatar com Editor Interativo:** Foto de perfil com suporte a upload de até 10MB, ferramenta de enquadramento (arrastar/reposicionar), zoom interativo (1x a 3x) e rotação de 90° em máscara circular.
- **Modo Escuro / Claro:** Suporte completo ao Dark Mode e Light Mode com alternância instantânea.

### 🔄 Offline-First & Portabilidade
- **Banco de Dados Local (Dexie / IndexedDB):** Funciona perfeitamente sem internet; todas as transações são gravadas instantaneamente no dispositivo.
- **Sincronização com Nuvem (Firebase Firestore):** Backup e restauração automática com resolução de conflitos e reconciliação de dados.
- **Backup & Restauração Manual:** Exportação e importação completa de todos os dados do usuário em arquivo JSON formatado.

---

## 🛠️ Tecnologias Utilizadas

| Camada | Tecnologia |
| :--- | :--- |
| **Frontend** | [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/) |
| **Estilização** | [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) (Ícones) |
| **Gráficos** | [Recharts](https://recharts.org/) |
| **Banco Local** | [Dexie.js](https://dexie.org/) (IndexedDB wrapper) |
| **Nuvem & Auth**| [Firebase Firestore](https://firebase.google.com/), [Firebase Authentication](https://firebase.google.com/docs/auth) |
| **Mobile Nativo**| [Capacitor 8](https://capacitorjs.com/) (Android), `@codetrix-studio/capacitor-google-auth`, `@capacitor/filesystem`, `@capacitor/share` |
| **CI / CD** | [GitHub Actions](https://github.com/features/actions) para validação e compilação de APK |

---

## 📂 Estrutura do Projeto

```text
├── android/                   # Código-fonte nativo do projeto Android (Capacitor)
│   ├── app/
│   │   ├── build.gradle       # Configurações de compilação, versionCode e versionName
│   │   └── src/main/          # Manifesto Android, assets compilados e recursos nativos
├── src/
│   ├── components/            # Componentes React de UI (Modais, Cards, Listas, Navegação)
│   ├── data/                  # Dados iniciais e categorias padrão
│   ├── db/                    # Camada do banco local (Dexie / IndexedDB) e operações de auth
│   ├── services/              # Serviços de nuvem (FirestoreSyncService, Firebase)
│   ├── utils/                 # Validadores (CPF), formatadores monetários e helpers
│   ├── App.tsx                # Componente raiz da aplicação
│   ├── types.ts               # Tipagens e interfaces TypeScript
│   └── version.ts             # Constantes centralizadas de versão e build
├── .github/workflows/         # Workflows de CI e Build do APK via GitHub Actions
├── package.json               # Dependências do ecossistema Node.js
└── README.md                  # Esta documentação
```

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)

### Instalação
```bash
# Clone o repositório
git clone https://github.com/jhenriquedm/app-gestao-financeira-oficial.git

# Acesse o diretório
cd app-gestao-financeira-oficial

# Instale as dependências
npm install
```

### Executar em Ambiente de Desenvolvimento
```bash
npm run dev
```
O servidor local iniciará na porta `3000` (ex: `http://localhost:3000`).

### Validação de Código e Tipos
```bash
# Executar testes unitários e de integração
npm test

# Executar validação de tipagem com TypeScript
npm run lint
```

### Compilar para Produção (Web)
```bash
npm run build
```

---

## 📱 Compilação para Android (APK)

### Sincronizar com o Capacitor
Após compilar os arquivos web, sincronize os assets com a pasta nativa do Android:
```bash
npm run build:android
# ou manualmente:
npx cap sync android
```

### Compilação Automatizada no GitHub Actions
O repositório possui uma pipeline contínua configurada em `.github/workflows/build-apk.yml`. 

A cada push na branch `main`:
1. Os testes e checagem de tipos são executados automaticamente.
2. O ambiente Java/Gradle compila o APK do Android.
3. O arquivo compilado **`GestaoFinanceira.apk`** é publicado automaticamente no GitHub Releases na tag **`latest-apk`**.

📥 **Download do APK Mais Recente:** [Acesse a Release Oficial](https://github.com/jhenriquedm/app-gestao-financeira-oficial/releases/tag/latest-apk)

---

## 🏷️ Política de Versionamento

O projeto segue uma política estrita de versionamento incremental:
- **`src/version.ts`**: Define `APP_VERSION` e `APP_BUILD_NUMBER`.
- **`package.json`**: Mantém o campo `"version"` sincronizado.
- **`android/app/build.gradle`**: Incrementa `versionCode` (+1) e atualiza `versionName`.
- Na tela de autenticação, o aplicativo exibe apenas a numeração pública no formato `Versão X.Y.Z`.

---

## 📄 Licença

Este projeto é desenvolvido para uso pessoal e profissional de gestão orçamentária. Todos os direitos reservados.
