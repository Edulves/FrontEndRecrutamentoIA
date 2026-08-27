import { ChevronDown } from 'lucide-react'

interface Props {
    /** Usuário autenticado, mostrado no canto direito. */
    usuario: string | null
    onSair: () => void
}

// Itens institucionais do protótipo. Só "Análises" existe hoje — os demais são
// rótulos do menu, por isso não são links (não prometem navegação que não há).
const NAV = ['Dashboard', 'Vagas', 'Candidatos', 'Análises']
const NAV_ATIVO = 'Análises'

export default function AppHeader({ usuario, onSair }: Props) {
    const inicial = (usuario ?? '?').trim().charAt(0) || '?'

    return (
        <header className="topbar">
            <div className="topbar-inner">
                <span className="brand">
                    <span className="brand-square">RS</span>
                    <span>Recrutamento &amp; Seleção</span>
                </span>

                <nav className="nav" aria-label="Seções">
                    {NAV.map((item) => (
                        <span
                            key={item}
                            className="nav-item"
                            aria-current={item === NAV_ATIVO ? 'page' : undefined}
                        >
                            {item}
                        </span>
                    ))}
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
