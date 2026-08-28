import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DashboardPage, { melhoresPosicionados } from './DashboardPage'
import { TOKEN_KEY, EXPIRACAO_KEY } from '../auth'
import type { Candidato } from '../types'

function candidato(parcial: Partial<Candidato> & Pick<Candidato, 'id' | 'nome' | 'historico'>): Candidato {
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
        criadoEmUtc: '2026-08-01T12:00:00Z',
        atualizadoEmUtc: '2026-08-10T12:00:00Z',
        ...parcial,
    }
}

const CANDIDATOS: Candidato[] = [
    candidato({
        id: 'ana',
        nome: 'Ana Lima',
        historico: [
            { dataUtc: '2026-08-01T12:00:00Z', vaga: 'Vaga A', score: 60 },
            { dataUtc: '2026-08-10T12:00:00Z', vaga: 'Vaga B', score: 92 },
        ],
    }),
    candidato({
        id: 'bruno',
        nome: 'Bruno Souza',
        historico: [{ dataUtc: '2026-08-02T12:00:00Z', vaga: 'Vaga A', score: 75 }],
    }),
    candidato({
        id: 'carla',
        nome: 'Carla Dias',
        historico: [{ dataUtc: '2026-08-03T12:00:00Z', vaga: 'Vaga B', score: 55 }],
    }),
]

describe('melhoresPosicionados', () => {
    it('ordena pelo melhor score de cada candidato', () => {
        const linhas = melhoresPosicionados(CANDIDATOS, null)
        expect(linhas.map((l) => [l.nome, l.score])).toEqual([
            ['Ana Lima', 92],
            ['Bruno Souza', 75],
            ['Carla Dias', 55],
        ])
        // O melhor score da Ana veio da Vaga B, com as duas análises contadas.
        expect(linhas[0].vaga).toBe('Vaga B')
        expect(linhas[0].analises).toBe(2)
    })

    it('filtra o histórico pela vaga selecionada', () => {
        const linhas = melhoresPosicionados(CANDIDATOS, 'Vaga A')
        expect(linhas.map((l) => [l.nome, l.score])).toEqual([
            ['Bruno Souza', 75],
            ['Ana Lima', 60],
        ])
    })
})

describe('DashboardPage', () => {
    const fetchOriginal = globalThis.fetch
    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
        localStorage.clear()
        localStorage.setItem(TOKEN_KEY, 'token-jwt-de-teste')
        localStorage.setItem(EXPIRACAO_KEY, new Date(Date.now() + 60 * 60 * 1000).toISOString())
        fetchMock = vi.fn(async (url: string) => {
            if (url === '/api/candidatos')
                return { ok: true, status: 200, json: async () => CANDIDATOS }
            return { ok: false, status: 404, text: async () => 'not found' }
        })
        globalThis.fetch = fetchMock as unknown as typeof fetch
    })

    afterEach(() => {
        globalThis.fetch = fetchOriginal
        vi.restoreAllMocks()
    })

    it('mostra os KPIs e o ranking com o melhor posicionado no topo', async () => {
        render(<DashboardPage onSessaoExpirada={() => {}} onIrParaAnalises={() => {}} />)

        expect(await screen.findByText('Ana Lima')).toBeInTheDocument()

        // KPIs: 3 candidatos, 4 análises, média 74% (92+75+55)/3, 2 recomendados
        expect(screen.getByText('Candidatos avaliados').parentElement).toHaveTextContent('3')
        expect(screen.getByText('Análises realizadas').parentElement).toHaveTextContent('4')
        expect(screen.getByText('Aderência média').parentElement).toHaveTextContent('74%')
        expect(screen.getByText('Recomendados').parentElement).toHaveTextContent('2')

        // Ranking ordenado: Ana (92) em 1º, com status Recomendado
        const linhas = screen.getAllByRole('row').slice(1) // pula o cabeçalho
        expect(linhas[0]).toHaveTextContent('Ana Lima')
        expect(within(linhas[0]).getByText('92%')).toBeInTheDocument()
        expect(within(linhas[0]).getByText('Recomendado')).toBeInTheDocument()
        expect(linhas[2]).toHaveTextContent('Carla Dias')
        expect(within(linhas[2]).getByText('Em análise')).toBeInTheDocument()
    })

    it('reordena o ranking ao filtrar por vaga', async () => {
        const user = userEvent.setup()
        render(<DashboardPage onSessaoExpirada={() => {}} onIrParaAnalises={() => {}} />)

        await screen.findByText('Ana Lima')
        await user.selectOptions(
            screen.getByLabelText('Vaga'),
            screen.getByRole('option', { name: 'Vaga A' })
        )

        const linhas = screen.getAllByRole('row').slice(1)
        expect(linhas).toHaveLength(2)
        expect(linhas[0]).toHaveTextContent('Bruno Souza')
        expect(within(linhas[1]).getByText('60%')).toBeInTheDocument()
    })

    it('mostra o estado vazio com atalho para Análises', async () => {
        fetchMock.mockImplementation(async () => ({
            ok: true,
            status: 200,
            json: async () => [],
        }))
        const irParaAnalises = vi.fn()
        const user = userEvent.setup()
        render(<DashboardPage onSessaoExpirada={() => {}} onIrParaAnalises={irParaAnalises} />)

        await user.click(await screen.findByRole('button', { name: /Ir para Análises/i }))
        expect(irParaAnalises).toHaveBeenCalled()
    })
})
