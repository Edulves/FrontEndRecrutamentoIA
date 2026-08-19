import { useState } from 'react'
import type { AnaliseResponse, AnaliseResultado } from '../types'

interface Props { data: AnaliseResponse }

function classeScore(score: number): string {
  if (score >= 80) return 'score-alto'
  if (score >= 60) return 'score-medio'
  if (score >= 40) return 'score-baixo'
  return 'score-muito-baixo'
}

function medalha(pos: number): string {
  if (pos === 0) return '🥇'
  if (pos === 1) return '🥈'
  if (pos === 2) return '🥉'
  return `#${pos + 1}`
}

function Card({ item, pos }: { item: AnaliseResultado; pos: number }) {
  const [aberto, setAberto] = useState(pos < 3)

  return (
    <div className={`ranking-card ${classeScore(item.score)}`}>
      <div className="ranking-header" onClick={() => setAberto(!aberto)}>
        <div className="posicao">{medalha(pos)}</div>
        <div className="candidato">
          <h3>{item.nomeCandidato}</h3>
          <small>{item.nomeArquivo}</small>
        </div>
        <div className="score-badge">{item.score}<span>/100</span></div>
        <div className="toggle">{aberto ? '▼' : '▶'}</div>
      </div>

      {aberto && (
        <div className="ranking-detalhes">
          <p className="resumo">{item.resumo}</p>

          {item.habilidadesIdentificadas.length > 0 && (
            <div className="secao">
              <strong>🛠️ Habilidades:</strong>
              <div className="tags">
                {item.habilidadesIdentificadas.map(h => <span key={h} className="tag">{h}</span>)}
              </div>
            </div>
          )}

          <div className="grid-pontos">
            {item.pontosFortes.length > 0 && (
              <div className="secao">
                <strong>✅ Pontos Fortes</strong>
                <ul>{item.pontosFortes.map(p => <li key={p}>{p}</li>)}</ul>
              </div>
            )}
            {item.pontosFracos.length > 0 && (
              <div className="secao">
                <strong>⚠️ Pontos Fracos</strong>
                <ul>{item.pontosFracos.map(p => <li key={p}>{p}</li>)}</ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function RankingList({ data }: Props) {
  return (
    <section className="ranking">
      <div className="ranking-summary card">
        <h2>📊 Ranking de Compatibilidade</h2>
        <p>
          <strong>{data.totalCurriculos}</strong> currículo(s) analisado(s) ·
          Processado em {new Date(data.processadoEm).toLocaleString('pt-BR')}
        </p>
      </div>

      <div className="ranking-lista">
        {data.ranking.map((item, i) => (
          <Card key={item.nomeArquivo + i} item={item} pos={i} />
        ))}
      </div>
    </section>
  )
}
