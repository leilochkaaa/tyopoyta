// All data below is synthetic. Company names are fictional.
import type { ChallengeCard, Talent } from './types'

export const EVENT = {
  name: 'Espoo TalentMatch — Live Sprints',
  date: 'Thu 4 Dec 2026',
  place: 'Sello Library, Espoo',
  online: 'Online rounds by video',
  rounds: ['13:00', '13:30', '14:00'],
  sprintMinutes: 20,
}

// Team sprint: one host, three teams of four. Structured so the loudest voice doesn't win.
export const TEAM_PLAN = [
  { min: 3, what: 'Everyone writes their own idea, in silence' },
  { min: 12, what: 'Each person explains one part, the team picks a plan' },
  { min: 5, what: 'Every teammate presents one part to the host' },
]

export const CARDS: ChallengeCard[] = [
  {
    id: 'kvanttia',
    company: 'Kvanttia Oy',
    companyBlurb: 'Quantum-software startup in Otaniemi',
    sector: 'Deep tech',
    size: '24 people',
    format: 'sprint',
    where: 'both',
    title: 'Our test pipeline takes 3 hours. Help us cut it.',
    problem:
      'Every pull request waits ~3 h for CI. Developers batch changes and bugs slip through. We have never had a dedicated DevOps person.',
    atTheTable:
      'You get a printed diagram of our pipeline and real timing data. With our lead engineer, sketch where the time goes and what you would try first.',
    goodLooksLike: ['Asks which steps actually block a merge', 'Prioritises by impact, not by what is trendy', 'Explains trade-offs out loud'],
    skills: ['continuous integration', 'build automation', 'Python', 'analyse performance data'],
    mustHaves: ['Can work on-site in Espoo 2 days/week'],
    languages: ['English'],
    host: 'Lead engineer',
    whatYouGet: 'A look inside a real quantum-software codebase.',
    followUp: '45-min follow-up within 7 days if it’s mutual',
    debriefQuestions: ['Which step would you change first, and why?', 'What would you need to know before touching it?', 'How would you check it actually got faster?'],
    seatsPerRound: 4,
    rounds: 3,
    status: 'approved',
    daysBeforeEvent: 24,
  },
  {
    id: 'hoiva',
    company: 'Hoiva Labs',
    companyBlurb: 'Health-tech app for home-care nurses',
    sector: 'Health tech',
    size: '41 people',
    format: 'team',
    where: 'onsite',
    title: 'Nurses ignore our notifications. Why?',
    problem:
      'Home-care nurses get 30+ alerts a shift and mute them, so urgent ones are missed. We need someone who can untangle the flow.',
    atTheTable:
      'Teams of 4 get three anonymised notification logs and a paper phone mock-up. Together, redesign which alerts reach the nurse, and when.',
    goodLooksLike: ['Builds on a teammate’s idea', 'Starts from the nurse’s day, not the UI', 'Explains their part clearly'],
    skills: ['user experience design', 'interaction design', 'conduct user research'],
    mustHaves: [],
    languages: ['English', 'Finnish'],
    host: 'Head of product',
    whatYouGet: 'Your idea tested with two real nurses next week.',
    followUp: '45-min follow-up within 7 days if it’s mutual',
    debriefQuestions: ['Which alert would you remove first, and why?', 'Whose idea changed your mind, and how?', 'What would you test with nurses next week?'],
    parts: ['Urgent alerts: what must never be missed', 'Noise: what can go or be bundled', 'Timing: start of shift vs. during a visit', 'The screen: sketch what the nurse sees'],
    teamResult: 'New alert rules on one page: what arrives now, hourly, or never.',
    seatsPerRound: 12,
    rounds: 3,
    status: 'approved',
    daysBeforeEvent: 19,
  },
  {
    id: 'lumo',
    company: 'Lumo Logistics',
    companyBlurb: 'Last-mile delivery for the capital region',
    sector: 'Logistics',
    size: '160 people',
    format: 'sprint',
    where: 'online',
    title: 'Our route spreadsheet breaks every Monday.',
    problem:
      'Route planning lives in one huge Excel file. Every Monday a formula breaks and planners redo it by hand for 4 hours.',
    atTheTable: 'A copy of the broken sheet (synthetic data). Find what breaks and propose a sturdier setup.',
    goodLooksLike: ['Finds the root cause before fixing', 'Thinks about the planners who maintain it', 'Pragmatic over perfect'],
    skills: ['data analysis', 'use spreadsheets software', 'SQL', 'logistics planning'],
    mustHaves: [],
    languages: ['English', 'Finnish', 'Swedish'],
    host: 'Operations manager',
    whatYouGet: 'Fix it and we buy you lunch — seriously.',
    followUp: '45-min follow-up within 7 days if it’s mutual',
    debriefQuestions: ['What did you find was breaking the sheet?', 'What would you change first, and why?', 'How would the planners keep it working without you?'],
    seatsPerRound: 4,
    rounds: 3,
    status: 'approved',
    daysBeforeEvent: 15,
  },
  {
    id: 'pinewave',
    company: 'Pinewave Games',
    companyBlurb: 'Mobile game studio, Keilaniemi',
    sector: 'Games',
    size: '33 people',
    format: 'sprint',
    where: 'online',
    title: 'Players quit at level 3. Find out why.',
    problem: 'Day-1 retention dropped 18% after our last update and the team disagrees about the cause.',
    atTheTable: 'A funnel dashboard and 200 lines of event data. Form a hypothesis and design a test.',
    goodLooksLike: ['Forms testable hypotheses', 'Reads data critically', 'Communicates clearly to non-analysts'],
    skills: ['statistics', 'data analysis', 'A/B testing', 'game design'],
    mustHaves: [],
    languages: ['English'],
    host: 'Game producer',
    whatYouGet: 'Credits in our next patch notes if your test wins.',
    followUp: '45-min follow-up within 7 days if it’s mutual',
    debriefQuestions: ['What is your main hypothesis?', 'Which data would prove you wrong?', 'What test would you run first?'],
    seatsPerRound: 4,
    rounds: 3,
    status: 'draft',
    daysBeforeEvent: 9,
  },
  {
    id: 'vartio',
    company: 'Vartiopiste Oy',
    companyBlurb: 'Security services for malls and offices',
    sector: 'Security',
    size: '900 people',
    format: 'taster',
    where: 'onsite',
    title: 'A child is lost in a shopping centre. What do you do?',
    problem:
      'We hire 40 guards a year. A CV tells us nothing about how someone stays calm and communicates under pressure.',
    atTheTable:
      'A 10-minute role-play with one of our senior guards, then a “spot 5 risks” walk around the library floor.',
    goodLooksLike: ['Stays calm and friendly', 'Notices details', 'Asks for help when needed'],
    skills: ['monitor security', 'handle stressful situations', 'communicate with customers'],
    mustHaves: ['Security guard card (vartijakortti) or willing to get one', 'Can work evening / weekend shifts'],
    languages: ['Finnish (basic is fine)', 'English'],
    host: 'Senior security guard',
    whatYouGet: 'Same-week interview if it’s a mutual match. Training paid.',
    followUp: 'Interview the same week if it’s mutual',
    debriefQuestions: ['What did you do first, and why?', 'When would you call for help?', 'What did you notice on the risk walk?'],
    seatsPerRound: 6,
    rounds: 3,
    status: 'approved',
    daysBeforeEvent: 21,
  },
  {
    id: 'kirkas',
    company: 'Kirkas Siivous Oy',
    companyBlurb: 'Office and school cleaning in Espoo',
    sector: 'Facility services',
    size: '220 people',
    format: 'taster',
    where: 'onsite',
    title: 'Plan a 2-hour office clean — with pictures, not words.',
    problem: 'Many great cleaners are new to Finnish. Our written tests filtered them out for the wrong reasons.',
    atTheTable:
      'A pictogram card game: which product for which surface, which colour cloth where. Then plan the order of a 2-hour shift on a floor map.',
    goodLooksLike: ['Safe chemical handling', 'Logical work order', 'Careful and reliable'],
    skills: ['clean surfaces', 'follow hygiene standards', 'plan work schedule'],
    mustHaves: ['Hygiene passport (hygieniapassi) or willing to get one', 'Early-morning shifts'],
    languages: ['Any — the task is visual'],
    host: 'Shift supervisor',
    whatYouGet: 'Paid trial day (työkokeilu) for mutual matches.',
    followUp: 'Paid trial day (työkokeilu) within 2 weeks if it’s mutual',
    debriefQuestions: ['Why did you choose that order for the shift?', 'Which product would you never use on which surface?', 'What do you do if you run out of time?'],
    seatsPerRound: 6,
    rounds: 3,
    status: 'approved',
    daysBeforeEvent: 12,
  },
  {
    id: 'virta',
    company: 'Virta Grid',
    companyBlurb: 'Battery-storage analytics, Aalto spin-off',
    sector: 'Energy',
    size: '12 people',
    format: 'sprint',
    where: 'both',
    title: 'Predict which batteries fail next month.',
    problem: '',
    atTheTable: '',
    goodLooksLike: [],
    skills: [],
    mustHaves: [],
    languages: [],
    host: '',
    whatYouGet: '',
    followUp: '',
    debriefQuestions: [],
    seatsPerRound: 4,
    rounds: 3,
    status: 'missing',
    daysBeforeEvent: null,
  },
]

const LANGS = [['English'], ['English', 'Arabic'], ['Finnish', 'English'], ['English', 'Ukrainian'], ['Russian', 'English'], ['English', 'Hindi'], ['Somali', 'Finnish'], ['Portuguese', 'English'], ['Estonian', 'Finnish']]
const OPEN = CARDS.filter((c) => c.status === 'approved').map((c) => c.id)
const TECH = OPEN.filter((id) => CARDS.find((c) => c.id === id)!.format === 'sprint')
const HANDS = OPEN.filter((id) => CARDS.find((c) => c.id === id)!.format === 'taster')

// deterministic pseudo-random so the demo is the same every time
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

function pickN(pool: string[], n: number, r: () => number, bias?: string) {
  const out: string[] = bias ? [bias] : []
  while (out.length < Math.min(n, pool.length)) {
    const x = pool[Math.floor(r() * pool.length)]
    if (!out.includes(x)) out.push(x)
  }
  return out
}

export function makeTalents(n = 64): Talent[] {
  const r = rng(42)
  return Array.from({ length: n }, (_, i) => {
    const hands = r() < 0.35
    const pool = hands ? HANDS : TECH
    // Hoiva and Kvanttia are popular: realistic oversubscription
    const bias = !hands && r() < 0.45 ? (r() < 0.6 ? 'hoiva' : 'kvanttia') : undefined
    const choices = pickN(pool, hands ? 2 : 3, r, bias)
    if (hands && r() < 0.3) choices.push(TECH[Math.floor(r() * TECH.length)])
    return {
      code: `T-${String(101 + i)}`,
      choices,
      languages: LANGS[Math.floor(r() * LANGS.length)],
      checks: hands ? ['Evening shifts'] : [],
    }
  })
}
