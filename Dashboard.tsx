import { ArrowRight, ClipboardList, PackageCheck, Store, TimerOff, TriangleAlert } from 'lucide-react'
import { useStore, deadlineOf, isExpired, type Channel } from '../store'
import { navigate } from '../router'
import { Button, Card, ChannelBadge, Stat, StatusBadge, cx, toast } from '../components/ui'
import { addDays, dayShort, fromKey, shortDate, toKey, todayKey } from '../dates'
import { PageTitle } from './AdminLayout'
import { CodeDesk } from '../components/CodeDesk'

export default function Dashboard() {
  const { orders, config, setStatus, confirmPayment, lowStock, toDeliver } = useStore()
  const low = lowStock()
  const store = config.store
  const today = todayKey()
  const toPrepare = orders.filter((o) => o.status === 'pendiente' || o.status === 'preparacion').sort((a, b) => a.createdAt - b.createdAt)
  const waiting = orders.filter((o) => o.status === 'listo').sort((a, b) => (deadlineOf(a, store) ?? '').localeCompare(deadlineOf(b, store) ?? ''))
  const expired = waiting.filter((o) => isExpired(o, store))
  const deliveredToday = orders.filter((o) => o.status === 'entregado' && o.deliveredDate === today)

  const last7 = Array.from({ length: 7 }, (_, i) => toKey(addDays(new Date(), i - 6)))
  const perDay = last7.map((d) => ({ d, n: orders.filter((o) => o.status === 'entregado' && o.deliveredDate === d).length }))
  const maxDay = Math.max(1, ...perDay.map((x) => x.n))
  const channels: Channel[] = ['Tiendanube', 'WhatsApp', 'Instagram']
  const active = orders.filter((o) => o.status !== 'entregado')
  const perChannel = channels.map((c) => ({ c, n: active.filter((o) => o.channel === c).length }))
  const total = Math.max(1, active.length)
  const CH_COLOR: Record<Channel, string> = { Tiendanube: 'bg-sky-500', WhatsApp: 'bg-emerald-500', Instagram: 'bg-fuchsia-500' }

  const daysLeft = (o: (typeof orders)[number]) => {
    const d = deadlineOf(o, store)
    if (!d) return ''
    const diff = Math.round((fromKey(d).getTime() - fromKey(today).getTime()) / 864e5)
    return diff < 0 ? 'Vencido' : diff === 0 ? 'Vence hoy' : `Vence en ${diff} ${diff === 1 ? 'día' : 'días'}`
  }

  return (
    <>
      <PageTitle title="Resumen" subtitle={`Hoy es ${shortDate(today)}. Esto es lo que hay que preparar y quiénes pueden pasar.`} />

      <div className="mb-6"><CodeDesk /></div>

      {low.length > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800"><TriangleAlert className="h-5 w-5" /></span>
              <div>
                <h2 className="font-bold text-amber-950">Stock bajo en {low.length} {low.length === 1 ? 'producto' : 'productos'}</h2>
                <ul className="mt-1 space-y-0.5 text-sm text-amber-900">
                  {low.map(({ name, item }) => <li key={name}><b>{name}</b>: quedan {item.stock} (mínimo {item.min}){toDeliver(name) > 0 ? ` · ${toDeliver(name)} ya vendidas para retirar` : ''}</li>)}
                </ul>
              </div>
            </div>
            <Button variant="secondary" className="shrink-0" onClick={() => navigate('/admin/stock')}>Ver stock</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Para preparar" value={toPrepare.length} hint="Pendientes o en preparación" icon={ClipboardList} accent />
        <Stat label="Listos, esperando retiro" value={waiting.length - expired.length} hint="Clientes que pueden pasar" icon={Store} />
        <Stat label="Retirados hoy" value={deliveredToday.length} hint="Entregados con código" icon={PackageCheck} />
        <Stat label="Vencidos sin retirar" value={expired.length} hint={`Más de ${store.pickupDays} días listos`} icon={TimerOff} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="min-w-0">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <h2 className="font-bold">Para preparar</h2>
            <span className="text-xs text-ink-400">Del más viejo al más nuevo</span>
          </div>
          {toPrepare.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-400">No hay pedidos para preparar.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {toPrepare.slice(0, 6).map((o) => (
                <li key={o.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm"><b>{o.number}</b> · {o.customer}</div>
                    <div className="truncate text-xs text-ink-500">{o.products.join(', ')}</div>
                  </div>
                  <span className="hidden sm:inline"><ChannelBadge channel={o.channel} /></span>
                  {o.paid ? (
                    <Button variant="secondary" className="shrink-0 px-3 py-1.5 text-xs" onClick={() => { setStatus(o.id, 'listo'); toast(`${o.number} listo · se le avisó por mail a ${o.customer.split(' ')[0]}`) }}>Marcar listo</Button>
                  ) : (
                    <Button variant="secondary" className="shrink-0 border-amber-300 px-3 py-1.5 text-xs text-amber-800" onClick={() => { confirmPayment(o.id); toast(`Pago de ${o.number} confirmado`) }}>Confirmar pago</Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="min-w-0">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <h2 className="font-bold">Esperando que los retiren</h2>
            <span className="text-xs text-ink-400">Plazo: {store.pickupDays} días</span>
          </div>
          {waiting.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-400">No hay pedidos esperando.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {waiting.slice(0, 6).map((o) => (
                <li key={o.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm"><b>{o.number}</b> · {o.customer}</div>
                    <div className="text-xs text-ink-500">Listo desde {o.readyDate === today ? 'hoy' : shortDate(o.readyDate!)}</div>
                  </div>
                  <span className={cx('whitespace-nowrap text-xs font-semibold', isExpired(o, store) ? 'text-red-700' : 'text-ink-500')}>{daysLeft(o)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-bold">Retiros por día</h2>
          <p className="text-xs text-ink-400">Últimos 7 días</p>
          <div className="mt-5 flex h-36 items-end gap-3">
            {perDay.map(({ d, n }) => (
              <div key={d} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-xs font-semibold text-ink-700">{n}</span>
                <div className={cx('w-full rounded-t-lg', d === today ? 'bg-brand-800' : 'bg-brand-300')} style={{ height: `${(n / maxDay) * 100}px`, minHeight: 4 }} />
                <span className="text-xs text-ink-500">{d === today ? 'Hoy' : dayShort(d)}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-bold">Pedidos activos por canal</h2>
          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-ink-100">{perChannel.map(({ c, n }) => <div key={c} className={CH_COLOR[c]} style={{ width: `${(n / total) * 100}%` }} />)}</div>
          <div className="mt-4 space-y-2.5">
            {perChannel.map(({ c, n }) => (
              <div key={c} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><span className={cx('h-2.5 w-2.5 rounded-full', CH_COLOR[c])} /> {c}</span>
                <span className="font-semibold">{n} <span className="font-normal text-ink-400">· {Math.round((n / total) * 100)} %</span></span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/admin/pedidos')} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-900">Ver todos los pedidos <ArrowRight className="h-3.5 w-3.5" /></button>
        </Card>
      </div>
      {deliveredToday.length > 0 && (
        <p className="mt-6 flex flex-wrap items-center gap-2 text-sm text-ink-500">Retirados hoy: {deliveredToday.map((o) => <StatusBadge key={o.id} status="entregado" label={o.number} />)}</p>
      )}
    </>
  )
}
