import { useState, type FormEvent } from 'react'
import { Button } from '../components/Button'
import { Panel } from '../components/Panel'
import { Screen } from '../components/Screen'
import { TextField } from '../components/TextField'
import { navigate } from '../hooks/useHashRoute'
import { useToast } from '../hooks/useToast'
import { NAME_MAX } from '../lib/model'
import { RoomError, joinRoom, type RoomErrorCode } from '../lib/rooms'
import { CODE_LENGTH, normalizeCode } from '../lib/roomCode'

const CODE_ERRORS: RoomErrorCode[] = ['INVALID_CODE', 'ROOM_NOT_FOUND']
const NAME_ERRORS: RoomErrorCode[] = ['NAME_TAKEN', 'NAME_INVALID']

export interface JoinRoomProps {
  /** Pre-filled from a shared link (#/ABCD). */
  initialCode?: string
}

export default function JoinRoom({ initialCode = '' }: JoinRoomProps) {
  const toast = useToast()
  const [code, setCode] = useState(initialCode)
  const [name, setName] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setCodeError(null)
    setNameError(null)
    try {
      const res = await joinRoom(code, name)
      if (res.rejoined) toast.show(`Welcome back! You're still #${res.joinNumber}.`, 'info')
      navigate(res.code)
    } catch (err) {
      if (err instanceof RoomError && CODE_ERRORS.includes(err.code)) setCodeError(err.message)
      else if (err instanceof RoomError && NAME_ERRORS.includes(err.code)) setNameError(err.message)
      else if (err instanceof RoomError) toast.show(err.message, 'error')
      else toast.show('Could not join. Check your connection.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen className="justify-center">
      <h1 className="font-display text-2xl font-black tracking-wide uppercase">Join a room</h1>
      <Panel>
        <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
          <TextField
            label="Room code"
            code
            value={code}
            onChange={(e) => {
              setCode(normalizeCode(e.target.value).slice(0, CODE_LENGTH))
              setCodeError(null)
            }}
            placeholder="ABCD"
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            autoFocus={!initialCode}
            error={codeError}
          />
          <TextField
            label="Your name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setNameError(null)
            }}
            placeholder="What should everyone call you?"
            autoComplete="nickname"
            autoFocus={Boolean(initialCode)}
            maxLength={NAME_MAX + 4}
            error={nameError}
            hint={`Up to ${NAME_MAX} characters, different from everyone else's.`}
            enterKeyHint="go"
          />
          <Button
            type="submit"
            fullWidth
            disabled={busy || code.length === 0 || name.trim().length === 0}
          >
            {busy ? 'Joining...' : 'Join Room'}
          </Button>
        </form>
      </Panel>
      <Button variant="ghost" onClick={() => navigate('')} className="self-center">
        Back
      </Button>
    </Screen>
  )
}
