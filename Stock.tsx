import { Package, RefreshCw, TriangleAlert, Plus } from 'lucide-react'
import { useStore, CATALOG, money } from '../store'
import { Button, Card, Stat, cx, toast } from '../components/ui'
import { PageTitle } from './AdminLayout'

export const agoText = (ts: number) => {
  const min = Math.round((Date.now() - ts) / 60_000)
  return min < 1 ? 'recién' : min < 60 ? `hace ${min} min` : `hace ${Math.round(min / 60)} h`
}

/** Precios y stock vienen de Tiendanube. Martín solo elige desde qué cantidad quiere que le avisemos. */
export default function Stock() {
  const { inventory, lastSync, syncTiendanube, setMinStock, addStock, toDeliver, lowStock } = useStore()
  const low = lowStock()
  const units = CATALOG.reduce((s, p) => s + (inventory[p.name]?.stock ?? 0), 0)
  const reserved = CATALOG.reduce((s, p) => s + toDeliver(p.name), 0)

  return (
    <>
      <PageTitle
        title="Productos y stock"
        subtitle="Precios y stock se leen de Tiendanube: no se cargan dos veces. Vos elegís desde cuántas unidades te avisamos."
        action={<Button onClick={() => { syncTiendanube(); toast('Precios y stock actualizados desde Tiendanube') }}><RefreshCw className="h-4 w-4" /> <span className="whitespace-nowrap">Sincronizar con Tiendanube</span></Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Productos con stock bajo" value={low.length} hint="Llegaron al mínimo" icon={TriangleAlert} accent={low.length > 0} />
        <Stat label="Unidades en stock" value={units} hint="Según Tiendanube" icon={Package} />
        <Stat label="Vendidas para retirar" value={reserved} hint="Separalas: ya están pagas o confirmadas" icon={Package} />
        <Stat label="Última sincronización" value={agoText(lastSync)} hint="Se actualiza sola con cada venta" icon={RefreshCw} />
      </div>

      <Card className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-500">
            <tr>{['Producto', 'Precio en Tiendanube', 'Stock', 'Para retirar en el local', 'Avisarme con', ''].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {CATALOG.map((p) => {
              const it = inventory[p.name]
              const isLow = it.stock <= it.min
              return (
                <tr key={p.name} className={cx(isLow && 'bg-amber-50/60')}>
                  <td className="px-4 py-3.5"><div className="font-semibold">{p.name}</div><div className="font-mono text-[11px] text-ink-400">{p.sku}</div></td>
                  <td className="px-4 py-3.5">{money(p.price)}</td>
                  <td className="px-4 py-3.5">
                    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold', it.stock === 0 ? 'bg-red-100 text-red-800' : isLow ? 'bg-amber-100 text-amber-900' : 'bg-brand-50 text-brand-800')}>
                      {isLow && <TriangleAlert className="h-3 w-3" />}{it.stock === 0 ? 'Sin stock' : `${it.stock} u.`}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-ink-600">{toDeliver(p.name) || '—'}</td>
                  <td className="px-4 py-3.5">
                    <label className="flex items-center gap-2 text-ink-500"><input type="number" min={0} aria-label={`Mínimo de ${p.name}`} value={it.min} onChange={(e) => setMinStock(p.name, Number(e.target.value) || 0)} className="w-16 rounded-lg border border-ink-200 px-2 py-1.5 text-sm text-ink-900 outline-none focus:border-brand-600" /> u.</label>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button onClick={() => { addStock(p.name, 10); toast(`Entraron 10 unidades de ${p.name} (simulado)`) }} className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-brand-700 hover:text-brand-900"><Plus className="h-3.5 w-3.5" /> Simular reposición</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
      <p className="mt-4 text-xs text-ink-400">En la versión real, el stock baja solo con cada venta de Tiendanube y la reposición se carga en Tiendanube como siempre. El botón "Simular reposición" es solo para la demo.</p>
    </>
  )
}
