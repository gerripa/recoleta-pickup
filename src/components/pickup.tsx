import { Clock, Gift, Mail, MapPin, Percent, Sparkles, Star, BellRing, CalendarX2 } from 'lucide-react'
import { useStore, upcomingClosed, hoursText, money, totals, validEmail, type Benefit, type BenefitQuote, type Message } from '../store'
import { cx } from './ui'
import { shortDate } from '../dates'

// ---------- Datos del local (lo que ve el cliente al elegir retiro) ----------

export function StoreCard({ compact = false }: { compact?: boolean }) {
  const { config } = useStore()
  const s = config.store
  const rows: { icon: typeof Clock; label: string; value: string }[] = [
    { icon: MapPin, label: 'Dirección', value: s.address },
    { icon: Clock, label: 'Horario', value: hoursText(s) },
    { icon: BellRing, label: 'Cuándo pasar', value: `Te avisamos por mail cuando esté listo. Tenés ${s.pickupDays} días para retirarlo.` },
  ]
  const closed = upcomingClosed(s).slice(0, 3)
  if (closed.length) rows.push({ icon: CalendarX2, label: 'Cerrado', value: closed.map((c) => `${shortDate(c.date)} (${c.reason.toLowerCase()})`).join(' · ') })
  return (
    <div className={cx('grid gap-3', compact ? '' : rows.length > 3 ? 'sm:grid-cols-2' : 'sm:grid-cols-3')}>
      {rows.map((r) => (
        <div key={r.label} className="flex items-start gap-3 rounded-xl bg-ink-50 p-3.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-brand-700 ring-1 ring-ink-200"><r.icon className="h-4 w-4" /></span>
          <div className="min-w-0 text-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-ink-400">{r.label}</div>
            <div className="mt-0.5 font-medium text-ink-800">{r.value}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------- Beneficios ----------

const ICON: Record<Benefit['id'], typeof Gift> = { first: Sparkles, loyalty: Star, big: Gift, restock: Percent }

export function BenefitList({ benefits }: { benefits: Benefit[] }) {
  return (
    <ul className="space-y-2">
      {benefits.map((b) => {
        const Icon = ICON[b.id]
        return (
          <li key={b.id} className="flex items-start gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-800 text-white"><Icon className="h-4 w-4" /></span>
            <div className="text-sm"><div className="font-semibold text-ink-900">{b.title}</div><div className="text-ink-600">{b.detail}</div></div>
          </li>
        )
      })}
    </ul>
  )
}

/** Tarjeta de retiros: un sello por cada retiro completado */
export function Stamps({ progress, goal, pending = false, pct }: { progress: number; goal: number; pending?: boolean; pct?: number }) {
  return (
    <div>
      <div className="flex gap-1.5">
        {Array.from({ length: goal }, (_, i) => {
          const filled = i < progress
          const next = pending && i === progress
          return (
            <div key={i} className={cx('grid h-9 flex-1 place-items-center rounded-lg text-xs font-bold', filled ? 'bg-brand-800 text-white' : next ? 'border-2 border-dashed border-brand-600 text-brand-700' : 'bg-ink-100 text-ink-400')} title={filled ? 'Retiro completado' : next ? 'Este retiro' : 'Pendiente'}>
              {i === goal - 1 ? <Star className="h-4 w-4" /> : i + 1}
            </div>
          )
        })}
      </div>
      {pct !== undefined && <div className="mt-1.5 text-right text-[11px] text-ink-400">Al completar: {pct} % off</div>}
    </div>
  )
}

/** Qué le toca al cliente por retirar (se muestra antes de pagar) */
export function BenefitBox({ quote, email, products }: { quote: BenefitQuote; email: string; products: string[] }) {
  const { config } = useStore()
  const rules = config.benefits
  const t = totals(products, quote.pct)
  const valid = validEmail(email)
  return (
    <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
      <div className="flex items-center gap-2 text-sm font-bold text-brand-900"><Gift className="h-4 w-4" /> Tus beneficios por retirar</div>
      {!valid ? (
        <p className="mt-2 text-sm text-ink-600">Ingresá tu email y te mostramos qué te corresponde. Con tu email guardamos tus retiros.</p>
      ) : quote.benefits.length > 0 ? (
        <div className="mt-3"><BenefitList benefits={quote.benefits} /></div>
      ) : (
        <p className="mt-2 text-sm text-ink-600">Esta compra no tiene un beneficio extra, pero suma a tu tarjeta de retiros.</p>
      )}
      {valid && rules.loyalty.on && (
        <div className="mt-4 border-t border-brand-200 pt-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold text-ink-700">Tu tarjeta de retiros</span>
            <span className="text-ink-500">{quote.loyalty.left === 1 ? 'Este retiro completa la tarjeta' : `Con este retiro: ${quote.loyalty.progress + 1} de ${quote.loyalty.goal}`}</span>
          </div>
          <Stamps progress={quote.loyalty.progress} goal={quote.loyalty.goal} pending pct={rules.loyalty.pct} />
        </div>
      )}
      {quote.pct > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-brand-200"><span>Ahorrás en esta compra</span><b className="text-brand-800">{money(t.discount)}</b></div>
      )}
    </div>
  )
}

// ---------- Vista previa de mail ----------

export function MailPreview({ message, to }: { message: Pick<Message, 'subject' | 'body'>; to: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
      <div className="flex items-center gap-2 border-b border-ink-100 bg-ink-50 px-4 py-2.5 text-xs text-ink-500">
        <Mail className="h-3.5 w-3.5" /> Para: <span className="truncate font-medium text-ink-700">{to}</span>
        <span className="ml-auto shrink-0 rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">Vista previa · no se envía</span>
      </div>
      <div className="p-4">
        <div className="text-sm font-bold">{message.subject}</div>
        <div className="mt-2 space-y-1.5 text-sm text-ink-600">{message.body.map((l, i) => <p key={i}>{l}</p>)}</div>
        <div className="mt-3 text-xs font-semibold tracking-wider text-brand-700">RECOLETA PICKUP</div>
      </div>
    </div>
  )
}

export function PriceSummary({ products, pct, shipping }: { products: string[]; pct: number; shipping: 'retiro' | 'envio' | null }) {
  const t = totals(products, pct)
  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between"><span className="text-ink-500">Subtotal</span><span>{money(t.subtotal)}</span></div>
      {pct > 0 && <div className="flex justify-between text-brand-700"><span>Beneficio por retiro ({pct} %)</span><span>− {money(t.discount)}</span></div>}
      <div className="flex justify-between"><span className="text-ink-500">Envío</span><span>{shipping === 'retiro' ? <b className="text-brand-700">Gratis (retiro)</b> : shipping === 'envio' ? 'Se calcula según la zona' : '—'}</span></div>
      <div className="flex justify-between border-t border-ink-100 pt-3 text-base font-bold"><span>Total</span><span>{money(t.total)}{shipping === 'envio' ? ' + envío' : ''}</span></div>
    </div>
  )
}
