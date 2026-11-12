import { useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Package } from 'lucide-react'
import { useStore, money, productOf, firstName } from '../store'
import { navigate } from '../router'
import { Button, Card, ChannelBadge, cx } from '../components/ui'
import { BenefitBox, PriceSummary, StoreCard } from '../components/pickup'
import NotFound from './NotFound'

/** Enlace que recibe el cliente de WhatsApp o Instagram: confirma el retiro con su email (y ve sus beneficios) antes de pagar */
export default function Reserve({ id }: { id: string }) {
  const { byId, quote, confirmPickup } = useStore()
  const order = byId(id)
  const [email, setEmail] = useState('')
  const [optIn, setOptIn] = useState(true)
  const [error, setError] = useState('')
  const q = useMemo(() => quote(email, order?.products ?? [], order?.id), [quote, email, order])

  if (!order) return <NotFound />

  if (order.status !== 'sin_reserva') {
    return (
      <div className="fade-in mx-auto max-w-lg px-4 py-14 sm:px-6">
        <Card className="p-6 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-100 text-brand-700"><CheckCircle2 className="h-6 w-6" /></span>
          <h1 className="mt-4 text-xl font-bold">El retiro del pedido {order.number} ya está confirmado</h1>
          <p className="mt-2 text-ink-500">Te avisamos por mail cuando esté listo.</p>
          <Button className="mt-6" onClick={() => navigate(`/confirmacion/${order.id}`)}>Ver mi pedido</Button>
        </Card>
      </div>
    )
  }

  const confirm = () => {
    const r = confirmPickup(order.id, { email, optIn })
    if (!r.ok) return setError(r.error)
    navigate(`/confirmacion/${order.id}`)
  }
  const input = 'w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100'

  return (
    <div className="fade-in mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Retiro en el local</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Hola {firstName(order.customer)}, confirmá tu retiro</h1>
      <p className="mt-1 text-ink-500">Poné tu email antes de pagar: así se aplican tus beneficios al total.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card className="p-6">
            <label className="block">
              <span className="text-sm font-semibold text-ink-700">Tu email <span className="text-red-700">*</span></span>
              <input type="email" className={cx(input, 'mt-1.5')} value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} placeholder="tu@email.com" />
            </label>
            <p className="mt-2 text-xs text-ink-500">Lo usamos para guardar tus retiros y avisarte cuando tu pedido esté listo.</p>
          </Card>
          <Card className="p-6">
            <div className="mb-4 text-sm font-semibold">Dónde y cuándo retirar</div>
            <StoreCard />
          </Card>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-ink-200 bg-white p-4">
            <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-800" />
            <span className="text-sm"><b>Quiero recibir avisos de recompra y promociones por mail.</b><span className="block text-ink-500">Podés darte de baja cuando quieras.</span></span>
          </label>
        </div>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-5">
            <div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-ink-400">Pedido {order.number}</span><ChannelBadge channel={order.channel} /></div>
            <ul className="mt-3 space-y-2">
              {order.products.map((p) => <li key={p} className="flex items-start gap-2.5 text-sm"><Package className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" /><span className="flex-1">{p}</span><span className="text-ink-500">{money(productOf(p)?.price ?? 0)}</span></li>)}
            </ul>
            <div className="mt-4 border-t border-ink-100 pt-4"><PriceSummary products={order.products} pct={q.pct} shipping="retiro" /></div>
          </Card>
          <BenefitBox quote={q} email={email} products={order.products} />
          {error && <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}</div>}
          <Button className="w-full py-3.5 text-base" onClick={confirm}>Confirmar retiro</Button>
        </div>
      </div>
    </div>
  )
}
