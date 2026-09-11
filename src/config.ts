/**
 * Configuração centralizada da API
 * 
 * Em desenvolvimento (npm run dev):
 *   - Usa /api (proxy para http://localhost:5000 via vite.config.ts)
 * 
 * Em produção (npm run build + npm run preview):
 *   - Usa a URL definida em VITE_API_URL ou /api como fallback
 */

export const API_URL = import.meta.env.VITE_API_URL || '/api'

/**
 * Constrói a URL completa para uma requisição da API
 * 
 * @param path - O caminho da rota (ex: '/auth/login')
 * @returns URL completa (ex: '/api/auth/login' ou 'https://api.exemplo.com/auth/login')
 */
export function getApiUrl(path: string): string {
    const base = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL
    const endpoint = path.startsWith('/') ? path : '/' + path
    return base + endpoint
}
