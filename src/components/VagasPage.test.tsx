import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VagasPage from './VagasPage'
import { TOKEN_KEY, EXPIRACAO_KEY } from '../auth'
import type { CadastroVagaResponse, Vaga } from '../types'

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

describe('VagasPage', () => {
    const fetchOriginal = globalThis.fetch
    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
        localStorage.clear()
        localStorage.setItem(TOKEN_KEY, 'token-jwt-de-teste')
        localStorage.setItem(EXPIRACAO_KEY, new Date(Date.now() + 60 * 60 * 1000).toISOString())
        fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
            if (url === '/api/vagas' && init?.method === 'POST')
                return { ok: true, status: 200, json: async () => RESPOSTA }
            if (url === '/api/vagas')
                return { ok: true, status: 200, json: async () => [] }
            if (url === '/api/candidatos')
                return { ok: true, status: 200, json: async () => [] }
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
