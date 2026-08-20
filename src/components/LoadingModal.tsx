// POP-UP de loading exibido enquanto a análise de currículos não retorna.
// O overlay desfoca a tela de fundo (backdrop-filter: blur()) e bloqueia
// a interação com o conteúdo até a operação terminar.

interface Props {
    /** Número de currículos sendo analisados (para a mensagem). */
    totalCurriculos?: number
}

export default function LoadingModal({ totalCurriculos }: Props) {
    return (
        <div
            className="loading-overlay"
            role="progressbar"
            aria-busy="true"
            aria-label="Analisando currículos"
        >
            <div className="loading-card">
                <div className="loading-spinner" aria-hidden="true" />
                <strong>🤖 Analisando currículos...</strong>
                <p>
                    {totalCurriculos && totalCurriculos > 0
                        ? `${totalCurriculos} currículo(s) sendo processado(s) pela IA.`
                        : "A IA está gerando o ranking de compatibilidade."}
                </p>
                <small>Isso pode levar alguns segundos — não feche a página.</small>
            </div>
        </div>
    )
}