import { isCloud } from './backend'
import type { ReactNode } from 'react'
import { LayoutDashboard } from 'lucide-react'
import { useRoute, navigate } from './router'
import { Logo, Toaster, DemoBadge } from './components/ui'
import Home from './pages/Home'
import Tiendanube from './pages/Tiendanube'
import Checkout from './pages/Checkout'
import ReserveLookup from './pages/ReserveLookup'
import Reserve from './pages/Reserve'
import Confirmation from './pages/Confirmation'
import AdminLayout from './admin/AdminLayout'

/** Páginas que ve el cliente real (link de WhatsApp/Instagram y confirmación): sin cosas de la demo ni acceso al panel */
function CustomerShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-ink-200/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo small />
          <span className="text-xs font-semibold text-ink-500">Recoleta al Fallo · Suplementos</span>
        </div>
      </header>
      <main>{children}</main>
      <footer className="mx-auto max-w-6xl px-4 py-10 text-center text-xs text-ink-400 sm:px-6">Recoleta al Fallo · Retiro en el local</footer>
    </div>
  )
}

function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-ink-200/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <button onClick={() => navigate('/')} aria-label="Ir al inicio"><Logo small /></button>
          <div className="flex items-center gap-2">
            <DemoBadge className="hidden sm:inline-flex" />
            <button onClick={() => navigate('/admin')} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-ink-600 hover:bg-ink-100 hover:text-ink-900">
              <LayoutDashboard className="h-4 w-4" /> <span className="hidden sm:inline">Panel del administrador</span><span className="sm:hidden">Panel</span>
            </button>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="mx-auto max-w-6xl px-4 py-10 text-center text-xs text-ink-400 sm:px-6">Recoleta PickUp · Prototipo para IA Aplicada a Negocios (ITBA, TP3) · {isCloud ? 'Pedidos guardados en la base de datos · pago y Tiendanube simulados · precios de ejemplo' : 'Datos, precios y mails ficticios guardados solo en este navegador'}</footer>
    </div>
  )
}

export default function App() {
  const path = useRoute()
  const parts = path.split('/').filter(Boolean)
  if (parts[0] === 'admin')
    return (
      <>
        <AdminLayout section={parts[1] ?? 'resumen'} />
        <Toaster />
      </>
    )

  let page: ReactNode
  switch (parts[0]) {
    case 'tiendanube':
      page = <Tiendanube />
      break
    case 'checkout':
      page = <Checkout key={path} />
      break
    case 'reservar':
      page = parts[1] ? <Reserve key={parts[1]} id={parts[1]} /> : <ReserveLookup />
      break
    case 'confirmacion':
      page = <Confirmation id={parts[1]} />
      break
    default:
      page = <Home />
  }
  const Shell = parts[0] === 'reservar' || parts[0] === 'confirmacion' ? CustomerShell : PublicShell
  return (
    <>
      <Shell>{page}</Shell>
      <Toaster />
    </>
  )
}
