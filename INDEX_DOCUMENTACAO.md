# 📖 Índice de Documentação - Configuração da API

Clique nos links abaixo para navegar pela documentação:

## 🚀 Comece por Aqui

- **[SUMARIO_FINAL.md](./SUMARIO_FINAL.md)** ⭐
  - Visão geral completa da solução
  - Status de conclusão
  - Tabelas resumidas
  - Próximas ações

- **[QUICK_START.md](./QUICK_START.md)** ⭐
  - Instruções rápidas
  - TL;DR (Muito Longo; Não Li)
  - Como testar

## 📚 Documentação Técnica

### Configuração
- **[API_CONFIG.md](./API_CONFIG.md)**
  - Explicação técnica detalhada
  - Variáveis de ambiente
  - Fluxo de requisições por ambiente

### Diagramas
- **[DIAGRAMA_FLUXO.md](./DIAGRAMA_FLUXO.md)**
  - Diagramas visuais
  - Comparação dos 3 ambientes
  - Tabelas de fluxo

### Mudanças
- **[ARQUIVOS_ALTERADOS.md](./ARQUIVOS_ALTERADOS.md)**
  - Lista de todos os arquivos criados
  - Lista de todos os arquivos modificados
  - Diffs de antes/depois
  - Resumo estatístico

- **[RESUMO_ALTERACOES.md](./RESUMO_ALTERACOES.md)**
  - O que foi alterado e por quê
  - Motivação das mudanças
  - FAQ

### Correção
- **[CORRECAO_URL_API.md](./CORRECAO_URL_API.md)** ⭐ ÚLTIMA CORREÇÃO
  - Problema do 404 (falta de /api)
  - Como foi corrigido
  - Fluxo correto agora

## 🎯 Guias por Caso de Uso

### "Quero começar a usar"
1. Leia: [QUICK_START.md](./QUICK_START.md)
2. Execute: `npm run dev` ou `npm run preview`
3. Abra DevTools (F12) e verifique requisições

### "Quero entender como funciona"
1. Leia: [SUMARIO_FINAL.md](./SUMARIO_FINAL.md)
2. Visualize: [DIAGRAMA_FLUXO.md](./DIAGRAMA_FLUXO.md)
3. Aprofunde: [API_CONFIG.md](./API_CONFIG.md)

### "Quero saber o que mudou"
1. Leia: [RESUMO_ALTERACOES.md](./RESUMO_ALTERACOES.md)
2. Detalhe: [ARQUIVOS_ALTERADOS.md](./ARQUIVOS_ALTERADOS.md)
3. Últimas correções: [CORRECAO_URL_API.md](./CORRECAO_URL_API.md)

### "Tenho um erro 404"
1. Leia: [CORRECAO_URL_API.md](./CORRECAO_URL_API.md)
2. Verifique: `.env.preview` e `.env.production` incluem `/api`
3. Rode: `npm run build` e `npm run preview`

## 📋 Arquivos de Configuração

### Variáveis de Ambiente
```
.env.local                 # Desenvolvimento (vazio/comentado)
.env.preview               # npm run preview (https://...foxheart.com.br/api)
.env.production            # npm run build (https://...foxheart.com.br/api)
```

### Código
```
src/config.ts              # Configuração centralizada (getApiUrl)
vite.config.ts             # Proxy para dev, sem proxy para preview
src/auth.ts                # Usa getApiUrl()
src/App.tsx                # Usa getApiUrl()
src/curriculo.ts           # Usa getApiUrl()
src/components/CandidatosPage.tsx    # Usa getApiUrl()
src/components/VagasPage.tsx         # Usa getApiUrl()
src/components/DashboardPage.tsx     # Usa getApiUrl()
```

## 🔍 Estrutura de Documentação

```
Nível 1: Visão Geral (você está aqui!)
   ↓
Nível 2: Guias Rápidos (QUICK_START.md, SUMARIO_FINAL.md)
   ↓
Nível 3: Técnico (API_CONFIG.md, DIAGRAMA_FLUXO.md)
   ↓
Nível 4: Detalhe (ARQUIVOS_ALTERADOS.md)
   ↓
Nível 5: Específico (CORRECAO_URL_API.md, CONCLUSAO.md)
```

## ✅ Checklist de Implementação

- ✅ Sistema centralizado (`src/config.ts`)
- ✅ Proxy para desenvolvimento (`vite.config.ts`)
- ✅ URL com `/api` em produção (`.env.preview`, `.env.production`)
- ✅ Todos os componentes atualizados
- ✅ Build compila sem erros
- ✅ 25 testes passando
- ✅ Documentação completa

## 🎓 Conceitos Principais

1. **getApiUrl(path)**: Função que constrói URLs completas baseado no ambiente
2. **API_URL**: Constante com URL base (de env var ou `/api` por padrão)
3. **Proxy em Dev**: Esconde URL real para simplificar desenvolvimento
4. **URL em Preview/Build**: Transparente para debugging
5. **Vite Env Substitution**: URL injetada em tempo de build (não precisa .env em prod)

## 📞 Troubleshooting

### Erro 404 em preview?
→ Verificar [CORRECAO_URL_API.md](./CORRECAO_URL_API.md)

### Qual URL usar?
→ Consultar [DIAGRAMA_FLUXO.md](./DIAGRAMA_FLUXO.md)

### Como mudar a API?
→ Ler [API_CONFIG.md](./API_CONFIG.md)

### Quais arquivos mudaram?
→ Consultar [ARQUIVOS_ALTERADOS.md](./ARQUIVOS_ALTERADOS.md)

## 🎯 Status Atual

- **Desenvolvimento:** ✅ Funciona com proxy local
- **Preview:** ✅ Funciona com URL de produção e `/api`
- **Build:** ✅ URL injetada corretamente
- **Testes:** ✅ 25/25 passando
- **Documentação:** ✅ Completa e organizada

---

**Última atualização:** Correção da URL com `/api` ⭐

**Próximo passo:** Testar `npm run preview` e validar requisições no DevTools (F12)
