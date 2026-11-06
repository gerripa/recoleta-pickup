import { SearchX } from 'lucide-react'
import { navigate } from '../router'
import { Button } from '../components/ui'

export default function NotFound({ text = 'No encontramos ese pedido.' }: { text?: string }) {
  return (
    <div className="fade-in mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-ink-100 text-ink-500"><SearchX className="h-6 w-6" /></span>
      <h1 className="mt-4 text-xl font-bold">{text}</h1>
      <p className="mt-1 text-sm text-ink-500">Puede que el enlace sea de otro navegador: la demo guarda los datos solo en este equipo.</p>
      <Button className="mt-6" onClick={() => navigate('/reservar')}>Buscar mi pedido</Button>
    </div>
  )
}
