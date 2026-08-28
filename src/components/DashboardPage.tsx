import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Info, LayoutDashboard } from 'lucide-react'
import type { Candidato } from '../types'
import { getToken } from '../auth'
import { CORTE_RECOMENDADO } from './ResultadoAnalise'

interface Props {
    /** Sessão expirada: derruba para a tela de login. */
    onSessaoExpirada: () => void
    /** Estado vazio: leva o usuário para importar currículos. */
    onIrParaAnalises: () => void
}

/** Quantos candidatos aparecem no ranking do dashboard. */
const TOP_N = 10

interface Posicionado {
    id: string
    nome: string
    score: number
    vaga: string
    dataUtc: string
    analises: number
}

/**
 * Melhor posição de cada candidato: maior score do histórico (empate = análise
 * mais recente), opcionalmente restrito a uma vaga (null = todas as vagas).
 * Ordenado do maior para o menor.
 */
export function melhoresPosicionados(candidatos: Candidato[], vaga: string | null): Posicionado[] {
    const linhas: Posicionado[] = []
    for (const c of candidatos) {
        const hist = vaga === null ? c.historico : c.historico.filter((h) => h.vaga === vaga)
        if (hist.length === 0) continue
        const melhor = hist.reduce((a, b) => (b.score >= a.score ? b : a))
        linhas.push({
            id: c.id,
            nome: c.nome,
            score: melhor.score,
            vaga: melhor.vaga,
            dataUtc: melhor.dataUtc,
            analises: hist.length,
        })
    }
    return linhas.sort((a, b) => b.score - a.score)
}

function dataCurta(iso: string): string {
    const d = new Date(iso)
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR')
}

export default function DashboardPage({ onSessaoExpirada, onIrParaAnalises }: Props) {
    const [candidatos, setCandidatos] = useState<Candidato[] | null>(null)
    const [erro, setErro] = useState<string | null>(null)
    // Filtro por índice da vaga (-1 = todas): títulos são texto livre e poderiam
    // colidir com qualquer valor-sentinela de string.
    const [vagaSel, setVagaSel] = useState(-1)

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

    const vagas = useMemo(() => {
        const nomes = new Set<string>()
        for (const c of candidatos ?? []) for (const h of c.historico) nomes.add(h.vaga)
        return Array.from(nomes)
    }, [candidatos])

    const vagaAtual = vagaSel >= 0 && vagaSel < vagas.length ? vagas[vagaSel] : null

    const ranking = useMemo(
        () => melhoresPosicionados(candidatos ?? [], vagaAtual),
        [candidatos, vagaAtual]
    )

    const totalAnalises = ranking.reduce((soma, r) => soma + r.analises, 0)
    const recomendados = ranking.filter((r) => r.score >= CORTE_RECOMENDADO).length
    const mediaScore =
        ranking.length > 0
            ? Math.round(ranking.reduce((soma, r) => soma + r.score, 0) / ranking.length)
            : 0
    const top = ranking.slice(0, TOP_N)

    return (
        <>
            <div className="breadcrumb">
                <span>Dashboard</span>
                <span>/</span>
                <strong>Visão geral</strong>
            </div>

            <div className="result-head">
                <div>
                    <h1>Dashboard</h1>
                    <p>Acompanhe os candidatos melhores posicionados nas análises realizadas.</p>
                </div>
                {vagas.length > 0 && (
                    <div className="dash-filtro">
                        <label htmlFor="filtro-vaga">Vaga</label>
                        <select
                            id="filtro-vaga"
                            value={String(vagaSel)}
                            onChange={(e) => setVagaSel(Number(e.target.value))}
                        >
                            <option value="-1">Todas as vagas</option>
                            {vagas.map((v, i) => (
                                <option key={v} value={String(i)}>
                                    {v || 'Vaga sem título'}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {erro && (
                <div className="alert alert--erro" role="alert">
                    <AlertTriangle size={15} strokeWidth={1.75} aria-hidden="true" />
                    <span>{erro}</span>
                </div>
            )}

            {!erro && candidatos === null && <p className="page-sub">Carregando dados…</p>}

            {candidatos !== null && candidatos.length === 0 && (
                <div className="card table-card vazio-card">
                    <LayoutDashboard size={20} strokeWidth={1.75} color="#98a2b3" aria-hidden="true" />
                    <p>
                        Ainda não há candidatos analisados. Importe currículos em{' '}
                        <strong>Análises</strong> e o ranking aparece aqui automaticamente.
                    </p>
                    <button type="button" className="btn-secondary" onClick={onIrParaAnalises}>
                        Ir para Análises
                    </button>
                </div>
            )}

            {candidatos !== null && candidatos.length > 0 && (
                <>
                    <div className="kpis">
                        <div className="card kpi">
                            <span className="kpi-label">Candidatos avaliados</span>
                            <span className="kpi-valor">{ranking.length}</span>
                            <span className="kpi-sub">
                                {vagaAtual === null ? 'em todas as vagas' : 'na vaga selecionada'}
                            </span>
                        </div>
                        <div className="card kpi">
                            <span className="kpi-label">Análises realizadas</span>
                            <span className="kpi-valor">{totalAnalises}</span>
                            <span className="kpi-sub">currículos avaliados pela IA</span>
                        </div>
                        <div className="card kpi">
                            <span className="kpi-label">Aderência média</span>
                            <span className="kpi-valor">
                                {ranking.length > 0 ? `${mediaScore}%` : '—'}
                            </span>
                            <span className="kpi-sub">melhor score de cada candidato</span>
                        </div>
                        <div className="card kpi">
                            <span className="kpi-label">Recomendados</span>
                            <span className="kpi-valor">{recomendados}</span>
                            <span className="kpi-sub">aderência de {CORTE_RECOMENDADO}% ou mais</span>
                        </div>
                    </div>

                    <div className="card table-card">
                        <div className="tabela-scroll">
                            <table className="tabela">
                                <thead>
                                    <tr>
                                        <th>Posição</th>
                                        <th>Candidato</th>
                                        <th>Aderência ao perfil</th>
                                        <th>Vaga</th>
                                        <th>Melhor análise</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {top.map((r, i) => (
                                        <tr key={r.id}>
                                            <td>
                                                <span
                                                    className={`pos ${i === 0 ? 'pos--1' : i < 3 ? 'pos--top' : ''}`}
                                                >
                                                    {i + 1}
                                                </span>
                                            </td>
                                            <td className="col-candidato">{r.nome}</td>
                                            <td>
                                                <span className="aderencia">
                                                    <span className="pct">{r.score}%</span>
                                                    <span className="bar">
                                                        <span
                                                            style={{
                                                                width: `${Math.min(100, Math.max(0, r.score))}%`,
                                                            }}
                                                        />
                                                    </span>
                                                </span>
                                            </td>
                                            <td
                                                className="col-muted col-vaga"
                                                title={r.vaga || 'Vaga sem título'}
                                            >
                                                {r.vaga || 'Vaga sem título'}
                                            </td>
                                            <td className="col-muted">{dataCurta(r.dataUtc)}</td>
                                            <td>
                                                <span
                                                    className={
                                                        r.score >= CORTE_RECOMENDADO
                                                            ? 'badge badge--ok'
                                                            : 'badge badge--neutro'
                                                    }
                                                >
                                                    {r.score >= CORTE_RECOMENDADO
                                                        ? 'Recomendado'
                                                        : 'Em análise'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {top.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="vazio">
                                                Nenhuma análise registrada ainda para este filtro.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <p className="result-count">
                        {ranking.length > TOP_N
                            ? `Exibindo os ${TOP_N} melhores de ${ranking.length} candidatos, pelo melhor score de cada um`
                            : `${ranking.length} candidato${ranking.length === 1 ? '' : 's'}, ordenado${ranking.length === 1 ? '' : 's'} pelo melhor score de cada um`}
                    </p>
                </>
            )}

            <div className="result-nota">
                <Info size={15} strokeWidth={1.75} color="#98a2b3" aria-hidden="true" />
                <p>
                    O posicionamento considera o melhor score de cada candidato e é um apoio à
                    decisão, não substitui a avaliação do recrutador.
                </p>
            </div>
        </>
    )
}
