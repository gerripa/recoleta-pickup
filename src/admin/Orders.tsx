import { useMemo, useState } from 'react'
import { ExternalLink, Link2, Search, X, KeyRound, Gift } from 'lucide-react'
import { useStore, PREP_STATUSES, STATUS_LABEL, deadlineOf, isExpired, money, totals, type Channel, type Order, type Status } from '../store'
import { navigate, reserveLink } from '../router'
import { Button, Card, ChannelBadge, StatusBadge, STATUS_STYLE, copyText, cx, toast } from '../components/ui'
import { shortDate, todayKey } from '../dates'
import { PageTitle } from './AdminLayout'

const field = 'rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100'

/** Para entregar hay que validar el código de retiro: así solo suman retiros reales */
function DeliverModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const { setStatus, quote, config } = useStore()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const submit = () => {
    if (code.trim().toUpperCase() !== (order.code ?? '').toUpperCase()) return setError('El código no coincide. Pedíselo al cliente.')
    const before = quote(order.email, [], order.id).loyalty
    setStatus(order.id, 'entregado')
    const goal = config.benefits.loyalty.every
    if (config.benefits.loyalty.on && (before.done + 2) % goal === 0) toast(`${order.customer} ya tiene ${config.benefits.loyalty.pct} % off en su próxima compra · se le avisó por mail`)
    else if (config.benefits.loyalty.on && (before.done + 1) % goal === 0) toast(`${order.customer} completó su tarjeta de ${goal} retiros`)
    else toast(`${order.number} entregado · se envió el mail de agradecimiento`)
    onClose()
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="fade-in w-full max-w-sm rounded-2xl bg-white p-6 shadow-lift" onClick={(e) => e.stopPropagation()}>
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700"><KeyRound className="h-5 w-5" /></span>
        <h2 className="mt-4 text-lg font-bold">Entregar pedido {order.number}</h2>
        <p className="mt-1 text-sm text-ink-500">Pedile a {order.customer.split(' ')[0]} su código de retiro.</p>
        <input autoFocus value={code} onChange={(e) => { setCode(e.target.value); setError('') }} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="RP-0000-XXXX" className={cx(field, 'mt-4 w-full font-mono uppercase')} />
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        <button onClick={() => setCode(order.code ?? '')} className="mt-2 text-xs text-ink-400 underline-offset-2 hover:underline">Demo: completar con el código del cliente</button>
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" onClick={submit}>Confirmar entrega</Button>
        </div>
      </div>
    </div>
  )
}

function StatusSelect({ order, onDeliver }: { order: Order; onDeliver: (o: Order) => void }) {
  const { setStatus } = useStore()
  if (order.status === 'sin_reserva') return <StatusBadge status="sin_reserva" label="Esperando al cliente" />
  if (order.status === 'entregado') return <StatusBadge status="entregado" />
  return (
    <select
      aria-label={`Estado del pedido ${order.number}`}
      value={order.status}
      onChange={(e) => {
        const s = e.target.value as Status
        if (s === 'entregado') return onDeliver(order)
        setStatus(order.id, s)
        toast(`${order.number}: ${STATUS_LABEL[s]}${s === 'listo' ? ' · se le avisó por mail' : ''}`)
      }}
      className={cx('cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold outline-none ring-1', STATUS_STYLE[order.status])}
    >
      {PREP_STATUSES.map((s, i) => <option key={s} value={s} className="bg-white text-ink-900">{i + 1}. {STATUS_LABEL[s]}</option>)}
    </select>
  )
}

function Payment({ order }: { order: Order }) {
  const { confirmPayment } = useStore()
  if (order.paid) return <span className="text-xs font-medium text-brand-700">Pagado</span>
  return (
    <div>
      <span className="text-xs font-medium text-amber-700">Pago pendiente</span>
      <button onClick={() => { confirmPayment(order.id); toast(`Pago de ${order.number} confirmado`) }} className="block text-xs font-semibold text-brand-700 hover:text-brand-900">Confirmar pago</button>
    </div>
  )
}

function RowActions({ order }: { order: Order }) {
  if (order.status !== 'sin_reserva') return null
  return (
    <div className="flex gap-3">
      <button onClick={async () => toast((await copyText(reserveLink(order.id))) ? 'Enlace copiado' : 'No se pudo copiar el enlace')} className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-brand-700 hover:text-brand-900"><Link2 className="h-3.5 w-3.5" /> Copiar enlace</button>
      <button onClick={() => navigate(`/reservar/${order.id}`)} className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-ink-500 hover:text-ink-900"><ExternalLink className="h-3.5 w-3.5" /> Abrir</button>
    </div>
  )
}

function PickupInfo({ order }: { order: Order }) {
  const { config } = useStore()
  const today = todayKey()
  const d = (k: string) => (k === today ? 'hoy' : shortDate(k))
  if (order.status === 'entregado' && order.deliveredDate) return <span className="whitespace-nowrap text-ink-500">Retirado {d(order.deliveredDate)}</span>
  if (order.status === 'listo' && order.readyDate) {
    const dl = deadlineOf(order, config.store)!
    return (
      <div className="whitespace-nowrap">
        <span>Listo desde {d(order.readyDate)}</span>
        <span className={cx('block text-xs', isExpired(order, config.store) ? 'font-semibold text-red-700' : 'text-ink-500')}>{isExpired(order, config.store) ? 'Vencido: no lo retiró' : `Puede retirar hasta ${d(dl)}`}</span>
      </div>
    )
  }
  return <span className="whitespace-nowrap text-ink-500">Pedido {d(order.createdDate)}</span>
}

export default function Orders() {
  const { orders, config } = useStore()
  const [channel, setChannel] = useState<'todos' | Channel>('todos')
  const [status, setStatus] = useState<'todos' | 'vencido' | Status>('todos')
  const [view, setView] = useState<'activos' | 'todos'>('activos')
  const [q, setQ] = useState('')
  const [deliver, setDeliver] = useState<Order | null>(null)

  const list = useMemo(
    () =>
      orders
        .filter((o) => view === 'todos' || o.status !== 'entregado' || o.deliveredDate === todayKey())
        .filter((o) => channel === 'todos' || o.channel === channel)
        .filter((o) => (status === 'todos' ? true : status === 'vencido' ? isExpired(o, config.store) : o.status === status))
        .filter((o) => !q || `${o.number} ${o.customer} ${o.email} ${o.products.join(' ')}`.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => PREP_ORDER.indexOf(a.status) - PREP_ORDER.indexOf(b.status) || a.createdAt - b.createdAt),
    [orders, channel, status, view, q, config.store],
  )
  const filtered = channel !== 'todos' || status !== 'todos' || view !== 'activos' || q
  const clear = () => { setChannel('todos'); setStatus('todos'); setView('activos'); setQ('') }

  return (
    <>
      <PageTitle title="Pedidos" subtitle="Todos los pedidos con retiro, sin importar el canal de compra." action={<Button onClick={() => navigate('/admin/nuevo')}>+ Nuevo pedido manual</Button>} />

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
          <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar pedido, cliente o email" className={cx(field, 'w-full pl-9')} /></div>
          <select aria-label="Vista" value={view} onChange={(e) => setView(e.target.value as typeof view)} className={field}><option value="activos">Activos y retirados hoy</option><option value="todos">Todo el historial</option></select>
          <select aria-label="Canal" value={channel} onChange={(e) => setChannel(e.target.value as typeof channel)} className={field}><option value="todos">Todos los canales</option><option>Tiendanube</option><option>WhatsApp</option><option>Instagram</option></select>
          <select aria-label="Estado" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={field}>
            <option value="todos">Todos los estados</option>
            {(['sin_reserva', ...PREP_STATUSES] as Status[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            <option value="vencido">Vencidos sin retirar</option>
          </select>
          <Button variant="ghost" onClick={clear} disabled={!filtered} className="disabled:opacity-40"><X className="h-4 w-4" /> Limpiar</Button>
        </div>
      </Card>

      <p className="mb-3 mt-5 text-sm text-ink-500">{list.length} {list.length === 1 ? 'pedido' : 'pedidos'}</p>

      <Card className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-500">
            <tr>{['Pedido', 'Productos', 'Canal', 'Retiro', 'Total', 'Pago', 'Estado', ''].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {list.map((o) => {
              const t = totals(o.products, o.discountPct)
              return (
                <tr key={o.id} className="align-middle hover:bg-ink-50/60">
                  <td className="px-4 py-3.5"><div className="font-semibold">{o.number}</div><div className="text-xs text-ink-500">{o.customer}</div></td>
                  <td className="max-w-[220px] px-4 py-3.5 text-ink-600">{o.products.join(', ')}</td>
                  <td className="px-4 py-3.5"><ChannelBadge channel={o.channel} /></td>
                  <td className="px-4 py-3.5"><PickupInfo order={o} /></td>
                  <td className="whitespace-nowrap px-4 py-3.5"><div className="font-semibold">{money(t.total)}</div>{o.benefits.length > 0 && <div className="flex items-center gap-1 text-xs text-brand-700"><Gift className="h-3 w-3" /> {o.benefits.map((b) => b.title).join(', ')}</div>}</td>
                  <td className="px-4 py-3.5"><Payment order={o} /></td>
                  <td className="px-4 py-3.5"><StatusSelect order={o} onDeliver={setDeliver} /></td>
                  <td className="px-4 py-3.5 text-right"><RowActions order={o} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {list.length === 0 && <p className="py-10 text-center text-sm text-ink-400">Ningún pedido coincide con los filtros.</p>}
      </Card>

      <div className="space-y-3 md:hidden">
        {list.map((o) => (
          <Card key={o.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div><div className="font-semibold">{o.number} · {o.customer}</div><div className="mt-0.5 text-sm text-ink-500">{o.products.join(', ')}</div></div>
              <ChannelBadge channel={o.channel} />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm"><PickupInfo order={o} /><span className="font-semibold">{money(totals(o.products, o.discountPct).total)}</span></div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><Payment order={o} /><StatusSelect order={o} onDeliver={setDeliver} /></div>
            <div className="mt-2"><RowActions order={o} /></div>
          </Card>
        ))}
        {list.length === 0 && <p className="py-10 text-center text-sm text-ink-400">Ningún pedido coincide con los filtros.</p>}
      </div>

      {deliver && <DeliverModal order={deliver} onClose={() => setDeliver(null)} />}
    </>
  )
}

const PREP_ORDER: Status[] = ['sin_reserva', 'pendiente', 'preparacion', 'listo', 'entregado']
