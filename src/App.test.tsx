import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import App from "./App";
import { TOKEN_KEY, USUARIO_KEY, EXPIRACAO_KEY, type LoginResponse } from "./auth";
import type { AnaliseResponse } from "./types";

const DESCRICAO = "Analista de PCP Sênior com experiência em Excel avançado e SAP.";
const USUARIO = "admin";
const SENHA = "SenhaForte@123";
const TOKEN = "token-jwt-de-teste";

function respostaLoginMock(): LoginResponse {
    return {
        mensagem: "Login realizado com sucesso.",
        usuario: USUARIO,
        token: TOKEN,
        tipo: "Bearer",
        expiraEmUtc: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };
}

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

describe("App — autenticação por usuário/senha + JWT", () => {
    const fetchOriginal = globalThis.fetch;
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        localStorage.clear();
        fetchMock = vi.fn(async (url: string, _init?: RequestInit) => {
            if (url === "/api/auth/login")
                return { ok: true, status: 200, json: async () => respostaLoginMock() };
            if (url === "/api/analisar")
                return { ok: true, status: 200, json: async () => respostaMock() };
            return { ok: false, status: 404, text: async () => "not found" };
        });
        globalThis.fetch = fetchMock as unknown as typeof fetch;
    });

    afterEach(() => {
        globalThis.fetch = fetchOriginal;
        vi.restoreAllMocks();
    });

    /** Na tela de acesso a aba e o botão de envio têm o mesmo rótulo; aqui só o envio interessa. */
    function botaoSubmit(nome: string): HTMLElement {
        const achado = screen
            .getAllByRole("button", { name: nome })
            .find((b) => b.getAttribute("type") === "submit");
        if (!achado) throw new Error(`Botão de envio "${nome}" não encontrado`);
        return achado;
    }

    async function fazerLogin(user: UserEvent) {
        render(<App />);
        await user.type(screen.getByLabelText(/Usuário/i), USUARIO);
        await user.type(screen.getByLabelText(/Senha/i), SENHA);
        await user.click(botaoSubmit("Entrar"));
        await screen.findByRole("button", { name: /Iniciar análise/i });
    }

    async function preencherEEnviar(user: UserEvent, arquivos: File[]) {
        const textarea = screen.getByRole("textbox", { name: /Descrição da vaga/i });
        await user.clear(textarea);
        await user.type(textarea, DESCRICAO);

        const inputArquivo = screen.getByLabelText(/Currículos/i, { selector: 'input[type="file"]' });
        await user.upload(inputArquivo, arquivos);

        await user.click(screen.getByRole("button", { name: /Iniciar análise/i }));
    }

    it("mostra a tela de login e envia as credenciais para /api/auth/login", async () => {
        const user = userEvent.setup();
        render(<App />);

        expect(screen.getByLabelText(/Usuário/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();

        await user.type(screen.getByLabelText(/Usuário/i), USUARIO);
        await user.type(screen.getByLabelText(/Senha/i), SENHA);
        await user.click(botaoSubmit("Entrar"));

        await screen.findByRole("button", { name: /Iniciar análise/i });

        const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toBe("/api/auth/login");
        expect(options.method).toBe("POST");
        expect(JSON.parse(String(options.body))).toEqual({ username: USUARIO, password: SENHA });

        // O JWT é persistido no localStorage e usado nas próximas requisições.
        expect(localStorage.getItem(TOKEN_KEY)).toBe(TOKEN);
        expect(localStorage.getItem(USUARIO_KEY)).toBe(USUARIO);
        expect(localStorage.getItem(EXPIRACAO_KEY)).toBeTruthy();
    });

    it("envia o JWT no cabeçalho Authorization ao chamar /api/analisar", async () => {
        const user = userEvent.setup();
        await fazerLogin(user);
        await preencherEEnviar(user, [
            new File(["conteúdo pdf"], "maria.pdf", { type: "application/pdf" }),
        ]);

        await waitFor(() =>
            expect(fetchMock).toHaveBeenCalledWith("/api/analisar", expect.anything())
        );

        const chamada = fetchMock.mock.calls.find((c) => c[0] === "/api/analisar");
        const options = chamada?.[1] as RequestInit;
        expect(options.method).toBe("POST");
        expect(options.headers).toMatchObject({ Authorization: `Bearer ${TOKEN}` });
        expect(options.body).toBeInstanceOf(FormData);

        const fd = options.body as FormData;
        expect(fd.get("descricaoVaga")).toBe(DESCRICAO);
    });
it("renderiza o ranking retornado pela API", async () => {
        const user = userEvent.setup();
        await fazerLogin(user);
        await preencherEEnviar(user, [
            new File(["conteúdo"], "maria.pdf", { type: "application/pdf" }),
        ]);

        expect(await screen.findByText(/Maria Silva/)).toBeInTheDocument();
        expect(screen.getByText("95%")).toBeInTheDocument();
        expect(screen.getByText(/João Souza/)).toBeInTheDocument();
    });

    it("não envia requisição quando não há currículos selecionados", async () => {
        const user = userEvent.setup();
        await fazerLogin(user);

        // Sem arquivo o envio fica bloqueado no próprio botão (nada é enviado).
        const iniciar = screen.getByRole("button", { name: /Iniciar análise/i });
        expect(iniciar).toBeDisabled();

        await user.click(iniciar);

        expect(fetchMock.mock.calls.filter((c) => c[0] === "/api/analisar")).toHaveLength(0);
    });

    it("retorna à tela de login quando a API responde 401 (JWT expirado)", async () => {
        fetchMock.mockImplementation(async (url: string) => {
            if (url === "/api/auth/login")
                return { ok: true, status: 200, json: async () => respostaLoginMock() };
            if (url === "/api/analisar")
                return { ok: false, status: 401, text: async () => "Unauthorized" };
            return { ok: false, status: 404, text: async () => "not found" };
        });

        const user = userEvent.setup();
        await fazerLogin(user);
        await preencherEEnviar(user, [
            new File(["conteúdo"], "maria.pdf", { type: "application/pdf" }),
        ]);

        expect(await screen.findByLabelText(/Usuário/i)).toBeInTheDocument();
        expect(screen.getByText(/sessão expirou/i)).toBeInTheDocument();
        expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    });

    it("exibe a mensagem de erro devolvida pelo backend no login", async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            status: 401,
            json: async () => ({ erro: "Nome de usuário ou senha inválidos." }),
        });

        const user = userEvent.setup();
        render(<App />);
        await user.type(screen.getByLabelText(/Usuário/i), USUARIO);
        await user.type(screen.getByLabelText(/Senha/i), "senha-errada");
        await user.click(botaoSubmit("Entrar"));

        expect(await screen.findByText(/Nome de usuário ou senha inválidos/)).toBeInTheDocument();
    });

    it("permite criar conta e volta para a aba de entrar", async () => {
        fetchMock.mockImplementation(async (url: string) => {
            if (url === "/api/auth/registrar")
                return {
                    ok: true,
                    status: 201,
                    json: async () => ({
                        mensagem: "Usuário criado com sucesso.",
                        username: USUARIO,
                        criadoEmUtc: new Date().toISOString(),
                    }),
                };
            if (url === "/api/auth/login")
                return { ok: true, status: 200, json: async () => respostaLoginMock() };
            return { ok: false, status: 404, text: async () => "not found" };
        });

        const user = userEvent.setup();
        render(<App />);

        await user.click(screen.getByRole("button", { name: "Criar conta" }));
        await user.type(screen.getByLabelText(/Usuário/i), USUARIO);
        await user.type(screen.getByLabelText(/^Senha$/), SENHA);
        await user.type(screen.getByLabelText(/Confirmar senha/i), SENHA);
        await user.click(botaoSubmit("Criar conta"));

        expect(await screen.findByText(/Conta "admin" criada/i)).toBeInTheDocument();
        expect(fetchMock).toHaveBeenCalledWith("/api/auth/registrar", expect.anything());
        expect(botaoSubmit("Entrar")).toBeInTheDocument();
    });

    it("faz logout ao clicar em Sair", async () => {
        const user = userEvent.setup();
        await fazerLogin(user);

        await user.click(screen.getByRole("button", { name: /Sair/i }));

        expect(await screen.findByLabelText(/Usuário/i)).toBeInTheDocument();
        expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    });

    it("exibe o pop-up de loading (tela desfocada) enquanto a análise não retorna", async () => {
        let resolver!: (value: unknown) => void;
        const promessaPendente = new Promise((resolve) => {
            resolver = resolve;
        });

        fetchMock.mockImplementation(async (url: string) => {
            if (url === "/api/auth/login")
                return { ok: true, status: 200, json: async () => respostaLoginMock() };
            if (url === "/api/analisar")
                return promessaPendente; // análise ainda não retornou
            return { ok: false, status: 404, text: async () => "not found" };
        });

        const user = userEvent.setup();
        await fazerLogin(user);
        await preencherEEnviar(user, [
            new File(["conteúdo"], "maria.pdf", { type: "application/pdf" }),
        ]);

        // Enquanto a operação está pendente, o pop-up fica visível
        // (overlay com backdrop-filter, que desfoca a tela de fundo).
        const overlay = await screen.findByRole("progressbar", {
            name: /Analisando currículos/i,
        });
        expect(overlay).toHaveClass("loading-overlay");
        expect(within(overlay).getByText(/Analisando currículos/)).toBeInTheDocument();

        // Depois que a API retorna, o pop-up some e o ranking é exibido.
        resolver({ ok: true, status: 200, json: async () => respostaMock() });
        expect(await screen.findByText(/Maria Silva/)).toBeInTheDocument();
        expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    });
});