'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ACHIEVEMENTS,
  calculateLevel,
  calculateLevelProgress,
  createDefaultProgress,
  DIFFICULTIES,
  generateQuestions,
  LIBRARY_TOPICS,
  normalizeProgress,
  PLAYABLE_TOPICS,
  type Difficulty,
  type GameResult,
  type PlayerProgress,
  type PlayableTopic,
  type Question,
  type TopicId,
  updateProgress,
} from '@/lib/math-game';

type Screen = 'home' | 'topics' | 'game' | 'results' | 'progress' | 'achievements';
type Feedback = 'correct' | 'incorrect' | null;

const STORAGE_KEY = 'math-sprout-progress-v1';
const navItems: Array<{ id: Exclude<Screen, 'game' | 'results'>; label: string; icon: string }> = [
  { id: 'home', label: 'Home', icon: '⌂' },
  { id: 'topics', label: 'Play', icon: '✦' },
  { id: 'progress', label: 'Progress', icon: '↗' },
  { id: 'achievements', label: 'Badges', icon: '♛' },
];

function formatAnswer(value: number | '>' | '<' | '=') {
  return value;
}

function percentage(correct: number, attempted: number) {
  return attempted === 0 ? 0 : Math.round((correct / attempted) * 100);
}

function getRecommendation(correct: number) {
  if (correct === 10) return 'Perfect round! You are ready for a brain-boosting challenge.';
  if (correct >= 7) return 'Amazing work! Try a new topic to keep your math muscles growing.';
  if (correct >= 4) return 'Nice effort! A little more practice will make these feel easy.';
  return 'Every try helps your brain grow. Play again and spot your next star!';
}

export default function MathGame() {
  const [screen, setScreen] = useState<Screen>('home');
  const [hydrated, setHydrated] = useState(false);
  const [progress, setProgress] = useState<PlayerProgress>(createDefaultProgress);
  const [selectedTopic, setSelectedTopic] = useState<PlayableTopic>('addition');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<Question['answer'] | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const hydrate = () => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) setProgress(normalizeProgress(JSON.parse(stored)));
      } catch {
        setProgress(createDefaultProgress());
      } finally {
        setHydrated(true);
      }
    };

    const timer = window.setTimeout(hydrate, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [hydrated, progress]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const level = calculateLevel(progress.stars);
  const levelProgress = calculateLevelProgress(progress.stars);
  const totalAttempted = Object.values(progress.topics).reduce(
    (sum, topic) => sum + topic.attempted,
    0
  );
  const totalCorrect = Object.values(progress.topics).reduce(
    (sum, topic) => sum + topic.correct,
    0
  );
  const overallAccuracy = percentage(totalCorrect, totalAttempted);
  const completedTopics = PLAYABLE_TOPICS.filter(
    (topic) => progress.topics[topic.id].completed > 0
  ).length;
  const currentQuestion = questions[questionIndex];

  const activeTopic = useMemo(
    () => PLAYABLE_TOPICS.find((topic) => topic.id === selectedTopic) ?? PLAYABLE_TOPICS[0]!,
    [selectedTopic]
  );

  function navigate(nextScreen: Screen) {
    setScreen(nextScreen);
    setShowConfetti(false);
    setToast('');
  }

  function startGame() {
    setQuestions(generateQuestions(selectedTopic, selectedDifficulty));
    setQuestionIndex(0);
    setCorrectAnswers(0);
    setSelectedAnswer(null);
    setFeedback(null);
    setLastResult(null);
    setShowConfetti(false);
    setScreen('game');
  }

  function chooseTopic(topic: TopicId) {
    if (!PLAYABLE_TOPICS.some((playable) => playable.id === topic)) {
      setToast('That adventure is coming soon! Pick a colorful game to play now.');
      return;
    }
    setSelectedTopic(topic as PlayableTopic);
    setScreen('topics');
  }

  function finishGame(nextCorrect: number) {
    const result: GameResult = {
      topic: selectedTopic,
      difficulty: selectedDifficulty,
      correct: nextCorrect,
      total: questions.length,
      stars: nextCorrect * 10,
    };
    setLastResult(result);
    setProgress((current) => updateProgress(current, result));
    setShowConfetti(true);
    setScreen('results');
  }

  function answerQuestion(answer: Question['answer']) {
    if (!currentQuestion || selectedAnswer !== null) return;
    const isCorrect = answer === currentQuestion.answer;
    const nextCorrect = correctAnswers + (isCorrect ? 1 : 0);
    setSelectedAnswer(answer);
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setCorrectAnswers(nextCorrect);
    setShowConfetti(isCorrect);

    window.setTimeout(
      () => {
        if (questionIndex === questions.length - 1) {
          finishGame(nextCorrect);
          return;
        }
        setQuestionIndex((current) => current + 1);
        setSelectedAnswer(null);
        setFeedback(null);
        setShowConfetti(false);
      },
      isCorrect ? 1000 : 1200
    );
  }

  if (!hydrated) {
    return (
      <main className="loading-screen" aria-busy="true">
        <div className="loading-mascot" aria-hidden="true">
          🌱
        </div>
        <p>Waking up your math garden…</p>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <header className="mobile-header">
        <button
          className="brand-mark focus-ring"
          onClick={() => navigate('home')}
          aria-label="Go to home"
        >
          <span aria-hidden="true">✿</span>
          <span>Math Sprout</span>
        </button>
        <div className="mobile-stars" aria-label={`${progress.stars} stars earned`}>
          ⭐ {progress.stars}
        </div>
      </header>

      <aside className="sidebar" aria-label="Primary navigation">
        <button className="brand-mark focus-ring" onClick={() => navigate('home')}>
          <span className="brand-flower" aria-hidden="true">
            ✿
          </span>
          <span>Math Sprout</span>
        </button>
        <div className="profile-mini">
          <div className="avatar avatar-small" aria-hidden="true">
            🧒
          </div>
          <div>
            <strong>Mia</strong>
            <span>Level {level} learner</span>
          </div>
          <span className="profile-dot" aria-label="Ready to learn" />
        </div>
        <nav className="nav-list">
          {navItems.map((item) => (
            <button
              className={`nav-button focus-ring ${screen === item.id ? 'nav-button-active' : ''}`}
              key={item.id}
              onClick={() => navigate(item.id)}
              aria-current={screen === item.id ? 'page' : undefined}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-tip">
          <span className="tip-spark" aria-hidden="true">
            ✦
          </span>
          <strong>Little tip</strong>
          <p>Small steps make giant brain gains.</p>
        </div>
      </aside>

      <main className="main-content">
        {screen === 'home' && (
          <HomeView
            level={level}
            levelProgress={levelProgress}
            progress={progress}
            completedTopics={completedTopics}
            chooseTopic={chooseTopic}
            startTopics={() => navigate('topics')}
          />
        )}
        {screen === 'topics' && (
          <TopicsView
            selectedTopic={selectedTopic}
            selectedDifficulty={selectedDifficulty}
            onTopicChange={setSelectedTopic}
            onDifficultyChange={setSelectedDifficulty}
            onStart={startGame}
            onBack={() => navigate('home')}
          />
        )}
        {screen === 'game' && currentQuestion && (
          <GameView
            topic={activeTopic}
            question={currentQuestion}
            questionIndex={questionIndex}
            selectedAnswer={selectedAnswer}
            feedback={feedback}
            showConfetti={showConfetti}
            onAnswer={answerQuestion}
            onExit={() => navigate('home')}
          />
        )}
        {screen === 'results' && lastResult && (
          <ResultsView
            result={lastResult}
            onPlayAgain={startGame}
            onAnotherTopic={() => navigate('topics')}
            onHome={() => navigate('home')}
            showConfetti={showConfetti}
          />
        )}
        {screen === 'progress' && (
          <ProgressView
            progress={progress}
            level={level}
            levelProgress={levelProgress}
            totalAttempted={totalAttempted}
            overallAccuracy={overallAccuracy}
          />
        )}
        {screen === 'achievements' && <AchievementsView progress={progress} />}
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navItems.map((item) => (
          <button
            className={`mobile-nav-button focus-ring ${screen === item.id ? 'mobile-nav-active' : ''}`}
            key={item.id}
            onClick={() => navigate(item.id)}
            aria-current={screen === item.id ? 'page' : undefined}
          >
            <span aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

function HomeView({
  level,
  levelProgress,
  progress,
  completedTopics,
  chooseTopic,
  startTopics,
}: {
  level: number;
  levelProgress: number;
  progress: PlayerProgress;
  completedTopics: number;
  chooseTopic: (topic: TopicId) => void;
  startTopics: () => void;
}) {
  return (
    <div className="view-stack landing-page">
      <div className="topline">
        <div>
          <p className="eyebrow">
            Tuesday, 14 May <span aria-hidden="true">•</span> Ready to grow
          </p>
          <h1>
            Let&apos;s learn <span className="heading-accent">math!</span>
          </h1>
        </div>
        <div className="desktop-student">
          <div className="avatar avatar-medium" aria-hidden="true">
            🧒
          </div>
          <div>
            <strong>Hi, Mia!</strong>
            <span>Keep your streak glowing</span>
          </div>
          <span className="streak-chip">
            🔥 {progress.currentStreak} day{progress.currentStreak === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      <section className="hero-card" aria-labelledby="hero-title">
        <div className="hero-copy">
          <span className="hero-kicker">Your math garden is blooming</span>
          <h2 id="hero-title">
            A little practice.
            <br />
            <span>A lot of sparkle.</span>
          </h2>
          <p>Pick a game, make a guess, and collect bright stars as you grow your number power.</p>
          <button className="primary-button focus-ring" onClick={startTopics}>
            <span>Play now</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="sun-disc" />
          <div className="hero-cloud cloud-one" />
          <div className="hero-cloud cloud-two" />
          <div className="mascot mascot-large">
            <span className="mascot-face">◡</span>
            <span className="mascot-leaf">✦</span>
          </div>
          <span className="float-star star-one">✦</span>
          <span className="float-star star-two">✧</span>
          <span className="hero-number number-one">7</span>
          <span className="hero-number number-two">+</span>
          <span className="hero-number number-three">3</span>
        </div>
      </section>

      <section className="quick-stats" aria-label="Your learning stats">
        <StatCard
          icon="⭐"
          label="Stars earned"
          value={progress.stars.toString()}
          tone="yellow"
          detail="Keep shining!"
        />
        <StatCard
          icon="🔥"
          label="Learning streak"
          value={progress.currentStreak.toString()}
          tone="coral"
          detail="days in a row"
        />
        <StatCard
          icon="↗"
          label="Current level"
          value={level.toString()}
          tone="sky"
          detail={`${levelProgress}% to next`}
          progress={levelProgress}
        />
        <StatCard
          icon="✿"
          label="Topics tried"
          value={`${completedTopics}/5`}
          tone="mint"
          detail="Playful progress"
        />
      </section>

      <section className="section-block" aria-labelledby="topics-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Choose your adventure</p>
            <h2 id="topics-title">What shall we practice?</h2>
          </div>
          <button className="text-button focus-ring" onClick={startTopics}>
            See all topics <span aria-hidden="true">→</span>
          </button>
        </div>
        <div className="topic-grid">
          {LIBRARY_TOPICS.map((topic) => {
            const topicStats = progress.topics[topic.id];
            const topicProgress = percentage(topicStats.correct, topicStats.attempted);
            const playable = PLAYABLE_TOPICS.some((item) => item.id === topic.id);
            return (
              <button
                className={`topic-card topic-${topic.color} focus-ring ${!playable ? 'topic-card-soon' : ''}`}
                key={topic.id}
                onClick={() => chooseTopic(topic.id)}
                aria-label={`${topic.name}. ${playable ? topic.description : 'Coming soon'}`}
              >
                <span className="topic-icon" aria-hidden="true">
                  {topic.icon}
                </span>
                <span className="topic-card-copy">
                  <strong>{topic.name}</strong>
                  <span>{playable ? topic.description : 'Coming soon'}</span>
                </span>
                <span className="topic-progress-label">
                  {playable ? `${topicProgress}%` : 'Soon'}
                </span>
                <span className="mini-progress" aria-hidden="true">
                  <span style={{ width: `${playable ? topicProgress : 0}%` }} />
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function TopicsView({
  selectedTopic,
  selectedDifficulty,
  onTopicChange,
  onDifficultyChange,
  onStart,
  onBack,
}: {
  selectedTopic: PlayableTopic;
  selectedDifficulty: Difficulty;
  onTopicChange: (topic: PlayableTopic) => void;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onStart: () => void;
  onBack: () => void;
}) {
  return (
    <div className="view-stack narrow-view">
      <div className="topline compact-topline">
        <div>
          <button className="back-button focus-ring" onClick={onBack}>
            ← Back home
          </button>
          <p className="eyebrow">Step 1 of 2</p>
          <h1>
            Choose a <span className="heading-accent">math quest</span>
          </h1>
          <p className="intro-copy">Every answer plants a little seed of smart.</p>
        </div>
        <div className="choice-badge" aria-hidden="true">
          🗺️
        </div>
      </div>
      <section className="choice-section" aria-labelledby="topic-choice-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Pick a topic</p>
            <h2 id="topic-choice-title">What feels fun today?</h2>
          </div>
          <span className="step-pill">1 / 2</span>
        </div>
        <div className="play-topic-grid">
          {PLAYABLE_TOPICS.map((topic) => (
            <button
              className={`play-topic-card topic-${topic.color} focus-ring ${selectedTopic === topic.id ? 'selected-choice' : ''}`}
              key={topic.id}
              onClick={() => onTopicChange(topic.id)}
              aria-pressed={selectedTopic === topic.id}
            >
              <span className="topic-icon" aria-hidden="true">
                {topic.icon}
              </span>
              <span>
                <strong>{topic.name}</strong>
                <small>{topic.description}</small>
              </span>
              {selectedTopic === topic.id && (
                <span className="selected-check" aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      </section>
      <section className="choice-section" aria-labelledby="difficulty-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Set the challenge</p>
            <h2 id="difficulty-title">How spicy should it be?</h2>
          </div>
          <span className="step-pill">2 / 2</span>
        </div>
        <div className="difficulty-grid">
          {DIFFICULTIES.map((difficulty) => (
            <button
              className={`difficulty-card focus-ring ${selectedDifficulty === difficulty.id ? 'selected-choice' : ''}`}
              key={difficulty.id}
              onClick={() => onDifficultyChange(difficulty.id)}
              aria-pressed={selectedDifficulty === difficulty.id}
            >
              <span className="difficulty-icon" aria-hidden="true">
                {difficulty.icon}
              </span>
              <span>
                <strong>{difficulty.label}</strong>
                <small>{difficulty.helper}</small>
              </span>
              {selectedDifficulty === difficulty.id && (
                <span className="selected-check" aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      </section>
      <div className="start-quest-row">
        <p>
          <span aria-hidden="true">✨</span> 10 questions <span aria-hidden="true">•</span> Earn up
          to 100 stars
        </p>
        <button className="primary-button focus-ring" onClick={onStart}>
          Start quest <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}

function GameView({
  topic,
  question,
  questionIndex,
  selectedAnswer,
  feedback,
  showConfetti,
  onAnswer,
  onExit,
}: {
  topic: (typeof PLAYABLE_TOPICS)[number];
  question: Question;
  questionIndex: number;
  selectedAnswer: Question['answer'] | null;
  feedback: Feedback;
  showConfetti: boolean;
  onAnswer: (answer: Question['answer']) => void;
  onExit: () => void;
}) {
  const currentNumber = questionIndex + 1;
  const progress = currentNumber * 10;
  return (
    <div className="game-view">
      <div className="game-topbar">
        <button className="back-button focus-ring" onClick={onExit}>
          ← Exit quest
        </button>
        <div className="game-topic-chip">
          <span aria-hidden="true">{topic.icon}</span>
          {topic.name}
        </div>
        <span className="game-stars">⭐ +10</span>
      </div>
      <div className="question-progress-row">
        <span>
          Question <strong>{currentNumber}</strong> / 10
        </span>
        <span>{progress}% grown</span>
      </div>
      <div className="question-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
      <section
        className={`question-card feedback-${feedback ?? 'idle'}`}
        aria-labelledby="question-prompt"
      >
        <div className="question-sparkles" aria-hidden="true">
          <span>✦</span>
          <span>✧</span>
          <span>·</span>
        </div>
        <p className="eyebrow">
          {feedback === 'correct'
            ? 'Brilliant thinking!'
            : feedback === 'incorrect'
              ? 'Good try, sprout!'
              : 'Take your best guess'}
        </p>
        <h1 id="question-prompt">{question.prompt}</h1>
        <p className="question-helper">Choose an answer below</p>
        <div className="answer-grid" role="group" aria-label="Answer choices">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = selectedAnswer !== null && option === question.answer;
            return (
              <button
                className={`answer-button answer-${index + 1} focus-ring ${isSelected ? 'answer-selected' : ''} ${isCorrect ? 'answer-correct' : ''}`}
                key={`${option}-${index}`}
                onClick={() => onAnswer(option)}
                disabled={selectedAnswer !== null}
                aria-label={`Answer ${formatAnswer(option)}`}
                aria-pressed={isSelected}
              >
                {formatAnswer(option)}
              </button>
            );
          })}
        </div>
        <div className="feedback-message" role="status" aria-live="polite">
          {feedback === 'correct' && (
            <>
              <span aria-hidden="true">🎉</span>
              <strong>Yes! That&apos;s right! +10 ⭐</strong>
            </>
          )}
          {feedback === 'incorrect' && (
            <>
              <span aria-hidden="true">🌈</span>
              <strong>Almost! Keep growing — next one!</strong>
            </>
          )}
        </div>
      </section>
      {showConfetti && <Confetti />}
    </div>
  );
}

function ResultsView({
  result,
  onPlayAgain,
  onAnotherTopic,
  onHome,
  showConfetti,
}: {
  result: GameResult;
  onPlayAgain: () => void;
  onAnotherTopic: () => void;
  onHome: () => void;
  showConfetti: boolean;
}) {
  const accuracy = Math.round((result.correct / result.total) * 100);
  return (
    <div className="results-view">
      {showConfetti && <Confetti />}
      <div className="results-kicker">
        Quest complete <span aria-hidden="true">✦</span>
      </div>
      <div className="results-mascot" aria-hidden="true">
        🌻
      </div>
      <p className="eyebrow">You made your brain sparkle</p>
      <h1>Great job!</h1>
      <p className="results-subtitle">That was a wonderful {result.topic} adventure.</p>
      <div className="result-summary-card">
        <div className="big-score">
          <strong>{result.correct}</strong>
          <span>/ {result.total} correct</span>
        </div>
        <div className="result-divider" />
        <div className="result-stat">
          <span className="result-stat-icon" aria-hidden="true">
            🎯
          </span>
          <span>
            <small>Accuracy</small>
            <strong>{accuracy}%</strong>
          </span>
        </div>
        <div className="result-divider" />
        <div className="result-stat">
          <span className="result-stat-icon" aria-hidden="true">
            ⭐
          </span>
          <span>
            <small>Stars earned</small>
            <strong>+{result.stars}</strong>
          </span>
        </div>
      </div>
      <div
        className="stars-row"
        aria-label={`${Math.min(5, Math.ceil(result.correct / 2))} out of 5 stars`}
      >
        <span className="stars-label">Your sparkle score</span>
        <span>
          {Array.from({ length: 5 }, (_, index) => (
            <span
              className={index < Math.ceil(result.correct / 2) ? 'star-on' : 'star-off'}
              key={index}
            >
              ★
            </span>
          ))}
        </span>
      </div>
      <p className="recommendation">
        <span aria-hidden="true">💡</span>
        <span>
          <strong>Sprout suggestion</strong>
          {getRecommendation(result.correct)}
        </span>
      </p>
      <div className="result-actions">
        <button className="primary-button focus-ring" onClick={onPlayAgain}>
          Play again <span aria-hidden="true">↻</span>
        </button>
        <button className="secondary-button focus-ring" onClick={onAnotherTopic}>
          Try another topic
        </button>
        <button className="quiet-button focus-ring" onClick={onHome}>
          Back to home
        </button>
      </div>
    </div>
  );
}

function ProgressView({
  progress,
  level,
  levelProgress,
  totalAttempted,
  overallAccuracy,
}: {
  progress: PlayerProgress;
  level: number;
  levelProgress: number;
  totalAttempted: number;
  overallAccuracy: number;
}) {
  return (
    <div className="view-stack">
      <div className="topline">
        <div>
          <p className="eyebrow">Your learning garden</p>
          <h1>
            Look how far you&apos;ve <span className="heading-accent">grown!</span>
          </h1>
          <p className="intro-copy">Every round adds a new leaf to your math tree.</p>
        </div>
        <div className="page-illustration" aria-hidden="true">
          🌱
        </div>
      </div>
      <section className="level-card">
        <div className="level-badge" aria-hidden="true">
          {level}
        </div>
        <div className="level-copy">
          <span className="eyebrow">Current level</span>
          <h2>Bright Bud</h2>
          <p>{levelProgress} stars until your next level</p>
          <div className="wide-progress">
            <span style={{ width: `${levelProgress}%` }} />
          </div>
        </div>
        <div className="level-number">
          <strong>{progress.stars}</strong>
          <span>total stars</span>
        </div>
      </section>
      <div className="progress-overview-grid">
        <StatCard
          icon="🎯"
          label="Overall accuracy"
          value={`${overallAccuracy}%`}
          tone="coral"
          detail={totalAttempted ? `${totalAttempted} answers tried` : 'Ready for your first try'}
          progress={overallAccuracy}
        />
        <StatCard
          icon="🔥"
          label="Learning streak"
          value={`${progress.currentStreak}`}
          tone="yellow"
          detail="days glowing"
        />
        <StatCard
          icon="✦"
          label="Games completed"
          value={`${progress.gamesCompleted}`}
          tone="sky"
          detail="mini quests won"
        />
      </div>
      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Your map</p>
            <h2>Topic progress</h2>
          </div>
          <span className="small-muted">Keep exploring!</span>
        </div>
        <div className="progress-topic-list">
          {PLAYABLE_TOPICS.map((topic) => {
            const stats = progress.topics[topic.id];
            const value = percentage(stats.correct, stats.attempted);
            return (
              <div className="progress-topic-row" key={topic.id}>
                <span className={`progress-topic-icon topic-${topic.color}`} aria-hidden="true">
                  {topic.icon}
                </span>
                <span className="progress-topic-name">
                  <strong>{topic.name}</strong>
                  <small>
                    {stats.completed
                      ? `${stats.completed} round${stats.completed === 1 ? '' : 's'} complete`
                      : 'Not started yet'}
                  </small>
                </span>
                <div className="wide-progress">
                  <span style={{ width: `${value}%` }} />
                </div>
                <strong className="progress-percent">{value}%</strong>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function AchievementsView({ progress }: { progress: PlayerProgress }) {
  return (
    <div className="view-stack">
      <div className="topline">
        <div>
          <p className="eyebrow">Tiny trophies, big smiles</p>
          <h1>
            Your <span className="heading-accent">badges</span>
          </h1>
          <p className="intro-copy">Keep playing to wake up every sleepy little badge.</p>
        </div>
        <div className="page-illustration" aria-hidden="true">
          🏆
        </div>
      </div>
      <section className="achievement-banner">
        <div className="banner-icon" aria-hidden="true">
          🎈
        </div>
        <div>
          <strong>
            {progress.achievements.length} of {ACHIEVEMENTS.length} badges unlocked
          </strong>
          <p>Each badge celebrates a different kind of clever.</p>
        </div>
        <div className="badge-progress">
          <span
            style={{ width: `${(progress.achievements.length / ACHIEVEMENTS.length) * 100}%` }}
          />
        </div>
      </section>
      <div className="achievement-grid">
        {ACHIEVEMENTS.map((achievement) => {
          const unlocked = progress.achievements.includes(achievement.id);
          return (
            <article
              className={`achievement-card achievement-${achievement.color} ${unlocked ? 'achievement-unlocked' : 'achievement-locked'}`}
              key={achievement.id}
            >
              <div className="achievement-icon" aria-hidden="true">
                {unlocked ? achievement.icon : '🔒'}
              </div>
              <div>
                <h2>{achievement.title}</h2>
                <p>{achievement.description}</p>
              </div>
              <span className="achievement-status">{unlocked ? 'Unlocked!' : 'Keep growing'}</span>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
  detail,
  progress,
}: {
  icon: string;
  label: string;
  value: string;
  tone: string;
  detail: string;
  progress?: number;
}) {
  return (
    <article className={`stat-card stat-${tone}`}>
      <div className="stat-top">
        <span className="stat-icon" aria-hidden="true">
          {icon}
        </span>
        {progress !== undefined && (
          <span className="stat-mini-progress" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </span>
        )}
      </div>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      <span className="stat-detail">{detail}</span>
    </article>
  );
}

function Confetti() {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 18 }, (_, index) => (
        <span className={`confetti-piece confetti-${index % 6}`} key={index} />
      ))}
    </div>
  );
}
