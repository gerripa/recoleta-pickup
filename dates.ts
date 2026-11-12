// Utilidades de fechas en hora local (formato YYYY-MM-DD)

export const pad = (n: number) => String(n).padStart(2, '0')

export const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const fromKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const todayKey = () => toKey(new Date())

export const addDays = (d: Date, n: number) => {
  const c = new Date(d)
  c.setDate(c.getDate() + n)
  return c
}

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** "jueves 31 de octubre" */
export const longDate = (key: string) => {
  const d = fromKey(key)
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`
}

/** "Jue 31/10" */
export const shortDate = (key: string) => {
  const d = fromKey(key)
  return `${DIAS_CORTOS[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`
}

export const dayShort = (key: string) => DIAS_CORTOS[fromKey(key).getDay()]

/** Próximos N días hábiles (según los días habilitados), empezando hoy */
export const nextOpenDays = (n: number, openDays: number[], from = new Date()) => {
  const out: string[] = []
  let d = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  let guard = 0
  while (out.length < n && guard < 60) {
    if (openDays.includes(d.getDay())) out.push(toKey(d))
    d = addDays(d, 1)
    guard++
  }
  return out
}

export const hourLabel = (h: number) => `${pad(h)}:00`

/** Franja horaria "11:00 – 12:00" */
export const slotRange = (time: string) => {
  const h = Number(time.slice(0, 2))
  return `${time} – ${hourLabel(h + 1)}`
}
