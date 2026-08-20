import { useState, type FormEvent } from 'react'
import { login, registrar, type LoginResponse } from '../auth'

interface Props {
    /** Chamado após um login bem-sucedido (o JWT já foi persistido). */
    onLogin: (resposta: LoginResponse) => void
    /** Aviso opcional exibido no topo (ex.: sessão expirada). */
    aviso?: string | null
}

type Modo = 'entrar' | 'criar-conta'

export default function LoginScreen({ onLogin, aviso }: Props) {
    const [modo, setModo] = useState<Modo>('entrar')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [confirmacao, setConfirmacao] = useState('')
    const [carregando, setCarregando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)
    const [sucesso, setSucesso] = useState<string | null>(null)

    function trocarModo(novo: Modo) {
        setModo(novo)
        setErro(null)
        setSucesso(null)
    }

    async function onSubmit(e: FormEvent) {
        e.preventDefault()
        setErro(null)
        setSucesso(null)

        const usuario = username.trim()
        if (!usuario || !password) {
            setErro('Informe usuário e senha.')
            return
        }

        if (modo === 'criar-conta') {
            if (password !== confirmacao) {
                setErro('A confirmação de senha não confere.')
                return
            }
            if (password.length < 6) {
                setErro('A senha deve ter ao menos 6 caracteres.')
                return
            }

            setCarregando(true)
            try {
                await registrar(usuario, password)
                setModo('entrar')
                setPassword('')
                setConfirmacao('')
                setSucesso(`Conta "${usuario}" criada! Faça login para começar.`)
            } catch (err: any) {
                setErro(err.message ?? 'Erro desconhecido')
            } finally {
                setCarregando(false)
            }
            return
        }

        setCarregando(true)
        try {
            const resposta = await login(usuario, password)
            onLogin(resposta)
        } catch (err: any) {
            setErro(err.message ?? 'Erro desconhecido')
        } finally {
            setCarregando(false)
        }
    }

    return (
        <div className="login-wrapper">
            <form className="card login-card" onSubmit={onSubmit}>
                <div className="login-brand">
                    <h1>🎯 Recrutamento IA</h1>
                    <p>Ranking de currículos com inteligência artificial</p>
                </div>

                {aviso && <div className="aviso">ℹ️ {aviso}</div>}
                {erro && <div className="erro">⚠️ {erro}</div>}
                {sucesso && <div className="sucesso">✅ {sucesso}</div>}

                <div className="login-tabs">
                    <button
                        type="button"
                        className={modo === 'entrar' ? 'tab ativo' : 'tab'}
                        onClick={() => trocarModo('entrar')}
                        disabled={carregando}
                    >
                        Entrar
                    </button>
                    <button
                        type="button"
                        className={modo === 'criar-conta' ? 'tab ativo' : 'tab'}
                        onClick={() => trocarModo('criar-conta')}
                        disabled={carregando}
                    >
                        Criar conta
                    </button>
                </div>

                <label className="label">
                    <span>Usuário</span>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                        autoFocus
                        placeholder="Seu nome de usuário"
                        disabled={carregando}
                    />
                </label>

                <label className="label">
                    <span>Senha</span>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
                        placeholder="Sua senha"
                        disabled={carregando}
                    />
                </label>

                {modo === 'criar-conta' && (
                    <label className="label">
                        <span>Confirmar senha</span>
                        <input
                            type="password"
                            value={confirmacao}
                            onChange={(e) => setConfirmacao(e.target.value)}
                            autoComplete="new-password"
                            placeholder="Repita a senha"
                            disabled={carregando}
                        />
                    </label>
                )}

                <button type="submit" className="btn-primary" disabled={carregando}>
                    {carregando
                        ? 'Aguarde...'
                        : modo === 'entrar'
                          ? '🔑 Entrar'
                          : '📝 Criar conta'}
                </button>
            </form>
        </div>
    )
}