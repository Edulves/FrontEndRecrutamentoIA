import { Fragment, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Info } from 'lucide-react'
import type { AnaliseResponse, AnaliseResultado } from '../types'

interface Props {
    data: AnaliseResponse
    /** Volta para o formulário de nova análise. */
    onNovaAnalise: () => void
}

/** A partir deste percentual de aderência o candidato entra como "Recomendado". */
const CORTE_RECOMENDADO = 70

type Filtro = 'todos' | 'recomendados' | 'em-analise'

const FILTROS: { id: Filtro; rotulo: string }[] = [
    { id: 'todos', rotulo: 'Todos' },
    { id: 'recomendados', rotulo: 'Recomendados' },
    { id: 'em-analise', rotulo: 'Em análise' },
]

function recomendado(item: AnaliseResultado): boolean {
    return item.score >= CORTE_RECOMENDADO
}

/** Título da vaga = primeira linha preenchida da descrição enviada. */
function tituloVaga(descricao: string): string {
    const linha = descricao.split('\n').find((l) => l.trim().length > 0)?.trim() ?? ''
    return linha.length > 70 ? `${linha.slice(0, 70)}…` : linha
}

function Detalhe({ item }: { item: AnaliseResultado }) {
    return (
        <tr className="detalhe">
            <td colSpan={5}>
                <p className="resumo">{item.resumo}</p>
                <div className="colunas">
                    {item.pontosFortes.length > 0 && (
                        <div>
                            <h4>Pontos fortes</h4>
                            <ul>
                                {item.pontosFortes.map((p) => (
                                    <li key={p}>{p}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {item.pontosFracos.length > 0 && (
                        <div>
                            <h4>Pontos de atenção</h4>
                            <ul>
                                {item.pontosFracos.map((p) => (
                                    <li key={p}>{p}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {item.habilidadesIdentificadas.length > 0 && (
                        <div>
                            <h4>Habilidades identificadas</h4>
                            <div className="chips">
                                {item.habilidadesIdentificadas.map((h) => (
                                    <span key={h} className="chip">
                                        {h}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    )
}

export default function ResultadoAnalise({ data, onNovaAnalise }: Props) {
    const [filtro, setFiltro] = useState<Filtro>('todos')
    const [aberto, setAberto] = useState<string | null>(null)

    const linhas = useMemo(() => {
        if (filtro === 'recomendados') return data.ranking.filter(recomendado)
        if (filtro === 'em-analise') return data.ranking.filter((r) => !recomendado(r))
        return data.ranking
    }, [data.ranking, filtro])

    const vaga = tituloVaga(data.descricaoVaga)

    return (
        <>
            <div className="breadcrumb">
                <span>Análises</span>
                <span>/</span>
                <strong>Resultado da análise</strong>
            </div>

            <div className="result-head">
                <div>
                    <h1>Resultado da análise</h1>
                    <p>
                        {data.totalCurriculos} candidato{data.totalCurriculos === 1 ? '' : 's'} analisado
                        {data.totalCurriculos === 1 ? '' : 's'}
                        {vaga && ` · ${vaga}`} · Análise assistida por inteligência artificial
                    </p>
                </div>
                <button type="button" className="btn-secondary" onClick={onNovaAnalise}>
                    Nova análise
                </button>
            </div>

            <div className="seg result-filtro" role="group" aria-label="Filtrar candidatos">
                {FILTROS.map((f) => (
                    <button
                        key={f.id}
                        type="button"
                        aria-pressed={filtro === f.id}
                        onClick={() => setFiltro(f.id)}
                    >
                        {f.rotulo}
                    </button>
                ))}
            </div>

            <div className="card table-card">
                <div className="tabela-scroll">
                    <table className="tabela">
                        <thead>
                            <tr>
                                <th>Candidato</th>
                                <th>Aderência ao perfil</th>
                                <th>Habilidades</th>
                                <th>Currículo</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {linhas.map((item) => {
                                const chave = item.nomeArquivo
                                const expandido = aberto === chave
                                return (
                                    <Fragment key={chave}>
                                        <tr>
                                            <td className="col-candidato">
                                                <button
                                                    type="button"
                                                    aria-expanded={expandido}
                                                    onClick={() => setAberto(expandido ? null : chave)}
                                                >
                                                    {expandido ? (
                                                        <ChevronDown size={15} strokeWidth={1.75} aria-hidden="true" />
                                                    ) : (
                                                        <ChevronRight size={15} strokeWidth={1.75} aria-hidden="true" />
                                                    )}
                                                    {item.nomeCandidato}
                                                </button>
                                            </td>
                                            <td>
                                                <span className="aderencia">
                                                    <span className="pct">{item.score}%</span>
                                                    <span className="bar">
                                                        <span
                                                            style={{
                                                                width: `${Math.min(100, Math.max(0, item.score))}%`,
                                                            }}
                                                        />
                                                    </span>
                                                </span>
                                            </td>
                                            <td className="col-muted">
                                                {item.habilidadesIdentificadas.slice(0, 3).join(', ') || '—'}
                                            </td>
                                            <td className="col-muted">{item.nomeArquivo}</td>
                                            <td>
                                                <span
                                                    className={
                                                        recomendado(item) ? 'badge badge--ok' : 'badge badge--neutro'
                                                    }
                                                >
                                                    {recomendado(item) ? 'Recomendado' : 'Em análise'}
                                                </span>
                                            </td>
                                        </tr>
                                        {expandido && <Detalhe item={item} />}
                                    </Fragment>
                                )
                            })}
                            {linhas.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="vazio">
                                        Nenhum candidato neste filtro.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <p className="result-count">
                Exibindo {linhas.length} de {data.ranking.length} candidatos, ordenados por aderência ao perfil da vaga
            </p>

            <div className="result-nota">
                <Info size={15} strokeWidth={1.75} color="#98a2b3" aria-hidden="true" />
                <p>A análise é um apoio à tomada de decisão e não substitui a avaliação do recrutador.</p>
            </div>
        </>
    )
}
