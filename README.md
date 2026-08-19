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

## 🔑 Variáveis de ambiente

Copie `.env.example` para `.env.local` e ajuste:

```powershell
Copy-Item .env.example .env.local
```

```env
VITE_API_KEY=SUA_CHAVE_DE_ACESSO_AO_BACKEND
```

Essa chave é enviada como cabeçalho `X-Api-Key` para o backend — corresponde às chaves de
`api-credentials.json` do repositório do **backend**. `.env.local` **não é versionado**.

> 🛡️ Nenhuma chave de IA (Claude) fica aqui: todas as chamadas à IA são feitas pelo backend.

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
├── App.tsx                 # tela principal (formulário + envio)
├── App.test.tsx            # testes da tela
├── components/
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