// ============================================
// CONFIG: Default card side
// ============================================

let defaultCardSide = 'english'; // 'english' or 'spanish'

// ============================================
// STATE MANAGEMENT
// ============================================
let vocabularyData = null;
let currentSetId = null;
let currentCardIndex = 0;
let currentCards = [];
let cardProgress = {}; // Track which cards user has seen
let screenId = null;

// ============================================
// INITIALIZATION
// ============================================

/*document.addEventListener('DOMContentLoaded', async () => {
  // Register Service Worker for offline support
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('sw.js');
      console.log('Service Worker registered');
    } catch (error) {
      console.log('Service Worker registration failed:', error);
    }
  }

  // Load vocabulary data
  await loadVocabularyData();
  initializeEventListeners();
  showSetSelectionScreen();
}); */

// ============================================
// DATA LOADING
// ============================================

/*async function loadVocabularyData() {
  try {
    const response = await fetch('data/unit_1.json');
    vocabularyData = await response.json();
    console.log('Vocabulary data loaded:', vocabularyData);
  } catch (error) {
    console.error('Failed to load vocabulary data:', error);
    alert('Error loading vocabulary data. Make sure data/unit_1.json exists.');
  }
}*/

// ============================================
// EVENT LISTENERS
// ============================================

function initializeEventListeners() {
  //Home page sections
  document.getElementById('lessnBtn').addEventListener('click', () => showScreen('lessnScreen'));
  document.getElementById('vocabBtn').addEventListener('click', () => showScreen('vocabScreen'));
  document.getElementById('exerBtn').addEventListener('click', () => showScreen('exerScreen'));

  // Set selection
  /*document.getElementById('setList').addEventListener('click', (e) => {
    const setCard = e.target.closest('.set-card');
    if (setCard) {
      const setId = setCard.dataset.setId;
      startStudySession(setId);
    }
  });*/

  // flashcard screen controls
  document.getElementById('backBtn').addEventListener('click', () => showSetSelectionScreen());
  document.getElementById('revealBtn').addEventListener('click', () => flipCard());
  document.getElementById('playAudioBtn').addEventListener('click', () => playAudio());
  document.getElementById('nextCardBtn').addEventListener('click', () => nextCard());
  document.getElementById('prevCardBtn').addEventListener('click', () => previousCard());

  // Feedback buttons
  document.getElementById('difficultBtn').addEventListener('click', () => recordFeedback('difficult'));
  document.getElementById('goodBtn').addEventListener('click', () => recordFeedback('good'));
  document.getElementById('easyBtn').addEventListener('click', () => recordFeedback('easy'));

  // Click flashcard to flip back and forth
  document.getElementById('flashcard').addEventListener('click', () => flipCard());

  // Optional: toggle default side dynamically
  const toggleBtn = document.getElementById('toggleSideBtn');
  if (toggleBtn) {
toggleBtn.addEventListener('click', () => {
  defaultCardSide = defaultCardSide === 'english' ? 'spanish' : 'english';
  displayCard();
  toggleBtn.textContent = `Default: ${defaultCardSide.charAt(0).toUpperCase() + defaultCardSide.slice(1)}`;
});
  }
}

// ============================================
// SCREEN MANAGEMENT ~(functions)~
// ============================================


function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add("active");
  }
}

function showSetSelectionScreen() {
  document.getElementById('setSelectionScreen').classList.add('active');
  document.getElementById('studyScreen').classList.remove('active');
  renderSetList();
}

function showStudyScreen() {
  document.getElementById('setSelectionScreen').classList.remove('active');
  document.getElementById('studyScreen').classList.add('active');
}

function renderSetList() {
  const setList = document.getElementById('setList');
  setList.innerHTML = '';

  vocabularyData.sets.forEach((set) => {
    const setCard = document.createElement('div');
    setCard.className = 'set-card';
    setCard.dataset.setId = set.id;
    setCard.innerHTML = `
      <h3>${set.name}</h3>
      <p>${set.cards.length} cards</p>
    `;
    setList.appendChild(setCard);
  });
}

// ============================================
// STUDY SESSION
// ============================================

function startStudySession(setId) {
  currentSetId = setId;
  currentCardIndex = 0;

  // Get cards for this set
  const set = vocabularyData.sets.find((s) => s.id === setId);
  currentCards = set.cards;

  // Initialize progress tracking
  currentCards.forEach((card) => {
    if (!cardProgress[card.id]) {
      cardProgress[card.id] = {
        seen: false,
        difficulty: 'new',
        attempts: 0,
      };
    }
  });

  showStudyScreen();
  displayCard();
}

// ============================================
// CARD DISPLAY
// ============================================

function displayCard() {
  if (currentCardIndex >= currentCards.length) {
    showSessionComplete();
    return;
  }

  const card = currentCards[currentCardIndex];

  const flashcard = document.getElementById('flashcard');
  const cardBack = document.querySelector('.card-back');
  const revealBtn = document.getElementById('revealBtn');
  const feedbackBtns = document.getElementById('feedbackBtns');

  // Reset card state
  flashcard.classList.remove('flipped');
  cardBack.classList.add('hidden');
  revealBtn.classList.remove('hidden');
  feedbackBtns.classList.add('hidden');

  // Determine front and back sides
  const frontSide = defaultCardSide;
  const backSide = frontSide === 'english' ? 'spanish' : 'english';

  flashcard.dataset.frontSide = frontSide;
  flashcard.dataset.backSide = backSide;
  flashcard.dataset.currentSide = frontSide;

  // Set initial card text
  document.getElementById('cardEnglish').textContent = frontSide === 'english' ? card.english : card.spanish;
  document.getElementById('cardSpanish').textContent = backSide === 'english' ? card.english : card.spanish;

  // Update progress text
  const progress = currentCardIndex + 1;
  const total = currentCards.length;
  document.getElementById('progressText').textContent = `${progress} / ${total}`;

  // Mark card as seen
  cardProgress[card.id].seen = true;
}

function flipCard() {
  const flashcard = document.getElementById('flashcard');
  const card = currentCards[currentCardIndex];

  // Swap front/back side
  const currentSide = flashcard.dataset.currentSide;
  const newSide = currentSide === flashcard.dataset.frontSide ? flashcard.dataset.backSide : flashcard.dataset.frontSide;
  flashcard.dataset.currentSide = newSide;

  // Toggle CSS flip class for animation
  flashcard.classList.toggle('flipped');

  // Update visible content
  document.getElementById('cardEnglish').textContent = newSide === 'english' ? card.english : card.spanish;
  document.getElementById('cardSpanish').textContent = newSide === 'english' ? card.spanish : card.english;
}

function playAudio() {
  const card = currentCards[currentCardIndex];
  const audioPath = `audio/${card.audioFile}`;

  const audio = new Audio(audioPath);
  audio.play().catch((error) => {
    console.error('Error playing audio:', error);
    alert('Audio file not found: ' + audioPath);
  });
}

// ============================================
// NAVIGATION
// ============================================

function nextCard() {
  if (currentCardIndex < currentCards.length - 1) {
    currentCardIndex++;
    displayCard();
  }
}

function previousCard() {
  if (currentCardIndex > 0) {
    currentCardIndex--;
    displayCard();
  }
}

// ============================================
// FEEDBACK & PROGRESS
// ============================================

function recordFeedback(feedback) {
  const card = currentCards[currentCardIndex];
  cardProgress[card.id].difficulty = feedback;
  cardProgress[card.id].attempts += 1;

  console.log(`Card "${card.english}" marked as: ${feedback}`);

  // Move to next card
  nextCard();
}

function showSessionComplete() {
  const studyScreen = document.getElementById('studyScreen');
  const stats = calculateSessionStats();

  studyScreen.innerHTML = `
    <div style="text-align: center; padding: 60px 20px;">
      <h2>🎉 Session Complete!</h2>
      <div style="margin: 30px 0; font-size: 18px; color: #666;">
        <p>Cards studied: <strong>${stats.total}</strong></p>
        <p>Easy: <strong style="color: #4caf50;">${stats.easy}</strong></p>
        <p>Good: <strong style="color: #2196f3;">${stats.good}</strong></p>
        <p>Difficult: <strong style="color: #ff9800;">${stats.difficult}</strong></p>
      </div>
      <button id="restartBtn" class="btn-primary" style="margin-top: 20px; padding: 12px 30px; font-size: 16px;">
        Study Again
      </button>
      <button id="backToSetsBtn" class="btn-secondary" style="margin-top: 10px; padding: 12px 30px; font-size: 16px;">
        Back to Topics
      </button>
    </div>
  `;

  document.getElementById('restartBtn').addEventListener('click', () => {
    startStudySession(currentSetId);
  });

  document.getElementById('backToSetsBtn').addEventListener('click', () => {
    showSetSelectionScreen();
  });
}

function calculateSessionStats() {
  const stats = {
    total: currentCards.length,
    easy: 0,
    good: 0,
    difficult: 0,
  };

  currentCards.forEach((card) => {
    const progress = cardProgress[card.id];
    if (progress.difficulty === 'easy') stats.easy++;
    else if (progress.difficulty === 'good') stats.good++;
    else if (progress.difficulty === 'difficult') stats.difficult++;
  });

  return stats;
}