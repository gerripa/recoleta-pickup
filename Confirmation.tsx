import { CheckCircle2, Package } from 'lucide-react'
import { useStore, usePublicOrder, usePublicQuote, firstName, messagesFor, money, totals } from '../store'
import { navigate } from '../router'
import { Button, Card, StatusBadge } from '../components/ui'
import { BenefitList, MailPreview, Stamps, StoreCard } from '../components/pickup'
import NotFound from './NotFound'

export default function Confirmation({ id }: { id?: string }) {
  const { config } = useStore()
  const { order } = usePublicOrder(id)
  const { quote: q } = usePublicQuote(order?.email ?? '', [], order?.id)
  if (order === undefined) return <p className="py-20 text-center text-sm text-ink-400">Cargando pedido…</p>
  if (!order || order.status === 'sin_reserva') return <NotFound text="No encontramos ese pedido." />
  const t = totals(order.products, order.discountPct)
  const mail = messagesFor(order, [], config).find((m) => m.kind === 'confirmacion')

  return (
    <div className="fade-in mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-800 text-white shadow-lift"><CheckCircle2 className="h-8 w-8" /></span>
        <h1 className="mt-5 text-3xl font-bold tracking-tight">{order.paid ? '¡Compra confirmada!' : '¡Retiro confirmado!'}</h1>
        <p className="mt-2 text-ink-500">{firstName(order.customer)}, te avisamos a <b className="text-ink-700">{order.email}</b> cuando tu pedido esté listo para retirar.</p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="bg-brand-800 px-6 py-5 text-white">
            <div className="text-xs font-semibold uppercase tracking-wider text-brand-200">Código de retiro</div>
            <div className="mt-1 font-mono text-4xl font-bold tracking-[0.3em]">{order.code}</div>
            <div className="mt-1 text-xs text-brand-200">Decilo en el mostrador al retirar: así el retiro suma a tu tarjeta</div>
          </div>
          <div className="space-y-4 p-6">
            <StoreCard compact />
            <div className="border-t border-ink-100 pt-4">
              <div className="flex items-center justify-between"><span className="text-sm font-semibold">Pedido {order.number}</span><StatusBadge status={order.status} /></div>
              <ul className="mt-3 space-y-1.5">{order.products.map((p) => <li key={p} className="flex items-center gap-2 text-sm text-ink-600"><Package className="h-4 w-4 text-brand-600" /> {p}</li>)}</ul>
              <div className="mt-4 space-y-1 text-sm">
                {t.discount > 0 && <div className="flex justify-between text-brand-700"><span>Beneficio ({order.discountPct} %)</span><span>− {money(t.discount)}</span></div>}
                <div className="flex justify-between font-bold"><span>{order.paid ? 'Total pagado' : 'Total a pagar'}</span><span>{money(t.total)}</span></div>
                {!order.paid && <p className="text-xs text-ink-500">El responsable te confirma el pago por {order.channel}.</p>}
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-ink-400">Tus beneficios</div>
            <div className="mt-3">{order.benefits.length ? <BenefitList benefits={order.benefits} /> : <p className="text-sm text-ink-600">Esta compra no tuvo beneficio extra.</p>}</div>
            {config.benefits.loyalty.on && (
              <div className="mt-5 border-t border-ink-100 pt-5">
                <div className="mb-2 flex justify-between text-xs"><span className="font-semibold text-ink-700">Tarjeta de retiros</span><span className="text-ink-500">Suma cuando retirás</span></div>
                <Stamps progress={q.loyalty.progress} goal={q.loyalty.goal} pending={order.status !== 'entregado'} pct={config.benefits.loyalty.pct} />
              </div>
            )}
          </Card>
          {mail && <div><div className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">Mail que recibe el cliente</div><MailPreview message={mail} to={order.email} /></div>}
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-xs"><Button className="w-full" onClick={() => navigate('/')}>Volver al inicio</Button></div>
    </div>
  )
}
