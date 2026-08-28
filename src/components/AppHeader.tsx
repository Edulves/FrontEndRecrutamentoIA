import { ChevronDown } from 'lucide-react'

export type Secao = 'dashboard' | 'vagas' | 'analises' | 'candidatos'

interface Props {
    /** Usuário autenticado, mostrado no canto direito. */
    usuario: string | null
    onSair: () => void
    /** Seção ativa no menu. */
    secao: Secao
    onNavegar: (secao: Secao) => void
}

const NAV: { rotulo: string; secao?: Secao }[] = [
    { rotulo: 'Dashboard', secao: 'dashboard' },
    { rotulo: 'Vagas', secao: 'vagas' },
    { rotulo: 'Candidatos', secao: 'candidatos' },
    { rotulo: 'Análises', secao: 'analises' },
]

export default function AppHeader({ usuario, onSair, secao, onNavegar }: Props) {
    const inicial = (usuario ?? '?').trim().charAt(0) || '?'

    return (
        <header className="topbar">
            <div className="topbar-inner">
                <span className="brand">
                    <span className="brand-square">RS</span>
                    <span>Recrutamento &amp; Seleção</span>
                </span>

                <nav className="nav" aria-label="Seções">
                    {NAV.map((item) =>
                        item.secao ? (
                            <button
                                key={item.rotulo}
                                type="button"
                                className="nav-item"
                                aria-current={item.secao === secao ? 'page' : undefined}
                                onClick={() => onNavegar(item.secao!)}
                            >
                                {item.rotulo}
                            </button>
                        ) : (
                            <span key={item.rotulo} className="nav-item">
                                {item.rotulo}
                            </span>
                        )
                    )}
                </nav>

                <span className="topbar-right">
                    <span className="user-chip">
                        <span className="avatar" aria-hidden="true">
                            {inicial}
                        </span>
                        <span>{usuario ?? ''}</span>
                        <ChevronDown size={14} strokeWidth={1.75} color="#667085" aria-hidden="true" />
                    </span>
                    <span className="vdivider" aria-hidden="true" />
                    <button type="button" className="btn-ghost" onClick={onSair}>
                        Sair
                    </button>
                </span>
            </div>
        </header>
    )
}
