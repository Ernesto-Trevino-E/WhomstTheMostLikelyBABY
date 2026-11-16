// Anonymous ballots: one atomic multi-path write stores an unlinked ballot plus my
// "voted" flag. The database never records who voted for whom (rules enforce one flag each).
import { push, update } from 'firebase/database'
import { dbRef, paths, roundKey } from './model'

export async function castVote(
  code: string,
  round: number,
  voterUid: string,
  targetUid: string,
): Promise<void> {
  const ballotId = push(dbRef(paths.ballots(code, round))).key
  if (!ballotId) throw new Error('Could not create a ballot id')
  await update(dbRef(paths.room(code)), {
    [`ballots/${roundKey(round)}/${ballotId}`]: targetUid,
    [`voted/${roundKey(round)}/${voterUid}`]: true,
  })
}

/** Votes per target uid. */
export function tally(ballots: Record<string, string> | null | undefined): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const target of Object.values(ballots ?? {})) counts[target] = (counts[target] ?? 0) + 1
  return counts
}
