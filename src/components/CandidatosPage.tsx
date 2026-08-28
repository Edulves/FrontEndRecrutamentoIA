import { Fragment, useEffect, useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronRight, Info, Users } from 'lucide-react'
import type { Candidato } from '../types'
import { getToken } from '../auth'

interface Props {
    /** Sessão expirada: derruba para a tela de login. */
    onSessaoExpirada: () => void
}

function dataCurta(iso: string): string {
    const d = new Date(iso)
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR')
}

function Detalhe({ c }: { c: Candidato }) {
    return (
        <tr className="detalhe">
            <td colSpan={5}>
                {c.resumo && <p className="resumo">{c.resumo}</p>}
                <div className="colunas">
                    {c.experiencias.length > 0 && (
                        <div>
                            <h4>Experiências</h4>
                            <ul>
                                {c.experiencias.map((e) => (
                                    <li key={e}>{e}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {c.formacao.length > 0 && (
                        <div>
                            <h4>Formação</h4>
                            <ul>
                                {c.formacao.map((f) => (
                                    <li key={f}>{f}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {c.pontosFortes.length > 0 && (
                        <div>
                            <h4>Pontos fortes</h4>
                            <ul>
                                {c.pontosFortes.map((p) => (
                                    <li key={p}>{p}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {c.habilidades.length > 0 && (
                        <div>
                            <h4>Habilidades</h4>
                            <div className="chips">
                                {c.habilidades.map((h) => (
                                    <span key={h} className="chip">
                                        {h}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {c.historico.length > 0 && (
                        <div>
                            <h4>Histórico de análises</h4>
                            <ul>
                                {c.historico.map((h, i) => (
                                    <li key={i}>
                                        {dataCurta(h.dataUtc)} · {h.vaga || 'Vaga sem título'} · {h.score}%
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    )
}

export default function CandidatosPage({ onSessaoExpirada }: Props) {
    const [candidatos, setCandidatos] = useState<Candidato[] | null>(null)
    const [erro, setErro] = useState<string | null>(null)
    const [aberto, setAberto] = useState<string | null>(null)

    useEffect(() => {
        const token = getToken()
        if (!token) {
            onSessaoExpirada()
            return
        }
        let ativo = true
        fetch('/api/candidatos', { headers: { Authorization: `Bearer ${token}` } })
            .then(async (resp) => {
                if (resp.status === 401) {
                    onSessaoExpirada()
                    return
                }
                if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${await resp.text()}`)
                const data: Candidato[] = await resp.json()
                if (ativo) setCandidatos(data)
            })
            .catch((err) => {
                if (ativo) setErro(err.message ?? 'Erro desconhecido')
            })
        return () => {
            ativo = false
        }
        // ponytail: busca uma vez ao abrir a página; recarregar = navegar de novo
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <>
            <div className="breadcrumb">
                <span>Candidatos</span>
                <span>/</span>
                <strong>Cadastro</strong>
            </div>

            <div className="result-head">
                <div>
                    <h1>Candidatos</h1>
                    <p>
                        Perfis salvos automaticamente a cada currículo analisado, com as áreas em que
                        cada candidato se destaca.
                    </p>
                </div>
            </div>

            {erro && (
                <div className="alert alert--erro" role="alert">
                    <AlertTriangle size={15} strokeWidth={1.75} aria-hidden="true" />
                    <span>{erro}</span>
                </div>
            )}

            {!erro && candidatos === null && <p className="page-sub">Carregando candidatos…</p>}

            {candidatos !== null && candidatos.length === 0 && (
                <div className="card table-card vazio-card">
                    <Users size={20} strokeWidth={1.75} color="#98a2b3" aria-hidden="true" />
                    <p>
                        Nenhum candidato salvo ainda. Importe currículos em <strong>Análises</strong>{' '}
                        e os perfis aparecem aqui automaticamente.
                    </p>
                </div>
            )}

            {candidatos !== null && candidatos.length > 0 && (
                <>
                    <div className="card table-card">
                        <div className="tabela-scroll">
                            <table className="tabela">
                                <thead>
                                    <tr>
                                        <th>Candidato</th>
                                        <th>Bom para</th>
                                        <th>Contato</th>
                                        <th>Cidade</th>
                                        <th>Última análise</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {candidatos.map((c) => {
                                        const expandido = aberto === c.id
                                        const ultima = c.historico[c.historico.length - 1]
                                        return (
                                            <Fragment key={c.id}>
                                                <tr>
                                                    <td className="col-candidato">
                                                        <button
                                                            type="button"
                                                            aria-expanded={expandido}
                                                            onClick={() => setAberto(expandido ? null : c.id)}
                                                        >
                                                            {expandido ? (
                                                                <ChevronDown size={15} strokeWidth={1.75} aria-hidden="true" />
                                                            ) : (
                                                                <ChevronRight size={15} strokeWidth={1.75} aria-hidden="true" />
                                                            )}
                                                            {c.nome}
                                                        </button>
                                                    </td>
                                                    <td>
                                                        {c.areasAptidao.length > 0 ? (
                                                            <div className="chips">
                                                                {c.areasAptidao.map((a) => (
                                                                    <span key={a} className="chip chip--area">
                                                                        {a}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            '—'
                                                        )}
                                                    </td>
                                                    <td className="col-muted">
                                                        {[c.email, c.telefone].filter(Boolean).join(' · ') || '—'}
                                                    </td>
                                                    <td className="col-muted">{c.cidade || '—'}</td>
                                                    <td className="col-muted">
                                                        {ultima
                                                            ? `${dataCurta(ultima.dataUtc)} · ${ultima.score}%`
                                                            : '—'}
                                                    </td>
                                                </tr>
                                                {expandido && <Detalhe c={c} />}
                                            </Fragment>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <p className="result-count">
                        {candidatos.length} candidato{candidatos.length === 1 ? '' : 's'} no cadastro
                    </p>
                </>
            )}

            <div className="result-nota">
                <Info size={15} strokeWidth={1.75} color="#98a2b3" aria-hidden="true" />
                <p>As áreas de aptidão são sugeridas pela IA a partir do currículo e não substituem a avaliação do recrutador.</p>
            </div>
        </>
    )
}
