import { useEffect, useState } from 'react'

// Router mínimo basado en el hash (#/ruta), así los enlaces de reserva funcionan sin servidor.

const current = () => window.location.hash.replace(/^#/, '') || '/'

export function useRoute() {
  const [path, setPath] = useState(current)
  useEffect(() => {
    const on = () => {
      setPath(current())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return path
}

export const navigate = (path: string) => {
  window.location.hash = path
}

/** Enlace completo de reserva para compartir con el cliente */
export const reserveLink = (orderId: string) => {
  const base = window.location.href.split('#')[0]
  return `${base}#/reservar/${orderId}`
}
