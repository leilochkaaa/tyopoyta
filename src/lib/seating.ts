// Seat allocation. Deliberately blind: it only sees WHAT people chose and a
// public lottery number — never who they are (no CV, name, nationality, age).
import type { ChallengeCard, Talent } from './types'

export interface Seat {
  talent: string
  table: string
  round: number
  choiceRank: number
}

export interface SeatingResult {
  seats: Seat[]
  firstChoiceRate: number
  everyoneSeated: number
  unseated: string[]
  overflow: Record<string, number>
}

export function allocate(cards: ChallengeCard[], talents: Talent[], lotterySeed = 7): SeatingResult {
  const open = cards.filter((c) => c.status === 'approved')
  const rounds = Math.max(...open.map((c) => c.rounds))
  const free: Record<string, number[]> = Object.fromEntries(open.map((c) => [c.id, Array(c.rounds).fill(c.seatsPerRound)]))
  const busy: Record<string, Set<number>> = Object.fromEntries(talents.map((t) => [t.code, new Set<number>()]))
  const overflow: Record<string, number> = {}

  // Public lottery order, re-drawn per choice level so nobody is always last.
  let s = lotterySeed
  const shuffled = () => {
    const a = [...talents]
    for (let i = a.length - 1; i > 0; i--) {
      // mulberry32: exact 32-bit integer steps, so every seat order is equally likely
      s = (s + 0x6d2b79f5) | 0
      let t = Math.imul(s ^ (s >>> 15), 1 | s)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      const j = ((t ^ (t >>> 14)) >>> 0) % (i + 1)
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  const seats: Seat[] = []
  // Everyone's 1st choice is served before anyone's 2nd choice.
  for (let rank = 0; rank < 3; rank++) {
    for (const t of shuffled()) {
      const table = t.choices[rank]
      if (!table || !free[table]) continue
      let placed = false
      for (let r = 0; r < rounds; r++) {
        if (free[table][r] > 0 && !busy[t.code].has(r)) {
          free[table][r]--
          busy[t.code].add(r)
          seats.push({ talent: t.code, table, round: r, choiceRank: rank + 1 })
          placed = true
          break
        }
      }
      if (!placed) overflow[table] = (overflow[table] ?? 0) + 1
    }
  }

  const firsts = talents.filter((t) => seats.some((x) => x.talent === t.code && x.choiceRank === 1)).length
  const seated = new Set(seats.map((x) => x.talent))
  return {
    seats,
    firstChoiceRate: firsts / talents.length,
    everyoneSeated: seated.size / talents.length,
    unseated: talents.filter((t) => !seated.has(t.code)).map((t) => t.code),
    overflow,
  }
}

// Fairness audit: re-run the lottery many times and compare outcomes between
// self-declared language groups. Aggregates only.
export function fairnessAudit(cards: ChallengeCard[], talents: Talent[], runs = 500) {
  const finnish = (t: Talent) => t.languages.some((l) => l.startsWith('Finnish'))
  const groups = { 'Speaks Finnish': talents.filter(finnish), 'No Finnish yet': talents.filter((t) => !finnish(t)) }
  const hits: Record<string, number> = { 'Speaks Finnish': 0, 'No Finnish yet': 0 }
  for (let i = 0; i < runs; i++) {
    const firsts = new Set(allocate(cards, talents, i * 7919 + 1).seats.filter((s) => s.choiceRank === 1).map((s) => s.talent))
    for (const [g, ts] of Object.entries(groups)) hits[g] += ts.filter((t) => firsts.has(t.code)).length / ts.length
  }
  return Object.entries(groups).map(([group, ts]) => ({ group, n: ts.length, firstChoiceRate: hits[group] / runs }))
}
