import { useState } from 'react'
import { ArrowRight, Search } from 'lucide-react'
import { useStore } from '../store'
import { navigate } from '../router'
import { Button, Card } from '../components/ui'

export default function ReserveLookup() {
  const { findByNumber, orders } = useStore()
  const [q, setQ] = useState('')
  const [error, setError] = useState('')
  const examples = orders.filter((o) => o.status === 'sin_reserva').slice(0, 3)

  const submit = (value = q) => {
    const o = findByNumber(value)
    if (!o) return setError('No encontramos ese número de pedido. Revisalo e intentá de nuevo.')
    navigate(`/reservar/${o.id}`)
  }

  return (
    <div className="fade-in mx-auto max-w-lg px-4 py-14 sm:px-6">
      <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Confirmar mi retiro</p>
      <h1 className="mt-2 text-center text-3xl font-bold tracking-tight">¿Cuál es tu número de pedido?</h1>
      <p className="mt-2 text-center text-ink-500">Normalmente te llega el enlace directo por WhatsApp o Instagram. Si no lo tenés, buscalo acá.</p>
      <Card className="mt-8 p-6">
        <form onSubmit={(e) => { e.preventDefault(); submit() }}>
          <label className="text-sm font-semibold text-ink-700" htmlFor="num">Número de pedido</label>
          <div className="mt-2 flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input id="num" value={q} onChange={(e) => { setQ(e.target.value); setError('') }} placeholder="Ej.: WA-216" className="w-full rounded-xl border border-ink-200 py-3 pl-9 pr-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100" />
            </div>
            <Button type="submit" disabled={!q.trim()}>Continuar <ArrowRight className="h-4 w-4" /></Button>
          </div>
          {error && <p className="mt-3 text-sm font-medium text-red-700">{error}</p>}
        </form>
        {examples.length > 0 && (
          <div className="mt-6 border-t border-ink-100 pt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Pedidos de prueba sin confirmar</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {examples.map((o) => <button key={o.id} onClick={() => submit(o.number)} className="rounded-full border border-ink-200 px-3 py-1.5 text-sm font-medium text-ink-700 hover:border-brand-600 hover:text-brand-800">{o.number} · {o.customer.split(' ')[0]}</button>)}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
