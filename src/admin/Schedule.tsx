import { useState } from 'react'
import { Minus, Plus, Save } from 'lucide-react'
import { useStore, DEFAULT_STORE, type StoreInfo } from '../store'
import { Button, Card, cx, toast } from '../components/ui'
import { PageTitle } from './AdminLayout'
import { hoursText } from '../store'

const DAYS = [{ d: 1, l: 'Lun' }, { d: 2, l: 'Mar' }, { d: 3, l: 'Mié' }, { d: 4, l: 'Jue' }, { d: 5, l: 'Vie' }, { d: 6, l: 'Sáb' }, { d: 0, l: 'Dom' }]
const field = 'rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100'

/** Datos del local que ve el cliente al elegir retiro */
export default function Schedule() {
  const { config, saveConfig } = useStore()
  const [s, setS] = useState<StoreInfo>(config.store)
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
                return <button key={d} onClick={() => setS({ ...s, openDays: on ? s.openDays.filter((x) => x !== d) : [...s.openDays, d] })} className={cx('h-11 w-14 rounded-xl text-sm font-semibold', on ? 'bg-brand-800 text-white' : 'border border-ink-200 text-ink-500 hover:border-ink-300')}>{l}</button>
              })}
            </div>
            {s.openDays.length === 0 && <p className="mt-3 text-sm text-red-700">Elegí al menos un día.</p>}
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
            <div><div className="text-xs text-ink-400">Cuándo pasar</div><div className="font-semibold">Te avisamos por mail cuando esté listo. Tenés {s.pickupDays} días para retirarlo.</div></div>
          </div>
          {dirty && <p className="mt-4 text-xs font-medium text-amber-700">Tenés cambios sin guardar.</p>}
        </Card>
      </div>
    </>
  )
}
