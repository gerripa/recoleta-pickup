import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  CATALOG, DEFAULT_CONFIG, STORAGE_KEY, contextFrom, makeCode, quoteBenefits, seed, validEmail,
  type Config, type Data, type Order, type QuoteContext, type StockItem,
} from './store'
import { todayKey } from './dates'

/**
 * Dónde se guardan los datos.
 * - "cloud": base de datos real en Supabase (si están las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY).
 * - "local": demo guardada en este navegador (sin servidor), por ejemplo en Bolt.
 */

export type Result = { ok: true; order: Order } | { ok: false; error: string }
export interface PublicInfo { config: Config; stock: Record<string, number> }
export interface PurchaseInput { customer: string; email: string; products: string[]; optIn: boolean }

export interface Backend {
  mode: 'local' | 'cloud'
  // Lo que usa el cliente, sin login
  publicInfo(): Promise<PublicInfo>
  quoteContext(email: string, products: string[], exceptId?: string): Promise<QuoteContext>
  createPurchase(input: PurchaseInput): Promise<Result>
  confirmPickup(id: string, input: { email: string; optIn: boolean }): Promise<Result>
  getOrder(id: string): Promise<Order | null>
  findPending(number: string): Promise<string | null>
  // Panel del administrador
  currentAdmin(): Promise<string | null>
  signIn(email: string, password: string): Promise<string | null>
  signOut(): Promise<void>
  loadAdmin(): Promise<Data>
  persist(prev: Data, next: Data): Promise<void>
  replaceAll(data: Data): Promise<void>
}

// =====================================================================
// Demo local (navegador)
// =====================================================================

const countIn = (products: string[], name: string) => products.filter((p) => p === name).length

function readLocal(): Data {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const d = JSON.parse(raw) as Data
      if (d.inventory && d.config?.store?.closedDates) return d
    }
  } catch {
    /* sin almacenamiento */
  }
  const d = seed()
  writeLocal(d)
  return d
}
function writeLocal(d: Data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d))
  } catch {
    /* ignorar */
  }
  window.dispatchEvent(new Event('pickup-local-change'))
}
const stockError = (d: Data, products: string[]) => {
  const missing = [...new Set(products)].find((p) => (d.inventory[p]?.stock ?? 0) < countIn(products, p))
  return missing ? `No hay stock de ${missing} en Tiendanube.` : ''
}
const takeStock = (inv: Data['inventory'], products: string[]) => {
  const next = { ...inv }
  for (const p of products) if (next[p]) next[p] = { ...next[p], stock: Math.max(0, next[p].stock - 1) }
  return next
}

export const localBackend: Backend = {
  mode: 'local',
  async publicInfo() {
    const d = readLocal()
    return { config: d.config, stock: Object.fromEntries(Object.entries(d.inventory).map(([k, v]) => [k, v.stock])) }
  },
  async quoteContext(email, products, exceptId) {
    return contextFrom(readLocal().orders, email, products, exceptId)
  },
  async createPurchase(input) {
    const d = readLocal()
    if (!validEmail(input.email)) return { ok: false, error: 'Ingresá un email válido para tu retiro.' }
    const err = stockError(d, input.products)
    if (err) return { ok: false, error: err }
    const q = quoteBenefits(d.orders, d.config.benefits, input.email, input.products)
    const order: Order = {
      id: Math.random().toString(36).slice(2, 10), number: `#${d.nextTn}`, customer: input.customer, email: input.email.trim(), channel: 'Tiendanube',
      products: input.products, paid: true, benefits: q.benefits, discountPct: q.pct, optIn: input.optIn, status: 'pendiente',
      code: makeCode(d.orders.map((o) => o.code)), createdDate: todayKey(), createdAt: Date.now(),
    }
    writeLocal({ ...d, orders: [order, ...d.orders], nextTn: d.nextTn + 1, inventory: takeStock(d.inventory, input.products) })
    return { ok: true, order }
  },
  async confirmPickup(id, { email, optIn }) {
    const d = readLocal()
    const order = d.orders.find((o) => o.id === id)
    if (!order) return { ok: false, error: 'No encontramos el pedido.' }
    if (order.status !== 'sin_reserva') return { ok: false, error: 'Este pedido ya fue confirmado.' }
    if (!validEmail(email)) return { ok: false, error: 'Ingresá un email válido para tu retiro.' }
    const err = stockError(d, order.products)
    if (err) return { ok: false, error: `${err} Escribinos por WhatsApp y lo resolvemos.` }
    const q = quoteBenefits(d.orders, d.config.benefits, email, order.products, id)
    const updated: Order = { ...order, email: email.trim(), optIn, benefits: q.benefits, discountPct: q.pct, code: makeCode(d.orders.map((o) => o.code)), status: 'pendiente' }
    writeLocal({ ...d, orders: d.orders.map((o) => (o.id === id ? updated : o)), inventory: takeStock(d.inventory, order.products) })
    return { ok: true, order: updated }
  },
  async getOrder(id) {
    return readLocal().orders.find((o) => o.id === id) ?? null
  },
  async findPending(number) {
    const q = number.trim().toUpperCase().replace(/^#/, '')
    return readLocal().orders.find((o) => o.status === 'sin_reserva' && o.number.toUpperCase().replace(/^#/, '') === q)?.id ?? null
  },
  async currentAdmin() {
    return 'demo'
  },
  async signIn() {
    return null
  },
  async signOut() {},
  async loadAdmin() {
    return readLocal()
  },
  async persist(_prev, next) {
    writeLocal(next)
  },
  async replaceAll(data) {
    writeLocal(data)
  },
}

// =====================================================================
// Base de datos real (Supabase)
// =====================================================================

interface OrderRow {
  id: string; number: string; customer: string; email: string; channel: Order['channel']; products: string[]; paid: boolean
  benefits: Order['benefits']; discount_pct: number; opt_in: boolean; status: Order['status']; code: string | null
  created_date: string; ready_date: string | null; delivered_date: string | null; created_at: number
}
const toRow = (o: Order): OrderRow => ({
  id: o.id, number: o.number, customer: o.customer, email: o.email, channel: o.channel, products: o.products, paid: o.paid,
  benefits: o.benefits, discount_pct: o.discountPct, opt_in: o.optIn, status: o.status, code: o.code ?? null,
  created_date: o.createdDate, ready_date: o.readyDate ?? null, delivered_date: o.deliveredDate ?? null, created_at: o.createdAt,
})
/** Las fechas llegan como texto "2026-11-12"; por las dudas, también aceptamos Date */
const day = (v: unknown): string | undefined => (v == null ? undefined : v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10))
const fromRow = (r: OrderRow): Order => ({
  id: r.id, number: r.number, customer: r.customer, email: r.email ?? '', channel: r.channel, products: r.products ?? [], paid: r.paid,
  benefits: r.benefits ?? [], discountPct: r.discount_pct ?? 0, optIn: r.opt_in, status: r.status, code: r.code ?? undefined,
  createdDate: day(r.created_date)!, readyDate: day(r.ready_date), deliveredDate: day(r.delivered_date), createdAt: Number(r.created_at),
})
/** La función devuelve el pedido con los nombres de la app (camelCase) y fechas como texto */
const fromJson = (j: Record<string, unknown>): Order => {
  const o = j as unknown as Order & { code: string | null; readyDate: string | null; deliveredDate: string | null }
  return { ...o, code: o.code ?? undefined, createdDate: day(o.createdDate)!, readyDate: day(o.readyDate), deliveredDate: day(o.deliveredDate), createdAt: Number(o.createdAt) }
}

const friendly = (msg: string) => {
  if (/fetch|network/i.test(msg)) return 'No hay conexión con el servidor. Probá de nuevo en un momento.'
  if (/duplicate key.*number/i.test(msg)) return 'Ya existe un pedido con ese número.'
  return msg
}

export function cloudBackend(sb: SupabaseClient): Backend {
  const rpc = async <T,>(fn: string, args: Record<string, unknown>): Promise<T> => {
    const { data, error } = await sb.rpc(fn, args)
    if (error) throw new Error(friendly(error.message))
    return data as T
  }
  const asResult = (r: { ok: boolean; order?: Record<string, unknown>; error?: string }): Result => (r.ok && r.order ? { ok: true, order: fromJson(r.order) } : { ok: false, error: r.error ?? 'No se pudo guardar.' })

  return {
    mode: 'cloud',
    async publicInfo() {
      const r = await rpc<{ config: Config | null; stock: Record<string, number> }>('public_info', {})
      return { config: r?.config ?? DEFAULT_CONFIG, stock: r?.stock ?? {} }
    },
    async quoteContext(email, products, exceptId) {
      if (!validEmail(email)) return { total: 0, done: 0, restock: false }
      return rpc<QuoteContext>('quote_context', { p_email: email, p_products: products, p_except: exceptId ?? null })
    },
    async createPurchase(input) {
      try {
        return asResult(await rpc('create_purchase', { p_customer: input.customer, p_email: input.email, p_products: input.products, p_opt_in: input.optIn }))
      } catch (e) {
        return { ok: false, error: (e as Error).message }
      }
    },
    async confirmPickup(id, input) {
      try {
        return asResult(await rpc('confirm_pickup', { p_id: id, p_email: input.email, p_opt_in: input.optIn }))
      } catch (e) {
        return { ok: false, error: (e as Error).message }
      }
    },
    async getOrder(id) {
      const r = await rpc<Record<string, unknown> | null>('public_order', { p_id: id })
      return r ? fromJson(r) : null
    },
    async findPending(number) {
      return rpc<string | null>('find_pending_order', { p_number: number })
    },
    async currentAdmin() {
      const { data } = await sb.auth.getSession()
      const email = data.session?.user.email
      if (!email) return null
      const ok = await rpc<boolean>('is_admin', {}).catch(() => false)
      return ok ? email : null
    },
    async signIn(email, password) {
      const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password })
      if (error) return /invalid/i.test(error.message) ? 'Mail o contraseña incorrectos.' : friendly(error.message)
      const ok = await rpc<boolean>('is_admin', {}).catch(() => false)
      if (!ok) {
        await sb.auth.signOut()
        return 'Este mail no tiene permiso para entrar al panel.'
      }
      return null
    },
    async signOut() {
      await sb.auth.signOut()
    },
    async loadAdmin() {
      const [o, p, s] = await Promise.all([
        sb.from('orders').select('*').order('created_at', { ascending: false }),
        sb.from('products').select('*'),
        sb.from('settings').select('*').eq('id', 1).maybeSingle(),
      ])
      const err = o.error ?? p.error ?? s.error
      if (err) throw new Error(friendly(err.message))
      const inventory: Record<string, StockItem> = {}
      for (const r of p.data ?? []) inventory[r.name] = { stock: r.stock, min: r.min }
      for (const c of CATALOG) inventory[c.name] ??= { stock: 0, min: 0 }
      return {
        orders: (o.data as OrderRow[]).map(fromRow),
        inventory,
        config: (s.data?.config as Config) ?? DEFAULT_CONFIG,
        nextTn: s.data?.next_tn ?? 1061,
        lastSync: Number(s.data?.last_sync ?? 0),
      }
    },
    async persist(prev, next) {
      const prevById = new Map(prev.orders.map((o) => [o.id, o]))
      const changed = next.orders.filter((o) => prevById.get(o.id) !== o)
      const tasks: PromiseLike<{ error: { message: string } | null }>[] = []
      if (changed.length) tasks.push(sb.from('orders').upsert(changed.map(toRow)))
      const inv = CATALOG.filter((c) => prev.inventory[c.name] !== next.inventory[c.name])
      if (inv.length) tasks.push(sb.from('products').upsert(inv.map((c) => ({ name: c.name, sku: c.sku, price: c.price, stock: next.inventory[c.name].stock, min: next.inventory[c.name].min }))))
      if (prev.config !== next.config || prev.lastSync !== next.lastSync) tasks.push(sb.from('settings').update({ config: next.config, last_sync: next.lastSync }).eq('id', 1))
      const res = await Promise.all(tasks)
      const err = res.find((r) => r.error)?.error
      if (err) throw new Error(friendly(err.message))
    },
    async replaceAll(data) {
      const del = await sb.from('orders').delete().neq('id', '')
      if (del.error) throw new Error(friendly(del.error.message))
      const res = await Promise.all([
        sb.from('orders').insert(data.orders.map(toRow)),
        sb.from('products').upsert(CATALOG.map((c) => ({ name: c.name, sku: c.sku, price: c.price, stock: data.inventory[c.name].stock, min: data.inventory[c.name].min }))),
        sb.from('settings').upsert({ id: 1, config: data.config, next_tn: data.nextTn, last_sync: data.lastSync }),
      ])
      const err = res.find((r) => r.error)?.error
      if (err) throw new Error(friendly(err.message))
    },
  }
}

const SB_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const backend: Backend = SB_URL && KEY ? cloudBackend(createClient(SB_URL, KEY)) : localBackend
export const isCloud = backend.mode === 'cloud'
