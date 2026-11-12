import { useState } from 'react'
import { ArrowLeft, Check, Package, Plus, Store, Truck, X, Lock, CircleAlert } from 'lucide-react'
import { useStore, usePublicQuote, CATALOG, NAMES, emailFor, money, totals, validEmail, productOf } from '../store'
import { navigate } from '../router'
import { Button, Card, cx } from '../components/ui'
import { BenefitBox, PriceSummary, StoreCard } from '../components/pickup'
import { SimulationNotice } from './Tiendanube'

const DEMO_PEOPLE = [
  { label: 'Clienta frecuente', hint: '4 retiros: le toca el premio', name: 'Martina López' },
  { label: 'Recompra', hint: 'Ya compró creatina', name: 'Tomás García' },
  { label: 'Cliente nuevo', hint: 'Primer retiro', name: '' },
]

function randomCart() {
  const pool = CATALOG.filter((p) => p.days)
  return [pool[Math.floor(Math.random() * pool.length)].name]
}

/** Checkout simulado de la tienda online: el retiro (y sus beneficios) se elige ANTES de pagar */
export default function Checkout() {
  const { createPurchase, inventory } = useStore()
  const [busy, setBusy] = useState(false)
  const stockOf = (n: string) => inventory[n]?.stock ?? 0
  const [products, setProducts] = useState<string[]>(randomCart)
  const [customer, setCustomer] = useState(() => NAMES[Math.floor(Math.random() * NAMES.length)])
  const [email, setEmail] = useState('')
  const [shipping, setShipping] = useState<'retiro' | 'envio' | null>(null)
  const [optIn, setOptIn] = useState(true)
  const [error, setError] = useState('')
  const [doneEnvio, setDoneEnvio] = useState(false)

  const { quote: q } = usePublicQuote(email, products)
  const pct = shipping === 'retiro' ? q.pct : 0
  const t = totals(products, pct)

  const asPerson = (name: string) => {
    if (!name) {
      const n = NAMES[Math.floor(Math.random() * NAMES.length)]
      setCustomer(n)
      setEmail(emailFor(n).replace('@', `.${Math.floor(Math.random() * 900 + 100)}@`))
      return
    }
    setCustomer(name)
    setEmail(emailFor(name))
    if (name === 'Tomás García') setProducts(['Creatina Monohidrato Star Nutrition 300 g'])
  }

  const pay = async () => {
    setError('')
    if (!customer.trim()) return setError('Completá tu nombre.')
    if (!validEmail(email)) return setError('Ingresá un email válido.')
    if (products.length === 0) return setError('Tu carrito está vacío.')
    if (!shipping) return setError('Elegí cómo querés recibir tu compra.')
    if (shipping === 'envio') return setDoneEnvio(true)
    setBusy(true)
    const r = await createPurchase({ customer: customer.trim(), email, products, optIn })
    setBusy(false)
    if (!r.ok) return setError(r.error)
    navigate(`/confirmacion/${r.order.id}`)
  }

  if (doneEnvio)
    return (
      <div className="fade-in mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ink-100 text-ink-600"><Truck className="h-6 w-6" /></span>
        <h1 className="mt-4 text-2xl font-bold">Compra simulada con envío</h1>
        <p className="mt-2 text-ink-500">Este pedido no pasa por Recoleta PickUp, así que no suma retiros ni beneficios.</p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Button onClick={() => { setDoneEnvio(false); setShipping('retiro') }}>Probar con retiro en el local</Button>
          <Button variant="secondary" onClick={() => navigate('/tiendanube')}>Volver al simulador</Button>
        </div>
      </div>
    )

  const input = 'w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100'
  const others = CATALOG.filter((p) => !products.includes(p.name))

  return (
    <div className="fade-in mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <button onClick={() => navigate('/tiendanube')} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"><ArrowLeft className="h-4 w-4" /> Volver al simulador</button>
      <SimulationNotice />

      <div className="mt-6 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-100 text-sky-700"><Lock className="h-4 w-4" /></span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finalizar compra</h1>
          <p className="text-sm text-ink-500">Checkout de Tiendanube con Recoleta PickUp integrado: el cliente no sale de la tienda</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card className="p-6">
            <Step n={1} title="Tus datos" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="text-sm font-medium text-ink-700">Nombre y apellido</span><input className={cx(input, 'mt-1.5')} value={customer} onChange={(e) => setCustomer(e.target.value)} /></label>
              <label className="block"><span className="text-sm font-medium text-ink-700">Email <span className="text-red-700">*</span></span><input type="email" className={cx(input, 'mt-1.5')} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" /></label>
            </div>
            <p className="mt-2 text-xs text-ink-500">Con tu email guardamos tus retiros y te avisamos cuando tu pedido esté listo.</p>
            <div className="mt-4 rounded-xl bg-ink-50 p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Para la demo: probar como…</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {DEMO_PEOPLE.map((p) => (
                  <button key={p.label} type="button" onClick={() => asPerson(p.name)} className="rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium hover:border-brand-600"><b>{p.label}</b> <span className="text-ink-500">· {p.hint}</span></button>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <Step n={2} title="¿Cómo querés recibir tu compra?" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Option selected={shipping === 'envio'} onClick={() => { setShipping('envio'); setError('') }} icon={Truck} title="Envío a domicilio" text="Costo según la zona" />
              <Option selected={shipping === 'retiro'} onClick={() => { setShipping('retiro'); setError('') }} icon={Store} title="Retiro en el local" text="Sin costo de envío · pasás cuando te quede cómodo" badge="Con beneficios" />
            </div>
            {shipping === 'retiro' && <div className="fade-in mt-5 border-t border-ink-100 pt-5"><StoreCard /></div>}
          </Card>

          {shipping === 'retiro' && (
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-ink-200 bg-white p-4">
              <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-800" />
              <span className="text-sm"><b>Quiero recibir avisos de recompra y promociones por mail.</b><span className="block text-ink-500">Te avisamos cuando se te esté por terminar el producto. Podés darte de baja cuando quieras.</span></span>
            </label>
          )}
        </div>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-ink-400">Tu carrito</div>
            <ul className="mt-3 space-y-2.5">
              {products.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink-50 text-brand-700"><Package className="h-4 w-4" /></span>
                  <span className="flex-1">{p}<span className="block text-ink-500">{money(productOf(p)?.price ?? 0)}{stockOf(p) === 0 ? <b className="ml-2 text-red-700">Sin stock</b> : stockOf(p) <= 3 ? <span className="ml-2 text-amber-700">Últimas {stockOf(p)}</span> : null}</span></span>
                  <button aria-label={`Quitar ${p}`} onClick={() => setProducts((s) => s.filter((x) => x !== p))} className="text-ink-300 hover:text-ink-700"><X className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
            {others.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-semibold text-brand-700">+ Sumar productos</summary>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {others.map((p) => <button key={p.name} disabled={stockOf(p.name) === 0} onClick={() => setProducts((s) => [...s, p.name])} className="inline-flex items-center gap-1 rounded-full border border-ink-200 px-2.5 py-1 text-xs hover:border-brand-600 disabled:cursor-not-allowed disabled:opacity-40"><Plus className="h-3 w-3" />{p.name}{stockOf(p.name) === 0 && ' · sin stock'}</button>)}
                </div>
              </details>
            )}
            <div className="mt-4 border-t border-ink-100 pt-4"><PriceSummary products={products} pct={pct} shipping={shipping} /></div>
          </Card>

          {shipping === 'retiro' && <BenefitBox quote={q} email={email} products={products} />}
          {shipping === 'envio' && (
            <div className="rounded-2xl border border-ink-200 bg-white p-4 text-sm text-ink-600">
              <b className="text-ink-900">¿Sabías?</b> Si elegís retiro en el local no pagás envío{q.pct > 0 ? ` y tenés ${q.pct} % off` : ''}. <button onClick={() => setShipping('retiro')} className="font-semibold text-brand-700">Cambiar a retiro</button>
            </div>
          )}

          {error && <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-800"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}</div>}
          <Button className="w-full py-3.5 text-base" disabled={busy} onClick={pay}>{busy ? 'Procesando pago…' : 'Pagar'} {money(t.total)}{shipping === 'envio' ? ' + envío' : ''}</Button>
          <p className="text-center text-xs text-ink-400">Pago simulado: no se cobra nada.</p>
        </div>
      </div>
    </div>
  )
}

function Step({ n, title }: { n: number; title: string }) {
  return <div className="flex items-center gap-2.5 font-semibold"><span className="grid h-6 w-6 place-items-center rounded-full bg-brand-800 text-xs text-white">{n}</span>{title}</div>
}

function Option({ selected, onClick, icon: Icon, title, text, badge }: { selected: boolean; onClick: () => void; icon: typeof Truck; title: string; text: string; badge?: string }) {
  return (
    <button type="button" onClick={onClick} className={cx('relative flex items-start gap-3 rounded-xl border-2 p-4 text-left', selected ? 'border-brand-800 bg-brand-50' : 'border-ink-200 hover:border-ink-300')}>
      <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-lg', selected ? 'bg-brand-800 text-white' : 'bg-ink-100 text-ink-600')}><Icon className="h-5 w-5" /></span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-ink-500">{text}</span>
        {badge && <span className="mt-2 inline-block rounded-full bg-brand-800 px-2 py-0.5 text-[11px] font-semibold text-white">{badge}</span>}
      </span>
      {selected && <Check className="absolute right-3 top-3 h-4 w-4 text-brand-700" />}
    </button>
  )
}
