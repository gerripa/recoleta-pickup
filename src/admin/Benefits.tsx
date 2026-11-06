import { useMemo, useState } from 'react'
import { Gift, Percent, Save, Sparkles, Star, Users, Mail, BadgePercent, UserX } from 'lucide-react'
import { useStore, isExpired, money, normEmail, totals, DEFAULT_RULES, type BenefitRules } from '../store'
import { Button, Card, Stat, cx, toast } from '../components/ui'
import { Stamps } from '../components/pickup'
import { shortDate, todayKey } from '../dates'
import { PageTitle } from './AdminLayout'

const num = 'w-24 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100'
const txt = 'w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100'

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className={cx('relative h-6 w-11 shrink-0 rounded-full transition', on ? 'bg-brand-700' : 'bg-ink-300')}>
      <span className={cx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', on ? 'left-[22px]' : 'left-0.5')} />
    </button>
  )
}

function Rule({ icon: Icon, title, text, on, onToggle, children }: { icon: typeof Gift; title: string; text: string; on: boolean; onToggle: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <div className={cx('rounded-2xl border p-5', on ? 'border-brand-200 bg-white' : 'border-ink-200 bg-ink-50')}>
      <div className="flex items-start gap-4">
        <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-xl', on ? 'bg-brand-800 text-white' : 'bg-ink-200 text-ink-500')}><Icon className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3"><h3 className="font-bold">{title}</h3><Toggle on={on} onChange={onToggle} /></div>
          <p className="mt-0.5 text-sm text-ink-500">{text}</p>
          <div className={cx('mt-3 flex flex-wrap items-center gap-3 text-sm', !on && 'pointer-events-none opacity-50')}>{children}</div>
        </div>
      </div>
    </div>
  )
}

export default function Benefits() {
  const { config, saveConfig, orders, allMessages } = useStore()
  const [r, setR] = useState<BenefitRules>(config.benefits)
  const dirty = JSON.stringify(r) !== JSON.stringify(config.benefits)
  const set = <K extends keyof BenefitRules>(k: K, v: Partial<BenefitRules[K]>) => setR((s) => ({ ...s, [k]: { ...s[k], ...v } }))

  const impact = useMemo(() => {
    const withSlot = orders.filter((o) => o.status !== 'sin_reserva')
    const withBenefit = withSlot.filter((o) => o.benefits.length > 0)
    const discount = withSlot.reduce((s, o) => s + totals(o.products, o.discountPct).discount, 0)
    const byEmail = new Map<string, typeof orders>()
    for (const o of withSlot) {
      if (!o.email) continue
      const k = normEmail(o.email)
      byEmail.set(k, [...(byEmail.get(k) ?? []), o])
    }
    const clients = [...byEmail.values()].map((list) => {
      const done = list.filter((o) => o.status === 'entregado').length
      const key = (o: (typeof list)[number]) => o.deliveredDate ?? o.readyDate ?? o.createdDate
      const last = [...list].sort((a, b) => key(b).localeCompare(key(a)))[0]
      return { name: list[0].customer, email: list[0].email, done, total: list.length, last }
    })
    const goal = config.benefits.loyalty.every
    return {
      withSlot: withSlot.length,
      withBenefit: withBenefit.length,
      discount,
      recurrent: clients.filter((c) => c.total >= 2).length,
      clients: clients.length,
      cards: clients.reduce((s, c) => s + Math.floor(c.done / goal), 0),
      noShow: withSlot.filter((o) => isExpired(o, config.store)).length,
      mails: allMessages().filter((m) => m.date <= todayKey()).length,
      list: clients.sort((a, b) => b.done - a.done),
      goal,
    }
  }, [orders, config.benefits.loyalty.every, config.store, allMessages])

  return (
    <>
      <PageTitle
        title="Beneficios"
        subtitle="La página decide sola qué le toca a cada cliente según su email. Acá elegís qué beneficios están activos."
        action={<Button disabled={!dirty || r.loyalty.every < 2} onClick={() => { saveConfig({ ...config, benefits: r }); toast('Beneficios guardados') }}><Save className="h-4 w-4" /> Guardar cambios</Button>}
      />

      {/* Impacto: números para el business case */}
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-400">Impacto (datos de la demo)</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Retiros con beneficio" value={`${impact.withBenefit} de ${impact.withSlot}`} hint={`${Math.round((impact.withBenefit / Math.max(1, impact.withSlot)) * 100)} % de los retiros`} icon={Gift} accent />
        <Stat label="Clientes que volvieron" value={`${impact.recurrent} de ${impact.clients}`} hint="Con 2 retiros o más" icon={Users} />
        <Stat label="Descuento otorgado" value={money(impact.discount)} hint={`${impact.cards} tarjetas completadas`} icon={BadgePercent} />
        <Stat label="Mails automáticos" value={impact.mails} hint={`${impact.noShow} pedidos vencidos sin retirar`} icon={Mail} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-400">Reglas</h2>
          <Rule icon={Star} title="Tarjeta de retiros" text="Cada retiro entregado suma. Al completar la tarjeta, descuento en esa compra." on={r.loyalty.on} onToggle={(on) => set('loyalty', { on })}>
            <label className="flex items-center gap-2">Cada <input type="number" min={2} max={20} className={num} value={r.loyalty.every} onChange={(e) => set('loyalty', { every: Math.max(2, Number(e.target.value) || 2) })} /> retiros</label>
            <label className="flex items-center gap-2"><input type="number" min={1} max={50} className={num} value={r.loyalty.pct} onChange={(e) => set('loyalty', { pct: Number(e.target.value) || 0 })} /> % off</label>
          </Rule>
          <Rule icon={Percent} title="Recompra" text="Si vuelve a comprar un producto que ya retiró. Se le avisa por mail cuando se le está por terminar." on={r.restock.on} onToggle={(on) => set('restock', { on })}>
            <label className="flex items-center gap-2"><input type="number" min={1} max={50} className={num} value={r.restock.pct} onChange={(e) => set('restock', { pct: Number(e.target.value) || 0 })} /> % off</label>
          </Rule>
          <Rule icon={Sparkles} title="Primer retiro" text="Para quien retira por primera vez con su email." on={r.first.on} onToggle={(on) => set('first', { on })}>
            <input className={txt} value={r.first.gift} onChange={(e) => set('first', { gift: e.target.value })} />
          </Rule>
          <Rule icon={Gift} title="Compra grande" text="Regalo cuando el carrito supera un monto." on={r.big.on} onToggle={(on) => set('big', { on })}>
            <label className="flex items-center gap-2">Desde $ <input type="number" min={0} step={1000} className={cx(num, 'w-32')} value={r.big.min} onChange={(e) => set('big', { min: Number(e.target.value) || 0 })} /></label>
            <input className={txt} value={r.big.gift} onChange={(e) => set('big', { gift: e.target.value })} />
          </Rule>
          <div className="rounded-2xl bg-ink-100/70 p-4 text-sm text-ink-600">
            <b className="text-ink-900">Reglas para que no haya abusos:</b> los descuentos no se suman (se aplica el mayor); un retiro suma a la tarjeta solo cuando se entrega con el código del cliente; los pedidos que vencen sin retirar no suman.
          </div>
          <button onClick={() => setR(DEFAULT_RULES)} className="text-sm font-medium text-ink-500 hover:text-ink-900">Volver a los valores de la demo</button>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-400">Clientes y su tarjeta</h2>
          <Card className="divide-y divide-ink-100">
            {impact.list.filter((c) => c.done > 0).map((c) => {
              const completed = c.done % impact.goal === 0
              const progress = completed ? impact.goal : c.done % impact.goal
              const left = impact.goal - (c.done % impact.goal)
              return (
                <div key={c.email} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold">{c.name}</div>
                      <div className="truncate text-xs text-ink-500">{c.email}</div>
                    </div>
                    <div className="shrink-0 text-right text-xs text-ink-500">
                      <div><b className="text-ink-900">{c.done}</b> {c.done === 1 ? 'retiro' : 'retiros'}</div>
                      <div>Último: {shortDate(c.last.deliveredDate ?? c.last.createdDate)}</div>
                    </div>
                  </div>
                  <div className="mt-3"><Stamps progress={progress} goal={impact.goal} /></div>
                  <div className={cx('mt-1.5 text-xs', completed || left === 1 ? 'font-semibold text-brand-700' : 'text-ink-400')}>
                    {completed ? `Completó la tarjeta y usó su ${config.benefits.loyalty.pct} % off. Empieza una nueva.` : left === 1 ? `En su próxima compra con retiro tiene ${config.benefits.loyalty.pct} % off` : `Le faltan ${left} retiros`}
                  </div>
                </div>
              )
            })}
            {impact.list.some((c) => c.done === 0) && (
              <p className="p-4 text-sm text-ink-500">{impact.list.filter((c) => c.done === 0).length} clientes más con su primer retiro en curso.</p>
            )}
            {impact.list.length === 0 && <p className="p-6 text-center text-sm text-ink-400"><UserX className="mx-auto mb-2 h-5 w-5" />Todavía no hay clientes con retiros.</p>}
          </Card>
        </div>
      </div>
    </>
  )
}
