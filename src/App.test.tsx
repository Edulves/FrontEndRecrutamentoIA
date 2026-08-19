import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import type { AnaliseResponse } from "./types";

const DESCRICAO = "Analista de PCP Sênior com experiência em Excel avançado e SAP.";

function respostaMock(): AnaliseResponse {
    return {
        descricaoVaga: DESCRICAO,
        totalCurriculos: 2,
        ranking: [
            {
                nomeArquivo: "maria.pdf",
                nomeCandidato: "Maria Silva",
                score: 95,
                resumo: "Excelente compatibilidade.",
                pontosFortes: ["Excel avançado", "SAP"],
                pontosFracos: [],
                habilidadesIdentificadas: ["Excel", "SAP"],
            },
            {
                nomeArquivo: "joao.docx",
                nomeCandidato: "João Souza",
                score: 55,
                resumo: "Compatibilidade média.",
                pontosFortes: [],
                pontosFracos: ["Sem experiência em PCP"],
                habilidadesIdentificadas: ["Excel"],
            },
        ],
        processadoEm: "2026-08-18T12:00:00.000Z",
    };
}

describe("App — envio da requisição à API", () => {
    const fetchOriginal = globalThis.fetch;
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as unknown as typeof fetch;
    });

    afterEach(() => {
        globalThis.fetch = fetchOriginal;
        vi.restoreAllMocks();
    });

    async function preencherEEnviar(arquivos: File[]) {
        const user = userEvent.setup();
        render(<App />);

        const textarea = screen.getByRole("textbox", { name: /Descrição da Vaga/i });
        await user.clear(textarea);
        await user.type(textarea, DESCRICAO);

        const inputArquivo = screen.getByLabelText(/Currículos/i, { selector: 'input[type="file"]' });
        await user.upload(inputArquivo, arquivos);

        await user.click(screen.getByRole("button", { name: /Analisar e Gerar Ranking/i }));
    }

    it("envia POST para /api/analisar com FormData contendo a vaga e os currículos", async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => respostaMock() });

        await preencherEEnviar([
            new File(["conteúdo pdf"], "maria.pdf", { type: "application/pdf" }),
            new File(["conteúdo docx"], "joao.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }),
        ]);

        await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

        const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toBe("/api/analisar");
        expect(options.method).toBe("POST");

        // O Content-Type (com boundary) é definido pelo navegador automaticamente;
        // o cabeçalho X-Api-Key é opcional — só é enviado se VITE_API_KEY vier do .env.local.
        if (options.headers !== undefined) {
            expect(options.headers).toHaveProperty("X-Api-Key");
        }
        expect(options.body).toBeInstanceOf(FormData);

        const fd = options.body as FormData;
        expect(fd.get("descricaoVaga")).toBe(DESCRICAO);

        const curriculos = fd.getAll("curriculos");
        expect(curriculos).toHaveLength(2);
        expect((curriculos[0] as File).name).toBe("maria.pdf");
        expect((curriculos[1] as File).name).toBe("joao.docx");
    });

    it("renderiza o ranking retornado pela API", async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => respostaMock() });

        await preencherEEnviar([new File(["conteúdo"], "maria.pdf", { type: "application/pdf" })]);

        expect(await screen.findByText(/Maria Silva/)).toBeInTheDocument();
        expect(screen.getByText("95")).toBeInTheDocument();
        expect(screen.getByText(/João Souza/)).toBeInTheDocument();
    });

    it("não envia requisição quando não há currículos selecionados", async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => respostaMock() });

        const user = userEvent.setup();
        render(<App />);
        await user.click(screen.getByRole("button", { name: /Analisar e Gerar Ranking/i }));

        expect(screen.getByText(/Envie ao menos 1 currículo/)).toBeInTheDocument();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("exibe mensagem de erro quando a API responde HTTP não-ok", async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 500, text: async () => "Erro interno" });

        await preencherEEnviar([new File(["conteúdo"], "maria.pdf", { type: "application/pdf" })]);

        expect(await screen.findByText(/HTTP 500/)).toBeInTheDocument();
        expect(screen.getByText(/Erro interno/)).toBeInTheDocument();
    });
});
