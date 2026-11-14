// Which of a table's skills the person's OWN kept skills touch. A transparent word
// match shown only to the job seeker to help them choose; nobody is scored or ranked.
import type { ChallengeCard, Strength } from './types'

// Words that mean the same kind of work.
const GROUPS = [
  ['data', 'analys', 'statist', 'predict', 'excel', 'spreadsheet', 'machine', 'ml'],
  ['python', 'program', 'code', 'coding', 'script', 'develop', 'engineer', 'c++', 'c#', 'java', 'typescript', 'rust', 'golang', 'continuous', 'automat', 'build'],
  ['customer', 'client', 'communicat', 'explain', 'sales', 'market'],
  ['user', 'design', 'research', 'interface', 'sketch'],
  ['team', 'lead', 'manage', 'coordinat'],
  ['logist', 'route', 'plann', 'deliver', 'schedul'],
  ['secur', 'safety', 'guard', 'stress'],
  ['clean', 'hygien'],
  ['continuous', 'pipeline', 'automat', 'devops', 'build', 'test'],
  ['troubleshoot', 'fault', 'failure', 'diagnos', 'root', 'outage', 'repair'],
  ['finance', 'report', 'account', 'budget'],
  ['website', 'web', 'frontend'],
]

// Keeps C++ / C# as words; plain words need 2+ letters.
const words = (s: string) => s.toLowerCase().match(/\p{L}[+#]+|\p{L}{2,}/gu) ?? []
const touches = (text: string[], term: string) => text.some((w) => w.startsWith(term))

export function fitSkills(card: ChallengeCard, kept: Strength[]): string[] {
  const mine = words(kept.map((k) => `${k.plain} ${k.esco_label} ${k.evidence_quote}`).join(' '))
  if (!mine.length) return []
  return card.skills.filter((skill) => {
    const sw = words(skill)
    return GROUPS.some((g) => g.some((t) => touches(sw, t)) && g.some((t) => touches(mine, t)))
  })
}
