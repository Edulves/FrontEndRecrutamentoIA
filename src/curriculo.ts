import { getToken } from './auth'

/**
 * Abre o currículo armazenado do candidato: PDF/TXT numa aba nova, DOCX baixa
 * com o nome original. Retorna 'sem-sessao' quando o JWT expirou, para o
 * chamador derrubar pro login; falhas de rede/HTTP estouram Error.
 */
export async function abrirCurriculo(candidatoId: string, nomeArquivo: string): Promise<'ok' | 'sem-sessao'> {
    const token = getToken()
    if (!token) return 'sem-sessao'

    // A aba precisa abrir DENTRO do gesto do clique — depois do await o
    // navegador bloqueia como popup (Safari sempre; Chrome/Firefox quando a
    // resposta demora). Se ainda assim for bloqueada, cai no download.
    const docx = /\.docx$/i.test(nomeArquivo)
    const aba = docx ? null : window.open('', '_blank')
    try {
        const resp = await fetch(`/api/candidatos/${candidatoId}/curriculo`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        if (resp.status === 401) {
            aba?.close()
            return 'sem-sessao'
        }
        if (!resp.ok) throw new Error('Não foi possível abrir o currículo.')

        const blob = await resp.blob()
        const url = URL.createObjectURL(blob)
        if (aba) {
            aba.location.href = url
        } else {
            const a = document.createElement('a')
            a.href = url
            a.download = nomeArquivo
            a.click()
        }
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
        return 'ok'
    } catch (err) {
        aba?.close()
        throw err
    }
}
