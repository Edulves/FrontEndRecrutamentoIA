import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Garante que o DOM seja limpo entre os testes
afterEach(() => {
  cleanup()
})
