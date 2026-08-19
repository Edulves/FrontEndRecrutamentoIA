export interface AnaliseResultado {
  nomeArquivo: string
  nomeCandidato: string
  score: number
  resumo: string
  pontosFortes: string[]
  pontosFracos: string[]
  habilidadesIdentificadas: string[]
}

export interface AnaliseResponse {
  descricaoVaga: string
  totalCurriculos: number
  ranking: AnaliseResultado[]
  processadoEm: string
}
