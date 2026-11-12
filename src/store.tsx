import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { backend, type PurchaseInput, type Result } from './backend'
import { toast } from './components/ui'
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

export interface ClosedDate {
  date: string // YYYY-MM-DD
  reason: string
}

export interface StoreInfo {
  address: string
  openDays: number[] // 0 = domingo … 6 = sábado
  openHour: number
  closeHour: number
  pickupDays: number // días para retirar desde que está listo
  closedDates: ClosedDate[] // feriados o días puntuales sin atención
}

export interface Config {
  store: StoreInfo
  benefits: BenefitRules
}

/** Stock tal como viene de Tiendanube (simulado) + el mínimo que elige Martín */
export interface StockItem {
  stock: number
  min: number
}

export interface Data {
  orders: Order[]
  config: Config
  nextTn: number
  inventory: Record<string, StockItem>
  lastSync: number
}

export interface Product {
  name: string
  sku: string
  price: number
  days?: number
}

// ---------- Catálogo de ejemplo (en la versión real se lee de la API de productos de Tiendanube) ----------

export const CATALOG: Product[] = [
  { name: 'Whey Protein Star Nutrition 1 kg', sku: 'TN-1001', price: 38900, days: 30 },
  { name: 'Creatina Monohidrato Star Nutrition 300 g', sku: 'TN-1002', price: 24500, days: 60 },
  { name: 'Whey Protein ENA 930 g', sku: 'TN-1003', price: 36700, days: 30 },
  { name: 'Pre-entreno ENA Pre War', sku: 'TN-1004', price: 21900, days: 30 },
  { name: 'Colágeno Hidrolizado Gentech', sku: 'TN-1005', price: 18400, days: 30 },
  { name: 'BCAA Xtrenght 250 g', sku: 'TN-1006', price: 16900, days: 25 },
  { name: 'Barras de proteína x12', sku: 'TN-1007', price: 14800, days: 12 },
  { name: 'Shaker Recoleta al Fallo', sku: 'TN-1008', price: 6500 },
]

export const DEFAULT_INVENTORY: Record<string, StockItem> = {
  'Whey Protein Star Nutrition 1 kg': { stock: 14, min: 5 },
  'Creatina Monohidrato Star Nutrition 300 g': { stock: 22, min: 6 },
  'Whey Protein ENA 930 g': { stock: 9, min: 5 },
  'Pre-entreno ENA Pre War': { stock: 3, min: 4 },
  'Colágeno Hidrolizado Gentech': { stock: 6, min: 4 },
  'BCAA Xtrenght 250 g': { stock: 2, min: 3 },
  'Barras de proteína x12': { stock: 17, min: 6 },
  'Shaker Recoleta al Fallo': { stock: 30, min: 10 },
}

/** Costo de envío promedio que el cliente se ahorra al retirar (estimado para las métricas) */
export const AVG_SHIPPING = 4500

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

export const STORAGE_KEY = 'recoleta-pickup-demo-v4'

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

/** ¿El local atiende ese día? (día de la semana habilitado y no bloqueado) */
export const isOpenOn = (date: string, store: StoreInfo) => store.openDays.includes(fromKey(date).getDay()) && !(store.closedDates ?? []).some((c) => c.date === date)

/** Fecha límite para retirar. Si cae en un día cerrado, pasa al siguiente día abierto. */
export function deadlineOf(o: Order, store: StoreInfo) {
  if (!o.readyDate) return undefined
  let d = addDays(fromKey(o.readyDate), store.pickupDays)
  for (let i = 0; i < 14 && !isOpenOn(toKey(d), store); i++) d = addDays(d, 1)
  return toKey(d)
}

/** Días en los que un pedido activo puede pasar a retirarse (desde hoy hasta su fecha límite) */
export function pickupWindow(o: Order, store: StoreInfo): string[] {
  if (o.status === 'entregado' || o.status === 'sin_reserva' || isExpired(o, store)) return []
  const today = todayKey()
  // Si todavía se está preparando, estimamos que queda listo hoy o mañana
  const end = o.status === 'listo' ? deadlineOf(o, store)! : toKey(addDays(new Date(), store.pickupDays + 1))
  const out: string[] = []
  for (let d = fromKey(today); toKey(d) <= end; d = addDays(d, 1)) out.push(toKey(d))
  return out
}

/** Pedidos que se podrían retirar en esa fecha: no se puede cerrar el local ese día */
export const ordersOnDate = (orders: Order[], store: StoreInfo, date: string) => orders.filter((o) => pickupWindow(o, store).includes(date))

/** Pedidos que se podrían retirar algún día de esa semana (para cerrar un día fijo, ej. todos los miércoles) */
export function ordersOnWeekday(orders: Order[], store: StoreInfo, weekday: number) {
  return orders
    .map((o) => ({ order: o, dates: pickupWindow(o, store).filter((d) => fromKey(d).getDay() === weekday) }))
    .filter((x) => x.dates.length > 0)
}

/** Próximos días cerrados puntuales (feriados), ordenados */
export const upcomingClosed = (store: StoreInfo) => [...(store.closedDates ?? [])].filter((c) => c.date >= todayKey()).sort((a, b) => a.date.localeCompare(b.date))

/** Cupón personal de un solo uso (en la versión real se crea con la API de cupones de Tiendanube) */
export const couponFor = (o: Pick<Order, 'customer'>, pct: number) => `${firstName(o.customer).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}${pct}`
/** Listo, pasó el plazo y no lo retiró: no suma a la tarjeta */
export function isExpired(o: Order, store: StoreInfo) {
  const d = deadlineOf(o, store)
  return o.status === 'listo' && !!d && d < todayKey()
}

// ---------- Datos de demostración ----------

export const uid = () => Math.random().toString(36).slice(2, 10)
/** Código de retiro corto: 4 números, fácil de decir en el mostrador. No se repite entre pedidos. */
export const makeCode = (taken: Iterable<string | undefined>) => {
  const used = new Set(taken)
  for (;;) {
    const c = String(Math.floor(1000 + Math.random() * 9000))
    if (!used.has(c)) return c
  }
}
export const normCode = (c: string) => c.replace(/\D/g, '')

export const DEFAULT_RULES: BenefitRules = {
  first: { on: true, gift: 'Muestra gratis de proteína' },
  loyalty: { on: true, every: 5, pct: 20 },
  big: { on: true, min: 60000, gift: 'Shaker Recoleta al Fallo de regalo' },
  restock: { on: true, pct: 10 },
}
export const DEFAULT_STORE: StoreInfo = { address: 'French 3160, Recoleta, CABA', openDays: [1, 2, 3, 4, 5, 6], openHour: 9, closeHour: 20, pickupDays: 7, closedDates: [] }
export const DEFAULT_CONFIG: Config = { store: DEFAULT_STORE, benefits: DEFAULT_RULES }

export function seed(): Data {
  const ago = (n: number) => toKey(addDays(new Date(), -n))
  const today = todayKey()
  let n = 0
  const codes: string[] = []
  const code = () => {
    const c = makeCode(codes)
    codes.push(c)
    return c
  }
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
    code: status === 'sin_reserva' ? undefined : code(),
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
  // Un feriado de ejemplo, más allá del plazo de los pedidos actuales
  const holiday = toKey(addDays(new Date(), 12))
  const config: Config = { ...DEFAULT_CONFIG, store: { ...DEFAULT_STORE, closedDates: [{ date: holiday, reason: 'Feriado' }] } }
  return { orders, config, nextTn: 1061, inventory: structuredClone(DEFAULT_INVENTORY), lastSync: Date.now() - 25 * 60_000 }
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

/** Lo único que hace falta saber del historial del cliente para calcular sus beneficios */
export interface QuoteContext {
  total: number // pedidos confirmados con ese email
  done: number // retiros entregados
  restock: boolean // ya retiró alguno de los productos del carrito
}

export function contextFrom(orders: Order[], email: string, products: string[], exceptId?: string): QuoteContext {
  const e = normEmail(email)
  const mine = e ? orders.filter((o) => normEmail(o.email) === e && o.id !== exceptId && o.status !== 'sin_reserva') : []
  const delivered = mine.filter((o) => o.status === 'entregado')
  return { total: mine.length, done: delivered.length, restock: products.some((p) => delivered.some((o) => o.products.includes(p))) }
}

/** Calcula qué beneficios le tocan a esta compra. Puede no tocar ninguno. (La base de datos hace el mismo cálculo al guardar.) */
export function quoteFromContext(rules: BenefitRules, ctx: QuoteContext, email: string, products: string[]): BenefitQuote {
  const goal = Math.max(1, rules.loyalty.every)
  const done = ctx.done
  const loyalty: Loyalty = { done, goal, progress: done % goal, left: goal - (done % goal), history: [] }
  const out: Benefit[] = []
  if (!validEmail(email)) return { benefits: out, pct: 0, loyalty, known: false }

  if (rules.first.on && ctx.total === 0) out.push({ id: 'first', title: 'Primer retiro', detail: rules.first.gift })
  if (rules.loyalty.on && (done + 1) % goal === 0) out.push({ id: 'loyalty', title: `Retiro n.º ${done + 1}`, detail: `${rules.loyalty.pct} % off por completar ${goal} retiros`, pct: rules.loyalty.pct })
  if (rules.restock.on && ctx.restock) out.push({ id: 'restock', title: 'Recompra', detail: `${rules.restock.pct} % off por volver a comprar un producto`, pct: rules.restock.pct })
  if (rules.big.on && subtotalOf(products) >= rules.big.min) out.push({ id: 'big', title: 'Compra grande', detail: rules.big.gift })

  // Los descuentos no se suman: queda solo el mayor. Los regalos sí se acumulan.
  const pct = Math.max(0, ...out.map((b) => b.pct ?? 0))
  const best = out.find((b) => b.pct === pct)
  return { benefits: out.filter((b) => !b.pct || b === best), pct, loyalty, known: ctx.total > 0 }
}

export function quoteBenefits(orders: Order[], rules: BenefitRules, email: string, products: string[], exceptId?: string): BenefitQuote {
  return quoteFromContext(rules, contextFrom(orders, email, products, exceptId), email, products)
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
      `Tu código de retiro: ${o.code}. Decilo en el mostrador cuando pases.`,
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
              ? `Ya sumaste ${done % every} de ${every} retiros: en tu próxima compra con retiro tenés ${rules.loyalty.pct} % off. Se aplica solo si comprás con tu cuenta, o usá tu cupón personal ${couponFor(o, rules.loyalty.pct)} en el checkout.`
              : `Ya sumaste ${done % every} de ${every} retiros. Te faltan ${left} para tu ${rules.loyalty.pct} % off.`
          : 'Te esperamos en tu próxima compra.',
      ],
      o.deliveredDate,
    )
    if (o.optIn && rules.restock.on) {
      const p = o.products.map(productOf).find((x) => x?.days)
      if (p?.days)
        send('recompra', `¿Se te está por terminar? ${rules.restock.pct} % off para reponer`, [`Hola ${name}, calculamos que tu ${p.name} se está por terminar.`, `Si lo volvés a comprar con retiro en el local, tenés ${rules.restock.pct} % off. Usá tu cupón ${couponFor(o, rules.restock.pct)} en el checkout.`], toKey(addDays(fromKey(o.deliveredDate), p.days - 5)))
    }
  }
  return out
}

// ---------- Contexto ----------

/** Resultado de cargar un código en el mostrador */
export type CodeResult =
  | { ok: true; order: Order; before: Order; from: Status; to: Status }
  | { ok: false; error: string; order?: Order; needsPayment?: boolean }

/** Qué estado sigue al cargar el código: pendiente → en preparación → listo → entregado */
export const NEXT_STATUS: Partial<Record<Status, Status>> = { pendiente: 'preparacion', preparacion: 'listo', listo: 'entregado' }

const countUnits = (orders: Order[], name: string) => orders.reduce((s, o) => s + o.products.filter((p) => p === name).length, 0)

const EMPTY: Data = { orders: [], config: DEFAULT_CONFIG, nextTn: 1061, inventory: structuredClone(DEFAULT_INVENTORY), lastSync: 0 }

export type { Result }

interface Store extends Data {
  mode: 'local' | 'cloud'
  /** Mail del administrador con sesión iniciada (en la demo local siempre hay) */
  admin: string | null
  authChecked: boolean
  adminLoaded: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  // Cliente (sin login): siempre pasan por el servidor
  fetchQuote: (email: string, products: string[], exceptId?: string) => Promise<QuoteContext>
  createPurchase: (input: PurchaseInput) => Promise<Result>
  confirmPickup: (id: string, input: { email: string; optIn: boolean }) => Promise<Result>
  getOrder: (id: string) => Promise<Order | null>
  findPending: (number: string) => Promise<string | null>
  // Panel
  quote: (email: string, products: string[], exceptId?: string) => BenefitQuote
  allMessages: () => Message[]
  createManualOrder: (input: { customer: string; number: string; channel: Channel; products: string[] }) => Order
  confirmPayment: (id: string) => void
  setStatus: (id: string, status: Status) => void
  advanceByCode: (code: string) => CodeResult
  restoreOrder: (order: Order) => void
  saveConfig: (c: Config) => void
  resetDemo: () => Promise<void>
  byId: (id: string) => Order | undefined
  findByNumber: (number: string) => Order | undefined
  /** Stock que falta entregar en el local (vendido con retiro, todavía no retirado) */
  toDeliver: (name: string) => number
  lowStock: () => { name: string; item: StockItem }[]
  syncTiendanube: () => void
  setMinStock: (name: string, min: number) => void
  addStock: (name: string, qty: number) => void
  refresh: () => Promise<void>
}

const Ctx = createContext<Store | null>(null)

const withStatus = (o: Order, status: Status): Order => {
  const today = todayKey()
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
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<Data>(EMPTY)
  const dataRef = useRef<Data>(EMPTY)
  const [admin, setAdmin] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [adminLoaded, setAdminLoaded] = useState(false)
  const adminRef = useRef<string | null>(null)

  const replace = (d: Data) => {
    dataRef.current = d
    setDataState(d)
  }

  const loadPublic = useCallback(async () => {
    try {
      const info = await backend.publicInfo()
      const inventory = { ...dataRef.current.inventory }
      for (const [name, stock] of Object.entries(info.stock)) inventory[name] = { ...(inventory[name] ?? { min: 0 }), stock }
      replace({ ...dataRef.current, config: info.config, inventory })
    } catch {
      /* sin conexión: quedan los datos por defecto */
    }
  }, [])

  const loadAdmin = useCallback(async () => {
    try {
      let d = await backend.loadAdmin()
      // Primera vez en la base de datos: cargamos los pedidos de ejemplo
      if (backend.mode === 'cloud' && d.orders.length === 0) {
        const s = seed()
        await backend.replaceAll(s)
        d = s
      }
      replace(d)
      setAdminLoaded(true)
    } catch (e) {
      toast(`No se pudieron cargar los datos: ${(e as Error).message}`)
    }
  }, [])

  // Al abrir: ¿hay un administrador con sesión? Si no, solo datos públicos.
  useEffect(() => {
    backend.currentAdmin().then((email) => {
      adminRef.current = email
      setAdmin(email)
      setAuthChecked(true)
      if (email) loadAdmin()
      else loadPublic()
    })
  }, [loadAdmin, loadPublic])

  // Mantener el panel al día: en la demo local cuando cambia el navegador; en la nube cada 20 s y al volver a la pestaña
  useEffect(() => {
    const reload = () => (adminRef.current ? loadAdmin() : loadPublic())
    if (backend.mode === 'local') {
      window.addEventListener('pickup-local-change', reload)
      return () => window.removeEventListener('pickup-local-change', reload)
    }
    const t = window.setInterval(reload, 20_000)
    window.addEventListener('focus', reload)
    return () => {
      window.clearInterval(t)
      window.removeEventListener('focus', reload)
    }
  }, [loadAdmin, loadPublic])

  /** Cambia los datos en pantalla y los guarda en el servidor */
  const mutate = useCallback(
    (fn: (d: Data) => Data) => {
      const prev = dataRef.current
      const next = fn(prev)
      if (next === prev) return
      replace(next)
      backend.persist(prev, next).catch((e) => {
        toast(`No se pudo guardar: ${(e as Error).message}`)
        loadAdmin()
      })
    },
    [loadAdmin],
  )

  const signIn = useCallback(
    async (email: string, password: string) => {
      const err = await backend.signIn(email, password)
      if (err) return err
      const who = await backend.currentAdmin()
      adminRef.current = who
      setAdmin(who)
      await loadAdmin()
      return null
    },
    [loadAdmin],
  )
  const signOut = useCallback(async () => {
    await backend.signOut()
    adminRef.current = null
    setAdmin(null)
    setAdminLoaded(false)
    replace(EMPTY)
    loadPublic()
  }, [loadPublic])

  const createPurchase = useCallback(async (input: PurchaseInput) => {
    const r = await backend.createPurchase(input)
    if (r.ok && adminRef.current) loadAdmin()
    else loadPublic()
    return r
  }, [loadAdmin, loadPublic])
  const confirmPickup = useCallback(async (id: string, input: { email: string; optIn: boolean }) => {
    const r = await backend.confirmPickup(id, input)
    if (r.ok && adminRef.current) loadAdmin()
    return r
  }, [loadAdmin])

  const quote = useCallback((email: string, products: string[], exceptId?: string) => quoteBenefits(data.orders, data.config.benefits, email, products, exceptId), [data.orders, data.config.benefits])
  const allMessages = useCallback(() => data.orders.flatMap((o) => messagesFor(o, data.orders, data.config)).sort((a, b) => b.date.localeCompare(a.date)), [data.orders, data.config])

  const createManualOrder = useCallback(
    (input: { customer: string; number: string; channel: Channel; products: string[] }) => {
      const order: Order = { id: uid(), ...input, email: '', paid: false, benefits: [], discountPct: 0, optIn: false, status: 'sin_reserva', createdDate: todayKey(), createdAt: Date.now() }
      mutate((d) => ({ ...d, orders: [order, ...d.orders] }))
      return order
    },
    [mutate],
  )
  const confirmPayment = useCallback((id: string) => mutate((d) => ({ ...d, orders: d.orders.map((o) => (o.id === id ? { ...o, paid: true } : o)) })), [mutate])
  const setStatus = useCallback((id: string, status: Status) => mutate((d) => ({ ...d, orders: d.orders.map((o) => (o.id === id ? withStatus(o, status) : o)) })), [mutate])

  /** Martín carga el código y el pedido pasa solo al estado siguiente */
  const advanceByCode = useCallback(
    (raw: string): CodeResult => {
      const code = normCode(raw)
      if (code.length !== 4) return { ok: false, error: 'El código tiene 4 números.' }
      const order = dataRef.current.orders.find((o) => o.code === code)
      if (!order) return { ok: false, error: `No hay ningún pedido con el código ${code}.` }
      if (order.status === 'entregado') return { ok: false, order, error: `${order.number} ya se entregó${order.deliveredDate ? ` el ${longDate(order.deliveredDate)}` : ''}.` }
      if (!order.paid) return { ok: false, order, needsPayment: true, error: `${order.number} todavía no está pagado. Confirmá el pago antes de prepararlo.` }
      const to = NEXT_STATUS[order.status]
      if (!to) return { ok: false, order, error: `${order.number} está esperando que el cliente confirme su email.` }
      const updated = withStatus(order, to)
      mutate((d) => ({ ...d, orders: d.orders.map((o) => (o.id === order.id ? updated : o)) }))
      return { ok: true, order: updated, before: order, from: order.status, to }
    },
    [mutate],
  )
  const restoreOrder = useCallback((order: Order) => mutate((d) => ({ ...d, orders: d.orders.map((o) => (o.id === order.id ? order : o)) })), [mutate])

  const saveConfig = useCallback((config: Config) => mutate((d) => ({ ...d, config })), [mutate])
  const resetDemo = useCallback(async () => {
    const s = seed()
    try {
      await backend.replaceAll(s)
      replace(s)
    } catch (e) {
      toast(`No se pudo restablecer: ${(e as Error).message}`)
    }
  }, [])
  const byId = useCallback((id: string) => data.orders.find((o) => o.id === id), [data.orders])
  const findByNumber = useCallback(
    (number: string) => {
      const q = number.trim().toUpperCase().replace(/^#/, '')
      return data.orders.find((o) => o.number.toUpperCase().replace(/^#/, '') === q)
    },
    [data.orders],
  )

  const toDeliver = useCallback((name: string) => countUnits(data.orders.filter((o) => ['pendiente', 'preparacion', 'listo'].includes(o.status)), name), [data.orders])
  const lowStock = useCallback(() => CATALOG.map((p) => ({ name: p.name, item: data.inventory[p.name] })).filter((x) => x.item && x.item.stock <= x.item.min), [data.inventory])
  const syncTiendanube = useCallback(() => mutate((d) => ({ ...d, lastSync: Date.now() })), [mutate])
  const setMinStock = useCallback((name: string, min: number) => mutate((d) => ({ ...d, inventory: { ...d.inventory, [name]: { ...d.inventory[name], min: Math.max(0, min) } } })), [mutate])
  const addStock = useCallback((name: string, qty: number) => mutate((d) => ({ ...d, lastSync: Date.now(), inventory: { ...d.inventory, [name]: { ...d.inventory[name], stock: d.inventory[name].stock + qty } } })), [mutate])
  const refresh = useCallback(async () => (adminRef.current ? loadAdmin() : loadPublic()), [loadAdmin, loadPublic])

  const value = useMemo<Store>(
    () => ({
      ...data, mode: backend.mode, admin, authChecked, adminLoaded, signIn, signOut,
      fetchQuote: backend.quoteContext, createPurchase, confirmPickup, getOrder: backend.getOrder, findPending: backend.findPending,
      quote, allMessages, createManualOrder, confirmPayment, setStatus, advanceByCode, restoreOrder, saveConfig, resetDemo, byId, findByNumber,
      toDeliver, lowStock, syncTiendanube, setMinStock, addStock, refresh,
    }),
    [data, admin, authChecked, adminLoaded, signIn, signOut, createPurchase, confirmPickup, quote, allMessages, createManualOrder, confirmPayment, setStatus, advanceByCode, restoreOrder, saveConfig, resetDemo, byId, findByNumber, toDeliver, lowStock, syncTiendanube, setMinStock, addStock, refresh],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('StoreProvider faltante')
  return s
}

/** Beneficios para el checkout del cliente: pregunta al servidor cuántos retiros tiene ese email */
export function usePublicQuote(email: string, products: string[], exceptId?: string) {
  const { fetchQuote, config } = useStore()
  const [ctx, setCtx] = useState<QuoteContext>({ total: 0, done: 0, restock: false })
  const [loading, setLoading] = useState(false)
  const key = `${normEmail(email)}|${products.join(',')}|${exceptId ?? ''}`
  useEffect(() => {
    if (!validEmail(email)) {
      setCtx({ total: 0, done: 0, restock: false })
      return
    }
    let alive = true
    setLoading(true)
    const t = window.setTimeout(() => {
      fetchQuote(email, products, exceptId)
        .then((c) => alive && setCtx(c))
        .catch(() => undefined)
        .finally(() => alive && setLoading(false))
    }, 350)
    return () => {
      alive = false
      window.clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, fetchQuote])
  const quote = useMemo(() => quoteFromContext(config.benefits, ctx, email, products), [config.benefits, ctx, email, products])
  return { quote, loading }
}

/** Pedido para las páginas del cliente (confirmación y link de WhatsApp/Instagram) */
export function usePublicOrder(id?: string) {
  const { getOrder } = useStore()
  const [order, setOrder] = useState<Order | null | undefined>(undefined)
  const reload = useCallback(() => {
    if (!id) return setOrder(null)
    getOrder(id).then(setOrder).catch(() => setOrder(null))
  }, [id, getOrder])
  useEffect(reload, [reload])
  return { order, reload, setOrder }
}
