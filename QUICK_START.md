# 🚀 Quick Start - Configuração da API

## TL;DR (Muito Longo; Não Li)

### Para Desenvolvimento
```bash
npm run dev
# ✅ Usa proxy para http://localhost:5000
# ✅ DevTools: /api/...
```

### Para Testar Produção Localmente
```bash
npm run build
npm run preview
# ✅ Usa URL de produção: https://recrutamentoiaapi.foxheart.com.br
# ✅ DevTools mostra URL real: https://...
```

### Para Deployar
```bash
npm run build
# Copia `dist/` para seu servidor
# A URL de produção já está injetada no código!
```

---

## O Que Mudou?

### Antes ❌
- `npm run preview` apontava para `localhost:5000` (errado para produção)
- URL não aparecia no DevTools

### Depois ✅
- `npm run preview` aponta para `https://recrutamentoiaapi.foxheart.com.br`
- URL aparece corretamente no DevTools (F12)
- Sistema centralizado para gerenciar API em todos ambientes

---

## Arquivos Importantes

| Arquivo | Propósito |
|---------|-----------|
| `src/config.ts` | Configuração centralizada da API |
| `vite.config.ts` | Proxy para dev, sem proxy para preview |
| `.env.preview` | URL de produção para `npm run preview` |
| `.env.production` | URL de produção para `npm run build` |
| `API_CONFIG.md` | Documentação técnica completa |
| `DIAGRAMA_FLUXO.md` | Diagramas visuais |
| `RESUMO_ALTERACOES.md` | O que foi alterado |

---

## Verificação Rápida

### Desenvolvimento
```bash
npm run dev
# Abrir DevTools (F12) → Network → Requisições
# ✅ Deve mostrar: /api/candidatos, /api/vagas, etc.
```

### Preview
```bash
npm run build
npm run preview
# Abrir DevTools (F12) → Network → Requisições
# ✅ Deve mostrar: https://recrutamentoiaapi.foxheart.com.br/...
```

### Build
```bash
npm run build
# Verificar arquivo gerado
# Deve conter: "https://recrutamentoiaapi.foxheart.com.br"
```

---

## Próximas Etapas

1. ✅ Código já usa `getApiUrl()` em todos endpoints
2. ✅ Testes passam (25/25)
3. ✅ Build compila sem erros
4. 👉 Faça `npm run preview` e teste no DevTools!

---

## Troubleshooting

**P: DevTools ainda mostra `/api/...` no preview?**
R: Verifique se `.env.preview` existe e tem `VITE_API_URL=https://...`

**P: Build falha?**
R: Execute `npm run build` novamente. Testes estão passando.

**P: Como mudar a URL de produção?**
R: Edite `.env.production` e `.env.preview`, depois rode `npm run build`

---

## Referência Rápida

```bash
# Desenvolvimento (proxy localhost:5000)
npm run dev

# Build para produção
npm run build

# Preview do build (URL real de produção)
npm run preview

# Testes
npm run test
```

Feito! 🎉
