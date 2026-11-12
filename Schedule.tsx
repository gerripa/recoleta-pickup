import { useState } from 'react'
import { CalendarX2, CircleAlert, Minus, Plus, Save, X } from 'lucide-react'
import { useStore, DEFAULT_STORE, ordersOnDate, ordersOnWeekday, upcomingClosed, hoursText, type StoreInfo } from '../store'
import { Button, Card, cx, toast } from '../components/ui'
import { PageTitle } from './AdminLayout'
import { longDate, shortDate, todayKey } from '../dates'

const DAY_FULL = ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados']
const list = (nums: string[]) => (nums.length <= 3 ? nums.join(', ') : `${nums.slice(0, 3).join(', ')} y ${nums.length - 3} más`)

const DAYS = [{ d: 1, l: 'Lun' }, { d: 2, l: 'Mar' }, { d: 3, l: 'Mié' }, { d: 4, l: 'Jue' }, { d: 5, l: 'Vie' }, { d: 6, l: 'Sáb' }, { d: 0, l: 'Dom' }]
const field = 'rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100'

/** Datos del local que ve el cliente al elegir retiro */
export default function Schedule() {
  const { config, saveConfig, orders } = useStore()
  const [s, setS] = useState<StoreInfo>(config.store)
  const [dayError, setDayError] = useState('')
  const [newDate, setNewDate] = useState('')
  const [reason, setReason] = useState('Feriado')
  const [dateError, setDateError] = useState('')

  /** No se puede cerrar un día fijo si hay pedidos que se pueden retirar ese día de la semana */
  const toggleDay = (d: number, on: boolean) => {
    setDayError('')
    if (!on) return setS({ ...s, openDays: [...s.openDays, d] })
    const hits = ordersOnWeekday(orders, s, d)
    if (hits.length > 0) {
      const first = hits.flatMap((h) => h.dates).sort()[0]
      return setDayError(`No podés cerrar los ${DAY_FULL[d]}: hay ${hits.length} ${hits.length === 1 ? 'pedido que se puede' : 'pedidos que se pueden'} retirar el ${longDate(first)} (${list(hits.map((h) => h.order.number))}). Esperá a que se entreguen o bloqueá fechas puntuales más adelante.`)
    }
    setS({ ...s, openDays: s.openDays.filter((x) => x !== d) })
  }

  /** Bloquear una fecha puntual (feriado), solo si nadie la tiene dentro de su plazo de retiro */
  const addDate = () => {
    setDateError('')
    if (!newDate) return setDateError('Elegí una fecha.')
    if (newDate < todayKey()) return setDateError('Esa fecha ya pasó.')
    if (s.closedDates.some((c) => c.date === newDate)) return setDateError('Esa fecha ya está bloqueada.')
    const hits = ordersOnDate(orders, s, newDate)
    if (hits.length > 0) return setDateError(`No podés cerrar el ${longDate(newDate)}: ${hits.length} ${hits.length === 1 ? 'pedido se puede' : 'pedidos se pueden'} retirar ese día (${list(hits.map((o) => o.number))}).`)
    setS({ ...s, closedDates: [...s.closedDates, { date: newDate, reason: reason.trim() || 'Cerrado' }].sort((a, b) => a.date.localeCompare(b.date)) })
    setNewDate('')
  }
  const dirty = JSON.stringify(s) !== JSON.stringify(config.store)
  const valid = s.openDays.length > 0 && s.closeHour > s.openHour && s.address.trim().length > 3

  return (
    <>
      <PageTitle
        title="Local y horario"
        subtitle="Lo que ve el cliente cuando elige retirar. El cliente no elige horario: pasa cuando el local está abierto."
        action={<Button disabled={!dirty || !valid} onClick={() => { saveConfig({ ...config, store: s }); toast('Datos del local guardados') }}><Save className="h-4 w-4" /> Guardar cambios</Button>}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-bold">Dirección</h2>
            <input className={cx(field, 'mt-3 w-full')} value={s.address} onChange={(e) => setS({ ...s, address: e.target.value })} />
          </Card>
          <Card className="p-6">
            <h2 className="font-bold">Días de atención</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {DAYS.map(({ d, l }) => {
                const on = s.openDays.includes(d)
                return <button key={d} onClick={() => toggleDay(d, on)} className={cx('h-11 w-14 rounded-xl text-sm font-semibold', on ? 'bg-brand-800 text-white' : 'border border-ink-200 text-ink-500 hover:border-ink-300')}>{l}</button>
              })}
            </div>
            {s.openDays.length === 0 && <p className="mt-3 text-sm text-red-700">Elegí al menos un día.</p>}
            {dayError && <p className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-800"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{dayError}</p>}
            <p className="mt-3 text-xs text-ink-400">Para cerrar un día fijo no puede haber pedidos que se puedan retirar ese día.</p>
          </Card>
          <Card className="p-6">
            <h2 className="font-bold">Días puntuales sin atención</h2>
            <p className="mt-1 text-sm text-ink-500">Feriados, vacaciones o un día que no abren. Se bloquea solo esa fecha, no todas las semanas.</p>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label className="block"><span className="text-sm text-ink-500">Fecha</span><input type="date" min={todayKey()} value={newDate} onChange={(e) => { setNewDate(e.target.value); setDateError('') }} className={cx(field, 'mt-1 block')} /></label>
              <label className="block min-w-[160px] flex-1"><span className="text-sm text-ink-500">Motivo</span><input value={reason} onChange={(e) => setReason(e.target.value)} className={cx(field, 'mt-1 block w-full')} /></label>
              <Button variant="secondary" onClick={addDate}><CalendarX2 className="h-4 w-4" /> Bloquear fecha</Button>
            </div>
            {dateError && <p className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-800"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{dateError}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {s.closedDates.length === 0 && <span className="text-sm text-ink-400">No hay fechas bloqueadas.</span>}
              {s.closedDates.map((c) => (
                <span key={c.date} className={cx('inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm', c.date < todayKey() ? 'border-ink-200 text-ink-400' : 'border-red-200 bg-red-50 text-red-900')}>
                  <b>{shortDate(c.date)}</b> {c.reason}
                  <button aria-label={`Desbloquear ${c.date}`} onClick={() => setS({ ...s, closedDates: s.closedDates.filter((x) => x.date !== c.date) })} className="text-red-700 hover:text-red-950"><X className="h-3.5 w-3.5" /></button>
                </span>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="font-bold">Horario</h2>
            <div className="mt-4 flex flex-wrap items-end gap-4">
              <label className="block"><span className="text-sm text-ink-500">Abre</span>
                <select className={cx(field, 'mt-1 block w-28')} value={s.openHour} onChange={(e) => setS({ ...s, openHour: Number(e.target.value) })}>{Array.from({ length: 10 }, (_, i) => i + 7).map((h) => <option key={h} value={h}>{h}:00</option>)}</select>
              </label>
              <label className="block"><span className="text-sm text-ink-500">Cierra</span>
                <select className={cx(field, 'mt-1 block w-28')} value={s.closeHour} onChange={(e) => setS({ ...s, closeHour: Number(e.target.value) })}>{Array.from({ length: 10 }, (_, i) => i + 14).map((h) => <option key={h} value={h}>{h}:00</option>)}</select>
              </label>
            </div>
            {s.closeHour <= s.openHour && <p className="mt-3 text-sm text-red-700">El cierre tiene que ser después de la apertura.</p>}
          </Card>
          <Card className="p-6">
            <h2 className="font-bold">Plazo para retirar</h2>
            <p className="mt-1 text-sm text-ink-500">Días que el pedido espera listo. Dos días antes de que venza, el cliente recibe un recordatorio.</p>
            <div className="mt-4 flex items-center gap-3">
              <button aria-label="Restar" onClick={() => setS({ ...s, pickupDays: Math.max(1, s.pickupDays - 1) })} className="grid h-11 w-11 place-items-center rounded-xl border border-ink-200 hover:bg-ink-50"><Minus className="h-4 w-4" /></button>
              <div className="w-14 text-center text-3xl font-bold">{s.pickupDays}</div>
              <button aria-label="Sumar" onClick={() => setS({ ...s, pickupDays: Math.min(30, s.pickupDays + 1) })} className="grid h-11 w-11 place-items-center rounded-xl border border-ink-200 hover:bg-ink-50"><Plus className="h-4 w-4" /></button>
              <span className="text-sm text-ink-500">días</span>
            </div>
          </Card>
          <button onClick={() => setS(DEFAULT_STORE)} className="text-sm font-medium text-ink-500 hover:text-ink-900">Volver a los datos de la demo</button>
        </div>

        <Card className="h-fit p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-400">Así lo ve el cliente</div>
          <div className="mt-4 space-y-3 text-sm">
            <div><div className="text-xs text-ink-400">Dirección</div><div className="font-semibold">{s.address || '—'}</div></div>
            <div><div className="text-xs text-ink-400">Horario</div><div className="font-semibold">{valid ? hoursText(s) : '—'}</div></div>
            {upcomingClosed(s).length > 0 && <div><div className="text-xs text-ink-400">Días sin atención</div><div className="font-semibold">{upcomingClosed(s).map((c) => `${shortDate(c.date)} (${c.reason.toLowerCase()})`).join(' · ')}</div></div>}
            <div><div className="text-xs text-ink-400">Cuándo pasar</div><div className="font-semibold">Te avisamos por mail cuando esté listo. Tenés {s.pickupDays} días para retirarlo.</div></div>
          </div>
          {dirty && <p className="mt-4 text-xs font-medium text-amber-700">Tenés cambios sin guardar.</p>}
        </Card>
      </div>
    </>
  )
}
