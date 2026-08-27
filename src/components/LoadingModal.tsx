// Overlay exibido enquanto a análise de currículos não retorna: desfoca o fundo
// e bloqueia a interação até a operação terminar.

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
                <div className="spinner" aria-hidden="true" />
                <strong>Analisando currículos…</strong>
                <p>
                    {totalCurriculos && totalCurriculos > 0
                        ? `${totalCurriculos} currículo${totalCurriculos === 1 ? '' : 's'} em avaliação contra os requisitos da vaga.`
                        : 'Avaliando os currículos contra os requisitos da vaga.'}
                </p>
                <small>Isso pode levar alguns segundos — não feche a página.</small>
            </div>
        </div>
    )
}
