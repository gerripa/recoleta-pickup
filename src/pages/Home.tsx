import { ArrowRight, CalendarCheck, Gift, LayoutDashboard, Mail, PackageCheck, Percent, ShoppingBag, Sparkles, Star, Store, Truck } from 'lucide-react'
import { navigate } from '../router'
import { useStore, hoursText } from '../store'
import { Button, Card, DemoBadge } from '../components/ui'
import { Stamps } from '../components/pickup'

export default function Home() {
  const { config } = useStore()
  const r = config.benefits
  const steps = [
    { icon: ShoppingBag, title: 'Comprás como siempre', text: 'En la tienda online, por WhatsApp o por Instagram.' },
    { icon: Store, title: 'Elegís retiro antes de pagar', text: 'Ponés tu email y ves en el momento la dirección, el horario y los beneficios que te tocan.' },
    { icon: PackageCheck, title: 'Pasás cuando te quede cómodo', text: 'Te avisamos cuando está listo. Retirás en el horario del local y sumás a tu tarjeta.' },
    { icon: Mail, title: 'Te llega todo por mail', text: 'La confirmación, el aviso de "listo", un recordatorio y el aviso de recompra.' },
  ]
  const perks = [
    r.loyalty.on && { icon: Star, title: `${r.loyalty.pct} % off cada ${r.loyalty.every} retiros`, text: 'Tu tarjeta se completa sola con tu email.' },
    r.restock.on && { icon: Percent, title: `${r.restock.pct} % off al reponer`, text: 'Si volvés a comprar un producto que ya llevaste.' },
    r.first.on && { icon: Sparkles, title: 'Regalo en tu primer retiro', text: r.first.gift + '.' },
    r.big.on && { icon: Gift, title: 'Regalo en compras grandes', text: r.big.gift + '.' },
    { icon: Truck, title: 'Sin costo de envío', text: 'Siempre que retires en el local.' },
  ].filter(Boolean) as { icon: typeof Star; title: string; text: string }[]

  return (
    <div className="fade-in">
      <section className="relative overflow-hidden bg-brand-900">
        <div className="pointer-events-none absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full bg-brand-700/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-10 h-[360px] w-[360px] rounded-full bg-brand-600/30 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1.1fr_.9fr] md:py-24">
          <div>
            <DemoBadge className="mb-6 sm:hidden" />
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-brand-300">Recoleta al Fallo · Suplementos deportivos</p>
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl">Tus pedidos, listos <span className="text-brand-300">cuando vos quieras.</span></h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-brand-100/80 sm:text-lg">Elegí retirar en el local al comprar: no pagás envío, te avisamos cuando está listo y cada retiro te suma beneficios.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button variant="light" className="px-6 py-3.5 text-base" onClick={() => navigate('/tiendanube')}>Probar una compra <ArrowRight className="h-4 w-4" /></Button>
              <Button className="border border-white/20 bg-white/5 px-6 py-3.5 text-base hover:bg-white/10" onClick={() => navigate('/admin')}><LayoutDashboard className="h-4 w-4" /> Panel del administrador</Button>
            </div>
            <button onClick={() => navigate('/reservar')} className="mt-4 text-sm font-medium text-brand-200 underline-offset-4 hover:underline">¿Compraste por WhatsApp o Instagram? Confirmá tu retiro</button>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <Card className="relative rotate-[2deg] p-6 shadow-lift">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">Retiro en el local</span>
                <span className="rounded-full bg-brand-800 px-2.5 py-1 text-[11px] font-semibold text-white">Con beneficios</span>
              </div>
              <div className="mt-4 text-lg font-bold">Hola Martina</div>
              <p className="text-sm text-ink-500">Este es tu 5.º retiro: completás la tarjeta.</p>
              <div className="mt-4"><Stamps progress={4} goal={5} pending /></div>
              <div className="mt-5 space-y-2 rounded-xl bg-ink-50 p-4 text-sm">
                <div className="flex justify-between"><span className="text-ink-500">Subtotal</span><span>$ 45.400</span></div>
                <div className="flex justify-between text-brand-700"><span>Beneficio (20 %)</span><span>− $ 9.080</span></div>
                <div className="flex justify-between"><span className="text-ink-500">Envío</span><b className="text-brand-700">Gratis</b></div>
                <div className="flex justify-between border-t border-ink-200 pt-2 font-bold"><span>Total</span><span>$ 36.320</span></div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-ink-500"><CalendarCheck className="h-4 w-4 text-brand-600" /> {config.store.address} · {hoursText(config.store)}</div>
            </Card>
            <p className="mt-4 text-center text-[11px] text-brand-200/70">Ejemplo ilustrativo con precios ficticios</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Cómo funciona</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">Integrado en la compra. Sin otra app.</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Card key={s.title} className="p-6">
              <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><s.icon className="h-5 w-5" /></span><span className="text-sm font-semibold text-ink-400">Paso {i + 1}</span></div>
              <h3 className="mt-4 font-bold">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-500">{s.text}</p>
            </Card>
          ))}
        </div>

        <p className="mt-16 text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Beneficios por retirar</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">Cada compra puede traer algo distinto</h2>
        <p className="mt-2 max-w-2xl text-ink-500">La página reconoce tu email y decide sola qué te corresponde. A veces es un descuento, a veces un regalo y a veces solo sumás un retiro a tu tarjeta.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {perks.map((p) => (
            <Card key={p.title} className="p-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-800 text-white"><p.icon className="h-5 w-5" /></span>
              <h3 className="mt-4 font-bold leading-snug">{p.title}</h3>
              <p className="mt-1 text-sm text-ink-500">{p.text}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
