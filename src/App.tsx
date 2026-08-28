import { useRef, useState, type FormEvent, type ChangeEvent, type DragEvent } from "react";
import { AlertTriangle, FileText, Info, Upload } from "lucide-react";
import type { AnaliseResponse } from "./types";
import AppHeader, { type Secao } from "./components/AppHeader";
import CandidatosPage from "./components/CandidatosPage";
import DashboardPage from "./components/DashboardPage";
import VagasPage from "./components/VagasPage";
import ResultadoAnalise from "./components/ResultadoAnalise";
import LoginScreen from "./components/LoginScreen";
import LoadingModal from "./components/LoadingModal";
import { getToken, getUsuarioLogado, limparSessao, salvarSessao, type LoginResponse } from "./auth";

const EXEMPLO_VAGA = `Analista de Planejamento Sênior
Requisitos obrigatórios:
- 5+ anos de experiência em Planejamento e Controle de Produção (PCP) no setor industrial/metalúrgico
- Conhecimento em processos de fundição, laminação ou usinagem
- Excel avançado (tabelas dinâmicas, macros, modelagem de dados)
- ERP (SAP, TOTVS Protheus ou similar)
- Elaboração de indicadores de produção (OEE, produtividade, giro de estoque)

Requisitos desejáveis:
- Power BI ou outras ferramentas de BI
- Metodologias de melhoria contínua (Lean, Six Sigma, Kaizen)
- Conhecimento em MRP/MPS e gestão de capacidade produtiva
- Inglês intermediário`;

// Máximo de currículos por análise — mantenha em sincronia com "Limites:MaxCurriculosPorAnalise" no backend
const MAX_CURRICULOS = 100;

export default function App() {
    const [descricaoVaga, setDescricaoVaga] = useState(EXEMPLO_VAGA);
    const [arquivos, setArquivos] = useState<File[]>([]);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [resultado, setResultado] = useState<AnaliseResponse | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const inputArquivos = useRef<HTMLInputElement>(null);

    // Autenticação: a sessão JWT fica persistida no localStorage.
    const [autenticado, setAutenticado] = useState(() => getToken() !== null);
    const [usuarioLogado, setUsuarioLogado] = useState<string | null>(getUsuarioLogado);
    const [avisoLogin, setAvisoLogin] = useState<string | null>(null);
    const [secao, setSecao] = useState<Secao>("analises");

    function handleSessaoExpirada() {
        limparSessao();
        setAutenticado(false);
        setAvisoLogin("Sua sessão expirou. Entre novamente para continuar.");
    }

    function handleLoginSucesso(resposta: LoginResponse) {
        salvarSessao(resposta);
        setUsuarioLogado(resposta.usuario);
        setAvisoLogin(null);
        setAutenticado(true);
    }

    function handleLogout() {
        limparSessao();
        setAutenticado(false);
        setUsuarioLogado(null);
        setResultado(null);
        setErro(null);
        setSecao("analises"); // próximo login recomeça no fluxo padrão
    }

    function onFileChange(e: ChangeEvent<HTMLInputElement>) {
        if (e.target.files) adicionarArquivos(Array.from(e.target.files));
    }

    function adicionarArquivos(novos: File[]) {
        const validos = novos.filter((f) => /\.(pdf|docx|txt)$/i.test(f.name));
        setArquivos((prev) => {
            const nomes = new Set(prev.map((p) => p.name));
            const novosUnicos = validos.filter((v) => !nomes.has(v.name));
            const vagas = Math.max(0, MAX_CURRICULOS - prev.length);
            const aceitos = novosUnicos.slice(0, vagas);

            let erro: string | null = null;
            if (novosUnicos.length > vagas) {
                erro = `Máximo de ${MAX_CURRICULOS} currículos por análise. Excedentes ignorados.`;
            } else if (validos.length !== novos.length) {
                erro = "Alguns arquivos foram ignorados (aceitos: PDF, DOCX, TXT)";
            }
            setErro(erro);

            return [...prev, ...aceitos];
        });
    }

    function limparArquivos() {
        setArquivos([]);
        setErro(null);
        if (inputArquivos.current) inputArquivos.current.value = "";
    }

    function onDrag(e: DragEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    }

    function onDrop(e: DragEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.length) adicionarArquivos(Array.from(e.dataTransfer.files));
    }

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setErro(null);
        setResultado(null);

        if (!descricaoVaga.trim()) {
            setErro("Descreva a vaga.");
            return;
        }
        if (arquivos.length === 0) {
            setErro("Envie ao menos 1 currículo.");
            return;
        }

        const token = getToken();
        if (!token) {
            setAutenticado(false);
            setAvisoLogin("Sua sessão expirou. Entre novamente para continuar.");
            return;
        }

        const fd = new FormData();
        fd.append("descricaoVaga", descricaoVaga);
        arquivos.forEach((a) => fd.append("curriculos", a));

        setCarregando(true);
        try {
            const resp = await fetch("/api/analisar", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            if (resp.status === 401) {
                limparSessao();
                setAutenticado(false);
                setAvisoLogin("Sua sessão expirou. Entre novamente para continuar.");
                return;
            }
            if (!resp.ok) {
                const txt = await resp.text();
                throw new Error(`HTTP ${resp.status}: ${txt}`);
            }
            const data: AnaliseResponse = await resp.json();
            setResultado(data);
        } catch (err: any) {
            setErro(err.message ?? "Erro desconhecido");
        } finally {
            setCarregando(false);
        }
    }

    if (!autenticado) {
        return <LoginScreen onLogin={handleLoginSucesso} aviso={avisoLogin} />;
    }

    const header = (
        <AppHeader usuario={usuarioLogado} onSair={handleLogout} secao={secao} onNavegar={setSecao} />
    );

    // Dashboard — ranking dos candidatos melhores posicionados
    if (secao === "dashboard") {
        return (
            <>
                {header}
                <main className="page">
                    <DashboardPage
                        onSessaoExpirada={handleSessaoExpirada}
                        onIrParaAnalises={() => setSecao("analises")}
                    />
                </main>
            </>
        );
    }

    // Cadastro de vagas — ao cadastrar, mostra o candidato ideal do cadastro
    if (secao === "vagas") {
        return (
            <>
                {header}
                <main className="page">
                    <VagasPage onSessaoExpirada={handleSessaoExpirada} />
                </main>
            </>
        );
    }

    // Cadastro de candidatos (perfis salvos a cada currículo analisado)
    if (secao === "candidatos") {
        return (
            <>
                {header}
                <main className="page">
                    <CandidatosPage onSessaoExpirada={handleSessaoExpirada} />
                </main>
            </>
        );
    }

    // Tela 3 — resultado da análise
    if (resultado) {
        return (
            <>
                {header}
                <main className="page">
                    <ResultadoAnalise data={resultado} onNovaAnalise={() => setResultado(null)} />
                </main>
            </>
        );
    }

    // Tela 2 — nova análise
    const nomesResumidos =
        arquivos.length <= 2
            ? arquivos.map((a) => a.name).join(", ")
            : `${arquivos[0].name}, ${arquivos[1].name} e mais ${arquivos.length - 2}`;

    return (
        <>
            {header}

            <main className="page">
                <div className="breadcrumb">
                    <span>Análises</span>
                    <span>/</span>
                    <strong>Nova análise</strong>
                </div>
                <h1>Nova análise</h1>
                <p className="page-sub">Avalie candidatos de acordo com os requisitos da vaga.</p>

                <div className="layout">
                    <form onSubmit={onSubmit} className="card form-card">
                        <div className="bloco">
                            <label className="section-label" htmlFor="descricao-vaga">
                                Descrição da vaga
                            </label>
                            <textarea
                                id="descricao-vaga"
                                className="textarea"
                                value={descricaoVaga}
                                onChange={(e) => setDescricaoVaga(e.target.value)}
                                rows={11}
                                placeholder="Cole aqui a descrição completa da vaga, requisitos obrigatórios e desejáveis…"
                                disabled={carregando}
                            />
                        </div>

                        <div className="bloco">
                            <span className="section-label" id="label-curriculos">
                                Currículos
                            </span>
                            <div
                                className={`dropzone ${dragActive ? "active" : ""}`}
                                onDragEnter={onDrag}
                                onDragLeave={onDrag}
                                onDragOver={onDrag}
                                onDrop={onDrop}
                                onClick={() => inputArquivos.current?.click()}
                                role="button"
                                tabIndex={0}
                                aria-labelledby="label-curriculos"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        inputArquivos.current?.click();
                                    }
                                }}
                            >
                                <input
                                    ref={inputArquivos}
                                    type="file"
                                    multiple
                                    accept=".pdf,.docx,.txt"
                                    onChange={onFileChange}
                                    disabled={carregando}
                                    id="file-input"
                                    aria-label="Currículos"
                                />
                                <span className="tile" aria-hidden="true">
                                    <Upload size={20} strokeWidth={1.75} color="#1f4e79" />
                                </span>
                                <span>
                                    Arraste os arquivos para esta área ou{" "}
                                    <span className="destaque">selecione no computador</span>
                                </span>
                                <small>PDF, DOCX ou TXT · Até {MAX_CURRICULOS} arquivos</small>
                            </div>

                            {arquivos.length > 0 && (
                                <div className="file-summary">
                                    <FileText size={16} strokeWidth={1.75} color="#1f4e79" aria-hidden="true" />
                                    <span className="qtd">
                                        {arquivos.length} arquivo{arquivos.length === 1 ? "" : "s"} selecionado
                                        {arquivos.length === 1 ? "" : "s"}
                                    </span>
                                    <span className="nomes">{nomesResumidos}</span>
                                    <button type="button" onClick={limparArquivos} disabled={carregando}>
                                        Remover
                                    </button>
                                </div>
                            )}
                        </div>

                        {erro && (
                            <div className="alert alert--erro" role="alert">
                                <AlertTriangle size={15} strokeWidth={1.75} aria-hidden="true" />
                                <span>{erro}</span>
                            </div>
                        )}

                        <div className="card-actions">
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={carregando || arquivos.length === 0}
                            >
                                {carregando ? (
                                    <>
                                        <span className="spinner" aria-hidden="true" />
                                        Analisando currículos…
                                    </>
                                ) : (
                                    "Iniciar análise"
                                )}
                            </button>
                        </div>
                    </form>

                    <aside className="aside-col">
                        <div className="card steps-card">
                            <span className="section-label">Processo</span>
                            <div className="step">
                                <span className="step-num">1</span>
                                <span className="step-label">Descrição da vaga</span>
                                <span className="step-status">
                                    {descricaoVaga.trim() ? "Concluído" : "Pendente"}
                                </span>
                            </div>
                            <div className="step">
                                <span className="step-num">2</span>
                                <span className="step-label">Currículos</span>
                                <span className="step-status">
                                    {arquivos.length > 0
                                        ? `${arquivos.length} arquivo${arquivos.length === 1 ? "" : "s"}`
                                        : "Pendente"}
                                </span>
                            </div>
                            <div className="step">
                                <span className="step-num">3</span>
                                <span className="step-label">Análise de compatibilidade</span>
                                <span className="step-status">{carregando ? "Em curso" : "Aguardando"}</span>
                            </div>
                        </div>

                        <div className="nota">
                            <Info size={15} strokeWidth={1.75} color="#98a2b3" aria-hidden="true" />
                            <p>
                                Avaliação automatizada dos currículos em relação aos requisitos da vaga,
                                assistida por inteligência artificial.
                            </p>
                        </div>
                    </aside>
                </div>
            </main>

            {carregando && <LoadingModal totalCurriculos={arquivos.length} />}
        </>
    );
}
