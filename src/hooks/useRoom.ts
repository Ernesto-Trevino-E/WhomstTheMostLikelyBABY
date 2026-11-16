// Live room listeners, one per subtree so screens only re-render on what they use.
import { useMemo } from 'react'
import { paths, type Player, type Round, type RoomMeta, type RoomSettings } from '../lib/model'
import { tally } from '../lib/votes'
import { useDbValue } from './useDbValue'

export const useRoomMeta = (code: string | null) =>
  useDbValue<RoomMeta>(code ? paths.meta(code) : null)

export const useRoomSettings = (code: string | null) =>
  useDbValue<RoomSettings>(code ? paths.settings(code) : null)

export const usePlayers = (code: string | null) =>
  useDbValue<Record<string, Player>>(code ? paths.players(code) : null)

export const useScores = (code: string | null) =>
  useDbValue<Record<string, number>>(code ? paths.scores(code) : null)

export const useRound = (code: string | null) =>
  useDbValue<Round>(code ? paths.round(code) : null)

/** Vote counts per target and who has voted (never who voted for whom). */
export function useVotes(code: string | null, round: number | null) {
  const on = code !== null && round !== null
  const ballots = useDbValue<Record<string, string>>(on ? paths.ballots(code, round) : null)
  const voted = useDbValue<Record<string, true>>(on ? paths.voted(code, round) : null)
  const counts = useMemo(() => tally(ballots.data), [ballots.data])
  const votedUids = useMemo(() => Object.keys(voted.data ?? {}), [voted.data])
  return {
    counts,
    votedUids,
    total: Object.keys(ballots.data ?? {}).length,
    loading: ballots.loading || voted.loading,
    error: ballots.error ?? voted.error,
  }
}
