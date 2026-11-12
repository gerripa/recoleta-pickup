import { Info, Plus, ShoppingBag } from 'lucide-react'
import { useStore, money, totals } from '../store'
import { navigate } from '../router'
import { Button, Card, StatusBadge } from '../components/ui'

export function SimulationNotice() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <p><b>Simulación del checkout de Tiendanube.</b> En la tienda real, "Retiro en el local" es una opción de envío de Tiendanube y el descuento lo agrega nuestra app antes de pagar, con la API de Descuentos. Acá los pedidos, precios y pagos son ficticios y se guardan en este navegador.</p>
    </div>
  )
}

export default function Tiendanube() {
  const { orders } = useStore()
  const tn = orders.filter((o) => o.channel === 'Tiendanube' && o.status !== 'entregado').sort((a, b) => b.createdAt - a.createdAt)
  return (
    <div className="fade-in mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">Simulador · Tiendanube</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Compras con retiro en el local</h1>
          <p className="mt-1 text-ink-500">El cliente elige el retiro y ve sus beneficios dentro del checkout, antes de pagar.</p>
        </div>
        <Button onClick={() => navigate('/checkout')} className="py-3"><Plus className="h-4 w-4" /> Simular nueva compra en Tiendanube</Button>
      </div>
      <div className="mt-6"><SimulationNotice /></div>
      <Card className="mt-6 divide-y divide-ink-100">
        {tn.map((o) => (
          <div key={o.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-700"><ShoppingBag className="h-5 w-5" /></span>
              <div>
                <div className="flex flex-wrap items-center gap-2"><span className="font-bold">Pedido {o.number}</span><span className="text-ink-300">·</span><span className="text-sm text-ink-600">{o.customer}</span></div>
                <div className="mt-0.5 text-sm text-ink-500">{o.products.join(' + ')} · {money(totals(o.products, o.discountPct).total)}</div>
                {o.benefits.length > 0 && <div className="mt-1 text-xs text-brand-700">Beneficio: {o.benefits.map((b) => b.title).join(', ')}</div>}
              </div>
            </div>
            <div className="pl-[60px] sm:pl-0"><StatusBadge status={o.status} /></div>
          </div>
        ))}
      </Card>
    </div>
  )
}
