# 🎯 Resumo de Alterações - Configuração da API de Produção

## Problema Identificado

Você corretamente apontou que quando rodava `npm run preview`:
- ❌ Requisições iam para `http://localhost:5000` (em vez de produção)
- ❌ A URL não aparecia corretamente no DevTools (F12)

## ✅ Solução Implementada

Sistema centralizado e robusto de configuração de API com suporte a múltiplos ambientes, onde **a URL da API aparece corretamente no DevTools** para cada ambiente.

---

## 📁 Arquivos Criados / Modificados

### Criados:
1. **`src/config.ts`** - Arquivo centralizado de configuração da API
   - Export `API_URL` e função `getApiUrl(path)`
   
2. **`.env.preview`** - Configuração específica para `npm run preview`
   ```env
   VITE_API_URL=https://recrutamentoiaapi.foxheart.com.br
   ```

3. **`.env.production`** - Configuração para `npm run build`
   ```env
   VITE_API_URL=https://recrutamentoiaapi.foxheart.com.br
   ```

4. **`API_CONFIG.md`** - Documentação completa da configuração

5. **`RESUMO_ALTERACOES.md`** - Este arquivo

### Modificados:
1. **`vite.config.ts`**
   - ✅ Mantém proxy para desenvolvimento (`server.proxy`)
   - ✅ Remove proxy de produção (`preview`)
   - Agora usa URL completa de `.env.preview`

2. **`.env.local`**
   - Comentários explicando como usar

3. **Todos os 6 arquivos com requisições de API:**
   - ✅ `src/auth.ts`
   - ✅ `src/App.tsx`
   - ✅ `src/curriculo.ts`
   - ✅ `src/components/CandidatosPage.tsx`
   - ✅ `src/components/VagasPage.tsx`
   - ✅ `src/components/DashboardPage.tsx`

---

## 🔍 Como Funciona Agora

### Desenvolvimento: `npm run dev`
```
┌─────────────────────────┐
│ Navegador               │
│ localhost:5173          │
└────────────┬────────────┘
             │
             ↓ fetch('/api/candidatos')
┌─────────────────────────┐
│ Proxy do Vite (server)  │
│ Intercepta /api/...     │
└────────────┬────────────┘
             │
             ↓ http://localhost:5000/...
┌─────────────────────────┐
│ Backend Local           │
│ http://localhost:5000   │
└─────────────────────────┘

DevTools mostra: /api/candidatos
(interceptado pelo proxy, não mostra URL completa)
```

### Preview: `npm run preview`
```
┌─────────────────────────────────────────────┐
│ Navegador                                   │
│ localhost:4173                              │
└────────────┬────────────────────────────────┘
             │
             ↓ fetch(getApiUrl('/candidatos'))
             │
             ↓ Resolvido para: (de .env.preview)
             │ https://recrutamentoiaapi.foxheart.com.br/...
             │
┌────────────────────────────────────────────┐
│ Backend de Produção                         │
│ https://recrutamentoiaapi.foxheart.com.br  │
└────────────────────────────────────────────┘

✅ DevTools mostra: https://recrutamentoiaapi.foxheart.com.br/candidatos
```

### Build: `npm run build`
```
Durante o build, Vite injeta valor de VITE_API_URL de .env.production:

Código-fonte:
  fetch(getApiUrl('/candidatos'))

                ↓↓↓ Build process ↓↓↓

JavaScript final:
  fetch('https://recrutamentoiaapi.foxheart.com.br/candidatos')

✅ DevTools mostra: https://recrutamentoiaapi.foxheart.com.br/candidatos
```

---

## 🧪 Validações

- ✅ **Build compila sem erros:** `npm run build` ✓
- ✅ **Todos os testes passam:** 25/25 testes ✓
- ✅ **Sem erros TypeScript**
- ✅ **URL de produção injetada no bundle** (verificado)

---

## 📌 Checklist de Uso

### Para Desenvolvimento
```bash
npm run dev
# ➜ Usa proxy para http://localhost:5000
# ➜ DevTools mostra: /api/...
```

### Para Testar Produção Localmente
```bash
npm run build
npm run preview
# ➜ Usa URL de .env.preview
# ➜ DevTools mostra: https://recrutamentoiaapi.foxheart.com.br/...
```

### Para Deployar
```bash
npm run build
# Copia pasta dist/ para seu servidor
# ➜ JavaScript contém URL injetada: https://recrutamentoiaapi.foxheart.com.br
# ➜ Funciona sem variáveis de ambiente!
```

---

## 🎓 Conceitos Importantes

1. **Proxy vs URL Direta**
   - Desenvolvimento usa proxy (esconde a URL real)
   - Produção usa URL direta (transparente no DevTools)

2. **Vite Env Substitution**
   - `import.meta.env.VITE_*` é substituído no build time
   - Não precisa de servidor para servir .env em produção

3. **Fallback Inteligente**
   - Se `VITE_API_URL` não estiver definido → usa `/api`
   - Permite desenvolvimento offline mesmo em produção

---

## 📞 Perguntas Frequentes

**P: Por que não usar proxy em produção?**
R: Porque o proxy do Vite é apenas para desenvolvimento. Em produção, a URL deve estar injetada no código ou configurada no servidor.

**P: E se eu quiser trocar a API de produção?**
R: Atualize `.env.production` e rode `npm run build` novamente.

**P: Posso usar variáveis de ambiente em tempo de execução?**
R: Não com esta abordagem (Vite substitui no build). Se precisar, seria necessário um arquivo config.json servido pelo servidor.

---

## 📚 Arquivos de Referência

- Documentação completa: `API_CONFIG.md`
- Configuração do Vite: `vite.config.ts`
- Código de requisição: `src/config.ts`
- Uso em componentes: `src/auth.ts`, `src/App.tsx`, etc.
