# ⚛️ Recrutamento IA — Frontend (Vite + React + TypeScript)

Interface web do sistema de **ranking de currículos com IA**: o usuário descreve a vaga, envia
os currículos (PDF, DOCX ou TXT) e o frontend chama a API do backend para exibir o ranking de compatibilidade.

## 🏗️ Stack

- Vite 5 + React 18 + TypeScript
- Vitest + Testing Library (testes)

## ▶️ Como rodar

Pré-requisitos: Node.js + npm.

```powershell
npm install
npm run dev
```

Abra http://localhost:5173

## 🔧 Scripts

| Comando            | Descrição                                   |
|--------------------|---------------------------------------------|
| `npm run dev`      | Sobe o servidor de desenvolvimento (5173)   |
| `npm run build`    | Compila (`tsc -b`) e gera o build em `dist` |
| `npm run preview`  | Pré-visualiza o build de produção           |
| `npm test`         | Roda os testes (Vitest run)                 |

## 🔐 Autenticação no frontend

O backend passou a exigir **autenticação por usuário/senha + JWT** (veja `backend/README.md`):

- A tela inicial é o **login** (`POST /api/auth/login`); também dá para **criar conta** na aba
  "Criar conta" (`POST /api/auth/registrar`).
- Após o login, o **JWT** e a expiração ficam no `localStorage` (`src/auth.ts`) e o token é
  enviado automaticamente como cabeçalho `Authorization: Bearer <token>` nas chamadas protegidas
  (ex.: `POST /api/analisar`).
- Se o token expirar (60 min por padrão) ou a API responder `401`, o app volta para a tela de
  login e limpa a sessão.

> A antiga `VITE_API_KEY` (cabeçalho `X-Api-Key`) deixou de ser usada — nenhuma variável de
> ambiente é necessária para a autenticação. O `.env.example` foi atualizado e o `.env.local`
> continua fora do versionamento (regras `.env.*` / `*.local` do `.gitignore`).

## 🔌 Proxy de desenvolvimento

O `vite.config.ts` já faz proxy de `/api` para o backend:

```ts
server: {
  port: 5173,
  proxy: { '/api': { target: 'http://localhost:5105', changeOrigin: true } }
}
```

Deixe o backend rodando (porta 5105) para a API funcionar em dev — sem problemas de CORS.

## 🗂️ Estrutura

```
src/
├── App.tsx                 # tela principal (formulário + envio, gated por login)
├── App.test.tsx            # testes da tela (autenticação + envio)
├── auth.ts                 # login/registro + persistência do JWT (localStorage)
├── components/
│   ├── LoadingModal.tsx    # pop-up de loading com tela de fundo desfocada
│   ├── LoginScreen.tsx     # tela de login / criar conta
│   └── RankingList.tsx     # exibição do ranking gerado
├── test/
│   └── setup.ts            # setup do Vitest/Testing Library
├── types.ts                # tipos compartilhados
├── styles.css
├── main.tsx
└── vite-env.d.ts
```

## ✅ Testes

```powershell
npm test
```

## 🚀 Build de produção

```powershell
npm run build
```