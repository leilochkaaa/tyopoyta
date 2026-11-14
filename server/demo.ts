// Scripted fallbacks so the demo works offline or without an API key.

export const DEMO_QUESTIONS = [
  'Hi! Forget the job ad for a moment. What is on fire right now — what would this person spend their first 90 days on?',
  'Got it. What goes wrong today because nobody owns this? A concrete example helps candidates a lot.',
  'Last one: is anything truly required — a licence, shifts, a language? I’ll flag anything that looks like a habit rather than a need.',
]

export const DEMO_CARD = {
  format: 'sprint' as const,
  title: 'Predict which batteries fail next month',
  problem:
    'We monitor 3,000 home batteries but only notice failures after customers complain. Our two engineers spend Fridays digging through sensor logs by hand.',
  atTheTable:
    'You get a printed sample of sensor data from 20 batteries (synthetic). With our CTO, spot early warning signs and sketch a simple alert rule.',
  goodLooksLike: ['Looks at the data before proposing models', 'Builds on a teammate’s idea', 'Explains reasoning to a non-specialist'],
  skills: ['data analysis', 'statistics', 'Python', 'monitor equipment condition'],
  mustHaves: [],
  languages: ['English'],
  host: 'CTO',
  whatYouGet: 'See real battery-fleet data and how a 12-person spin-off works.',
  parts: ['Temperature: which batteries overheat', 'Charge cycles: whose capacity is dropping', 'Past failures: what broken ones had in common', 'Action: what happens when the alert fires'],
  teamResult: 'One alert rule and the list of batteries to check first.',
  debriefQuestions: ['Which warning sign did you spot first, and why?', 'How would you check your alert rule is not too noisy?', 'What data would you ask us for next?'],
}

export const DEMO_TRANSLATE = {
  strengths: [
    { plain: 'Finds the root cause of technical failures', esco_label: 'troubleshoot', evidence_quote: 'finding the causes of network outages' },
    { plain: 'Predicts failures from data before they happen', esco_label: 'perform data analysis', evidence_quote: 'I built a Python script that predicted which base stations would fail' },
    { plain: 'Leads a small technical team', esco_label: 'lead a team', evidence_quote: 'I led a team of 4 field engineers' },
    { plain: 'Explains technical problems to non-technical people', esco_label: 'communicate technical information', evidence_quote: 'explained problems to managers who were not technical' },
    { plain: 'Keeps learning new tools', esco_label: 'data analytics', evidence_quote: 'In Finland I finished a data analytics course' },
  ],
  reflection_questions: [
    'When your script flagged a base station, how did you convince the field team to act on it?',
    'How many outages did the script help prevent? A rough number is fine.',
  ],
  mode: 'demo' as const,
}

export const DEMO_RECAP = {
  common_ground: ['Most CI time is spent on the full integration suite', 'Run fast unit tests first, the slow suite only before merge', 'Caching dependencies'],
  company_heard: 'The host said nobody had looked at the pipeline as a whole before, and liked that you asked which steps actually block a merge.',
  talent_heard: 'You said the problem looked like the one you solved at your previous job, and you would want to see how often the integration tests actually fail.',
  open_questions: ['Is the role full-time or part-time to start?', 'Which days on-site?', 'Does the work permit need an employer statement?'],
  suggested_next_step: '45-minute follow-up with the lead engineer next week to look at the real pipeline config.',
  mode: 'demo' as const,
}

export const DEMO_TALK = [
  'Hi! I’m here to help you show what you can do — no CV needed. Tell me about something you have done: a job, studies, a family business, volunteering… anything.',
  'That sounds like important work! Tell me about a problem you solved there. What did you do, step by step?',
  'Great example. What are you learning at the moment, and what kind of work would you enjoy next?',
  'Thank you! Give me a second — I’ll turn what you said into skills, and you decide what to keep.',
]

// Interview lines per language (index 4 = "please say a bit more").
export const DEMO_TALK_I18N: Record<string, string[]> = {
  en: [
    ...DEMO_TALK,
    'Sorry, I didn’t catch that. Could you tell me a bit more, in a sentence or two?',
  ],
  ru: [
    'Привет! Я помогу показать, что вы умеете, без резюме. Расскажите о том, что вы делали: работа, учёба, семейный бизнес, волонтёрство… что угодно.',
    'Звучит интересно! Расскажите о проблеме, которую вы там решили. Что вы делали, шаг за шагом?',
    'Отличный пример. Чему вы сейчас учитесь и какая работа вам была бы интересна?',
    'Спасибо! Секунду, я превращу ваш рассказ в навыки, а вы решите, что оставить.',
    'Извините, я не совсем поняла. Расскажите чуть подробнее, одним-двумя предложениями?',
  ],
  uk: [
    'Привіт! Я допоможу показати, що ви вмієте, без резюме. Розкажіть, що ви робили: робота, навчання, сімейний бізнес, волонтерство… будь-що.',
    'Цікаво! Розкажіть про проблему, яку ви там розв’язали. Що ви робили, крок за кроком?',
    'Чудовий приклад. Чого ви зараз вчитеся і яка робота вам була б цікава?',
    'Дякую! Секунду, я перетворю вашу розповідь на навички, а ви вирішите, що залишити.',
    'Вибачте, я не зовсім зрозуміла. Розкажіть трохи детальніше, одним-двома реченнями?',
  ],
  fi: [
    'Hei! Autan sinua näyttämään, mitä osaat, ilman CV:tä. Kerro jostain, mitä olet tehnyt: työ, opinnot, perheyritys, vapaaehtoistyö… mitä tahansa.',
    'Kuulostaa tärkeältä! Kerro ongelmasta, jonka ratkaisit siellä. Mitä teit, vaihe vaiheelta?',
    'Hyvä esimerkki. Mitä opiskelet nyt, ja millainen työ kiinnostaisi sinua seuraavaksi?',
    'Kiitos! Hetki, muutan kertomasi taidoiksi, ja sinä päätät, mitä pidät.',
    'Anteeksi, en ihan ymmärtänyt. Kertoisitko vähän enemmän, lauseella tai kahdella?',
  ],
  sv: [
    'Hej! Jag hjälper dig att visa vad du kan, utan CV. Berätta om något du har gjort: jobb, studier, familjeföretag, volontärarbete… vad som helst.',
    'Det låter viktigt! Berätta om ett problem du löste där. Vad gjorde du, steg för steg?',
    'Bra exempel. Vad lär du dig just nu, och vilket jobb skulle du vilja ha härnäst?',
    'Tack! Ett ögonblick, jag gör om det du sa till färdigheter, och du väljer vad du behåller.',
    'Förlåt, jag uppfattade inte riktigt. Kan du berätta lite mer, med en eller två meningar?',
  ],
  es: [
    '¡Hola! Te ayudo a mostrar lo que sabes hacer, sin CV. Cuéntame algo que hayas hecho: trabajo, estudios, un negocio familiar, voluntariado… lo que sea.',
    '¡Suena importante! Cuéntame un problema que resolviste allí. ¿Qué hiciste, paso a paso?',
    'Buen ejemplo. ¿Qué estás aprendiendo ahora y qué trabajo te gustaría hacer después?',
    '¡Gracias! Un segundo, convierto lo que dijiste en habilidades y tú decides qué guardar.',
    'Perdona, no te he entendido bien. ¿Me cuentas un poco más, en una o dos frases?',
  ],
}

// A real answer has a few different words, not one repeated sound.
export function meaningful(text: string) {
  const words = text.toLowerCase().match(/\p{L}{2,}/gu) ?? []
  return words.length >= 4 && new Set(words).size >= 3
}

// Offline fallback: pick sentences from the person's OWN text and name the skill they show.
const HINTS: [RegExp, string, string][] = [
  [/сайт|website|web|verkkosiv|frontend|react/i, 'Builds websites', 'develop websites'],
  [/продаж|sales|myynti|sell|маркет|marketing/i, 'Sets up and runs sales', 'sales activities'],
  [/оплат|payment|maksu|stripe/i, 'Sets up online payments', 'manage online payments'],
  [/университет|universit|yliopisto|studied|учил|degree|master|магист/i, 'Completed university studies', 'academic studies'],
  [/интерн|стаж|intern|harjoittel|trainee/i, 'Has worked as an intern', 'work experience'],
  [/\bml\b|machine learning|машинн|математ|math|statist|data|данн/i, 'Learns data, maths and ML', 'perform data analysis'],
  [/python|java|code|програм|software|engineer|инженер|ohjelm/i, 'Writes software', 'computer programming'],
  [/team|команд|tiimi|led |руковод|lead/i, 'Works in and leads teams', 'lead a team'],
  [/customer|клиент|asiakas|client/i, 'Works with customers', 'communicate with customers'],
  [/teach|школ|school|opet|учител|tutor/i, 'Has worked in education', 'teaching'],
]
export function demoTranslate(text: string) {
  if (!meaningful(text)) return { strengths: [], reflection_questions: ['Tell us one real thing you have done: a job, studies, volunteering or a family business.'], mode: 'demo' as const }
  const parts = text.split(/(?<=[.!?\n])\s+|\s(?:потом|then|и потом|вот|also|ещё|еще)\s/i).map((p) => p.trim()).filter((p) => (p.match(/\p{L}{2,}/gu) ?? []).length >= 3)
  const strengths: { plain: string; esco_label: string; evidence_quote: string }[] = []
  for (const p of parts)
    for (const [re, plain, esco] of HINTS)
      if (re.test(p) && !strengths.some((s) => s.plain === plain) && strengths.length < 5) strengths.push({ plain, esco_label: esco, evidence_quote: p.slice(0, 140) })
  return {
    strengths,
    reflection_questions: strengths.length
      ? ['Pick one example above: what changed because of what you did?']
      : ['Tell us one real thing you have done: a job, studies, volunteering or a family business.'],
    mode: 'demo' as const,
  }
}
