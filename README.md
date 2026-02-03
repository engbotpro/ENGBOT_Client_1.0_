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

## Docker

O app pode rodar em Docker (build multi-stage: Node + nginx). O nginx serve o SPA e faz proxy de `/api`, `/users`, `/calculate` e `/auth` para o backend.

### Subir com Docker Compose

```bash
docker compose up --build
```

Acesse: **http://localhost:3000**

O backend é chamado via `BACKEND_URL` (padrão: `http://host.docker.internal:5000`). Para mudar a porta do backend ou o host, edite `BACKEND_URL` em `docker-compose.yml` ou defina a variável de ambiente.

### Build e run manual

```bash
docker build -t engbot-client .
docker run -p 3000:80 -e BACKEND_URL=http://host.docker.internal:5000 engbot-client
```

### Variáveis (build, opcional)

- `VITE_API_URL`, `VITE_SERVER_URL` – vazios = app usa URLs relativas e o nginx faz proxy.
- `VITE_STRIPE_PUBLIC_KEY` – chave pública do Stripe (se usar pagamentos).

## Vercel (deploy do frontend)

O projeto está configurado para deploy na [Vercel](https://vercel.com) (`vercel.json` com build Vite e rewrites para SPA).

### 1. Conectar o repositório

1. Acesse [vercel.com](https://vercel.com) e faça login (GitHub).
2. **Add New** → **Project**.
3. Importe o repositório **engbotpro/ENGBOT_Client_1.0_** (ou o fork que você usa).
4. A Vercel detecta Vite; confirme:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

### 2. Variáveis de ambiente

No projeto na Vercel, vá em **Settings** → **Environment Variables** e defina:

| Variável | Descrição | Exemplo |
|----------|------------|---------|
| `VITE_API_URL` | URL pública do backend (API) | `https://sua-api.com` |
| `VITE_SERVER_URL` | URL do backend (OAuth, redirects) | `https://sua-api.com` |
| `VITE_STRIPE_PUBLIC_KEY` | Chave pública do Stripe (opcional) | `pk_live_...` |

**Importante:** use a URL real do seu backend (ex.: um servidor, Railway, Render). O frontend na Vercel chama a API diretamente do navegador; não há proxy como no Docker.

### 3. Deploy

- **Deploy** é automático a cada push na branch conectada (ex.: `main`).
- Ou use a CLI: `npx vercel` (ou `npm i -g vercel` e `vercel`) na pasta do projeto.
