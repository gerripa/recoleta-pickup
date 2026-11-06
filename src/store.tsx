import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { addDays, fromKey, longDate, toKey, todayKey } from './dates'

// ---------- Tipos ----------

export type Channel = 'Tiendanube' | 'WhatsApp' | 'Instagram'

/**
 * Estados del pedido.
 * "sin_reserva": pedido de WhatsApp/Instagram que el cliente todavía no confirmó con su email.
 */
export type Status = 'sin_reserva' | 'pendiente' | 'preparacion' | 'listo' | 'entregado'

export type BenefitId = 'first' | 'loyalty' | 'big' | 'restock'
export interface Benefit {
  id: BenefitId
  title: string
  detail: string
  pct?: number
}

export interface Order {
  id: string
  number: string
  customer: string
  email: string // ID del cliente
  channel: Channel
  products: string[]
  paid: boolean
  benefits: Benefit[]
  discountPct: number
  optIn: boolean
  status: Status
  code?: string // código de retiro
  createdDate: string
  readyDate?: string // cuándo quedó listo
  deliveredDate?: string // cuándo lo retiró
  createdAt: number
}

export interface BenefitRules {
  first: { on: boolean; gift: string }
  loyalty: { on: boolean; every: number; pct: number }
  big: { on: boolean; min: number; gift: string }
  restock: { on: boolean; pct: number }
}

export interface StoreInfo {
  address: string
  openDays: number[] // 0 = domingo … 6 = sábado
  openHour: number
  closeHour: number
  pickupDays: number // días para retirar desde que está listo
}

export interface Config {
  store: StoreInfo
  benefits: BenefitRules
}

interface Data {
  orders: Order[]
  config: Config
  nextTn: number
}

export interface Product {
  name: string
  price: number
  days?: number
}

// ---------- Catálogo de ejemplo (precios y duraciones ficticias) ----------

export const CATALOG: Product[] = [
  { name: 'Whey Protein Star Nutrition 1 kg', price: 38900, days: 30 },
  { name: 'Creatina Monohidrato Star Nutrition 300 g', price: 24500, days: 60 },
  { name: 'Whey Protein ENA 930 g', price: 36700, days: 30 },
  { name: 'Pre-entreno ENA Pre War', price: 21900, days: 30 },
  { name: 'Colágeno Hidrolizado Gentech', price: 18400, days: 30 },
  { name: 'BCAA Xtrenght 250 g', price: 16900, days: 25 },
  { name: 'Barras de proteína x12', price: 14800, days: 12 },
  { name: 'Shaker Recoleta al Fallo', price: 6500 },
]

export const productOf = (name: string) => CATALOG.find((p) => p.name === name)
export const subtotalOf = (products: string[]) => products.reduce((s, n) => s + (productOf(n)?.price ?? 0), 0)
export const money = (n: number) => `$ ${Math.round(n).toLocaleString('es-AR')}`
export const totals = (products: string[], discountPct: number) => {
  const subtotal = subtotalOf(products)
  const discount = Math.round((subtotal * discountPct) / 100)
  return { subtotal, discount, total: subtotal - discount }
}

export const STATUS_LABEL: Record<Status, string> = {
  sin_reserva: 'Esperando datos del cliente',
  pendiente: 'Pendiente de preparación',
  preparacion: 'En preparación',
  listo: 'Listo para retirar',
  entregado: 'Entregado',
}
export const PREP_STATUSES: Status[] = ['pendiente', 'preparacion', 'listo', 'entregado']

export const NAMES = ['Valentina Ruiz', 'Joaquín Díaz', 'Camila Torres', 'Mateo Álvarez', 'Florencia Gómez', 'Santiago Romero', 'Agustina Sosa', 'Nicolás Medina', 'Julieta Herrera', 'Bruno Castro']

const STORAGE_KEY = 'recoleta-pickup-demo-v3'

export const normEmail = (c: string) => c.trim().toLowerCase()
export const validEmail = (c: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.trim())
export const firstName = (n: string) => n.split(' ')[0]
export const emailFor = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '.') + '@ejemplo.com'

// ---------- Local ----------

const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

/** "Lunes a sábado" / "Lunes, miércoles y viernes" */
export function daysText(days: number[]) {
  const order = [1, 2, 3, 4, 5, 6, 0].filter((d) => days.includes(d))
  if (order.length === 0) return 'Sin días habilitados'
  if (order.length === 7) return 'Todos los días'
  const idx = order.map((d) => [1, 2, 3, 4, 5, 6, 0].indexOf(d))
  const consecutive = idx.every((v, i) => i === 0 || v === idx[i - 1] + 1)
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
  if (consecutive && order.length > 2) return `${cap(DAY_NAMES[order[0]])} a ${DAY_NAMES[order[order.length - 1]]}`
  const names = order.map((d) => DAY_NAMES[d])
  return cap(names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`)
}
export const hoursText = (s: StoreInfo) => `${daysText(s.openDays)}, de ${s.openHour} a ${s.closeHour} h`

/** Fecha límite para retirar */
export function deadlineOf(o: Order, store: StoreInfo) {
  if (!o.readyDate) return undefined
  return toKey(addDays(fromKey(o.readyDate), store.pickupDays))
}
/** Listo, pasó el plazo y no lo retiró: no suma a la tarjeta */
export function isExpired(o: Order, store: StoreInfo) {
  const d = deadlineOf(o, store)
  return o.status === 'listo' && !!d && d < todayKey()
}

// ---------- Datos de demostración ----------

const uid = () => Math.random().toString(36).slice(2, 10)
const makeCode = (number: string) => `RP-${number.replace(/[^0-9]/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

export const DEFAULT_RULES: BenefitRules = {
  first: { on: true, gift: 'Muestra gratis de proteína' },
  loyalty: { on: true, every: 5, pct: 20 },
  big: { on: true, min: 60000, gift: 'Shaker Recoleta al Fallo de regalo' },
  restock: { on: true, pct: 10 },
}
export const DEFAULT_STORE: StoreInfo = { address: 'French 3160, Recoleta, CABA', openDays: [1, 2, 3, 4, 5, 6], openHour: 9, closeHour: 20, pickupDays: 7 }
export const DEFAULT_CONFIG: Config = { store: DEFAULT_STORE, benefits: DEFAULT_RULES }

function seed(): Data {
  const ago = (n: number) => toKey(addDays(new Date(), -n))
  const today = todayKey()
  let n = 0
  const o = (number: string, customer: string, channel: Channel, products: string[], status: Status, created: number, extra: Partial<Order> = {}): Order => ({
    id: uid(),
    number,
    customer,
    email: emailFor(customer),
    channel,
    products,
    paid: true,
    benefits: [],
    discountPct: 0,
    optIn: true,
    status,
    code: status === 'sin_reserva' ? undefined : makeCode(number),
    createdDate: ago(created),
    readyDate: status === 'listo' || status === 'entregado' ? ago(Math.max(0, created - 1)) : undefined,
    deliveredDate: status === 'entregado' ? ago(Math.max(0, created - 2)) : undefined,
    createdAt: Date.now() - (300 - n++) * 3600_000,
    ...extra,
  })
  // Historial: clientes que ya retiraron varias veces
  const hist = (customer: string, channel: Channel, count: number, start: number, products: string[]) =>
    Array.from({ length: count }, (_, i) =>
      o(channel === 'Tiendanube' ? `#${start + i}` : `${channel === 'WhatsApp' ? 'WA' : 'IG'}-${String(start + i).padStart(3, '0')}`, customer, channel, products, 'entregado', (count - i) * 9 + 3),
    )
  const restock = { benefits: [{ id: 'restock' as const, title: 'Recompra', detail: '10 % off por volver a comprar un producto', pct: 10 }], discountPct: 10 }
  const orders: Order[] = [
    ...hist('Martina López', 'Tiendanube', 4, 1010, ['Whey Protein Star Nutrition 1 kg']),
    ...hist('Tomás García', 'Tiendanube', 2, 1020, ['Creatina Monohidrato Star Nutrition 300 g']),
    ...hist('Sofía Ramírez', 'WhatsApp', 5, 190, ['Creatina Monohidrato Star Nutrition 300 g']),
    // Pedidos actuales
    o('#1059', 'Tomás García', 'Tiendanube', ['Creatina Monohidrato Star Nutrition 300 g'], 'listo', 2, restock),
    o('#1060', 'Lucía Fernández', 'Tiendanube', ['Whey Protein ENA 930 g'], 'listo', 1, { benefits: [{ id: 'first', title: 'Primer retiro', detail: 'Muestra gratis de proteína' }], readyDate: today }),
    o('#1055', 'Juan Pérez', 'Tiendanube', ['Pre-entreno ENA Pre War', 'Shaker Recoleta al Fallo'], 'entregado', 2, { deliveredDate: today }),
    o('#1056', 'Paula Méndez', 'Tiendanube', ['BCAA Xtrenght 250 g'], 'preparacion', 0),
    o('#1057', 'Federico Ríos', 'Tiendanube', ['Barras de proteína x12'], 'pendiente', 0),
    o('WA-214', 'Sofía Ramírez', 'WhatsApp', ['Creatina Monohidrato Star Nutrition 300 g', 'Barras de proteína x12'], 'preparacion', 0, restock),
    o('WA-215', 'Lautaro Benítez', 'WhatsApp', ['Whey Protein ENA 930 g'], 'pendiente', 1, { paid: false }),
    o('WA-216', 'Carolina Vega', 'WhatsApp', ['Colágeno Hidrolizado Gentech', 'Whey Protein ENA 930 g'], 'sin_reserva', 0, { paid: false, optIn: false, email: '' }),
    o('IG-087', 'Micaela Ortiz', 'Instagram', ['Whey Protein Star Nutrition 1 kg', 'Shaker Recoleta al Fallo'], 'listo', 3),
    o('IG-088', 'Ramiro Acosta', 'Instagram', ['Pre-entreno ENA Pre War'], 'pendiente', 0, { paid: false }),
    o('IG-089', 'Delfina Suárez', 'Instagram', ['BCAA Xtrenght 250 g'], 'listo', 12),
    o('#1054', 'Ignacio Paz', 'Tiendanube', ['Whey Protein ENA 930 g'], 'entregado', 4, { deliveredDate: ago(1) }),
    o('WA-213', 'Emilia Navarro', 'WhatsApp', ['Creatina Monohidrato Star Nutrition 300 g'], 'pendiente', 1),
    // Retiros de la última semana
    ...([
      ['#1048', 'Camila Torres', 'Tiendanube', 'Whey Protein ENA 930 g', 6],
      ['WA-209', 'Mateo Álvarez', 'WhatsApp', 'Pre-entreno ENA Pre War', 5],
      ['#1049', 'Florencia Gómez', 'Tiendanube', 'Colágeno Hidrolizado Gentech', 4],
      ['IG-084', 'Santiago Romero', 'Instagram', 'BCAA Xtrenght 250 g', 4],
      ['#1050', 'Agustina Sosa', 'Tiendanube', 'Barras de proteína x12', 3],
      ['WA-210', 'Nicolás Medina', 'WhatsApp', 'Whey Protein Star Nutrition 1 kg', 2],
      ['#1051', 'Julieta Herrera', 'Tiendanube', 'Creatina Monohidrato Star Nutrition 300 g', 2],
      ['IG-085', 'Bruno Castro', 'Instagram', 'Whey Protein ENA 930 g', 1],
    ] as [string, string, Channel, string, number][]).map(([num, name, ch, prod, d]) => o(num, name, ch, [prod], 'entregado', d + 2, { readyDate: ago(d + 1), deliveredDate: ago(d) })),
  ]
  return { orders, config: DEFAULT_CONFIG, nextTn: 1061 }
}

function load(): Data {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Data
  } catch {
    /* sin almacenamiento: demo en memoria */
  }
  return seed()
}

// ---------- Beneficios ----------

export interface Loyalty {
  done: number
  progress: number
  goal: number
  left: number
  history: Order[]
}
export interface BenefitQuote {
  benefits: Benefit[]
  pct: number
  loyalty: Loyalty
  known: boolean
}

const sortKey = (o: Order) => o.deliveredDate ?? o.readyDate ?? o.createdDate

/** Calcula, a partir del email, qué beneficios le tocan a esta compra. Puede no tocar ninguno. */
export function quoteBenefits(orders: Order[], rules: BenefitRules, email: string, products: string[], exceptId?: string): BenefitQuote {
  const e = normEmail(email)
  const mine = e ? orders.filter((o) => normEmail(o.email) === e && o.id !== exceptId && o.status !== 'sin_reserva') : []
  const delivered = mine.filter((o) => o.status === 'entregado')
  const goal = rules.loyalty.every
  const done = delivered.length
  const loyalty: Loyalty = { done, goal, progress: done % goal, left: goal - (done % goal), history: [...mine].sort((a, b) => sortKey(b).localeCompare(sortKey(a))) }
  const out: Benefit[] = []
  if (!validEmail(email)) return { benefits: out, pct: 0, loyalty, known: false }

  if (rules.first.on && mine.length === 0) out.push({ id: 'first', title: 'Primer retiro', detail: rules.first.gift })
  if (rules.loyalty.on && (done + 1) % goal === 0) out.push({ id: 'loyalty', title: `Retiro n.º ${done + 1}`, detail: `${rules.loyalty.pct} % off por completar ${goal} retiros`, pct: rules.loyalty.pct })
  if (rules.restock.on && products.some((p) => delivered.some((o) => o.products.includes(p)))) out.push({ id: 'restock', title: 'Recompra', detail: `${rules.restock.pct} % off por volver a comprar un producto`, pct: rules.restock.pct })
  if (rules.big.on && subtotalOf(products) >= rules.big.min) out.push({ id: 'big', title: 'Compra grande', detail: rules.big.gift })

  // Los descuentos no se suman: queda solo el mayor. Los regalos sí se acumulan.
  const pct = Math.max(0, ...out.map((b) => b.pct ?? 0))
  const best = out.find((b) => b.pct === pct)
  return { benefits: out.filter((b) => !b.pct || b === best), pct, loyalty, known: mine.length > 0 }
}

// ---------- Mails automáticos (simulados) ----------

export interface Message {
  id: string
  order: Order
  kind: 'confirmacion' | 'listo' | 'recordatorio' | 'gracias' | 'recompra'
  subject: string
  body: string[]
  date: string
}

export function messagesFor(o: Order, orders: Order[], config: Config): Message[] {
  if (o.status === 'sin_reserva' || !o.email) return []
  const { store, benefits: rules } = config
  const name = firstName(o.customer)
  const t = totals(o.products, o.discountPct)
  const out: Message[] = []
  const send = (kind: Message['kind'], subject: string, body: string[], date: string) => out.push({ id: `${o.id}-${kind}`, order: o, kind, subject, body, date })

  send(
    'confirmacion',
    `Recibimos tu pedido ${o.number} · Retiro en el local`,
    [
      `Hola ${name}, ya tenemos tu pedido. Te avisamos por mail cuando esté listo para retirar.`,
      `Dónde: ${store.address}. Horario: ${hoursText(store).toLowerCase()}.`,
      `Tu código de retiro: ${o.code}.`,
      o.benefits.length ? `Beneficios de esta compra: ${o.benefits.map((b) => b.detail).join(' · ')}.` : 'Esta vez no hubo beneficio extra, pero el retiro suma a tu tarjeta.',
      `Total: ${money(t.total)}${t.discount ? ` (ahorraste ${money(t.discount)})` : ''}.`,
    ],
    o.createdDate,
  )
  const deadline = deadlineOf(o, store)
  if (o.readyDate && deadline) {
    send('listo', `¡Tu pedido ${o.number} está listo!`, [`Hola ${name}, ya podés pasar a buscarlo por ${store.address}.`, `Horario: ${hoursText(store).toLowerCase()}. Tenés tiempo hasta el ${longDate(deadline)}.`, `Mostrá tu código ${o.code} al retirar.`], o.readyDate)
    if (o.status === 'listo') {
      const remind = toKey(addDays(fromKey(deadline), -2))
      send('recordatorio', `Tu pedido ${o.number} te sigue esperando`, [`Hola ${name}, todavía no pasaste a buscar tu pedido.`, `Podés retirarlo hasta el ${longDate(deadline)}, ${hoursText(store).toLowerCase()}.`], remind < o.readyDate ? o.readyDate : remind)
    }
  }
  if (o.status === 'entregado' && o.deliveredDate) {
    const prev = orders.filter((x) => x.status === 'entregado' && x.deliveredDate && (x.deliveredDate < o.deliveredDate! || (x.deliveredDate === o.deliveredDate && x.createdAt < o.createdAt)))
    const done = quoteBenefits(prev, rules, o.email, [], o.id).loyalty.done + 1
    const every = rules.loyalty.every
    const left = every - (done % every)
    send(
      'gracias',
      '¡Gracias por retirar!',
      [
        `Hola ${name}, gracias por retirar tu pedido ${o.number}.`,
        rules.loyalty.on
          ? left === every
            ? `¡Completaste tu tarjeta de ${every} retiros! Desde tu próxima compra empezás una nueva.`
            : left === 1
              ? `Ya sumaste ${done % every} de ${every} retiros: en tu próxima compra con retiro tenés ${rules.loyalty.pct} % off.`
              : `Ya sumaste ${done % every} de ${every} retiros. Te faltan ${left} para tu ${rules.loyalty.pct} % off.`
          : 'Te esperamos en tu próxima compra.',
      ],
      o.deliveredDate,
    )
    if (o.optIn && rules.restock.on) {
      const p = o.products.map(productOf).find((x) => x?.days)
      if (p?.days)
        send('recompra', `¿Se te está por terminar? ${rules.restock.pct} % off para reponer`, [`Hola ${name}, calculamos que tu ${p.name} se está por terminar.`, `Si lo volvés a comprar con retiro en el local, tenés ${rules.restock.pct} % off.`], toKey(addDays(fromKey(o.deliveredDate), p.days - 5)))
    }
  }
  return out
}

// ---------- Contexto ----------

type Result = { ok: true; order: Order } | { ok: false; error: string }

interface Store extends Data {
  quote: (email: string, products: string[], exceptId?: string) => BenefitQuote
  allMessages: () => Message[]
  createPurchase: (input: { customer: string; email: string; products: string[]; optIn: boolean }) => Result
  createManualOrder: (input: { customer: string; number: string; channel: Channel; products: string[] }) => Order
  confirmPickup: (id: string, input: { email: string; optIn: boolean }) => Result
  confirmPayment: (id: string) => void
  setStatus: (id: string, status: Status) => void
  saveConfig: (c: Config) => void
  resetDemo: () => void
  byId: (id: string) => Order | undefined
  findByNumber: (number: string) => Order | undefined
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      /* ignorar */
    }
  }, [data])

  const quote = useCallback((email: string, products: string[], exceptId?: string) => quoteBenefits(data.orders, data.config.benefits, email, products, exceptId), [data.orders, data.config.benefits])

  const allMessages = useCallback(() => data.orders.flatMap((o) => messagesFor(o, data.orders, data.config)).sort((a, b) => b.date.localeCompare(a.date)), [data.orders, data.config])

  const createPurchase: Store['createPurchase'] = useCallback(
    (input) => {
      if (!validEmail(input.email)) return { ok: false, error: 'Ingresá un email válido para tu retiro.' }
      const q = quoteBenefits(data.orders, data.config.benefits, input.email, input.products)
      const number = `#${data.nextTn}`
      const order: Order = {
        id: uid(),
        number,
        customer: input.customer,
        email: input.email.trim(),
        channel: 'Tiendanube',
        products: input.products,
        paid: true,
        benefits: q.benefits,
        discountPct: q.pct,
        optIn: input.optIn,
        status: 'pendiente',
        code: makeCode(number),
        createdDate: todayKey(),
        createdAt: Date.now(),
      }
      setData((d) => ({ ...d, orders: [order, ...d.orders], nextTn: d.nextTn + 1 }))
      return { ok: true, order }
    },
    [data.nextTn, data.orders, data.config.benefits],
  )

  const createManualOrder: Store['createManualOrder'] = useCallback((input) => {
    const order: Order = { id: uid(), ...input, email: '', paid: false, benefits: [], discountPct: 0, optIn: false, status: 'sin_reserva', createdDate: todayKey(), createdAt: Date.now() }
    setData((d) => ({ ...d, orders: [order, ...d.orders] }))
    return order
  }, [])

  const confirmPickup: Store['confirmPickup'] = useCallback(
    (id, { email, optIn }) => {
      const order = data.orders.find((o) => o.id === id)
      if (!order) return { ok: false, error: 'No encontramos el pedido.' }
      if (order.status !== 'sin_reserva') return { ok: false, error: 'Este pedido ya fue confirmado.' }
      if (!validEmail(email)) return { ok: false, error: 'Ingresá un email válido para tu retiro.' }
      const q = quoteBenefits(data.orders, data.config.benefits, email, order.products, id)
      const updated: Order = { ...order, email: email.trim(), optIn, benefits: q.benefits, discountPct: q.pct, code: makeCode(order.number), status: 'pendiente' }
      setData((d) => ({ ...d, orders: d.orders.map((o) => (o.id === id ? updated : o)) }))
      return { ok: true, order: updated }
    },
    [data.orders, data.config.benefits],
  )

  const confirmPayment = useCallback((id: string) => {
    setData((d) => ({ ...d, orders: d.orders.map((o) => (o.id === id ? { ...o, paid: true } : o)) }))
  }, [])

  const setStatus = useCallback((id: string, status: Status) => {
    const today = todayKey()
    setData((d) => ({
      ...d,
      orders: d.orders.map((o) => {
        if (o.id !== id) return o
        const next: Order = { ...o, status }
        if (status === 'listo') next.readyDate = today
        if (status === 'entregado') {
          next.deliveredDate = today
          next.readyDate = o.readyDate ?? today
        }
        if (status === 'pendiente' || status === 'preparacion') {
          next.readyDate = undefined
          next.deliveredDate = undefined
        }
        return next
      }),
    }))
  }, [])

  const saveConfig = useCallback((config: Config) => setData((d) => ({ ...d, config })), [])
  const resetDemo = useCallback(() => setData(seed()), [])
  const byId = useCallback((id: string) => data.orders.find((o) => o.id === id), [data.orders])
  const findByNumber = useCallback(
    (number: string) => {
      const q = number.trim().toUpperCase().replace(/^#/, '')
      return data.orders.find((o) => o.number.toUpperCase().replace(/^#/, '') === q)
    },
    [data.orders],
  )

  const value = useMemo<Store>(
    () => ({ ...data, quote, allMessages, createPurchase, createManualOrder, confirmPickup, confirmPayment, setStatus, saveConfig, resetDemo, byId, findByNumber }),
    [data, quote, allMessages, createPurchase, createManualOrder, confirmPickup, confirmPayment, setStatus, saveConfig, resetDemo, byId, findByNumber],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('StoreProvider faltante')
  return s
}
