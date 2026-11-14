export type Format = 'sprint' | 'team' | 'taster'
export type Where = 'onsite' | 'online' | 'both'

export interface ChallengeCard {
  id: string
  company: string
  companyBlurb: string
  sector: string
  size: string
  format: Format
  where: Where
  title: string
  problem: string
  atTheTable: string
  goodLooksLike: string[]
  skills: string[]
  mustHaves: string[]
  languages: string[]
  host: string
  whatYouGet: string
  followUp: string
  debriefQuestions: string[]
  // Team sprints: one part per teammate + what the team hands over together
  parts?: string[]
  teamResult?: string
  seatsPerRound: number
  rounds: number
  status: 'approved' | 'draft' | 'missing'
  daysBeforeEvent: number | null
}

export interface Talent {
  code: string
  choices: string[]
  languages: string[]
  checks: string[]
}

export interface Strength {
  plain: string
  esco_label: string
  evidence_quote: string
}

export interface TranslateResult {
  strengths: Strength[]
  reflection_questions: string[]
  mode: 'live' | 'demo'
}

export interface IntakeTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface IntakeResult {
  reply: string
  card: Omit<ChallengeCard, 'id' | 'company' | 'companyBlurb' | 'sector' | 'size' | 'status' | 'daysBeforeEvent' | 'seatsPerRound' | 'rounds' | 'followUp' | 'where'> | null
  mode: 'live' | 'demo'
}

export interface Recap {
  common_ground: string[]
  company_heard: string
  talent_heard: string
  open_questions: string[]
  suggested_next_step: string
  mode: 'live' | 'demo'
}
