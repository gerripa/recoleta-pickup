import { useMemo } from 'react'
import { BadgePercent, Clock, Repeat, ShoppingBag, Timer, Truck, Wallet } from 'lucide-react'
import { useStore, isExpired, money, normEmail, totals, AVG_SHIPPING, type Channel } from '../store'
import { Card, Stat, cx } from '../components/ui'
import { addDays, fromKey, toKey } from '../dates'
import { PageTitle } from './AdminLayout'

const CH_COLOR: Record<Channel, string> = { Tiendanube: 'bg-sky-500', WhatsApp: 'bg-emerald-500', Instagram: 'bg-fuchsia-500' }
const WEEK = [{ d: 1, l: 'Lun' }, { d: 2, l: 'Mar' }, { d: 3, l: 'Mié' }, { d: 4, l: 'Jue' }, { d: 5, l: 'Vie' }, { d: 6, l: 'Sáb' }, { d: 0, l: 'Dom' }]

function Bars({ rows, format = (n: number) => String(n) }: { rows: { label: string; value: number; color?: string }[]; format?: (n: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 text-sm">
          <span className="truncate text-ink-700">{r.label}</span>
          <span className="font-semibold">{format(r.value)}</span>
          <div className="col-span-2 h-2 overflow-hidden rounded-full bg-ink-100"><div className={cx('h-full rounded-full', r.color ?? 'bg-brand-700')} style={{ width: `${(r.value / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  )
}

/** Números para que Martín vea si el retiro en el local le conviene */
export default function Metrics() {
  const { orders, config } = useStore()

  const m = useMemo(() => {
    const since = toKey(addDays(new Date(), -30))
    const valid = orders.filter((o) => o.status !== 'sin_reserva')
    const month = valid.filter((o) => o.createdDate >= since)
    const sales = month.reduce((s, o) => s + totals(o.products, o.discountPct).total, 0)
    const disc = month.reduce((s, o) => s + totals(o.products, o.discountPct).discount, 0)
    const delivered = valid.filter((o) => o.status === 'entregado')
    const expired = valid.filter((o) => isExpired(o, config.store))
    const waitDays = delivered.filter((o) => o.readyDate && o.deliveredDate).map((o) => (fromKey(o.deliveredDate!).getTime() - fromKey(o.readyDate!).getTime()) / 864e5)
    const byEmail = new Map<string, number>()
    for (const o of valid) if (o.email) byEmail.set(normEmail(o.email), (byEmail.get(normEmail(o.email)) ?? 0) + 1)
    const clients = [...byEmail.values()]
    const prod = new Map<string, number>()
    for (const o of month) for (const p of o.products) prod.set(p, (prod.get(p) ?? 0) + 1)
    const channels: Channel[] = ['Tiendanube', 'WhatsApp', 'Instagram']
    return {
      sales,
      count: month.length,
      ticket: month.length ? sales / month.length : 0,
      disc,
      discPct: sales + disc ? (disc / (sales + disc)) * 100 : 0,
      saved: delivered.filter((o) => o.deliveredDate! >= since).length * AVG_SHIPPING,
      onTime: delivered.length + expired.length ? (delivered.length / (delivered.length + expired.length)) * 100 : 100,
      wait: waitDays.length ? waitDays.reduce((a, b) => a + b, 0) / waitDays.length : 0,
      recurrent: clients.length ? (clients.filter((n) => n >= 2).length / clients.length) * 100 : 0,
      clients: clients.length,
      top: [...prod.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, value]) => ({ label, value })),
      perChannel: channels.map((c) => ({ label: c, value: month.filter((o) => o.channel === c).reduce((s, o) => s + totals(o.products, o.discountPct).total, 0), color: CH_COLOR[c] })),
      perWeekday: WEEK.map(({ d, l }) => ({ label: l, value: delivered.filter((o) => fromKey(o.deliveredDate!).getDay() === d).length })),
    }
  }, [orders, config.store])

  const busiest = [...m.perWeekday].sort((a, b) => b.value - a.value)[0]

  return (
    <>
      <PageTitle title="Métricas" subtitle="Últimos 30 días de pedidos con retiro en el local. Sirve para medir si el retiro aporta valor." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Ventas con retiro" value={money(m.sales)} hint={`${m.count} pedidos`} icon={Wallet} accent />
        <Stat label="Ticket promedio" value={money(m.ticket)} hint="Por pedido con retiro" icon={ShoppingBag} />
        <Stat label="Clientes que vuelven" value={`${Math.round(m.recurrent)} %`} hint={`De ${m.clients} clientes con email`} icon={Repeat} />
        <Stat label="Envíos ahorrados" value={money(m.saved)} hint={`Estimado a ${money(AVG_SHIPPING)} por envío`} icon={Truck} />
        <Stat label="Retiran a tiempo" value={`${Math.round(m.onTime)} %`} hint="Antes de que venza el plazo" icon={Timer} />
        <Stat label="Días hasta que retiran" value={m.wait.toFixed(1)} hint="Promedio desde que está listo" icon={Clock} />
        <Stat label="Descuentos dados" value={money(m.disc)} hint={`${m.discPct.toFixed(1)} % de lo vendido`} icon={BadgePercent} />
        <Stat label="Día con más retiros" value={busiest.value ? busiest.label : '—'} hint="Para organizar quién atiende" icon={Clock} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-5"><h2 className="font-bold">Productos más vendidos</h2><p className="mb-4 text-xs text-ink-400">Unidades con retiro</p><Bars rows={m.top} format={(n) => `${n} u.`} /></Card>
        <Card className="p-5"><h2 className="font-bold">Ventas por canal</h2><p className="mb-4 text-xs text-ink-400">Todos terminan en el mismo panel</p><Bars rows={m.perChannel} format={money} /></Card>
        <Card className="p-5"><h2 className="font-bold">Retiros por día de la semana</h2><p className="mb-4 text-xs text-ink-400">Cuándo viene más gente al local</p><Bars rows={m.perWeekday} /></Card>
      </div>
      <p className="mt-4 text-xs text-ink-400">Datos de la demo. En la versión real se calculan con los pedidos de Tiendanube, WhatsApp e Instagram guardados en la base de datos.</p>
    </>
  )
}
