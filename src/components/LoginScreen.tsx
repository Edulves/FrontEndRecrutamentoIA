import { useState, type FormEvent } from 'react'
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
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

    // ponytail: acesso demo de um clique, apenas no dev server (nunca no build de produção)
    async function entrarComoDemo() {
        setErro(null)
        setSucesso(null)
        setCarregando(true)
        try {
            const resposta = await login('demo', 'demo123')
            onLogin(resposta)
        } catch (err: any) {
            setErro(err.message ?? 'Erro desconhecido')
        } finally {
            setCarregando(false)
        }
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
                setSucesso(`Conta "${usuario}" criada. Entre para acessar a plataforma.`)
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
        <div className="login-split">
            <aside className="login-aside">
                <span className="brand">
                    <span className="brand-badge">RS</span>
                    <span>Recrutamento &amp; Seleção</span>
                </span>
                <div className="aside-mid">
                    <h1>Plataforma de análise e gestão de candidatos</h1>
                    <p>Apoio ao processo seletivo, da triagem de currículos à decisão do recrutador.</p>
                </div>
                <div className="aside-foot">Ambiente corporativo · Acesso restrito</div>
            </aside>

            <div className="login-panel">
                <div className="login-form">
                    <h2>Acesso ao Recrutamento</h2>
                    <p>Entre com suas credenciais para acessar a plataforma.</p>

                    {(aviso || erro || sucesso) && (
                        <div className="login-alerts">
                            {aviso && (
                                <div className="alert alert--info">
                                    <Info size={15} strokeWidth={1.75} aria-hidden="true" />
                                    <span>{aviso}</span>
                                </div>
                            )}
                            {erro && (
                                <div className="alert alert--erro" role="alert">
                                    <AlertTriangle size={15} strokeWidth={1.75} aria-hidden="true" />
                                    <span>{erro}</span>
                                </div>
                            )}
                            {sucesso && (
                                <div className="alert alert--ok">
                                    <CheckCircle2 size={15} strokeWidth={1.75} aria-hidden="true" />
                                    <span>{sucesso}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="seg seg--full" role="group" aria-label="Modo de acesso">
                        <button
                            type="button"
                            aria-pressed={modo === 'entrar'}
                            onClick={() => trocarModo('entrar')}
                            disabled={carregando}
                        >
                            Entrar
                        </button>
                        <button
                            type="button"
                            aria-pressed={modo === 'criar-conta'}
                            onClick={() => trocarModo('criar-conta')}
                            disabled={carregando}
                        >
                            Criar conta
                        </button>
                    </div>

                    <form onSubmit={onSubmit}>
                        <label className="field">
                            <span>Usuário</span>
                            <input
                                className="input"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                                autoFocus
                                placeholder="Digite seu usuário"
                                disabled={carregando}
                            />
                        </label>

                        <label className="field">
                            <span>Senha</span>
                            <input
                                className="input"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
                                placeholder="Digite sua senha"
                                disabled={carregando}
                            />
                        </label>

                        {modo === 'criar-conta' && (
                            <label className="field">
                                <span>Confirmar senha</span>
                                <input
                                    className="input"
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
                            {carregando ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
                        </button>

                        {import.meta.env.DEV && modo === 'entrar' && (
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={entrarComoDemo}
                                disabled={carregando}
                            >
                                Entrar como demo
                            </button>
                        )}
                    </form>

                    <div className="login-foot">Ambiente corporativo de recrutamento e seleção</div>
                </div>
            </div>
        </div>
    )
}
