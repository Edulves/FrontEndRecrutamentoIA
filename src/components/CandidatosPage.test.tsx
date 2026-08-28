import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CandidatosPage from './CandidatosPage'
import { TOKEN_KEY, EXPIRACAO_KEY } from '../auth'
import type { Candidato } from '../types'

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

const CANDIDATOS: Candidato[] = [
    candidato({
        id: 'ana',
        nome: 'Ana Lima',
        nomeArquivo: 'ana.pdf',
        curriculoArquivo: 'ana.pdf',
        fotoArquivo: 'ana.jpg',
    }),
    candidato({ id: 'bruno', nome: 'Bruno Souza' }),
]

describe('CandidatosPage — currículo importado e foto de perfil', () => {
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
            if (init?.method === 'DELETE' && /\/api\/candidatos\/\w+$/.test(url))
                return { ok: true, status: 200, json: async () => ({ mensagem: 'Candidato excluído.' }) }
            if (url === '/api/candidatos')
                return { ok: true, status: 200, json: async () => CANDIDATOS }
            if (/\/api\/candidatos\/\w+\/(foto|curriculo)$/.test(url))
                return { ok: true, status: 200, blob: async () => new Blob(['bytes']) }
            return { ok: false, status: 404, text: async () => 'not found' }
        })
        globalThis.fetch = fetchMock as unknown as typeof fetch
    })

    afterEach(() => {
        globalThis.fetch = fetchOriginal
        vi.restoreAllMocks()
    })

    it('mostra a foto de quem tem e a inicial de quem não tem', async () => {
        render(<CandidatosPage onSessaoExpirada={() => {}} />)

        // Ana tem fotoArquivo: o avatar busca a foto e renderiza <img> (decorativo, alt vazio)
        const botaoAna = await screen.findByRole('button', { name: 'Ana Lima' })
        await waitFor(() => expect(botaoAna.querySelector('img.avatar--foto')).toBeInTheDocument())
        expect(fetchMock).toHaveBeenCalledWith(
            '/api/candidatos/ana/foto',
            expect.objectContaining({ headers: expect.anything() })
        )
        // Bruno não tem: cai na inicial (sem <img>)
        const botaoBruno = screen.getByRole('button', { name: 'Bruno Souza' })
        expect(botaoBruno.querySelector('img')).toBeNull()
    })

    it('abre o currículo importado ao clicar em "Ver currículo"', async () => {
        const user = userEvent.setup()
        render(<CandidatosPage onSessaoExpirada={() => {}} />)

        await user.click(await screen.findByRole('button', { name: /Ana Lima/ }))
        await user.click(screen.getByRole('button', { name: /Ver currículo/i }))

        expect(fetchMock).toHaveBeenCalledWith(
            '/api/candidatos/ana/curriculo',
            expect.objectContaining({ headers: expect.anything() })
        )
        // A aba abre no gesto do clique e recebe o blob depois
        expect(window.open).toHaveBeenCalledWith('', '_blank')
        expect(abaMock.location.href).toBe('blob:mock')
    })

    it('sem arquivo guardado, avisa e ainda deixa adicionar foto', async () => {
        const user = userEvent.setup()
        render(<CandidatosPage onSessaoExpirada={() => {}} />)

        await user.click(await screen.findByRole('button', { name: /Bruno Souza/ }))

        expect(screen.getByText(/Currículo não disponível/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Adicionar foto/i })).toBeInTheDocument()
    })

    it('exclui candidato só depois da confirmação em duas etapas', async () => {
        const user = userEvent.setup()
        render(<CandidatosPage onSessaoExpirada={() => {}} />)

        await user.click(await screen.findByRole('button', { name: 'Bruno Souza' }))
        await user.click(screen.getByRole('button', { name: 'Excluir' }))

        // O primeiro clique só abre a confirmação — nada foi enviado ainda
        expect(
            fetchMock.mock.calls.filter((c) => (c[1] as RequestInit)?.method === 'DELETE')
        ).toHaveLength(0)
        expect(screen.getByText(/Excluir este candidato/i)).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: /Confirmar exclusão/i }))
        const del = fetchMock.mock.calls.find((c) => (c[1] as RequestInit)?.method === 'DELETE')
        expect(del?.[0]).toBe('/api/candidatos/bruno')
    })

    it('cancelar a exclusão não envia nada', async () => {
        const user = userEvent.setup()
        render(<CandidatosPage onSessaoExpirada={() => {}} />)

        await user.click(await screen.findByRole('button', { name: 'Bruno Souza' }))
        await user.click(screen.getByRole('button', { name: 'Excluir' }))
        await user.click(screen.getByRole('button', { name: 'Cancelar' }))

        expect(screen.getByRole('button', { name: 'Excluir' })).toBeInTheDocument()
        expect(
            fetchMock.mock.calls.filter((c) => (c[1] as RequestInit)?.method === 'DELETE')
        ).toHaveLength(0)
    })

    it('envia a foto escolhida para o backend', async () => {
        const user = userEvent.setup()
        render(<CandidatosPage onSessaoExpirada={() => {}} />)

        await user.click(await screen.findByRole('button', { name: /Bruno Souza/ }))
        const input = screen.getByLabelText('Foto de perfil de Bruno Souza')
        await user.upload(input, new File(['img'], 'perfil.png', { type: 'image/png' }))

        const post = fetchMock.mock.calls.find(
            (c) => c[0] === '/api/candidatos/bruno/foto' && (c[1] as RequestInit)?.method === 'POST'
        )
        expect(post).toBeTruthy()
        expect((post?.[1] as RequestInit).body).toBeInstanceOf(FormData)
    })
})
