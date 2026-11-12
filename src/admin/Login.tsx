import { useState } from 'react'
import { Lock, ArrowLeft } from 'lucide-react'
import { useStore } from '../store'
import { navigate } from '../router'
import { Button, Card, Logo } from '../components/ui'

/** Solo Martín (los mails cargados como administradores) entra al panel */
export default function Login() {
  const { signIn } = useStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const field = 'mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100'

  const submit = async () => {
    setError('')
    if (!email.trim() || !password) return setError('Completá tu mail y tu contraseña.')
    setBusy(true)
    const err = await signIn(email, password)
    setBusy(false)
    if (err) setError(err)
  }

  return (
    <div className="grid min-h-screen place-items-center bg-brand-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center"><Logo light /></div>
        <Card className="p-6">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700"><Lock className="h-5 w-5" /></span>
          <h1 className="mt-4 text-xl font-bold">Panel del administrador</h1>
          <p className="mt-1 text-sm text-ink-500">Entrá con el mail y la contraseña del local.</p>
          <form className="mt-5 space-y-4" onSubmit={(e) => { e.preventDefault(); submit() }}>
            <label className="block"><span className="text-sm font-semibold text-ink-700">Mail</span><input type="email" autoComplete="username" className={field} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <label className="block"><span className="text-sm font-semibold text-ink-700">Contraseña</span><input type="password" autoComplete="current-password" className={field} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
            {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
            <Button type="submit" className="w-full py-3" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</Button>
          </form>
        </Card>
        <button onClick={() => navigate('/')} className="mx-auto mt-5 flex items-center gap-1.5 text-sm text-brand-200 hover:text-white"><ArrowLeft className="h-4 w-4" /> Volver a la vista del cliente</button>
      </div>
    </div>
  )
}
