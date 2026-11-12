import { useState } from 'react'
import { ArrowRight, KeyRound, RotateCcw, CircleAlert, CheckCircle2 } from 'lucide-react'
import { useStore, STATUS_LABEL, type CodeResult, type Status } from '../store'
import { Button, Card, StatusBadge, cx, toast } from './ui'

const WHAT: Partial<Record<Status, string>> = {
  preparacion: 'Empezá a armarlo.',
  listo: 'Se le avisó por mail al cliente que ya puede pasar.',
  entregado: 'Retiro registrado: suma a la tarjeta y se envió el mail de agradecimiento.',
}

/**
 * Mostrador: Martín carga el código de 4 números y el pedido avanza solo.
 * Pendiente → En preparación → Listo → Entregado. Sin elegir el estado a mano.
 */
export function CodeDesk({ compact = false }: { compact?: boolean }) {
  const { advanceByCode, restoreOrder, confirmPayment, orders, config } = useStore()
  const [code, setCode] = useState('')
  const [res, setRes] = useState<CodeResult | null>(null)
  const demo = orders.find((o) => o.status === 'listo' && o.paid) ?? orders.find((o) => o.code && o.paid && o.status !== 'entregado')

  const submit = (value = code) => {
    const r = advanceByCode(value)
    setRes(r)
    if (r.ok) {
      setCode('')
      if (r.to === 'entregado' && config.benefits.loyalty.on) {
        const done = orders.filter((o) => o.status === 'entregado' && o.email && o.email.toLowerCase() === r.order.email.toLowerCase()).length + 1
        const goal = config.benefits.loyalty.every
        if ((done + 1) % goal === 0) toast(`${r.order.customer} ya tiene ${config.benefits.loyalty.pct} % off en su próxima compra`)
      }
    }
  }

  return (
    <Card className={cx('p-5', compact ? '' : 'sm:p-6')}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex items-start gap-3 lg:w-72">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-800 text-white"><KeyRound className="h-5 w-5" /></span>
          <div>
            <h2 className="font-bold">Cargar código de pedido</h2>
            <p className="text-xs text-ink-500">El estado cambia solo: pendiente → en preparación → listo → entregado.</p>
          </div>
        </div>
        <form className="flex flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); submit() }}>
          <input
            inputMode="numeric"
            maxLength={4}
            value={code}
            onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 4)); setRes(null) }}
            placeholder="0000"
            aria-label="Código de 4 números"
            className="w-36 rounded-xl border border-ink-200 bg-white px-4 py-3 text-center font-mono text-2xl font-bold tracking-[0.4em] outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
          />
          <Button type="submit" disabled={code.length !== 4} className="px-5">Cargar <ArrowRight className="h-4 w-4" /></Button>
        </form>
        {demo && <button onClick={() => { setCode(demo.code!); submit(demo.code!) }} className="text-left text-xs text-ink-400 underline-offset-2 hover:underline lg:w-40">Demo: cargar {demo.code} ({demo.number})</button>}
      </div>

      {res && res.ok && (
        <div className="fade-in mt-4 flex flex-col gap-3 rounded-xl bg-brand-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" />
            <div className="text-sm">
              <div className="flex flex-wrap items-center gap-2 font-semibold"><span>{res.order.number} · {res.order.customer}</span><StatusBadge status={res.from} /><ArrowRight className="h-3.5 w-3.5 text-ink-400" /><StatusBadge status={res.to} /></div>
              <div className="mt-1 text-ink-600">{res.order.products.join(', ')}. {WHAT[res.to]}</div>
            </div>
          </div>
          <button onClick={() => { restoreOrder(res.before); setRes(null); toast(`${res.order.number} volvió a "${STATUS_LABEL[res.from]}"`) }} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-ink-500 hover:text-ink-900"><RotateCcw className="h-3.5 w-3.5" /> Deshacer</button>
        </div>
      )}
      {res && !res.ok && (
        <div className="fade-in mt-4 flex flex-col gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-start gap-2"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {res.error}</span>
          {res.needsPayment && res.order && <Button variant="secondary" className="shrink-0 px-3 py-1.5 text-xs" onClick={() => { confirmPayment(res.order!.id); setRes(null); toast(`Pago de ${res.order!.number} confirmado. Cargá el código de nuevo.`) }}>Confirmar pago</Button>}
        </div>
      )}
    </Card>
  )
}
