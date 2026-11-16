import { useState, type FormEvent } from 'react'
import { Button } from '../components/Button'
import { Panel } from '../components/Panel'
import { Screen } from '../components/Screen'
import { TextField } from '../components/TextField'
import { navigate } from '../hooks/useHashRoute'
import { useToast } from '../hooks/useToast'
import { NAME_MAX } from '../lib/model'
import { RoomError, createRoom } from '../lib/rooms'

export default function CreateRoom() {
  const toast = useToast()
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setNameError(null)
    try {
      const res = await createRoom(name)
      navigate(res.code)
    } catch (err) {
      if (err instanceof RoomError && err.code === 'NAME_INVALID') setNameError(err.message)
      else if (err instanceof RoomError) toast.show(err.message, 'error')
      else toast.show('Could not create a room. Check your connection.', 'error')
      setBusy(false)
    }
  }

  return (
    <Screen className="justify-center">
      <h1 className="font-display text-2xl font-black tracking-wide uppercase">Create a room</h1>
      <Panel>
        <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
          <TextField
            label="Your name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setNameError(null)
            }}
            placeholder="What should everyone call you?"
            autoComplete="nickname"
            autoFocus
            maxLength={NAME_MAX + 4}
            error={nameError}
            hint={`Up to ${NAME_MAX} characters. You'll be the host.`}
            enterKeyHint="go"
          />
          <Button type="submit" fullWidth disabled={busy || name.trim().length === 0}>
            {busy ? 'Creating...' : 'Create Room'}
          </Button>
        </form>
      </Panel>
      <Button variant="ghost" onClick={() => navigate('')} className="self-center">
        Back
      </Button>
    </Screen>
  )
}
