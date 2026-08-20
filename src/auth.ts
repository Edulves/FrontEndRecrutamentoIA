// ── Autenticação ──────────────────────────────────────────────────────────────
// Login/registro no backend e persistência do JWT no localStorage.
// O token é reenviado como "Authorization: Bearer <token>" nas chamadas protegidas.

export interface LoginResponse {
    mensagem: string
    usuario: string
    token: string
    tipo: 'Bearer'
    expiraEmUtc: string
}

export interface RegistroResponse {
    mensagem: string
    username: string
    criadoEmUtc: string
}

interface ErroApi {
    erro?: string
}

export const TOKEN_KEY = 'recrutamento_ia_token'
export const USUARIO_KEY = 'recrutamento_ia_usuario'
export const EXPIRACAO_KEY = 'recrutamento_ia_expira_em'

export function salvarSessao(resposta: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY, resposta.token)
    localStorage.setItem(USUARIO_KEY, resposta.usuario)
    localStorage.setItem(EXPIRACAO_KEY, resposta.expiraEmUtc)
}

export function limparSessao(): void {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USUARIO_KEY)
    localStorage.removeItem(EXPIRACAO_KEY)
}

/** Retorna o JWT salvo, ou null se não existir sessão ou se ela já expirou. */
export function getToken(): string | null {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return null

    const expiraEm = localStorage.getItem(EXPIRACAO_KEY)
    if (expiraEm && new Date(expiraEm).getTime() <= Date.now()) {
        limparSessao()
        return null
    }
    return token
}

export function getUsuarioLogado(): string | null {
    return localStorage.getItem(USUARIO_KEY)
}

async function lerErro(resp: Response): Promise<Error> {
    try {
        const data = (await resp.json()) as ErroApi
        if (data.erro) return new Error(data.erro)
    } catch {
        // corpo não-JSON — cai no fallback com o status HTTP
    }
    return new Error(`HTTP ${resp.status}`)
}

async function postJson(url: string, body: unknown): Promise<Response> {
    return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
}

export async function login(username: string, password: string): Promise<LoginResponse> {
    const resp = await postJson('/api/auth/login', { username, password })
    if (!resp.ok) throw await lerErro(resp)
    return (await resp.json()) as LoginResponse
}

export async function registrar(username: string, password: string): Promise<RegistroResponse> {
    const resp = await postJson('/api/auth/registrar', { username, password })
    if (!resp.ok) throw await lerErro(resp)
    return (await resp.json()) as RegistroResponse
}