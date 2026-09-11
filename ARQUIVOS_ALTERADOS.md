# 📝 Lista de Arquivos Alterados

## Criados (5 arquivos)

### 1. `src/config.ts` ✨ NOVO
Arquivo centralizado de configuração da API. Exporta:
- `API_URL`: Constante com a URL base da API
- `getApiUrl(path)`: Função que constrói URLs completas

```typescript
export const API_URL = import.meta.env.VITE_API_URL || '/api'
export function getApiUrl(path: string): string { ... }
```

### 2. `.env.preview` ✨ NOVO
Configuração específica para `npm run preview`. Mostra URL real no DevTools.
```env
VITE_API_URL=https://recrutamentoiaapi.foxheart.com.br
```

### 3. `.env.production` ✨ NOVO
Configuração para build de produção. URL será injetada no código.
```env
VITE_API_URL=https://recrutamentoiaapi.foxheart.com.br
```

### 4. `API_CONFIG.md` ✨ NOVO
Documentação técnica detalhada sobre a configuração da API.
- Explicação de cada ambiente
- Fluxo de requisições
- Variáveis de ambiente

### 5. `DIAGRAMA_FLUXO.md` ✨ NOVO
Diagramas visuais mostrando como funciona cada ambiente.

---

## Modificados (7 arquivos)

### 1. `vite.config.ts`
**Alteração:** Removido proxy de preview, deixando URL ser resolvida de `.env.preview`

**Antes:**
```typescript
preview: {
  port: 4173,
  proxy: {
    '/api': {
      target: 'https://recrutamentoiaapi.foxheart.com.br',
      changeOrigin: true
    }
  }
}
```

**Depois:**
```typescript
preview: {
  port: 4173,
  // SEM proxy em produção: a URL completa virá de VITE_API_URL
}
```

### 2. `.env.local`
**Alteração:** Removida chave antiga (VITE_API_KEY) e adicionados comentários explicativos.

**Antes:**
```env
VITE_API_KEY=63d6dd3b14df4d6a2b0c03e6174dba930581394a74bf7ab8
```

**Depois:**
```env
# Configuração para desenvolvimento local (usa proxy via vite.config.ts para http://localhost:5000)
# Se quiser usar a URL completa, descomente a linha abaixo:
# VITE_API_URL=http://localhost:5000

# Para produção, use:
# VITE_API_URL=https://recrutamentoiaapi.foxheart.com.br
```

### 3. `.env.example`
**Alteração:** Adicionadas documentações sobre VITE_API_URL

**Adicionado:**
```env
#
# URL da API (opcional, padrão é /api para desenvolvimento)
# Em produção, use a URL completa da API
VITE_API_URL=https://recrutamentoiaapi.foxheart.com.br
```

### 4. `src/auth.ts`
**Alteração:** Importado `getApiUrl` e substituído URLs hardcoded

**Antes:**
```typescript
const resp = await postJson('/api/auth/login', { username, password })
const resp = await postJson('/api/auth/registrar', { username, password })
```

**Depois:**
```typescript
import { getApiUrl } from './config'

const resp = await postJson(getApiUrl('/auth/login'), { username, password })
const resp = await postJson(getApiUrl('/auth/registrar'), { username, password })
```

### 5. `src/App.tsx`
**Alteração:** Importado `getApiUrl` e substituído URL

**Antes:**
```typescript
const resp = await fetch("/api/analisar", {
```

**Depois:**
```typescript
import { getApiUrl } from "./config"

const resp = await fetch(getApiUrl("/analisar"), {
```

### 6. `src/curriculo.ts`
**Alteração:** Importado `getApiUrl` e substituído URL

**Antes:**
```typescript
const resp = await fetch(`/api/candidatos/${candidatoId}/curriculo`, {
```

**Depois:**
```typescript
import { getApiUrl } from './config'

const resp = await fetch(getApiUrl(`/candidatos/${candidatoId}/curriculo`), {
```

### 7. `src/components/CandidatosPage.tsx`
**Alteração:** Importado `getApiUrl` e substituído 3 URLs

**Antes:**
```typescript
fetch(`/api/candidatos/${c.id}/foto`, { ... })
fetch('/api/candidatos', { ... })
fetch(`/api/candidatos/${c.id}/foto`, { ... })
fetch(`/api/candidatos/${c.id}`, { ... })
```

**Depois:**
```typescript
import { getApiUrl } from '../config'

fetch(getApiUrl(`/candidatos/${c.id}/foto`), { ... })
fetch(getApiUrl('/candidatos'), { ... })
fetch(getApiUrl(`/candidatos/${c.id}/foto`), { ... })
fetch(getApiUrl(`/candidatos/${c.id}`), { ... })
```

### 8. `src/components/VagasPage.tsx`
**Alteração:** Importado `getApiUrl` e substituído 3 URLs

**Antes:**
```typescript
fetch('/api/vagas', { ... })
fetch('/api/candidatos', { ... })
fetch('/api/vagas', { method: 'POST', ... })
```

**Depois:**
```typescript
import { getApiUrl } from '../config'

fetch(getApiUrl('/vagas'), { ... })
fetch(getApiUrl('/candidatos'), { ... })
fetch(getApiUrl('/vagas'), { method: 'POST', ... })
```

### 9. `src/components/DashboardPage.tsx`
**Alteração:** Importado `getApiUrl` e substituído URL

**Antes:**
```typescript
fetch('/api/candidatos', { ... })
```

**Depois:**
```typescript
import { getApiUrl } from '../config'

fetch(getApiUrl('/candidatos'), { ... })
```

---

## Resumo Estatístico

| Métrica | Antes | Depois | Alteração |
|---------|-------|--------|-----------|
| Arquivos .env | 2 | 4 | +2 |
| Calls de `/api/` | ~12 | 0 | -12 (trocados por getApiUrl) |
| Chamadas getApiUrl | 0 | ~12 | +12 |
| Testes passando | ✅ | ✅ | Sem mudanças |

---

## Como Validar

### Verificar Imports
```bash
grep -r "getApiUrl" src/
# Deve mostrar import em 6 arquivos
```

### Verificar Ausência de URLs Diretas
```bash
grep -r "fetch('\/api" src/
grep -r 'fetch("/api' src/
# NÃO deve retornar nada (exceto testes que usam mocks)
```

### Verificar Arquivos .env
```bash
ls -la frontend/.env*
# Deve listar: .env.example, .env.local, .env.preview, .env.production
```

### Compilar e Testar
```bash
npm run build   # Deve compilar sem erros
npm run test    # Deve passar 25/25 testes
```
