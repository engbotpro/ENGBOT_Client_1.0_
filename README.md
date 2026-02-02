# ENGBOT_Client_1.0_

Projeto cliente baseado em React + TypeScript + Vite.

## Stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) com HMR
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) para Fast Refresh

## Expandir a configuração do ESLint

Para aplicações em produção, vale atualizar o ESLint para regras type-aware:

- Configure `parserOptions` no topo do config
- Use `tseslint.configs.recommendedTypeChecked` ou `tseslint.configs.strictTypeChecked`
- Opcional: [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react)

## Desenvolvimento

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
