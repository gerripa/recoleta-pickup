import type { ReactNode } from 'react'
import { CalendarCog, ClipboardList, Gift, Home, LayoutDashboard, Mail, PlusCircle, RotateCcw, Store } from 'lucide-react'
import { navigate } from '../router'
import { useStore } from '../store'
import { Logo, cx, toast } from '../components/ui'
import Dashboard from './Dashboard'
import Orders from './Orders'
import ManualOrder from './ManualOrder'
import Schedule from './Schedule'
import Benefits from './Benefits'
import Messages from './Messages'

const NAV = [
  { key: 'resumen', label: 'Resumen', icon: LayoutDashboard },
  { key: 'pedidos', label: 'Pedidos', icon: ClipboardList },
  { key: 'nuevo', label: 'Nuevo pedido manual', icon: PlusCircle },
  { key: 'beneficios', label: 'Beneficios', icon: Gift },
  { key: 'mensajes', label: 'Mails automáticos', icon: Mail },
  { key: 'horarios', label: 'Local y horario', icon: CalendarCog },
]

export default function AdminLayout({ section }: { section: string }) {
  const { resetDemo } = useStore()
  const current = NAV.find((n) => n.key === section) ?? NAV[0]
  const reset = () => {
    resetDemo()
    toast('Datos de la demo restablecidos')
  }

  return (
    <div className="min-h-screen bg-ink-50 lg:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-brand-900 p-5 text-white lg:flex">
        <button onClick={() => navigate('/')} className="text-left"><Logo light /></button>
        <div className="mt-2 text-xs text-brand-300">Panel del administrador</div>
        <nav className="mt-8 space-y-1">
          {NAV.map((n) => (
            <button key={n.key} onClick={() => navigate(`/admin/${n.key}`)} className={cx('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium', current.key === n.key ? 'bg-white text-brand-900' : 'text-brand-100 hover:bg-white/10')}>
              <n.icon className="h-[18px] w-[18px]" /> {n.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto space-y-1 border-t border-white/10 pt-4">
          <button onClick={() => navigate('/tiendanube')} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-brand-200 hover:bg-white/10"><Store className="h-4 w-4" /> Simulador Tiendanube</button>
          <button onClick={() => navigate('/')} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-brand-200 hover:bg-white/10"><Home className="h-4 w-4" /> Vista del cliente</button>
          <button onClick={reset} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-brand-200 hover:bg-white/10"><RotateCcw className="h-4 w-4" /> Restablecer demo</button>
        </div>
      </aside>

      <div className="sticky top-0 z-30 bg-brand-900 text-white lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <button onClick={() => navigate('/')}><Logo light small /></button>
          <div className="flex gap-1">
            <button onClick={() => navigate('/tiendanube')} aria-label="Simulador Tiendanube" className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/10"><Store className="h-4 w-4" /></button>
            <button onClick={reset} aria-label="Restablecer demo" className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/10"><RotateCcw className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto px-3 pb-3">
          {NAV.map((n) => (
            <button key={n.key} onClick={() => navigate(`/admin/${n.key}`)} className={cx('flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold', current.key === n.key ? 'bg-white text-brand-900' : 'bg-white/5 text-brand-100')}>
              <n.icon className="h-3.5 w-3.5" /> {n.label}
            </button>
          ))}
        </div>
      </div>

      <main className="min-w-0 flex-1">
        <div key={current.key} className="fade-in mx-auto max-w-6xl px-4 py-8 sm:px-8">
          {current.key === 'resumen' && <Dashboard />}
          {current.key === 'pedidos' && <Orders />}
          {current.key === 'nuevo' && <ManualOrder />}
          {current.key === 'beneficios' && <Benefits />}
          {current.key === 'mensajes' && <Messages />}
          {current.key === 'horarios' && <Schedule />}
        </div>
      </main>
    </div>
  )
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-ink-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
