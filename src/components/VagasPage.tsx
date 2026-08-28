import { useEffect, useRef, useState, type FormEvent } from 'react'
import { AlertTriangle, Award, Briefcase, FileText, Info } from 'lucide-react'
import type { CadastroVagaResponse, Candidato, Vaga } from '../types'
import { getToken } from '../auth'
import { abrirCurriculo } from '../curriculo'
import { CORTE_RECOMENDADO } from './ResultadoAnalise'
import { melhoresPosicionados } from './DashboardPage'
import LoadingModal from './LoadingModal'

interface Props {
    /** Sessão expirada: derruba para a tela de login. */
    onSessaoExpirada: () => void
}

function dataCurta(iso: string): string {
    const d = new Date(iso)
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR')
}

export default function VagasPage({ onSessaoExpirada }: Props) {
    const [vagas, setVagas] = useState<Vaga[] | null>(null)
    const [candidatos, setCandidatos] = useState<Candidato[] | null>(null)
    const [titulo, setTitulo] = useState('')
    const [descricao, setDescricao] = useState('')
    const [enviando, setEnviando] = useState(false)
    // Vaga já cadastrada aberta a partir da lista (ranking vem do histórico).
    const [vagaAberta, setVagaAberta] = useState<Vaga | null>(null)
    // Tela padrão é a lista de vagas; "Criar vaga" abre o formulário.
    const [criando, setCriando] = useState(false)
    // Erro do formulário (validação/submit) separado do erro de carregamento das listas.
    const [erro, setErro] = useState<string | null>(null)
    const [erroCarga, setErroCarga] = useState<string | null>(null)
    const [resultado, setResultado] = useState<CadastroVagaResponse | null>(null)
    // Invalida respostas atrasadas de cargas anteriores (o carregar() roda no mount e pós-cadastro).
    const geracaoRef = useRef(0)

    function carregar() {
        const token = getToken()
        if (!token) {
            onSessaoExpirada()
            return
        }
        const geracao = ++geracaoRef.current
        setErroCarga(null)
        const headers = { Authorization: `Bearer ${token}` }
        const tratar = async (resp: Response) => {
            if (resp.status === 401) {
                onSessaoExpirada()
                return null
            }
            if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${await resp.text()}`)
            return resp.json()
        }
        fetch('/api/vagas', { headers })
            .then(tratar)
            .then((data: Vaga[] | null) => {
                if (data && geracao === geracaoRef.current) setVagas(data)
            })
            .catch((err) => {
                if (geracao === geracaoRef.current) setErroCarga(err.message ?? 'Erro desconhecido')
            })
        fetch('/api/candidatos', { headers })
            .then(tratar)
            .then((data: Candidato[] | null) => {
                if (data && geracao === geracaoRef.current) setCandidatos(data)
            })
            .catch((err) => {
                if (geracao === geracaoRef.current) setErroCarga(err.message ?? 'Erro desconhecido')
            })
    }

    useEffect(() => {
        carregar()
        // ponytail: busca uma vez ao abrir a página; recarregar = navegar de novo
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    async function onSubmit(e: FormEvent) {
        e.preventDefault()
        setErro(null)

        if (!titulo.trim()) {
            setErro('Informe o título da vaga.')
            return
        }
        if (!descricao.trim()) {
            setErro('Descreva a vaga e os requisitos.')
            return
        }

        const token = getToken()
        if (!token) {
            onSessaoExpirada()
            return
        }

        setEnviando(true)
        try {
            const resp = await fetch('/api/vagas', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ titulo, descricao }),
            })
            if (resp.status === 401) {
                onSessaoExpirada()
                return
            }
            if (!resp.ok) {
                let mensagem = `HTTP ${resp.status}`
                try {
                    const data = await resp.json()
                    if (data?.erro) mensagem = data.erro
                } catch {
                    // corpo não-JSON — fica a mensagem com o status
                }
                throw new Error(mensagem)
            }
            const data: CadastroVagaResponse = await resp.json()
            setResultado(data)
            setCriando(false)
            setTitulo('')
            setDescricao('')
            carregar() // a vaga nova e o histórico dos candidatos mudaram
        } catch (err: any) {
            setErro(err.message ?? 'Erro desconhecido')
        } finally {
            setEnviando(false)
        }
    }

    /** Candidato do cadastro dono deste id, se tiver currículo armazenado. */
    function candidatoComCurriculo(candidatoId: string): Candidato | null {
        const c = (candidatos ?? []).find((x) => x.id === candidatoId)
        return c?.curriculoArquivo ? c : null
    }

    async function verCurriculo(candidatoId: string) {
        const c = candidatoComCurriculo(candidatoId)
        if (!c) return
        setErro(null)
        try {
            if ((await abrirCurriculo(c.id, c.nomeArquivo)) === 'sem-sessao') onSessaoExpirada()
        } catch (err: any) {
            setErro(err.message ?? 'Erro desconhecido')
        }
    }

    // ── Resultado do cadastro: candidato ideal + ranking completo ──
    if (resultado) {
        const [ideal, ...demais] = resultado.ranking
        return (
            <>
                <div className="breadcrumb">
                    <span>Vagas</span>
                    <span>/</span>
                    <strong>Vaga cadastrada</strong>
                </div>

                <div className="result-head">
                    <div>
                        <h1>{resultado.vaga.titulo}</h1>
                        <p>
                            Vaga cadastrada em {dataCurta(resultado.vaga.criadaEmUtc)} ·{' '}
                            {resultado.totalCandidatos} candidato
                            {resultado.totalCandidatos === 1 ? '' : 's'} do cadastro analisado
                            {resultado.totalCandidatos === 1 ? '' : 's'}
                        </p>
                    </div>
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setResultado(null)}
                    >
                        Voltar para Vagas
                    </button>
                </div>

                {erroCarga && (
                    <div className="alert alert--erro" role="alert">
                        <AlertTriangle size={15} strokeWidth={1.75} aria-hidden="true" />
                        <span>{erroCarga}</span>
                    </div>
                )}
                {erro && (
                    <div className="alert alert--erro" role="alert">
                        <AlertTriangle size={15} strokeWidth={1.75} aria-hidden="true" />
                        <span>{erro}</span>
                    </div>
                )}

                {ideal ? (
                    <div className="card ideal-card">
                        <span className="ideal-rotulo">
                            <Award size={16} strokeWidth={1.75} aria-hidden="true" />
                            Candidato ideal para esta vaga
                        </span>
                        <div className="ideal-linha">
                            <strong className="ideal-nome">{ideal.nome}</strong>
                            <span className="aderencia">
                                <span className="pct">{ideal.score}%</span>
                                <span className="bar">
                                    <span
                                        style={{
                                            width: `${Math.min(100, Math.max(0, ideal.score))}%`,
                                        }}
                                    />
                                </span>
                            </span>
                            <span
                                className={
                                    ideal.score >= CORTE_RECOMENDADO
                                        ? 'badge badge--ok'
                                        : 'badge badge--neutro'
                                }
                            >
                                {ideal.score >= CORTE_RECOMENDADO ? 'Recomendado' : 'Em análise'}
                            </span>
                            {candidatoComCurriculo(ideal.candidatoId) ? (
                                <button
                                    type="button"
                                    className="btn-secondary btn-curriculo"
                                    onClick={() => verCurriculo(ideal.candidatoId)}
                                >
                                    <FileText size={15} strokeWidth={1.75} aria-hidden="true" />
                                    Ver currículo
                                </button>
                            ) : (
                                <span className="detalhe-sem-arquivo">
                                    Currículo não disponível — reimporte o currículo em Análises
                                    para anexá-lo ao cadastro.
                                </span>
                            )}
                        </div>
                        {ideal.resumo && <p className="ideal-resumo">{ideal.resumo}</p>}
                    </div>
                ) : (
                    <div className="card table-card vazio-card">
                        <Briefcase size={20} strokeWidth={1.75} color="#98a2b3" aria-hidden="true" />
                        {resultado.totalCandidatos > 0 ? (
                            <p>
                                A vaga foi cadastrada, mas nenhuma análise pôde ser concluída
                                agora. Tente novamente mais tarde.
                            </p>
                        ) : (
                            <p>
                                A vaga foi cadastrada, mas ainda não há candidatos no cadastro
                                para comparar. Importe currículos em <strong>Análises</strong>.
                            </p>
                        )}
                    </div>
                )}

                {demais.length > 0 && (
                    <div className="card table-card">
                        <div className="tabela-scroll">
                            <table className="tabela">
                                <thead>
                                    <tr>
                                        <th>Posição</th>
                                        <th>Candidato</th>
                                        <th>Aderência ao perfil</th>
                                        <th>Status</th>
                                        <th>Currículo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {demais.map((r, i) => (
                                        <tr key={r.candidatoId}>
                                            <td>
                                                {/* posições 2 e 3 mantêm o destaque de top 3 do Dashboard */}
                                                <span className={`pos ${i < 2 ? 'pos--top' : ''}`}>
                                                    {i + 2}
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
                                            <td>
                                                {candidatoComCurriculo(r.candidatoId) ? (
                                                    <button
                                                        type="button"
                                                        className="btn-icon"
                                                        aria-label={`Ver currículo de ${r.nome}`}
                                                        title="Ver currículo"
                                                        onClick={() => verCurriculo(r.candidatoId)}
                                                    >
                                                        <FileText size={16} strokeWidth={1.75} aria-hidden="true" />
                                                    </button>
                                                ) : (
                                                    <span className="col-muted">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="result-nota">
                    <Info size={15} strokeWidth={1.75} color="#98a2b3" aria-hidden="true" />
                    <p>
                        Os candidatos do cadastro foram analisados contra a descrição desta vaga.
                        O resultado também entra no histórico de cada um e no Dashboard.
                    </p>
                </div>
            </>
        )
    }

    // ── Vaga já cadastrada, aberta a partir da lista ──
    if (vagaAberta) {
        const linhas = melhoresPosicionados(candidatos ?? [], vagaAberta.titulo)
        const [ideal, ...demais] = linhas
        return (
            <>
                <div className="breadcrumb">
                    <span>Vagas</span>
                    <span>/</span>
                    <strong>{vagaAberta.titulo}</strong>
                </div>

                <div className="result-head">
                    <div>
                        <h1>{vagaAberta.titulo}</h1>
                        <p>
                            Vaga cadastrada em {dataCurta(vagaAberta.criadaEmUtc)} ·{' '}
                            {linhas.length} candidato{linhas.length === 1 ? '' : 's'} no ranking
                        </p>
                    </div>
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setVagaAberta(null)}
                    >
                        Voltar para Vagas
                    </button>
                </div>

                {erroCarga && (
                    <div className="alert alert--erro" role="alert">
                        <AlertTriangle size={15} strokeWidth={1.75} aria-hidden="true" />
                        <span>{erroCarga}</span>
                    </div>
                )}
                {erro && (
                    <div className="alert alert--erro" role="alert">
                        <AlertTriangle size={15} strokeWidth={1.75} aria-hidden="true" />
                        <span>{erro}</span>
                    </div>
                )}

                <details className="vaga-descricao">
                    <summary>Descrição da vaga</summary>
                    <p>{vagaAberta.descricao}</p>
                </details>

                {ideal ? (
                    <div className="card ideal-card">
                        <span className="ideal-rotulo">
                            <Award size={16} strokeWidth={1.75} aria-hidden="true" />
                            Candidato ideal para esta vaga
                        </span>
                        <div className="ideal-linha">
                            <strong className="ideal-nome">{ideal.nome}</strong>
                            <span className="aderencia">
                                <span className="pct">{ideal.score}%</span>
                                <span className="bar">
                                    <span
                                        style={{
                                            width: `${Math.min(100, Math.max(0, ideal.score))}%`,
                                        }}
                                    />
                                </span>
                            </span>
                            <span
                                className={
                                    ideal.score >= CORTE_RECOMENDADO
                                        ? 'badge badge--ok'
                                        : 'badge badge--neutro'
                                }
                            >
                                {ideal.score >= CORTE_RECOMENDADO ? 'Recomendado' : 'Em análise'}
                            </span>
                            {candidatoComCurriculo(ideal.id) ? (
                                <button
                                    type="button"
                                    className="btn-secondary btn-curriculo"
                                    onClick={() => verCurriculo(ideal.id)}
                                >
                                    <FileText size={15} strokeWidth={1.75} aria-hidden="true" />
                                    Ver currículo
                                </button>
                            ) : (
                                <span className="detalhe-sem-arquivo">
                                    Currículo não disponível — reimporte o currículo em Análises
                                    para anexá-lo ao cadastro.
                                </span>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="card table-card vazio-card">
                        <Briefcase size={20} strokeWidth={1.75} color="#98a2b3" aria-hidden="true" />
                        <p>Nenhuma análise registrada para esta vaga ainda.</p>
                    </div>
                )}

                {demais.length > 0 && (
                    <div className="card table-card">
                        <div className="tabela-scroll">
                            <table className="tabela">
                                <thead>
                                    <tr>
                                        <th>Posição</th>
                                        <th>Candidato</th>
                                        <th>Aderência ao perfil</th>
                                        <th>Status</th>
                                        <th>Currículo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {demais.map((r, i) => (
                                        <tr key={r.id}>
                                            <td>
                                                <span className={`pos ${i < 2 ? 'pos--top' : ''}`}>
                                                    {i + 2}
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
                                            <td>
                                                {candidatoComCurriculo(r.id) ? (
                                                    <button
                                                        type="button"
                                                        className="btn-icon"
                                                        aria-label={`Ver currículo de ${r.nome}`}
                                                        title="Ver currículo"
                                                        onClick={() => verCurriculo(r.id)}
                                                    >
                                                        <FileText size={16} strokeWidth={1.75} aria-hidden="true" />
                                                    </button>
                                                ) : (
                                                    <span className="col-muted">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="result-nota">
                    <Info size={15} strokeWidth={1.75} color="#98a2b3" aria-hidden="true" />
                    <p>
                        Ranking montado a partir do melhor score de cada candidato nas análises
                        desta vaga. Novos currículos importados contra ela entram aqui.
                    </p>
                </div>
            </>
        )
    }

    // ── Lista de todas as vagas (tela padrão) ──
    if (!criando) {
        return (
            <>
                <div className="breadcrumb">
                    <span>Vagas</span>
                    <span>/</span>
                    <strong>Todas as vagas</strong>
                </div>

                <div className="result-head">
                    <div>
                        <h1>Vagas</h1>
                        <p>
                            Vagas cadastradas e o candidato ideal de cada uma. Clique numa vaga
                            para ver o ranking completo.
                        </p>
                    </div>
                    <button type="button" className="btn-primary" onClick={() => setCriando(true)}>
                        Criar vaga
                    </button>
                </div>

                {erroCarga && (
                    <div className="alert alert--erro" role="alert">
                        <AlertTriangle size={15} strokeWidth={1.75} aria-hidden="true" />
                        <span>{erroCarga}</span>
                    </div>
                )}
                {erro && (
                    <div className="alert alert--erro" role="alert">
                        <AlertTriangle size={15} strokeWidth={1.75} aria-hidden="true" />
                        <span>{erro}</span>
                    </div>
                )}

                {vagas === null && !erroCarga && <p className="page-sub">Carregando vagas…</p>}

                {vagas !== null && vagas.length === 0 && (
                    <div className="card table-card vazio-card">
                        <Briefcase size={20} strokeWidth={1.75} color="#98a2b3" aria-hidden="true" />
                        <p>Nenhuma vaga cadastrada ainda.</p>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setCriando(true)}
                        >
                            Criar vaga
                        </button>
                    </div>
                )}

                {vagas !== null && vagas.length > 0 && (
                    <>
                        <div className="card table-card">
                            <div className="tabela-scroll">
                                <table className="tabela">
                                    <thead>
                                        <tr>
                                            <th>Vaga</th>
                                            <th>Cadastrada em</th>
                                            <th>Candidatos</th>
                                            <th>Candidato ideal</th>
                                            <th>Currículo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vagas.map((v) => {
                                            const linhas = melhoresPosicionados(candidatos ?? [], v.titulo)
                                            const ideal = linhas[0]
                                            return (
                                                <tr key={v.id}>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="vaga-abrir"
                                                            title={v.titulo}
                                                            onClick={() => setVagaAberta(v)}
                                                        >
                                                            {v.titulo}
                                                        </button>
                                                    </td>
                                                    <td className="col-muted">{dataCurta(v.criadaEmUtc)}</td>
                                                    <td className="col-muted">
                                                        {candidatos === null ? '…' : linhas.length}
                                                    </td>
                                                    <td>
                                                        {candidatos === null ? (
                                                            <span className="col-muted">Carregando…</span>
                                                        ) : ideal ? (
                                                            <span className="aderencia">
                                                                <span>{ideal.nome}</span>
                                                                <span className="pct">{ideal.score}%</span>
                                                            </span>
                                                        ) : (
                                                            <span className="col-muted">Sem candidatos analisados</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {ideal && candidatoComCurriculo(ideal.id) ? (
                                                            <button
                                                                type="button"
                                                                className="btn-icon"
                                                                aria-label={`Ver currículo de ${ideal.nome}`}
                                                                title="Ver currículo"
                                                                onClick={() => verCurriculo(ideal.id)}
                                                            >
                                                                <FileText size={16} strokeWidth={1.75} aria-hidden="true" />
                                                            </button>
                                                        ) : (
                                                            <span className="col-muted">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <p className="result-count">
                            {vagas.length} vaga{vagas.length === 1 ? '' : 's'} cadastrada
                            {vagas.length === 1 ? '' : 's'}
                        </p>
                    </>
                )}

                <div className="result-nota">
                    <Info size={15} strokeWidth={1.75} aria-hidden="true" />
                    <p>
                        Ao cadastrar uma vaga, todos os candidatos do cadastro são analisados
                        contra ela pela IA e o ranking também aparece no Dashboard.
                    </p>
                </div>
            </>
        )
    }

    // ── Nova vaga (formulário) ──
    return (
        <>
            <div className="breadcrumb">
                <span>Vagas</span>
                <span>/</span>
                <strong>Nova vaga</strong>
            </div>
            <div className="result-head">
                <div>
                    <h1>Nova vaga</h1>
                    <p>Cadastre a vaga e veja na hora qual candidato do cadastro é o ideal para ela.</p>
                </div>
                <button type="button" className="btn-secondary" onClick={() => setCriando(false)}>
                    Voltar para Vagas
                </button>
            </div>

            {erroCarga && (
                <div className="alert alert--erro" role="alert">
                    <AlertTriangle size={15} strokeWidth={1.75} aria-hidden="true" />
                    <span>{erroCarga}</span>
                </div>
            )}

            <div className="layout">
                <form onSubmit={onSubmit} className="card form-card">
                    <div className="bloco">
                        <label className="section-label" htmlFor="vaga-titulo">
                            Título da vaga
                        </label>
                        <input
                            id="vaga-titulo"
                            className="input"
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            maxLength={70}
                            placeholder="Ex.: Analista de Planejamento Sênior"
                            disabled={enviando}
                        />
                    </div>

                    <div className="bloco">
                        <label className="section-label" htmlFor="vaga-descricao">
                            Descrição e requisitos
                        </label>
                        <textarea
                            id="vaga-descricao"
                            className="textarea"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            rows={10}
                            placeholder="Cole aqui a descrição completa da vaga, requisitos obrigatórios e desejáveis…"
                            disabled={enviando}
                        />
                    </div>

                    {erro && (
                        <div className="alert alert--erro" role="alert">
                            <AlertTriangle size={15} strokeWidth={1.75} aria-hidden="true" />
                            <span>{erro}</span>
                        </div>
                    )}

                    <div className="card-actions">
                        <button type="submit" className="btn-primary" disabled={enviando}>
                            {enviando ? (
                                <>
                                    <span className="spinner" aria-hidden="true" />
                                    Analisando candidatos…
                                </>
                            ) : (
                                'Cadastrar vaga'
                            )}
                        </button>
                    </div>
                </form>

                <aside className="aside-col">
                    <div className="nota">
                        <Info size={15} strokeWidth={1.75} color="#98a2b3" aria-hidden="true" />
                        <p>
                            Ao cadastrar, todos os candidatos do cadastro são analisados contra a
                            vaga pela IA. O ranking completo por vaga fica no Dashboard.
                        </p>
                    </div>
                </aside>
            </div>

            {enviando && <LoadingModal totalCurriculos={candidatos?.length ?? 0} />}
        </>
    )
}
