export interface AnaliseResultado {
  nomeArquivo: string
  nomeCandidato: string
  score: number
  resumo: string
  pontosFortes: string[]
  pontosFracos: string[]
  habilidadesIdentificadas: string[]
  areasAptidao?: string[] | null
  email?: string | null
  telefone?: string | null
  cidade?: string | null
  experiencias?: string[] | null
  formacao?: string[] | null
}

export interface AnaliseHistorico {
  dataUtc: string
  vaga: string
  score: number
}

/** Perfil salvo no backend a cada currículo importado (GET /api/candidatos). */
export interface Candidato {
  id: string
  nome: string
  email?: string | null
  telefone?: string | null
  cidade?: string | null
  areasAptidao: string[]
  habilidades: string[]
  experiencias: string[]
  formacao: string[]
  resumo: string
  pontosFortes: string[]
  pontosFracos: string[]
  nomeArquivo: string
  /** Arquivo original do currículo no backend; null nos importados antes do armazenamento. */
  curriculoArquivo?: string | null
  /** Foto de perfil no backend (extraída do currículo ou enviada à mão). */
  fotoArquivo?: string | null
  criadoEmUtc: string
  atualizadoEmUtc: string
  historico: AnaliseHistorico[]
}

export interface AnaliseResponse {
  descricaoVaga: string
  totalCurriculos: number
  ranking: AnaliseResultado[]
  processadoEm: string
}

/** Vaga cadastrada (GET /api/vagas). */
export interface Vaga {
  id: string
  titulo: string
  descricao: string
  criadaEmUtc: string
}

/** Posição de um candidato do cadastro na análise contra uma vaga nova. */
export interface VagaRankingItem {
  candidatoId: string
  nome: string
  score: number
  resumo: string
}

/** Resposta do POST /api/vagas: a vaga salva + ranking dos candidatos do cadastro. */
export interface CadastroVagaResponse {
  vaga: Vaga
  totalCandidatos: number
  ranking: VagaRankingItem[]
}
