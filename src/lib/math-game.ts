export type PlayableTopic =
  'addition' | 'subtraction' | 'multiplication' | 'division' | 'comparison';

export type TopicId = PlayableTopic | 'numbers' | 'shapes' | 'fractions';
export type Difficulty = 'easy' | 'medium' | 'hard';

export type Question = {
  id: string;
  prompt: string;
  answer: number | '>' | '<' | '=';
  options: Array<number | '>' | '<' | '='>;
};

export type TopicProgress = {
  attempted: number;
  correct: number;
  completed: number;
};

export type PlayerProgress = {
  stars: number;
  gamesCompleted: number;
  currentStreak: number;
  lastPlayedDate: string | null;
  achievements: string[];
  topics: Record<TopicId, TopicProgress>;
};

export type GameResult = {
  topic: PlayableTopic;
  difficulty: Difficulty;
  correct: number;
  total: number;
  stars: number;
};

export const PLAYABLE_TOPICS: Array<{
  id: PlayableTopic;
  icon: string;
  name: string;
  description: string;
  color: string;
}> = [
  {
    id: 'addition',
    icon: '＋',
    name: 'Addition',
    description: 'Put numbers together',
    color: 'coral',
  },
  {
    id: 'subtraction',
    icon: '−',
    name: 'Subtraction',
    description: 'Find what is left',
    color: 'sky',
  },
  {
    id: 'multiplication',
    icon: '×',
    name: 'Multiplication',
    description: 'Grow your number power',
    color: 'yellow',
  },
  {
    id: 'division',
    icon: '÷',
    name: 'Division',
    description: 'Share numbers fairly',
    color: 'mint',
  },
  {
    id: 'comparison',
    icon: '⚖',
    name: 'Number Compare',
    description: 'Spot bigger and smaller',
    color: 'lavender',
  },
];

export const LIBRARY_TOPICS: Array<{
  id: TopicId;
  icon: string;
  name: string;
  description: string;
  color: string;
}> = [
  ...PLAYABLE_TOPICS,
  {
    id: 'numbers',
    icon: '🔢',
    name: 'Numbers',
    description: 'Count, order, and explore',
    color: 'peach',
  },
  {
    id: 'shapes',
    icon: '🔷',
    name: 'Shapes',
    description: 'Meet corners and curves',
    color: 'blue',
  },
  {
    id: 'fractions',
    icon: '🍕',
    name: 'Fractions',
    description: 'Share the yummy whole',
    color: 'pink',
  },
];

export const DIFFICULTIES: Array<{
  id: Difficulty;
  label: string;
  helper: string;
  icon: string;
}> = [
  { id: 'easy', label: 'Easy peasy', helper: 'Warm-up numbers', icon: '🌱' },
  { id: 'medium', label: 'Thinky', helper: 'A fun challenge', icon: '🚀' },
  { id: 'hard', label: 'Brain boost', helper: 'Ready to stretch?', icon: '⚡' },
];

const DEFAULT_TOPIC_PROGRESS: TopicProgress = { attempted: 0, correct: 0, completed: 0 };

export function createDefaultProgress(): PlayerProgress {
  return {
    stars: 0,
    gamesCompleted: 0,
    currentStreak: 0,
    lastPlayedDate: null,
    achievements: [],
    topics: {
      addition: { ...DEFAULT_TOPIC_PROGRESS },
      subtraction: { ...DEFAULT_TOPIC_PROGRESS },
      multiplication: { ...DEFAULT_TOPIC_PROGRESS },
      division: { ...DEFAULT_TOPIC_PROGRESS },
      comparison: { ...DEFAULT_TOPIC_PROGRESS },
      numbers: { ...DEFAULT_TOPIC_PROGRESS },
      shapes: { ...DEFAULT_TOPIC_PROGRESS },
      fractions: { ...DEFAULT_TOPIC_PROGRESS },
    },
  };
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function createNumberOptions(answer: number, spread: number) {
  const options = new Set<number>([answer]);
  let attempts = 0;
  while (options.size < 4 && attempts < 30) {
    const candidate = Math.max(0, answer + randomInt(-spread, spread));
    options.add(candidate);
    attempts += 1;
  }
  while (options.size < 4) options.add(answer + options.size);
  return shuffle(Array.from(options));
}

function createComparisonOptions(answer: '>' | '<' | '='): Array<'>' | '<' | '='> {
  return shuffle(['>', '<', '='] as Array<'>' | '<' | '='>)
    .filter((option) => option !== answer)
    .concat(answer);
}

function getRange(difficulty: Difficulty) {
  if (difficulty === 'easy') return { max: 10, spread: 3 };
  if (difficulty === 'medium') return { max: 25, spread: 5 };
  return { max: 60, spread: 9 };
}

export function generateQuestion(
  topic: PlayableTopic,
  difficulty: Difficulty,
  index: number
): Question {
  const { max, spread } = getRange(difficulty);
  let prompt = '';
  let answer: Question['answer'] = 0;

  if (topic === 'addition') {
    const left = randomInt(1, max);
    const right = randomInt(1, max);
    answer = left + right;
    prompt = `${left} + ${right} = ?`;
  } else if (topic === 'subtraction') {
    const left = randomInt(2, max * 2);
    const right = randomInt(1, left);
    answer = left - right;
    prompt = `${left} − ${right} = ?`;
  } else if (topic === 'multiplication') {
    const factorMax = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 8 : 12;
    const left = randomInt(2, factorMax);
    const right = randomInt(2, factorMax);
    answer = left * right;
    prompt = `${left} × ${right} = ?`;
  } else if (topic === 'division') {
    const divisor = randomInt(2, difficulty === 'easy' ? 5 : difficulty === 'medium' ? 8 : 12);
    const quotient = randomInt(1, difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : 12);
    answer = quotient;
    prompt = `${divisor * quotient} ÷ ${divisor} = ?`;
  } else {
    const left = randomInt(1, max * 2);
    const right = randomInt(1, max * 2);
    answer = left === right ? '=' : left > right ? '>' : '<';
    prompt = `${left}  ?  ${right}`;
  }

  const options: Question['options'] =
    typeof answer === 'number'
      ? createNumberOptions(answer, spread)
      : createComparisonOptions(answer);
  return { id: `${topic}-${difficulty}-${Date.now()}-${index}`, prompt, answer, options };
}

export function generateQuestions(topic: PlayableTopic, difficulty: Difficulty) {
  return Array.from({ length: 10 }, (_, index) => generateQuestion(topic, difficulty, index));
}

export function calculateLevel(stars: number) {
  return Math.max(1, Math.floor(stars / 100) + 1);
}

export function calculateLevelProgress(stars: number) {
  return stars % 100;
}

export function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function updateProgress(progress: PlayerProgress, result: GameResult): PlayerProgress {
  const today = getTodayKey();
  const hadGameToday = progress.lastPlayedDate === today;
  const previousTopic = progress.topics[result.topic];
  const nextStreak = hadGameToday ? progress.currentStreak : progress.currentStreak + 1;
  const nextTopic: TopicProgress = {
    attempted: previousTopic.attempted + result.total,
    correct: previousTopic.correct + result.correct,
    completed: previousTopic.completed + 1,
  };
  const next = {
    ...progress,
    stars: progress.stars + result.stars,
    gamesCompleted: progress.gamesCompleted + 1,
    currentStreak: nextStreak,
    lastPlayedDate: today,
    topics: { ...progress.topics, [result.topic]: nextTopic },
  };
  return { ...next, achievements: getUnlockedAchievements(next) };
}

export function getUnlockedAchievements(progress: PlayerProgress) {
  const unlocked = new Set(progress.achievements);
  if (progress.topics.addition.correct >= 20) unlocked.add('addition-master');
  if (progress.topics.numbers.attempted + progress.topics.comparison.attempted >= 10)
    unlocked.add('number-explorer');
  if (progress.topics.multiplication.correct >= 20) unlocked.add('multiplication-hero');
  if (progress.currentStreak >= 7) unlocked.add('seven-day-streak');
  if (progress.stars >= 250) unlocked.add('math-champion');
  return Array.from(unlocked);
}

export function normalizeProgress(value: unknown): PlayerProgress {
  const fallback = createDefaultProgress();
  if (!value || typeof value !== 'object') return fallback;
  const candidate = value as Partial<PlayerProgress>;
  if (typeof candidate.stars !== 'number' || !candidate.topics) return fallback;
  return {
    ...fallback,
    ...candidate,
    achievements: Array.isArray(candidate.achievements)
      ? candidate.achievements.filter((item): item is string => typeof item === 'string')
      : [],
    topics: { ...fallback.topics, ...candidate.topics },
  };
}

export const ACHIEVEMENTS = [
  {
    id: 'addition-master',
    icon: '🏆',
    title: 'Addition Master',
    description: 'Get 20 addition answers right',
    color: 'yellow',
  },
  {
    id: 'number-explorer',
    icon: '🔢',
    title: 'Number Explorer',
    description: 'Answer 10 number questions',
    color: 'sky',
  },
  {
    id: 'multiplication-hero',
    icon: '✖',
    title: 'Multiplication Hero',
    description: 'Get 20 multiplication answers right',
    color: 'coral',
  },
  {
    id: 'seven-day-streak',
    icon: '🔥',
    title: '7-Day Streak',
    description: 'Play for seven days in a row',
    color: 'peach',
  },
  {
    id: 'math-champion',
    icon: '⭐',
    title: 'Math Champion',
    description: 'Earn 250 stars',
    color: 'lavender',
  },
];
