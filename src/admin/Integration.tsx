import { BadgePercent, CheckCircle2, CreditCard, KeyRound, Package, RefreshCw, ShoppingCart, Webhook, XCircle, MessageCircle } from 'lucide-react'
import { useStore, money, totals } from '../store'
import { Button, Card, cx, toast } from '../components/ui'
import { shortDate, todayKey } from '../dates'
import { PageTitle } from './AdminLayout'
import { agoText } from './Stock'

const STEPS = [
  { icon: ShoppingCart, when: 'En el carrito', title: 'El cliente elige "Retiro en el local"', how: 'Es una opción de envío que Tiendanube ya trae. Justo debajo, nuestra app muestra la dirección, el horario, la tarjeta de retiros y los regalos (NubeSDK, espacio "after_shipping_description").' },
  { icon: BadgePercent, when: 'Antes de pagar', title: 'Se aplica el beneficio', how: 'Cada vez que cambia el carrito, Tiendanube le pregunta a nuestra app (API de Descuentos) y devolvemos el descuento que le toca. Lo reconocemos por su cuenta o por el email que pone en el checkout; si eso fallara, tiene el cupón personal que le llegó por mail.' },
  { icon: CreditCard, when: 'Al pagar', title: 'Tiendanube cobra', how: 'El pago sigue 100 % en Tiendanube. Nuestra app nunca ve datos de tarjeta.' },
  { icon: Webhook, when: 'Apenas se paga', title: 'El pedido entra solo al panel', how: 'Tiendanube nos avisa con un webhook ("pedido pagado"). Si el envío es retiro, el pedido aparece como Pendiente con su código de 4 números y sale el mail de confirmación.' },
  { icon: KeyRound, when: 'En el local', title: 'Martín carga el código', how: 'Cada vez que carga el código, el pedido avanza solo: en preparación → listo → entregado. El cambio también se marca en el pedido de Tiendanube.' },
  { icon: Package, when: 'Siempre', title: 'Precios y stock', how: 'Se leen de la API de productos de Tiendanube. El stock baja con cada venta y avisamos cuando llega al mínimo.' },
]

export default function Integration() {
  const { orders, lastSync, syncTiendanube } = useStore()
  const events = orders
    .filter((o) => o.channel === 'Tiendanube' && o.status !== 'sin_reserva')
    .sort((a, b) => b.createdDate.localeCompare(a.createdDate) || b.createdAt - a.createdAt)
    .slice(0, 6)

  return (
    <>
      <PageTitle
        title="Conexión con Tiendanube"
        subtitle="Cómo funciona la integración real y cuándo se aplica cada cosa."
        action={<Button variant="secondary" onClick={() => { syncTiendanube(); toast('Sincronizado con Tiendanube (simulado)') }}><RefreshCw className="h-4 w-4" /> Sincronizar</Button>}
      />

      <Card className="mb-6 flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" /><span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" /></span>
          <div><div className="font-semibold">Modo demo: conexión simulada</div><div className="text-sm text-ink-500">Última sincronización {agoText(lastSync)}. En la versión real se conecta con la cuenta de Martín.</div></div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-brand-800 p-6 ring-1 ring-brand-800">
          <div className="flex items-center gap-2 text-sm font-bold text-brand-800"><CheckCircle2 className="h-4 w-4" /> Lo que elegimos para Tiendanube</div>
          <h2 className="mt-2 text-xl font-bold">Todo pasa dentro de Tiendanube, sin redirigir</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-ink-600">
            <li>• El cliente compra, elige retiro, ve el descuento y paga sin salir de la tienda.</li>
            <li>• No hay ida y vuelta entre páginas, así que no se pierden ventas.</li>
            <li>• El descuento se aplica antes de pagar, como pidieron.</li>
          </ul>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 text-sm font-bold text-ink-500"><XCircle className="h-4 w-4" /> Por qué no redirigir a otra página</div>
          <ul className="mt-3 space-y-1.5 text-sm text-ink-600">
            <li>• Si va a nuestra página <b>antes</b> de pagar, tiene que volver a Tiendanube: es un paso más y algunos abandonan.</li>
            <li>• Si va <b>después</b> de pagar, ya pagó y no se le puede aplicar el descuento en esa compra.</li>
          </ul>
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-ink-50 p-3 text-sm text-ink-600"><MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" /> El link a nuestra página se usa solo para WhatsApp e Instagram, donde la venta se cierra por chat y el pago se confirma aparte.</div>
        </Card>
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wider text-ink-400">Paso a paso: cuándo pasa cada cosa</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((s, i) => (
          <Card key={s.title} className="p-5">
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><s.icon className="h-5 w-5" /></span>
              <span className="rounded-full bg-ink-100 px-2.5 py-1 text-[11px] font-semibold text-ink-600">{i + 1} · {s.when}</span>
            </div>
            <h3 className="mt-4 font-bold">{s.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-500">{s.how}</p>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="min-w-0">
          <div className="border-b border-ink-100 px-5 py-4"><h2 className="font-bold">Últimos avisos de Tiendanube</h2><p className="text-xs text-ink-400">Webhooks simulados: así entran los pedidos solos</p></div>
          <ul className="divide-y divide-ink-100">
            {events.map((o) => (
              <li key={o.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                <Webhook className="h-4 w-4 shrink-0 text-sky-600" />
                <div className="min-w-0 flex-1"><span className="font-mono text-xs text-ink-500">order/paid</span> · <b>{o.number}</b> · {o.customer}<div className="truncate text-xs text-ink-500">Retiro en el local · {money(totals(o.products, o.discountPct).total)}{o.discountPct ? ` · ${o.discountPct} % off aplicado en el checkout` : ''}</div></div>
                <span className="shrink-0 text-xs text-ink-400">{o.createdDate === todayKey() ? 'Hoy' : shortDate(o.createdDate)}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="h-fit p-5">
          <h2 className="font-bold">A tener en cuenta</h2>
          <ul className={cx('mt-3 space-y-2 text-sm text-ink-600')}>
            <li>• Tiendanube espera la respuesta del descuento en menos de 1 segundo: la app tiene que ser rápida.</li>
            <li>• La API de Descuentos no recibe el email: lo tomamos del checkout con NubeSDK. Hay que probar que el descuento se actualice al instante en el resumen. Si no, queda el cupón personal de un solo uso.</li>
            <li>• Para usar NubeSDK y la API hay que registrar la app como socio de Tiendanube.</li>
            <li>• Las claves de Tiendanube se guardan en los Secrets de Supabase, nunca en el código.</li>
          </ul>
        </Card>
      </div>
    </>
  )
}
