# Gestão Financeira 💰

Aplicativo completo de gestão e controle financeiro pessoal, desenvolvido com React, TypeScript, Tailwind CSS, Capacitor (Android) e Vite.

## 🚀 Funcionalidades Principais
- **Controle de Receitas e Despesas**: Cadastro rápido de transações com categorias, datas e valores formatados em BRL (R$).
- **Transações Recorrentes e Parceladas**: Suporte a parcelamentos e gastos fixos mensais com cálculo automático.
- **Perfil do Usuário Completo**:
  - Foto de perfil personalizável com suporte a imagens até 10MB.
  - Ferramenta interativa de enquadramento (zoom, rotação 90°, arrastar/reposicionar com máscara circular).
  - Validação e máscara automática de CPF.
- **Armazenamento e Segurança**:
  - Persistência local segura com IndexedDB (Dexie).
  - Sincronização em nuvem via Firebase Firestore.
- **App Nativo Android**:
  - Suporte completo a dispositivos Android (incluindo Moto G52) via Capacitor.
  - Ícones adaptativos configurados.
  - Workflow de build automatizado via GitHub Actions.

## 🧪 Como Executar Testes
```bash
npm test
```
Para executar com linter de tipos:
```bash
npm run lint
```

## 🏗️ Como Compilar o Projeto Web
```bash
npm run build
```

## 📱 Como Gerar o APK Android
O projeto possui um workflow configurado em `.github/workflows/build-apk.yml`.
Ao realizar push para as branches `main` ou `app-gestao-financeira-oficial`, o GitHub Actions compila automaticamente o APK de Debug e disponibiliza na aba **Actions** e na seção **Releases**.
