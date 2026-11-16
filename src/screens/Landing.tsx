import { Button } from '../components/Button'
import { Screen } from '../components/Screen'
import { Sparkle } from '../components/Sparkle'
import { navigate } from '../hooks/useHashRoute'

export default function Landing() {
  return (
    <Screen className="justify-center gap-10 text-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="relative font-display text-4xl leading-tight font-black tracking-wide uppercase sm:text-5xl">
          Whomst the most?
          <Sparkle size={22} color="var(--color-orange)" className="absolute -top-3 -right-2" />
        </h1>
        <p className="text-base text-cream/60">
          Who's most likely to... Vote on your friends, crown the winner.
        </p>
      </div>
      <div className="flex w-full flex-col gap-3">
        <Button fullWidth onClick={() => navigate('create')}>
          Create Room
        </Button>
        <Button variant="secondary" fullWidth onClick={() => navigate('join')}>
          Join Room
        </Button>
      </div>
      <p className="text-sm text-cream/40">4 or more players, one phone each.</p>
    </Screen>
  )
}
