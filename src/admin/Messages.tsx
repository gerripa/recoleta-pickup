import { useMemo, useState } from 'react'
import { BellRing, CalendarClock, CheckCircle2, Heart, PackageCheck, RefreshCw } from 'lucide-react'
import { useStore, type Message } from '../store'
import { Card, cx } from '../components/ui'
import { MailPreview } from '../components/pickup'
import { shortDate, todayKey } from '../dates'
import { PageTitle } from './AdminLayout'

const KIND: Record<Message['kind'], { label: string; icon: typeof Heart; cls: string }> = {
  confirmacion: { label: 'Confirmación', icon: CheckCircle2, cls: 'bg-brand-50 text-brand-700' },
  listo: { label: 'Pedido listo', icon: PackageCheck, cls: 'bg-sky-50 text-sky-700' },
  recordatorio: { label: 'Recordatorio', icon: BellRing, cls: 'bg-orange-50 text-orange-700' },
  gracias: { label: 'Gracias + tarjeta', icon: Heart, cls: 'bg-fuchsia-50 text-fuchsia-700' },
  recompra: { label: 'Aviso de recompra', icon: RefreshCw, cls: 'bg-amber-50 text-amber-700' },
}

const WHEN: Record<Message['kind'], string> = { confirmacion: 'Al comprar', listo: 'Al marcar "listo"', recordatorio: '2 días antes de que venza', gracias: 'Al entregar', recompra: '5 días antes de que se termine' }

export default function Messages() {
  const { allMessages } = useStore()
  const today = todayKey()
  const [tab, setTab] = useState<'enviados' | 'programados'>('enviados')
  const all = useMemo(() => allMessages(), [allMessages])
  const sent = all.filter((m) => m.date <= today)
  const scheduled = all.filter((m) => m.date > today).sort((a, b) => a.date.localeCompare(b.date))
  const list = tab === 'enviados' ? sent : scheduled
  const [selId, setSelId] = useState<string | null>(null)
  const sel = list.find((m) => m.id === selId) ?? list[0]

  return (
    <>
      <PageTitle title="Mails automáticos" subtitle="La página los envía sola según el estado de cada pedido. El cliente no tiene que hacer nada." />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {(Object.keys(KIND) as Message['kind'][]).map((k) => {
          const K = KIND[k]
          return (
            <div key={k} className="flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-3">
              <span className={cx('grid h-9 w-9 place-items-center rounded-lg', K.cls)}><K.icon className="h-4 w-4" /></span>
              <div className="text-sm"><div className="font-semibold">{K.label}</div><div className="text-xs text-ink-500">{WHEN[k]}</div></div>
            </div>
          )
        })}
      </div>

      <div className="mb-4 inline-flex rounded-xl bg-ink-100 p-1 text-sm font-semibold">
        <button onClick={() => { setTab('enviados'); setSelId(null) }} className={cx('rounded-lg px-4 py-2', tab === 'enviados' ? 'bg-white shadow-sm' : 'text-ink-500')}>Enviados ({sent.length})</button>
        <button onClick={() => { setTab('programados'); setSelId(null) }} className={cx('rounded-lg px-4 py-2', tab === 'programados' ? 'bg-white shadow-sm' : 'text-ink-500')}>Programados ({scheduled.length})</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card className="max-h-[560px] divide-y divide-ink-100 overflow-y-auto">
          {list.map((m) => {
            const K = KIND[m.kind]
            return (
              <button key={m.id} onClick={() => setSelId(m.id)} className={cx('flex w-full items-start gap-3 p-4 text-left hover:bg-ink-50', sel?.id === m.id && 'bg-brand-50/60')}>
                <span className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-lg', K.cls)}><K.icon className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold">{m.order.customer}</span><span className="shrink-0 text-xs text-ink-400">{m.date === today ? 'Hoy' : shortDate(m.date)}</span></div>
                  <div className="truncate text-sm text-ink-600">{m.subject}</div>
                </div>
              </button>
            )
          })}
          {list.length === 0 && <p className="p-8 text-center text-sm text-ink-400"><CalendarClock className="mx-auto mb-2 h-5 w-5" />No hay mails en esta lista.</p>}
        </Card>
        <div>{sel && <MailPreview message={sel} to={sel.order.email} />}</div>
      </div>
    </>
  )
}
