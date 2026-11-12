import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Dumbbell, FlaskConical, Instagram, MessageCircle, ShoppingBag, Check, Copy } from 'lucide-react'
import type { Channel, Status } from '../store'
import { STATUS_LABEL } from '../store'

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

export function Logo({ light = false, small = false }: { light?: boolean; small?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={cx('grid place-items-center rounded-xl', small ? 'h-8 w-8' : 'h-9 w-9', light ? 'bg-white/10 text-white' : 'bg-brand-800 text-white')}>
        <Dumbbell className={small ? 'h-4 w-4' : 'h-[18px] w-[18px]'} strokeWidth={2.4} />
      </div>
      <div className="leading-none">
        <div className={cx('font-extrabold tracking-[0.14em]', small ? 'text-[13px]' : 'text-sm', light ? 'text-white' : 'text-ink-900')}>RECOLETA</div>
        <div className={cx('mt-0.5 font-semibold tracking-[0.3em]', small ? 'text-[10px]' : 'text-[11px]', light ? 'text-brand-200' : 'text-brand-600')}>PICKUP</div>
      </div>
    </div>
  )
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'light'
export function Button({ variant = 'primary', className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const styles: Record<Variant, string> = {
    primary: 'bg-brand-800 text-white hover:bg-brand-700 shadow-sm disabled:bg-ink-300',
    secondary: 'bg-white text-ink-900 border border-ink-200 hover:border-ink-300 hover:bg-ink-50 disabled:text-ink-400',
    ghost: 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
    light: 'bg-white text-brand-900 hover:bg-brand-50 shadow-sm',
  }
  return (
    <button
      className={cx('inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed', styles[variant], className)}
      {...rest}
    >
      {children}
    </button>
  )
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  const hasBg = /(^|\s)bg-/.test(className ?? '')
  return <div className={cx('rounded-2xl border border-ink-200/70 shadow-soft', !hasBg && 'bg-white', className)}>{children}</div>
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200', className)}>
      <FlaskConical className="h-3 w-3" /> Demo · datos ficticios
    </span>
  )
}

const CH: Record<Channel, { icon: typeof ShoppingBag; cls: string }> = {
  Tiendanube: { icon: ShoppingBag, cls: 'bg-sky-50 text-sky-800 ring-sky-200' },
  WhatsApp: { icon: MessageCircle, cls: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  Instagram: { icon: Instagram, cls: 'bg-fuchsia-50 text-fuchsia-800 ring-fuchsia-200' },
}
export function ChannelBadge({ channel }: { channel: Channel }) {
  const { icon: Icon, cls } = CH[channel]
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1', cls)}>
      <Icon className="h-3.5 w-3.5" /> {channel}
    </span>
  )
}

export const STATUS_STYLE: Record<Status, string> = {
  sin_reserva: 'bg-ink-100 text-ink-600 ring-ink-200',
  pendiente: 'bg-amber-50 text-amber-800 ring-amber-200',
  preparacion: 'bg-sky-50 text-sky-800 ring-sky-200',
  listo: 'bg-brand-100 text-brand-800 ring-brand-200',
  entregado: 'bg-ink-900 text-white ring-ink-900',
}
export const STATUS_DOT: Record<Status, string> = {
  sin_reserva: 'bg-ink-400',
  pendiente: 'bg-amber-500',
  preparacion: 'bg-sky-500',
  listo: 'bg-brand-500',
  entregado: 'bg-ink-900',
}
export function StatusBadge({ status, label }: { status: Status; label?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1', STATUS_STYLE[status])}>
      <span className={cx('h-1.5 w-1.5 rounded-full', status === 'entregado' ? 'bg-white' : STATUS_DOT[status])} />
      {label ?? STATUS_LABEL[status]}
    </span>
  )
}

// ---------- Toast ----------
let pushToast: (msg: string) => void = () => {}
export const toast = (msg: string) => pushToast(msg)

export function Toaster() {
  const [items, setItems] = useState<{ id: number; msg: string }[]>([])
  useEffect(() => {
    pushToast = (msg) => {
      const id = Date.now() + Math.random()
      setItems((s) => [...s, { id, msg }])
      setTimeout(() => setItems((s) => s.filter((i) => i.id !== id)), 2600)
    }
  }, [])
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex flex-col items-center gap-2 px-4">
      {items.map((i) => (
        <div key={i.id} className="fade-in flex items-center gap-2 rounded-xl bg-ink-900 px-4 py-3 text-sm font-medium text-white shadow-lift">
          <Check className="h-4 w-4 text-brand-300" /> {i.msg}
        </div>
      ))}
    </div>
  )
}

/** Copia al portapapeles con alternativa para entornos donde la API no está disponible */
export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch {
      ok = false
    }
    ta.remove()
    return ok
  }
}

export function CopyField({ value }: { value: string }) {
  const [done, setDone] = useState(false)
  return (
    <div className="flex items-stretch gap-2">
      <input readOnly value={value} onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 rounded-xl border border-ink-200 bg-ink-50 px-3 py-2.5 font-mono text-xs text-ink-700" />
      <Button
        variant="secondary"
        onClick={async () => {
          const ok = await copyText(value)
          setDone(true)
          toast(ok ? 'Enlace copiado' : 'Seleccioná el enlace y copialo')
          setTimeout(() => setDone(false), 1500)
        }}
      >
        {done ? <Check className="h-4 w-4 text-brand-600" /> : <Copy className="h-4 w-4" />} Copiar
      </Button>
    </div>
  )
}

export function Stat({ label, value, hint, icon: Icon, accent = false }: { label: string; value: number | string; hint?: string; icon: typeof ShoppingBag; accent?: boolean }) {
  return (
    <Card className={cx('p-5', accent && 'border-brand-800 bg-brand-800 text-white')}>
      <div className="flex items-start justify-between">
        <div className={cx('text-sm font-medium', accent ? 'text-brand-100' : 'text-ink-500')}>{label}</div>
        <div className={cx('grid h-9 w-9 place-items-center rounded-xl', accent ? 'bg-white/10' : 'bg-brand-50 text-brand-700')}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight">{value}</div>
      {hint && <div className={cx('mt-1 text-xs', accent ? 'text-brand-200' : 'text-ink-400')}>{hint}</div>}
    </Card>
  )
}
