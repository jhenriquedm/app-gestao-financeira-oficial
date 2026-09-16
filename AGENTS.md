# Regras do Projeto - Gestão Financeira

## Política Obrigatória de Versionamento Incremental

A cada nova alteração que for feita e commitada no repositório, por mínima que seja:
1. A versão deve **avançar numericamente de forma sequencial** (ex: 1.1.1 -> 1.1.2).
2. Devem ser atualizados simultaneamente:
   - `src/version.ts`: Atualizar `APP_VERSION` (ex: `'1.1.1'`) e `APP_BUILD_NUMBER` (+1).
   - `package.json`: Atualizar o campo `"version"` (ex: `"1.1.1"`).
   - `android/app/build.gradle`: Incrementar `versionCode` (+1) e atualizar `versionName` (ex: `"1.1.1"`).
3. Na tela de Login (`AuthScreen.tsx`), exibir estritamente apenas o nome da versão (`Versão X.Y.Z`), sem a tag de build.
