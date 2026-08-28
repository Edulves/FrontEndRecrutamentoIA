import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VagasPage from './VagasPage'
import { TOKEN_KEY, EXPIRACAO_KEY } from '../auth'
import type { CadastroVagaResponse, Candidato, Vaga } from '../types'

const VAGA: Vaga = {
    id: 'v1',
    titulo: 'Analista Fiscal',
    descricao: 'Requisitos: SPED, apuração de impostos.',
    criadaEmUtc: '2026-08-28T12:00:00Z',
}

const RESPOSTA: CadastroVagaResponse = {
    vaga: VAGA,
    totalCandidatos: 2,
    ranking: [
        { candidatoId: 'ana', nome: 'Ana Lima', score: 88, resumo: 'Forte aderência fiscal.' },
        { candidatoId: 'bruno', nome: 'Bruno Souza', score: 51, resumo: 'Aderência parcial.' },
    ],
}

function candidato(parcial: Partial<Candidato> & Pick<Candidato, 'id' | 'nome'>): Candidato {
    return {
        email: null,
        telefone: null,
        cidade: null,
        areasAptidao: [],
        habilidades: [],
        experiencias: [],
        formacao: [],
        resumo: '',
        pontosFortes: [],
        pontosFracos: [],
        nomeArquivo: `${parcial.nome}.pdf`,
        curriculoArquivo: null,
        fotoArquivo: null,
        criadoEmUtc: '2026-08-01T12:00:00Z',
        atualizadoEmUtc: '2026-08-10T12:00:00Z',
        historico: [],
        ...parcial,
    }
}

// Ana tem currículo armazenado; Bruno não (importado antes do armazenamento)
const CANDIDATOS: Candidato[] = [
    candidato({ id: 'ana', nome: 'Ana Lima', nomeArquivo: 'ana.pdf', curriculoArquivo: 'ana.pdf' }),
    candidato({ id: 'bruno', nome: 'Bruno Souza' }),
]

describe('VagasPage', () => {
    const fetchOriginal = globalThis.fetch
    let fetchMock: ReturnType<typeof vi.fn>
    let abaMock: { location: { href: string }; close: ReturnType<typeof vi.fn> }

    beforeEach(() => {
        localStorage.clear()
        localStorage.setItem(TOKEN_KEY, 'token-jwt-de-teste')
        localStorage.setItem(EXPIRACAO_KEY, new Date(Date.now() + 60 * 60 * 1000).toISOString())
        globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock')
        globalThis.URL.revokeObjectURL = vi.fn()
        abaMock = { location: { href: '' }, close: vi.fn() }
        window.open = vi.fn(() => abaMock as unknown as Window)
        fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
            if (url === '/api/vagas' && init?.method === 'POST')
                return { ok: true, status: 200, json: async () => RESPOSTA }
            if (url === '/api/vagas')
                return { ok: true, status: 200, json: async () => [] }
            if (url === '/api/candidatos')
                return { ok: true, status: 200, json: async () => CANDIDATOS }
            if (/\/api\/candidatos\/\w+\/curriculo$/.test(url))
                return { ok: true, status: 200, blob: async () => new Blob(['bytes']) }
            return { ok: false, status: 404, text: async () => 'not found' }
        })
        globalThis.fetch = fetchMock as unknown as typeof fetch
    })

    afterEach(() => {
        globalThis.fetch = fetchOriginal
        vi.restoreAllMocks()
    })

    async function preencherEEnviar() {
        const user = userEvent.setup()
        render(<VagasPage onSessaoExpirada={() => {}} />)

        await user.type(screen.getByLabelText(/Título da vaga/i), VAGA.titulo)
        await user.type(screen.getByLabelText(/Descrição e requisitos/i), VAGA.descricao)
        await user.click(screen.getByRole('button', { name: /Cadastrar vaga/i }))
        return user
    }

    it('cadastra a vaga e mostra o candidato ideal no topo do resultado', async () => {
        await preencherEEnviar()

        // POST enviado com o body certo
        const post = fetchMock.mock.calls.find((c) => (c[1] as RequestInit)?.method === 'POST')
        expect(post?.[0]).toBe('/api/vagas')
        expect(JSON.parse(String((post?.[1] as RequestInit).body))).toEqual({
            titulo: VAGA.titulo,
            descricao: VAGA.descricao,
        })

        // Candidato ideal em destaque + segundo colocado na tabela
        expect(await screen.findByText(/Candidato ideal para esta vaga/i)).toBeInTheDocument()
        expect(screen.getByText('Ana Lima')).toBeInTheDocument()
        expect(screen.getByText('88%')).toBeInTheDocument()
        expect(screen.getByText('Bruno Souza')).toBeInTheDocument()
    })

    it('abre o currículo do candidato ideal direto da tela da vaga', async () => {
        const user = await preencherEEnviar()

        await screen.findByText(/Candidato ideal para esta vaga/i)
        // Ana (ideal) tem currículo armazenado: botão presente e funcional
        await user.click(screen.getByRole('button', { name: /Ver currículo/i }))
        expect(fetchMock).toHaveBeenCalledWith(
            '/api/candidatos/ana/curriculo',
            expect.objectContaining({ headers: expect.anything() })
        )
        // A aba abre no gesto do clique e recebe o blob depois
        expect(window.open).toHaveBeenCalledWith('', '_blank')
        expect(abaMock.location.href).toBe('blob:mock')
        // Bruno não tem arquivo: sem botão de currículo para ele na tabela
        expect(screen.queryByRole('button', { name: /Ver currículo de Bruno/i })).not.toBeInTheDocument()
    })

    it('não envia nada sem título ou descrição', async () => {
        const user = userEvent.setup()
        render(<VagasPage onSessaoExpirada={() => {}} />)

        await user.click(screen.getByRole('button', { name: /Cadastrar vaga/i }))

        expect(await screen.findByText(/Informe o título da vaga/i)).toBeInTheDocument()
        expect(
            fetchMock.mock.calls.filter((c) => (c[1] as RequestInit)?.method === 'POST')
        ).toHaveLength(0)
    })

    it('mostra o erro do backend quando o título já existe (409)', async () => {
        fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
            if (url === '/api/vagas' && init?.method === 'POST')
                return {
                    ok: false,
                    status: 409,
                    json: async () => ({ erro: 'Já existe uma vaga cadastrada com esse título.' }),
                }
            if (url === '/api/vagas') return { ok: true, status: 200, json: async () => [] }
            if (url === '/api/candidatos') return { ok: true, status: 200, json: async () => [] }
            return { ok: false, status: 404, text: async () => 'not found' }
        })

        await preencherEEnviar()

        expect(
            await screen.findByText(/Já existe uma vaga cadastrada com esse título/i)
        ).toBeInTheDocument()
    })
})
