import { useState, type FormEvent, type ChangeEvent, type DragEvent } from "react";
import type { AnaliseResponse } from "./types";
import RankingList from "./components/RankingList";

const EXEMPLO_VAGA = `Analista de Planejamento Sênior
Requisitos obrigatórios:
- 5+ anos de experiência em Planejamento e Controle de Produção (PCP) no setor industrial/metalúrgico
- Conhecimento em processos de fundição, laminação ou usinagem
- Excel avançado (tabelas dinâmicas, macros, modelagem de dados)
- ERP (SAP, TOTVS Protheus ou similar)
- Elaboração de indicadores de produção (OEE, produtividade, giro de estoque)

Diferenciais:
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

    function removerArquivo(nome: string) {
        setArquivos((prev) => prev.filter((a) => a.name !== nome));
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

        const fd = new FormData();
        fd.append("descricaoVaga", descricaoVaga);
        arquivos.forEach((a) => fd.append("curriculos", a));

        // A API exige o cabeçalho X-Api-Key (configurável via .env.local -> VITE_API_KEY).
        const apiKey = import.meta.env.VITE_API_KEY as string | undefined;

        setCarregando(true);
        try {
            const resp = await fetch("/api/analisar", {
                method: "POST",
                headers: apiKey ? { "X-Api-Key": apiKey } : undefined,
                body: fd,
            });
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

    return (
        <div className="app">
            <header className="header">
                <h1>🎯 Recrutamento IA</h1>
                <p>Envie currículos e a IA gera o ranking por compatibilidade com a vaga</p>
            </header>

            <main className="main">
                <form onSubmit={onSubmit} className="card">
                    <label className="label">
                        <span>Descrição da Vaga</span>
                        <textarea
                            value={descricaoVaga}
                            onChange={(e) => setDescricaoVaga(e.target.value)}
                            rows={10}
                            placeholder="Cole aqui a descrição completa da vaga, requisitos e diferenciais..."
                            disabled={carregando}
                        />
                    </label>

                    <label className="label">
                        <span>Currículos (PDF, DOCX ou TXT — até {MAX_CURRICULOS} arquivos)</span>
                        <div
                            className={`dropzone ${dragActive ? "active" : ""}`}
                            onDragEnter={onDrag}
                            onDragLeave={onDrag}
                            onDragOver={onDrag}
                            onDrop={onDrop}
                        >
                            <input type="file" multiple accept=".pdf,.docx,.txt" onChange={onFileChange} disabled={carregando} id="file-input" />
                            <label htmlFor="file-input" className="dropzone-label">
                                📎 Arraste arquivos aqui ou <span className="link">clique para selecionar</span>
                            </label>
                        </div>
                    </label>

                    {arquivos.length > 0 && (
                        <div className="arquivos-lista">
                            <strong>{arquivos.length} arquivo(s) selecionado(s):</strong>
                            <ul>
                                {arquivos.map((a) => (
                                    <li key={a.name}>
                                        <span>
                                            {a.name} <em>({(a.size / 1024).toFixed(0)} KB)</em>
                                        </span>
                                        <button type="button" onClick={() => removerArquivo(a.name)} disabled={carregando}>
                                            ✕
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {erro && <div className="erro">⚠️ {erro}</div>}

                    <button type="submit" className="btn-primary" disabled={carregando}>
                        {carregando ? "🤖 Analisando currículos..." : "🚀 Analisar e Gerar Ranking"}
                    </button>
                </form>

                {resultado && <RankingList data={resultado} />}
            </main>

            <footer className="footer">
                <small>Backend: ASP.NET Core 8 · Frontend: Vite + React · IA: Google Gemini</small>
            </footer>
        </div>
    );
}
