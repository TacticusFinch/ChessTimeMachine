    document.addEventListener('DOMContentLoaded', function() {
      const gamesData = window.GAMES_DATA;

      const game = new Chess();

      let currentGameIndex = 0;
      let referenceGame = null;
      let movesList = [];
      let keyMoments = [];
      let currentMoveIndex = 0;

      let score = 0;
      const answeredMoments = new Set();
      const diamondMoves = new Set();
      let questionActive = false;
      let manualQuestionActive = false;
      let activeManualMoment = null;
      let summaryShown = false;

      let variationMode = false;
      let variationMovesSan = [];
      let variationIndex = 0;
      let variationTitle = '';

      let variationAutoTimer = null;
      let variationAutoDelayMs = 650; // скорость (можно 450–900)
      let variationAutoRunning = false;

      let manualHintStage = 0;      // 0 - нет, 1 - показали фигуру (from), 2 - показали клетку (to)
      let manualHintMomentKey = null; // чтобы сбрасывать подсказку при смене момента

let proofMode = false;
let proofMoment = null;        // какой исходный момент мы доказываем
let proofAlt = null;           // какой альтернативный ответ выбран (объект из altCorrect)
let proofStepIndex = 0;        // индекс шага мини-квеста
let proofAutoTimer = null;
let proofAutoDelayMs = 650;
let proofAutoRunning = false;

let savedProofMainFen = '';
let savedProofMainMoveIndex = 0;


      let savedMainFen = '';
      let savedMainMoveIndex = 0;
      let savedMomentForVariation = null;
      let survivalMode = false;
      let lives = 3;
      let proMode = false;

      // таймер вопроса
      let questionTimerId = null;
      let questionTimeLeftMs = 0;
      const PRO_QUESTION_TIME_MS = 2 * 60 * 1000; // 2 минуты


      const board = Chessboard('board', {
        draggable: true,
        position: 'start',
        pieceTheme: 'img/chesspieces/alpha/{piece}.png',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
	showNotation: false  
      });

const boardWrapperEl = document.getElementById('board-wrapper');

// ==== КООРДИНАТЫ: снизу (файлы) и справа (ранги) ====
const boardCoordsEl = document.getElementById('board-coords');
const filesBottomEl = boardCoordsEl.querySelector('.board-files.bottom');
const ranksRightEl  = boardCoordsEl.querySelector('.board-ranks.right');

function renderBoardCoords() {
  const orientation = board.orientation();
  const files = ['A','B','C','D','E','F','G','H'];
  const ranks = ['1','2','3','4','5','6','7','8'];

  const filesToShow = (orientation === 'white') ? files : files.slice().reverse();
  const ranksToShow = (orientation === 'white') ? ranks : ranks.slice().reverse();

  filesBottomEl.innerHTML = '';
  filesToShow.forEach(f => {
    const span = document.createElement('span');
    span.textContent = f;
    filesBottomEl.appendChild(span);
  });

  ranksRightEl.innerHTML = '';
  ranksToShow.forEach(r => {
    const span = document.createElement('span');
    span.textContent = r;
    ranksRightEl.appendChild(span);
  });
}
// первый рендер
renderBoardCoords();






const clickTocSoundEl = document.getElementById('sound-clicktoc');
const questChoiceSoundEl = document.getElementById('sound-questchoice');
const answerHoverSoundEl = document.getElementById('sound-answerhover');
const heartSoundEl = document.getElementById('heart-sound');
const angelSoundEl = document.getElementById('angel-sound');
const listingSoundEl = document.getElementById('sound-listing');


function playSound(el, volume = 0.8) {
  if (!el) return;
  try {
    el.currentTime = 0;
    el.volume = volume;
    el.play().catch(() => {});
  } catch (e) {}
}


      const wizardBubbleEl = document.getElementById('wizard-bubble');
      const wizardBubbleTextEl = document.getElementById('wizard-bubble-text');
      const wizardMediaEl = document.querySelector('.wizard-media');
const wizardVideoEl = document.getElementById('toc-wizard-video');
const wizardImgEl = document.getElementById('toc-wizard-img');

const WIZARD_YES_FILES = [
  'animations/wizard_yes_1.mp4',
  'animations/wizard_yes_2.mp4',
  'animations/wizard_yes_3.mp4',
  'animations/wizard_yes_4.mp4',
  'animations/wizard_yes_5.mp4',
  'animations/wizard_yes_6.mp4',
  'animations/wizard_yes_7.mp4',
  'animations/wizard_yes_8.mp4'
];

const WIZARD_NO_FILES = [
  'animations/wizard_no_1.mp4',
  'animations/wizard_no_2.mp4',
  'animations/wizard_no_3.mp4',
  'animations/wizard_no_4.mp4',
  'animations/wizard_no_5.mp4',
  'animations/wizard_no_6.mp4',
  'animations/wizard_no_7.mp4',
  'animations/wizard_no_8.mp4'
];

function playWizardAnimation(kind){ // kind: 'yes' | 'no'
  if (!wizardMediaEl || !wizardVideoEl || !wizardImgEl) return;

  const pool = kind === 'yes' ? WIZARD_YES_FILES : WIZARD_NO_FILES;
  if (!pool.length) return;

  const file = pool[Math.floor(Math.random() * pool.length)];
  wizardVideoEl.src = file;

  wizardMediaEl.classList.add('is-animating');

  try {
    wizardVideoEl.pause();
    wizardVideoEl.currentTime = 0;
  } catch (e) {}

  const stop = () => {
    wizardMediaEl.classList.remove('is-animating');
    wizardVideoEl.removeEventListener('ended', stop);
  };

  wizardVideoEl.addEventListener('ended', stop, { once: true });

  const p = wizardVideoEl.play();
  if (p && typeof p.catch === 'function') {
    p.catch(() => stop());
  }
}


function updateVariationPlayButtonIcon(playBtnEl) {
  if (!playBtnEl) return;
  // ▷ — play, ❚❚ — pause
  playBtnEl.textContent = variationAutoRunning ? '❚❚' : '▷';
  playBtnEl.title = variationAutoRunning ? 'Pause' : 'Play';
}




function stopVariationAuto(playBtnEl) {
  if (variationAutoTimer) {
    clearInterval(variationAutoTimer);
    variationAutoTimer = null;
  }
  variationAutoRunning = false;
  updateVariationPlayButtonIcon(playBtnEl);
}

function playVariationAuto(playBtnEl) {
  if (!variationMode) return;

  if (variationIndex >= variationMovesSan.length) {
    variationIndex = 0;
    renderVariationPosition();
  }

  stopVariationAuto(playBtnEl);
  variationAutoRunning = true;
  updateVariationPlayButtonIcon(playBtnEl);

  variationAutoTimer = setInterval(() => {
    if (!variationMode) {
      stopVariationAuto(playBtnEl);
      return;
    }

    if (variationIndex < variationMovesSan.length) {
      variationIndex++;
      renderVariationPosition();
    } else {
      stopVariationAuto(playBtnEl);
    }
  }, variationAutoDelayMs);
}

function toggleVariationAuto(playBtnEl) {
  if (variationAutoRunning) stopVariationAuto(playBtnEl);
  else playVariationAuto(playBtnEl);
}





function stopProofAuto() {
  if (proofAutoTimer) {
    clearInterval(proofAutoTimer);
    proofAutoTimer = null;
  }
  proofAutoRunning = false;
}

function autoplayMovesFromCurrentPosition(movesSan, onDone) {
  stopProofAuto();

  if (!Array.isArray(movesSan) || movesSan.length === 0) {
    if (typeof onDone === 'function') onDone();
    return;
  }

  let i = 0;
  proofAutoRunning = true;

  proofAutoTimer = setInterval(() => {
    if (!proofMode) {
      stopProofAuto();
      return;
    }

    const san = movesSan[i];
    const mv = game.move(san);
    if (!mv) {
      // если SAN не применился — остановимся
      stopProofAuto();
      if (typeof onDone === 'function') onDone();
      return;
    }

    board.position(game.fen());
    updateBoardAndNotation();

    i++;

    if (i >= movesSan.length) {
      stopProofAuto();
      if (typeof onDone === 'function') onDone();
    }
  }, proofAutoDelayMs);
}























      function wizardSay(text) {
        if (!wizardBubbleEl || !wizardBubbleTextEl) return;
        const safeText = (text || '').toString().trim();
        if (!safeText) return;
        wizardBubbleTextEl.textContent = safeText;
        wizardBubbleEl.classList.add('visible');
      }

      function wizardCommentForAnswer(moment, selectedSan, isCorrect) {
        const expl =
          (moment && moment.explanations && moment.explanations[selectedSan])
            ? moment.explanations[selectedSan]
            : '';

        if (expl) {
          wizardSay(expl);
          return;
        }

        if (isCorrect) {
          wizardSay(`Ход ${selectedSan} — верно.`);
        } else {
          wizardSay(`Ход ${selectedSan} — не лучший. Попробуй иначе.`);
        }
      }





      function triggerHitImpact() {
        if (!boardWrapperEl) return;
        boardWrapperEl.classList.remove('hit-impact');
        void boardWrapperEl.offsetWidth;
        boardWrapperEl.classList.add('hit-impact');
      }

function triggerDiamondImpact() {
  if (!boardWrapperEl) return;
  boardWrapperEl.classList.remove('hit-impact-diamond');
  void boardWrapperEl.offsetWidth;
  boardWrapperEl.classList.add('hit-impact-diamond');
}


function clearHintHighlights() {
  const squares = document.querySelectorAll('#board .square-55d63');
  squares.forEach(sq => sq.classList.remove('hint-from', 'hint-to'));
}

function addHintHighlight(square, cls) {
  const el = document.querySelector('#board .square-55d63[data-square="' + square + '"]');
  if (el) el.classList.add(cls);
}


/**
 * Находит (from,to) для SAN из ТЕКУЩЕЙ позиции game.
 * Важно: в manual-вопросе позиция уже стоит на нужном моменте.
 */
function getMoveSquaresForSanFromCurrentPosition(san) {
  const legal = game.moves({ verbose: true });
  const mv = legal.find(m => m.san === san);
  if (!mv) return null;
  return { from: mv.from, to: mv.to, piece: mv.piece }; // piece: 'p','n','b','r','q','k'
}

function pieceNameRu(pieceChar) {
  const map = { p: 'пешка', n: 'конь', b: 'слон', r: 'ладья', q: 'ферзь', k: 'король' };
  return map[pieceChar] || 'фигура';
}

function resetManualHintState() {
  manualHintStage = 0;
  manualHintMomentKey = null;
  clearHintHighlights();
  if (wizardHintBtn) wizardHintBtn.disabled = false;
}

      function clearHoverHighlights() {
        const squares = document.querySelectorAll('#board .square-55d63');
        squares.forEach(sq => {
          sq.classList.remove('hover-highlight-from', 'hover-highlight-to');
        });
      }

      function highlightMoveOnBoard(from, to) {
        clearHoverHighlights();
        if (!from || !to) return;

        const fromEl = document.querySelector(
          '#board .square-55d63[data-square="' + from + '"]'
        );
        const toEl = document.querySelector(
          '#board .square-55d63[data-square="' + to + '"]'
        );

        if (fromEl) fromEl.classList.add('hover-highlight-from');
        if (toEl) fromEl && toEl.classList.add('hover-highlight-to');
      }

      function getMoveSquaresForSan(moment, san) {
        const tmp = new Chess();
        for (let i = 0; i < moment.index && i < movesList.length; i++) {
          tmp.move(movesList[i]);
        }
        const legal = tmp.moves({ verbose: true });
        const mv = legal.find(m => m.san === san);
        if (!mv) return null;
        return { from: mv.from, to: mv.to };
      }


let tapSelectedSquare = null;
let tapLegalTargets = new Set();
const boardElLocal = document.getElementById('board');
function isMobileTapMode(){
  return window.matchMedia('(max-width: 900px)').matches;
}

function clearTapHints(){
  tapSelectedSquare = null;
  tapLegalTargets.clear();
  const all = document.querySelectorAll('#board .square-55d63');
  all.forEach(sq => sq.classList.remove('tap-selected','tap-legal','tap-capture'));
}

function showTapHints(fromSquare){
  clearTapHints();
  tapSelectedSquare = fromSquare;

  const fromEl = document.querySelector('#board .square-55d63[data-square="' + fromSquare + '"]');
  if (fromEl) fromEl.classList.add('tap-selected');

  const legal = game.moves({ verbose: true });
  legal
    .filter(m => m.from === fromSquare)
    .forEach(m => {
      tapLegalTargets.add(m.to);
      const toEl = document.querySelector('#board .square-55d63[data-square="' + m.to + '"]');
      if (!toEl) return;
      toEl.classList.add('tap-legal');
      if (m.flags && m.flags.includes('c')) {
        toEl.classList.add('tap-capture');
      }
    });
}

function tryTapMove(toSquare){
  if (!tapSelectedSquare) return false;
  if (!tapLegalTargets.has(toSquare)) return false;

  const move = game.move({
    from: tapSelectedSquare,
    to: toSquare,
    promotion: 'q'
  });

  if (!move) return false;

  // обработка "manual" вопроса (важно: повторяем вашу логику из onDrop)
  if (manualQuestionActive && activeManualMoment) {
    const san = move.san;
    const correctSan = activeManualMoment.correctMoveSan;

    if (san === correctSan) {

      stopQuestionTimer();
      hideQuestionTimerUI();

      const delta = getMomentPoints(activeManualMoment);
      score += delta;
      updateScoreDisplay(delta);

      if (delta === 3) {
        playDiamondSound();
        triggerDiamondImpact();;
        diamondMoves.add(activeManualMoment.index);
      } else {
        playRightSound();
	 if (delta === 2) {
    playMagicTwoSound();
  }
      }

      statusEl.style.color = 'green';
      statusEl.textContent = 'Верно!';
      resetManualHintState();
      const expl =
        activeManualMoment.explanations &&
        activeManualMoment.explanations[correctSan]
          ? activeManualMoment.explanations[correctSan]
          : '';

      if (explanationEl) {
        explanationEl.textContent = expl;
        explanationEl.style.color = '#333';
      } wizardCommentForAnswer(activeManualMoment, san, true);

      answeredMoments.add(activeManualMoment.index);
      updateProgress();

      manualQuestionActive = false;
      activeManualMoment = null;
      questionActive = false;

updateWizardHintBtnVisibility();


// === PROOF MODE: если это manual-вопрос мини-квеста — продолжаем сценарий ===
if (proofMode) {
  // закрываем текущий manual-вопрос
  manualQuestionActive = false;
  activeManualMoment = null;
  questionActive = true;

  const quest = proofAlt && proofAlt.proofQuest;
  const step = quest && quest.steps ? quest.steps[proofStepIndex] : null;

  const afterMoves = step ? (step.afterCorrectAutoplayMoves || []) : [];

  // проигрываем ответные ходы, потом следующий шаг
  autoplayMovesFromCurrentPosition(afterMoves, () => {
    startProofStep(proofStepIndex + 1);
  });

  return;
}



      prevMoveBtn.disabled = false;
      nextMoveBtn.disabled = false;

      syncCurrentIndexWithGame();
      board.position(game.fen());
      updateBoardAndNotation();

      clearTapHints();
      return true;
    } else {
      // откатываем ход
      game.undo();

      loseLife();

      statusEl.style.color = 'red';
      statusEl.textContent = 'Неправильно, попробуй найти более сильное продолжение.';

      const delta = -1;
      score += delta;
      updateScoreDisplay(delta);

      playWrongSound();

      const explWrong =
        activeManualMoment.explanations &&
        activeManualMoment.explanations[san]
          ? activeManualMoment.explanations[san]
          : '';

      if (explanationEl) {
        explanationEl.textContent = explWrong;
        explanationEl.style.color = '#333';
      }

      wizardCommentForAnswer(activeManualMoment, san, false);

      // остаёмся в режиме подсказок
      board.position(game.fen());
      showTapHints(tapSelectedSquare);
      return false;
    }
  }

  // обычный режим
  wizardSay(`Выбран ход: ${move.san}`);
  syncCurrentIndexWithGame();
  board.position(game.fen());
  updateBoardAndNotation();

  clearTapHints();
  return true;
}

/* Делегирование кликов по клеткам */
if (boardElLocal) {
  boardElLocal.addEventListener('click', (e) => {
    if (variationMode) return;
    if (!isMobileTapMode()) return;
    if (questionActive && !manualQuestionActive) return;

    const sqEl = e.target.closest('#board .square-55d63');
    if (!sqEl) return;

    const square = sqEl.getAttribute('data-square');
    if (!square) return;

    // 1) если есть выбранная фигура — пробуем сделать ход
    if (tapSelectedSquare) {
      if (square === tapSelectedSquare) {
        clearTapHints();
        return;
      }
      if (tryTapMove(square)) return;
      // если не получилось — продолжаем (возможно, хотим выбрать другую фигуру)
    }

    // 2) выбираем фигуру, если она наша и сейчас её ход
    const piece = game.get(square);
    if (!piece) {
      clearTapHints();
      return;
    }

    const myColor = game.turn(); // 'w' or 'b'
    if (piece.color !== myColor) {
      clearTapHints();
      return;
    }
    showTapHints(square);
  }, { passive: true });
}

/* при перелистывании ходов/перезагрузке/ресайзе — чистим точки */
window.addEventListener('resize', () => {
  if (!isMobileTapMode()) clearTapHints();
});






     function onDragStart(source, piece, position, orientation) {
  if (window.matchMedia('(max-width: 900px)').matches) return false; // mobile: only tap-to-move
  if (game.game_over()) return false;
  if (variationMode) return false;
  if (questionActive && !manualQuestionActive) return false;
  if (game.turn() === 'w' && piece[0] === 'b') return false;
  if (game.turn() === 'b' && piece[0] === 'w') return false;
}

      function onDrop(source, target) {
        if (questionActive && !manualQuestionActive) return 'snapback';

        const move = game.move({
          from: source,
          to: target,
          promotion: 'q'
        });
        if (move === null) return 'snapback';

        if (manualQuestionActive && activeManualMoment) {
          const san = move.san;
          const correctSan = activeManualMoment.correctMoveSan;

          if (san === correctSan) {

            stopQuestionTimer();
	    hideQuestionTimerUI();

            const delta = getMomentPoints(activeManualMoment);
            score += delta;
            updateScoreDisplay(delta);

            if (delta === 3) {
              playDiamondSound();
              triggerDiamondImpact();
              diamondMoves.add(activeManualMoment.index);
            } else if (delta === 2) {
    playMagicTwoSound();      // только магический звук
  } else {
    playRightSound();         // обычный звук для 1 очка
  }
  playWizardAnimation('yes');
            statusEl.style.color = 'green';
            statusEl.textContent = 'Верно!';
	    resetManualHintState();
            const expl =
              activeManualMoment.explanations &&
              activeManualMoment.explanations[correctSan]
                ? activeManualMoment.explanations[correctSan]
                : '';

            if (explanationEl) {
              explanationEl.textContent = expl;
              explanationEl.style.color = '#333';
            }

            wizardCommentForAnswer(activeManualMoment, san, true);

            answeredMoments.add(activeManualMoment.index);
            updateProgress();

            manualQuestionActive = false;
            activeManualMoment = null;
            questionActive = false;

	    updateWizardHintBtnVisibility();


// === PROOF MODE: если это manual-вопрос мини-квеста — продолжаем сценарий ===
if (proofMode) {
  // закрываем текущий manual-вопрос
  manualQuestionActive = false;
  activeManualMoment = null;
  questionActive = true;

  const quest = proofAlt && proofAlt.proofQuest;
  const step = quest && quest.steps ? quest.steps[proofStepIndex] : null;

  const afterMoves = step ? (step.afterCorrectAutoplayMoves || []) : [];

  // проигрываем ответные ходы, потом следующий шаг
  autoplayMovesFromCurrentPosition(afterMoves, () => {
    startProofStep(proofStepIndex + 1);
  });

  return;
}





            prevMoveBtn.disabled = false;
            nextMoveBtn.disabled = false;

            syncCurrentIndexWithGame();
            board.position(game.fen());
            updateBoardAndNotation();

            clearHoverHighlights();
            return;
          } else {
            game.undo();

            loseLife();

            statusEl.style.color = 'red';
            statusEl.textContent = 'Неправильно, попробуй найти более сильное продолжение.';

            const delta = -1;
            score += delta;
            updateScoreDisplay(delta);

            playWrongSound();
	    playWizardAnimation('no');

            const explWrong =
              activeManualMoment.explanations &&
              activeManualMoment.explanations[san]
                ? activeManualMoment.explanations[san]
                : '';

            if (explanationEl) {
              explanationEl.textContent = explWrong;
              explanationEl.style.color = '#333';
            }

            wizardCommentForAnswer(activeManualMoment, san, false);

            return 'snapback';
          }
        }

        wizardSay(`Выбран ход: ${move.san}`);
        syncCurrentIndexWithGame();
        updateBoardAndNotation();
      }

      function onSnapEnd() {
        board.position(game.fen());
      }

      const questionTitleEl = document.getElementById('question-title');
      const questionTextEl = document.getElementById('question-text');
      const answersEl = document.getElementById('answers');
      const statusEl = document.getElementById('status');
      const explanationEl = document.getElementById('explanation');
      const nextBtn = document.getElementById('next-btn');
      const notationContentEl = document.getElementById('notation-content');
      const moveCounterEl = document.getElementById('move-counter');
      const prevMoveBtn = document.getElementById('prev-move-btn');
      const nextMoveBtn = document.getElementById('next-move-btn');
      const wizardNextMoveBtn = document.getElementById('wizard-next-move-btn');

		if (wizardNextMoveBtn) {
  		wizardNextMoveBtn.addEventListener('click', () => {
    		// Поведение как у кнопки "Вперёд" под доской
    		if (questionActive) return;
    		if (currentMoveIndex < movesList.length) {
      		currentMoveIndex++;
      		playChessMoveNavSound(0.45);
      		const mv = movesList[currentMoveIndex - 1];
      		if (mv && mv.san) wizardSay(`Ход партии: ${mv.san}`);
      		updateBoardAndNotation();
    		}
  		});
	}

     const wizardHintBtn = document.getElementById('wizard-hint-btn');

     		if (wizardHintBtn) {
  		wizardHintBtn.addEventListener('click', () => {
		
    		// Подсказки только когда игрок ДОЛЖЕН сделать ход (manual)
    		if (!manualQuestionActive || !activeManualMoment) {
     		wizardSay('Подсказки доступны, когда нужно сделать ход на доске.');
      		return;
    	}
    updateWizardHintBtnVisibility();
    // если момент сменился — сбросим стадию
    const key = activeManualMoment.index + '|' + (activeManualMoment.correctMoveSan || '');
    if (manualHintMomentKey !== key) {
      manualHintMomentKey = key;
      manualHintStage = 0;
      clearHintHighlights();
    }

    const correctSan = activeManualMoment.correctMoveSan;
    const squares = getMoveSquaresForSanFromCurrentPosition(correctSan);

    if (!squares) {
      // значит SAN не матчится с текущей позицией (или ошибка в SAN)
      wizardSay('Не могу построить подсказку для этой позиции.');
      return;
    }

    // 2-ступенчатая подсказка: 1) from, 2) to, затем по кругу
    if (manualHintStage === 0 || manualHintStage === 2) {
      // этап 1: подсветить откуда ходит
      manualHintStage = 1;

      // снимаем 1 очко
      score -= 1;
      updateScoreDisplay(-1);

      clearHintHighlights(); 
      addHintHighlight(squares.from, 'hint-from');
      wizardSay('Обрати внимание, ходит ' + pieceNameRu(squares.piece) + '.');
      return;
    }

    if (manualHintStage === 1) {
      // этап 2: подсветить куда ходить
      manualHintStage = 2;

      score -= 1;
      updateScoreDisplay(-1);

      addHintHighlight(squares.to, 'hint-to');
      wizardSay('Только кнопки умеешь жать, а самому догадаться?!');
      return;
    }
  });
}



      const introTextEl = document.getElementById('intro-text');
      const scoreContainerEl = document.getElementById('score');
      const scoreValueEl = document.getElementById('score-value');
      const flipBoardBtn = document.getElementById('flip-board-btn');
      const victoryEffectEl = document.getElementById('victory-effect');
      const victorySoundEl = document.getElementById('victory-sound');
      const fullVictorySoundEl = document.getElementById('full-victory-sound');
      const soundRightEl = document.getElementById('sound-right');
      const magicTwoSoundEl = document.getElementById('magic-two-sound');
      const soundWrongEl = document.getElementById('sound-wrong');
      const diamondSoundEl = document.getElementById('diamond-sound');
      const gameoverSoundEl = document.getElementById('gameover-sound');

const chessMoveSoundEl = new Audio('sound/chesspieces.mp3');
chessMoveSoundEl.preload = 'auto';

function playChessMoveNavSound(volume = 0.45) {
  if (!chessMoveSoundEl) return;
  try {
    chessMoveSoundEl.pause();
    chessMoveSoundEl.currentTime = 0;
    chessMoveSoundEl.volume = volume;
    chessMoveSoundEl.play().catch(() => {});
  } catch (e) {}
}






      const gameoverOverlayEl = document.getElementById('gameover-overlay');
      const gameoverRestartBtnEl = document.getElementById('gameover-restart-btn');
      const gameoverVideoEl = document.getElementById('gameover-video');
      const resizeHandleEl = document.getElementById('resize-board-handle');
      const boardEl = document.getElementById('board');
      const questionBlockEl = document.getElementById('question-block');
      const notationBlockEl = document.getElementById('notation-block');
// === FIX: не увеличиваем доску на десктопе ===
// На широких экранах оставляем "дизайнерский" размер из макета,
// на узких (<=900px) включаем авто-подгон.
function autoFitBoard() {
  if (!boardEl) return;

  const isNarrow = window.matchMedia('(max-width: 900px)').matches;

  if (!isNarrow) {
    // Десктоп: фиксированные размеры как в CSS/макете
    const desktopBoardSize = 415;
    const desktopNotationSize = 420;

    boardEl.style.width = desktopBoardSize + 'px';
    if (notationBlockEl) {
      notationBlockEl.style.width = desktopNotationSize + 'px';
    }

    try { board.resize(); } catch (e) {}
    try { updateAllArrowsPositions(); } catch (e) {}
    renderBoardCoords(); 
    return;
  }

  // Мобильные/планшеты: резиновый размер под контейнер
  const padding = 24;
  const container =
    document.getElementById('quest-container') ||
    document.getElementById('layout') ||
    document.body;

  const containerWidth =
    container.getBoundingClientRect().width || window.innerWidth;

  let size = Math.floor(containerWidth - padding);
  size = Math.max(260, Math.min(size, 520));

  boardEl.style.width = size + 'px';
  if (notationBlockEl) {
    notationBlockEl.style.width = size + 'px';
  }

  try { board.resize(); } catch (e) {}
  try { updateAllArrowsPositions(); } catch (e) {}
}
      const progressContainerEl = document.getElementById('progress-container');
      const progressBarEl = document.getElementById('progress-bar');
      const progressLabelEl = document.getElementById('progress-label');

      const survivalBtnEl = document.getElementById('survival-btn');
      const livesContainerEl = document.getElementById('lives-container');
      const proBtnEl = document.getElementById('pro-btn');
      const questionTimerEl = document.getElementById('question-timer');





      const tocButtons = document.querySelectorAll('#toc .toc-item');

// === MOBILE TOC toggle ===
const tocToggleBtn = document.getElementById('toc-toggle-btn');
const tocOverlay = document.getElementById('toc-overlay');

function isMobileLayout() {
  return window.matchMedia('(max-width: 900px)').matches;
}

function openToc() {
  document.body.classList.add('toc-open');
  if (tocOverlay) tocOverlay.hidden = false;
  if (tocToggleBtn) tocToggleBtn.setAttribute('aria-expanded', 'true');
}

function closeToc() {
  document.body.classList.remove('toc-open');
  if (tocOverlay) tocOverlay.hidden = true;
  if (tocToggleBtn) tocToggleBtn.setAttribute('aria-expanded', 'false');
}

function toggleToc() {
  if (document.body.classList.contains('toc-open')) closeToc();
  else openToc();
}

if (tocToggleBtn) {
  tocToggleBtn.addEventListener('click', () => {
    if (!isMobileLayout()) return; // на десктопе кнопка и так скрыта, но на всякий случай
    toggleToc();
  });
}

if (tocOverlay) {
  tocOverlay.addEventListener('click', () => {
    closeToc();
  });
}

// Закрывать меню по ESC (удобно на планшетах/клавиатурах)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeToc();
});

// При смене ориентации/resize: если вышли на десктоп — снять блокировки
window.addEventListener('resize', () => {
  if (!isMobileLayout()) closeToc();
});



      const boardArrowLayerEl = document.getElementById('board-arrow-layer');

      const eraProgressEl = document.getElementById('era-progress');
      const eraProgressFillEl = document.getElementById('era-progress-fill');
      const eraProgressThumbEl = document.getElementById('era-progress-thumb');
      const eraProgressCurrentEl = document.getElementById('era-progress-current');

      const eraProgressMap = {
        0: 0,   // Greco 1623
        1: 3,
        2: 6,
        3: 9,
        4: 12,  // La Bourdonnais – McDonnell 1834
        5: 15,  // Anderssen–Kieseritzky 1851
        6: 20,  // Anderssen–Dufresne 1852
        7: 30,  // Morphy 1857–58
        8: 33,
        9: 36,
        10: 39,
        11: 55, // Gunsberg–Chigorin 1890
        12: 58, // Chigorin–Pollock 1889
        13: 60, // Chigorin–Steinitz 1892
        14: 50  // Steinitz–Sellman 1885
      };

      const eraTextMap = {
        0: 'Ранний романтизм · Греко, XVII век',
        1: 'Ранний романтизм · Греко',
        2: 'Ранний романтизм · Греко',
        3: 'Ранний романтизм · Греко',
        4: 'Переход к классическому романтизму · Ла Бурдонне vs Макдоннелл',
        5: 'Классический романтизм · Андерссен (Бессмертная партия)',
        6: 'Классический романтизм · Андерссен',
        7: 'Классический романтизм · Морфи',
        8: 'Классический романтизм · Морфи',
        9: 'Классический романтизм · Морфи',
        10: 'Классический романтизм · Морфи',
        11: 'Конец XIX века · Чигорин',
        12: 'Конец XIX века · Чигорин',
        13: 'Конец XIX века · Чигорин vs Стейниц',
        14: 'Конец XIX века · Стейниц'
      };

      function setEraProgressForGame(gameIndex) {
        if (!eraProgressFillEl || !eraProgressThumbEl) return;
        const pct = (gameIndex in eraProgressMap) ? eraProgressMap[gameIndex] : 0;
        eraProgressFillEl.style.width = pct + '%';
        eraProgressThumbEl.style.left = pct + '%';

        if (eraProgressCurrentEl) {
          const text = eraTextMap[gameIndex] || '';
          eraProgressCurrentEl.textContent = text;
        }
      }

      const boardArrows = new Map();

      let rightMouseDown = false;
      let rightMouseStartSquare = null;
      let rightMouseStartPos = { x: 0, y: 0 };
      let rightMouseDragged = false;

      function renderLives() {
        if (!livesContainerEl) return;
        const hearts = livesContainerEl.querySelectorAll('.life-heart');
        hearts.forEach((h, idx) => {
          const lifeIndex = idx + 1;
          if (lifeIndex <= lives) {
            h.classList.remove('lost');
          } else {
            h.classList.add('lost');
          }
        });
      }


      function formatMsToMMSS(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function renderQuestionTimer() {
  if (!questionTimerEl) return;
  questionTimerEl.textContent = formatMsToMMSS(questionTimeLeftMs);

  // по желанию: красим, когда мало времени
  if (questionTimeLeftMs <= 15000) {
    questionTimerEl.style.color = '#b91c1c';
  } else {
    questionTimerEl.style.color = '';
  }
}

function stopQuestionTimer() {
  if (questionTimerId) {
    clearInterval(questionTimerId);
    questionTimerId = null;
  }
}

function hideQuestionTimerUI() {
  if (!questionTimerEl) return;
  questionTimerEl.style.display = 'none';
}

function showQuestionTimerUI() {
  if (!questionTimerEl) return;
  questionTimerEl.style.display = 'block';
}

function onQuestionTimeExpired() {
  // Время вышло — считаем как ошибку (минус жизнь и минус 1 очко, как у тебя за wrong)
  // Если хочешь без минуса очков — убери блок score ниже.
  stopQuestionTimer();

  if (!proMode) return;
  if (!questionActive) return; // если вопрос уже закрыт — ничего не делаем

  statusEl.style.color = '#b91c1c';
  statusEl.textContent = 'Время вышло!';

  // штраф по очкам (как за неправильный ответ)
  score -= 1;
  updateScoreDisplay(-1);

  // минус жизнь (работает только если survivalMode=true, поэтому в proMode мы включим survivalMode)
  loseLife();

  wizardSay('Время вышло. Попробуй ещё раз быстрее.');

  // ВАЖНО: вопрос остаётся активным, игрок может пробовать дальше,
  // но таймер надо перезапустить заново на 2:00
  startQuestionTimer();
}

function startQuestionTimer() {
  // Таймер работает только в proMode и только когда вопрос активен
  if (!proMode) return;
  if (!questionActive) return;

  stopQuestionTimer();
  showQuestionTimerUI();

  questionTimeLeftMs = PRO_QUESTION_TIME_MS;
  renderQuestionTimer();

  questionTimerId = setInterval(() => {
    questionTimeLeftMs -= 250; // шаг 250мс выглядит плавнее
    if (questionTimeLeftMs <= 0) {
      questionTimeLeftMs = 0;
      renderQuestionTimer();
      onQuestionTimeExpired();
      return;
    }
    renderQuestionTimer();
  }, 250);
}
























      function setSurvivalUIVisible(isVisible) {
        if (!livesContainerEl) return;
        if (isVisible) {
          livesContainerEl.classList.add('visible');
        } else {
          livesContainerEl.classList.remove('visible');
        }
      }

      function resetLives() {
        lives = 3;
        renderLives();
      }

      function loseLife() {
        if (!survivalMode) return;
        if (lives <= 0) return;
        lives -= 1;
        renderLives();
        if (lives <= 0) {
          triggerDefeat();
        }
      }

      function triggerDefeat() {

	stopQuestionTimer();
        hideQuestionTimerUI();

        questionActive = true;
        manualQuestionActive = false;
        activeManualMoment = null;

        prevMoveBtn.disabled = true;
        nextMoveBtn.disabled = true;

        clearHoverHighlights();

        hideGameoverOverlay();
        showGameoverOverlay();

        if (introTextEl) {
          introTextEl.style.display = 'none';
        }

        questionTitleEl.style.display = 'block';
        questionTextEl.style.display = 'block';
        questionTitleEl.textContent = 'Поражение';
        questionTextEl.textContent = 'Ты исчерпал(а) все жизни в режиме выживания.';

        answersEl.innerHTML = '';
        statusEl.style.color = '#b91c1c';
        statusEl.textContent = 'Жизни закончились.';
        if (explanationEl) explanationEl.textContent = '';

        wizardSay('Режим выживания: 3 ошибки — поражение. Нажми «Начать заново», чтобы попробовать ещё раз.');
      }

      function updateScoreDisplay(delta = 0) {
        if (!scoreValueEl) return;

        scoreValueEl.textContent = 'Очки: ' + score;

        if (delta !== 0 && scoreContainerEl) {
          if (delta > 0) {
            scoreValueEl.classList.add('score-pulse');
            setTimeout(() => {
              scoreValueEl.classList.remove('score-pulse');
            }, 350);
          }

          const popup = document.createElement('span');
          popup.classList.add('score-popup');
          popup.classList.add(delta > 0 ? 'positive' : 'negative');
          popup.textContent = (delta > 0 ? '+' : '') + delta;
          scoreContainerEl.appendChild(popup);

          popup.addEventListener('animationend', () => {
            popup.remove();
          });
        }
      }

      function getMomentPoints(moment) {
        if (!moment) return 0;
        return typeof moment.points === 'number' ? moment.points : 1;
      }

      function getMaxScoreForCurrentGame() {
        if (!keyMoments || keyMoments.length === 0) return 0;
        return keyMoments.reduce((sum, m) => sum + getMomentPoints(m), 0);
      }

      function updateProgress() {
        if (!progressContainerEl || !progressBarEl || !progressLabelEl) return;

        if (!keyMoments || keyMoments.length === 0) {
          progressContainerEl.style.display = 'none';
          return;
        }

        const total = keyMoments.length;
        const done = answeredMoments.size;
        const percent = Math.round((done / total) * 100);

        progressContainerEl.style.display = 'block';
        progressBarEl.style.width = percent + '%';
        progressLabelEl.textContent = `Прогресс квеста: ${done}/${total}`;
      }

      if (flipBoardBtn) {
        flipBoardBtn.addEventListener('click', () => {
          board.flip();
          updateAllArrowsPositions();
	  renderBoardCoords();
        });
      }

      if (resizeHandleEl && boardEl) {
        let isResizing = false;
        let startX = 0;
        let startY = 0;
        let startSize = 0;

        const minSize = 260;
        const maxSize = 720;

        function onMouseMoveResize(e) {
          if (!isResizing) return;
          const dx = e.clientX - startX;
          const dy = e.clientY - startY;
          const delta = Math.max(dx, dy);
          let newSize = startSize + delta;
          if (newSize < minSize) newSize = minSize;
          if (newSize > maxSize) newSize = maxSize;

          boardEl.style.width = newSize + 'px';
          if (notationBlockEl) {
            notationBlockEl.style.width = newSize + 'px';
          }
          board.resize();
          updateAllArrowsPositions();
        }

        function onMouseUpResize() {
          if (!isResizing) return;
          isResizing = false;
          document.removeEventListener('mousemove', onMouseMoveResize);
          document.removeEventListener('mouseup', onMouseUpResize);
        }

        resizeHandleEl.addEventListener('mousedown', (e) => {
          e.preventDefault();
          isResizing = true;
          startX = e.clientX;
          startY = e.clientY;
          startSize = boardEl.getBoundingClientRect().width;
          document.addEventListener('mousemove', onMouseMoveResize);
          document.addEventListener('mouseup', onMouseUpResize);
        });
      }

      function applyMovesUpTo(moveIndex) {
        const tmpGame = new Chess();
        for (let i = 0; i < moveIndex && i < movesList.length; i++) {
          tmpGame.move(movesList[i]);
        }
        game.load(tmpGame.fen());
        board.position(game.fen());
      }

      function syncCurrentIndexWithGame() {
        const tmp = new Chess();
        let idx = 0;
        for (let i = 0; i < movesList.length; i++) {
          tmp.move(movesList[i]);
          if (tmp.fen() === game.fen()) {
            idx = i + 1;
            break;
          }
        }
        currentMoveIndex = idx;
      }

      function getMomentByIndex(index) {
        return keyMoments.find(m => m.index === index) || null;
      }

      function checkForQuestion() {
        const moment = getMomentByIndex(currentMoveIndex);

        if (!moment || answeredMoments.has(moment.index)) {
          return;
        }

        if (moment.type === 'manual') {
          showManualQuestion(moment);
          return;
        }

        showQuestionForMoment(moment);
      }

     function findAltCorrect(moment, san) {
  	const arr = moment && Array.isArray(moment.altCorrect) ? moment.altCorrect : [];
  	return arr.find(a => a && a.san === san) || null;
	}











function enterVariationMode(moment, lineObj) {
  // moment — вопрос, из которого мы ушли смотреть
  // lineObj — { title, movesSan: [...] }




  stopQuestionTimer();
  hideQuestionTimerUI();
  variationMode = true;
  savedMomentForVariation = moment;

  // сохраняем текущую основную позицию (она сейчас в game на моменте index)
  savedMainFen = game.fen();
  savedMainMoveIndex = currentMoveIndex;

  variationTitle = lineObj.title || 'Вариант';
  variationMovesSan = Array.isArray(lineObj.movesSan) ? lineObj.movesSan.slice() : [];
  variationIndex = 0;

  // блокируем обычное управление вопросами/ответами
  questionActive = true;          // чтобы ваша логика не перескакивала дальше
  manualQuestionActive = false;prevMoveBtn.disabled = false;
  nextMoveBtn.disabled = false;

  // показываем интерфейс просмотра варианта
  renderVariationUI();
  renderVariationPosition();
}

function renderVariationUI() {
  if (introTextEl) introTextEl.style.display = 'none';

  questionTitleEl.style.display = 'block';
  questionTextEl.style.display = 'block';
  questionTitleEl.textContent = variationTitle;
  questionTextEl.textContent = 'Просмотр варианта (можно Play).';

  answersEl.innerHTML = '';

  const controls = document.createElement('div');
  controls.className = 'variation-controls';

  const playBtn = document.createElement('button');
  playBtn.className = 'var-icon-btn';
  playBtn.type = 'button';
  playBtn.addEventListener('click', () => {
    toggleVariationAuto(playBtn);
  });

  const restartBtn = document.createElement('button');
  restartBtn.className = 'var-icon-btn';
  restartBtn.type = 'button';
  restartBtn.textContent = '↻';
  restartBtn.title = 'Restart';
  restartBtn.addEventListener('click', () => {
    stopVariationAuto(playBtn);
    variationIndex = 0;
    renderVariationPosition();
  });

  const backBtn = document.createElement('button');
  backBtn.className = 'back-quest-btn';
  backBtn.type = 'button';
  backBtn.innerHTML = 'Вернуться';
  backBtn.addEventListener('click', () => {
    exitVariationMode();
  });

  controls.appendChild(backBtn);
  controls.appendChild(playBtn);
  controls.appendChild(restartBtn);

  answersEl.appendChild(controls);

  statusEl.textContent = '';
  if (explanationEl) explanationEl.textContent = '';

  // выставляем правильную иконку (по умолчанию будет ▶)
  updateVariationPlayButtonIcon(playBtn);

  wizardSay('Смотри вариант: можно запустить Play.');
}
function renderVariationPosition() {
  // строим позицию: старт — сохранённый FEN, затем проигрываем variationIndex SAN-ходов
  const tmp = new Chess(savedMainFen);

  for (let i = 0; i < variationIndex; i++) {
    const san = variationMovesSan[i];
    const mv = tmp.move(san);
    if (!mv) {
      // если SAN не применился (ошибка в SAN/позиции) — остановимся
      break;
    }
  }

  game.load(tmp.fen());
  board.position(game.fen());

  // обновим «нотацию» так, чтобы было видно вариант
  if (notationContentEl) {
    let html = '';
    for (let i = 0; i < variationIndex; i++) {
      html += variationMovesSan[i] + ' ';
    }
    notationContentEl.innerHTML = html || '(начало варианта)';
  }

  // счётчик ходов под кнопками можете также обновить
  if (moveCounterEl) {
    moveCounterEl.textContent = `Вариант: ${variationIndex}/${variationMovesSan.length}`;
  }
}

function exitVariationMode() {
  stopVariationAuto();

  variationMode = false;
  // если вернулись в вопрос — таймер снова запустится showQuestionForMoment/showManualQuestion
// но если вопрос активен прямо сейчас — можно подстраховаться
if (questionActive) startQuestionTimer();
else hideQuestionTimerUI();
  updateWizardHintBtnVisibility();

  variationMovesSan = [];
  variationIndex = 0;
  variationTitle = '';

  game.load(savedMainFen);
  board.position(game.fen());
  currentMoveIndex = savedMainMoveIndex;

  questionActive = false;
  manualQuestionActive = false;

  prevMoveBtn.disabled = true;
  nextMoveBtn.disabled = true;

  if (savedMomentForVariation) {
    showQuestionForMoment(savedMomentForVariation);
  } else {
    updateBoardAndNotation();
  }

  savedMomentForVariation = null;
}



function enterProofMode(moment, altObj) {
  
  
  proofMode = true;
  proofMoment = moment;
  proofAlt = altObj;
  proofStepIndex = 0;

  stopQuestionTimer();
  hideQuestionTimerUI();

  // сохраняем основную позицию (как вы делаете для варианта)
  savedProofMainFen = game.fen();
  savedProofMainMoveIndex = currentMoveIndex;

  // блокируем обычную навигацию по партии, пока идёт мини-квест
  questionActive = true;
  manualQuestionActive = false;
  activeManualMoment = null;

  prevMoveBtn.disabled = true;
  nextMoveBtn.disabled = true;

  renderProofUI();
  startProofStep(0);
}

function exitProofMode(returnToMoment = true) {
  stopProofAuto();

  proofMode = false;

  if (questionActive) startQuestionTimer();
  else hideQuestionTimerUI();


  proofStepIndex = 0;

  // вернуться в исходную позицию основного квеста
  game.load(savedProofMainFen);
  board.position(game.fen());
  currentMoveIndex = savedProofMainMoveIndex;

  questionActive = false;
  manualQuestionActive = false;
  activeManualMoment = null;

  updateWizardHintBtnVisibility();

  prevMoveBtn.disabled = false;
  nextMoveBtn.disabled = false;

  if (returnToMoment && proofMoment) {
    // снова показываем исходный вопрос
    showQuestionForMoment(proofMoment);
  } else {
    updateBoardAndNotation();
  }

  proofMoment = null;
  proofAlt = null;
}

function renderProofUI() {
  if (introTextEl) introTextEl.style.display = 'none';

  questionTitleEl.style.display = 'block';
  questionTextEl.style.display = 'block';
  questionTitleEl.textContent = (proofAlt && proofAlt.proofQuest && proofAlt.proofQuest.title)
    ? proofAlt.proofQuest.title
    : 'Доказательство';

  questionTextEl.textContent = 'Мини‑квест: докажи, что альтернатива работает.';

  answersEl.innerHTML = '';

  const backBtn = document.createElement('button');
  backBtn.className = 'back-quest-btn';
  backBtn.type = 'button';
  backBtn.textContent = 'Вернуться';
  backBtn.addEventListener('click', () => exitProofMode(true));

  answersEl.appendChild(backBtn);

  statusEl.textContent = '';
  if (explanationEl) explanationEl.textContent = '';

  wizardSay('Докажи идею: сначала посмотрим линию, потом тебе нужно будет сделать ходы на доске.');
}

function startProofStep(stepIdx) {
  const quest = proofAlt && proofAlt.proofQuest;
  if (!quest || !Array.isArray(quest.steps)) {
    // тут можно сразу выходить, потому что квест некорректен
    exitProofMode(true);
    return;
  }

  const step = quest.steps[stepIdx];

  if (!step) {
    // === ВАЖНО: НЕ ВЫХОДИМ из proofMode автоматически ===
    // оставляем текущую позицию на доске (после финального хода)

    const reward = typeof quest.rewardPoints === 'number' ? quest.rewardPoints : 0;
    if (reward > 0) {
      score += reward;
      updateScoreDisplay(reward);
    }

    questionActive = true;
    manualQuestionActive = false;
    activeManualMoment = null;

    // можно разблокировать навигацию, но чаще лучше оставить заблокированной,
    // чтобы пользователь не "сломал" доказанную позицию случайно
    prevMoveBtn.disabled = true;
    nextMoveBtn.disabled = true;

    // UI финала мини-квеста
    questionTitleEl.style.display = 'block';
    questionTextEl.style.display = 'block';
    questionTitleEl.textContent = 'Доказательство завершено';
    questionTextEl.textContent = 'Вариант доказан. Нажми «Вернуться», чтобы вернуться к основному вопросу.';

    answersEl.innerHTML = '';

    const backBtn = document.createElement('button');
    backBtn.className = 'back-quest-btn';
    backBtn.type = 'button';

    // текст завернём в span, чтобы ваш CSS для span работал
    backBtn.innerHTML = 'Вернуться';
    backBtn.addEventListener('click', () => exitProofMode(true));

    answersEl.appendChild(backBtn);

    statusEl.textContent = '';
    if (explanationEl) explanationEl.textContent = '';

    wizardSay('Отлично! Вариант доказан. Если хочешь вернуться — нажми «Вернуться».');
    return;
  }

  proofStepIndex = stepIdx;

  autoplayMovesFromCurrentPosition(step.autoplayMoves || [], () => {
    showProofManualQuestion(step);
  });
}
function showProofManualQuestion(step) {
   resetManualHintState();
  // мы используем вашу существующую логику manual-вопроса,
  // но "момент" создаём на лету.
  const pseudoMoment = {
    index: -1000 - proofStepIndex, // фиктивный индекс
    question: step.question,
    type: 'manual',
    correctMoveSan: step.correctMoveSan,
    explanations: step.explanations || {}
  };

  questionActive = true;
  manualQuestionActive = true;
  activeManualMoment = pseudoMoment;
  updateWizardHintBtnVisibility();


  // UI как у manual-вопроса
  statusEl.style.color = '#333';
  statusEl.textContent = 'Сделай ход на доске.';

  questionTitleEl.style.display = 'block';
  questionTextEl.style.display = 'none';

  answersEl.innerHTML = '';

  const backBtn =document.createElement('button');
  backBtn.className = 'back-quest-btn';
  backBtn.type = 'button';
  backBtn.textContent = 'Вернуться';
  backBtn.addEventListener('click', () => exitProofMode(true));
  answersEl.appendChild(backBtn);


  wizardSay(step.question + 'nСделай ход на доске.');
}


function updateWizardHintBtnVisibility() {
  if (!wizardHintBtn) return;

  // Кнопка должна быть видна только в режиме manual-вопроса
  const shouldShow =
    manualQuestionActive === true &&
    !!activeManualMoment &&
    variationMode === false &&
    proofMode === false;

  wizardHintBtn.style.display = shouldShow ? "inline-flex" : "none";
}






      function updateBoardAndNotation() {
	 // В режимах, где позицию двигают НЕ по mainline-индексу,
  	// нельзя принудительно "перезагружать" mainline.
       	if (!proofMode && !variationMode) {
    		applyMovesUpTo(currentMoveIndex);
  		}
	 // если сейчас нет активного вопроса и не показывается финальное резюме —
      // прячем блок вопросов/ответов
      if (!questionActive && !summaryShown) {
        if (questionTitleEl) {
          questionTitleEl.style.display = 'none';
          questionTitleEl.textContent = '';
        }
        if (questionTextEl) {
          questionTextEl.style.display = 'none';
          questionTextEl.textContent = '';
        }
        if (answersEl) {
          answersEl.innerHTML = '';
        }
        if (statusEl) {
          statusEl.textContent = '';
        }
        if (explanationEl) {
          explanationEl.textContent = '';
          explanationEl.style.color = '#333';
        }
      }
	clearTapHints();
        if (moveCounterEl) {
  const currentMoveNumber = Math.ceil(currentMoveIndex / 2) || 0;
  const totalMoveNumber   = Math.ceil(movesList.length / 2);
  moveCounterEl.textContent = `Ход: ${currentMoveNumber}/${totalMoveNumber}`;
}

        let html = '';
        const visibleMovesCount = currentMoveIndex;
        for (let i = 0; i < visibleMovesCount; i++) {
          const move = movesList[i];
          if (i % 2 === 0) {
            const moveNumber = (i / 2) + 1;
            html += moveNumber + '. ';
          }
          const isCurrent = (i === currentMoveIndex - 1);
          const san = move.san;
          let displaySan = san;
          if (diamondMoves.has(i)) {
            displaySan = san + '!!';
          }
          if (isCurrent) {
            html += '<span class="current-move">' + displaySan + '</span> ';
          } else {
            html += displaySan + ' '; 
          }

        }
        notationContentEl.innerHTML = html;
        const currentSpan = notationContentEl.querySelector('.current-move');
        if (currentSpan) {
          const top = currentSpan.offsetTop - notationContentEl.offsetTop;
          notationContentEl.scrollTop = top - 20;
        } else {
          notationContentEl.scrollTop = 0;
        }

        if (!questionActive) {
          clearHoverHighlights();
          checkForQuestion();
        }

        if (
          !summaryShown &&
          currentMoveIndex === movesList.length &&
          (!keyMoments || keyMoments.length === 0 || answeredMoments.size === keyMoments.length)
        ) {
          showFinalSummary();
        }

 // Показ/скрытие кнопки "Дальше" под волшебником
        if (wizardNextMoveBtn) {
          // Кнопка видна, когда НЕТ активного вопроса и партия ещё не долистана до конца
          const canGoNext = !questionActive && currentMoveIndex < movesList.length && !summaryShown;
          wizardNextMoveBtn.style.display = canGoNext ? 'inline-flex' : 'none';
        }

	updateWizardHintBtnVisibility();

      }

function goToNextQuest() {
  const nextIndex = currentGameIndex + 1;
  if (nextIndex < gamesData.length) {
    loadGame(nextIndex);
  } else {
    // Если квестов больше нет — можно показать сообщение волшебника
    wizardSay('Это был последний квест в списке. Скоро появятся новые!');
  }
}


      function loadGame(index) {
        currentGameIndex = index;
        const data = gamesData[index];
        hideGameoverOverlay();

	stopQuestionTimer();
        hideQuestionTimerUI();



       if (introTextEl) {
  introTextEl.innerHTML = '';

  const h2 = document.createElement('h2');
  h2.textContent = data.title;
  introTextEl.appendChild(h2);

  const paragraphs = data.introParagraphs || [];
  const pageSize = 1; // сколько абзацев показывать на одной "странице"
  let currentPage = 0;

  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'intro-paged-content';
  introTextEl.appendChild(contentWrapper);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'read-more-btn';
  introTextEl.appendChild(btn);

  function renderPage(pageIndex){
    contentWrapper.innerHTML = '';

    const start = pageIndex * pageSize;
    const end = Math.min(start + pageSize, paragraphs.length);

    for (let i = start; i < end; i++) {
      const p = document.createElement('p');
      p.textContent = paragraphs[i];
      contentWrapper.appendChild(p);
    }

    if (paragraphs.length <= pageSize) {
      btn.style.display = 'none';
    } else {
      btn.style.display = 'inline-flex';
      if (end >= paragraphs.length) {
        btn.textContent = 'Назад';
      } else {
        btn.textContent = 'Читать дальше';
      }
    }
  }

  btn.addEventListener('click', () => {
    const totalPages = Math.ceil(paragraphs.length / pageSize);
    currentPage = (currentPage + 1) % totalPages; // листаем по кругу
    renderPage(currentPage);
    playSound(listingSoundEl, 0.8);
  });

  // начальная страница
  renderPage(0);
  introTextEl.style.display = 'block';
}

        questionTitleEl.style.display = 'none';
        questionTextEl.style.display = 'none';
        answersEl.innerHTML = '';
        statusEl.textContent = '';
        if (explanationEl) {
          explanationEl.textContent = '';
          explanationEl.style.color = '#333';
        }
        nextBtn.style.display = 'none';

        score = 0;
        updateScoreDisplay(0);
        answeredMoments.clear();
        diamondMoves.clear();
        questionActive = false;
        manualQuestionActive = false;
        activeManualMoment = null;
        summaryShown = false;

        stopVictoryEffect();
        stopVictorySound();

        if (survivalMode) {
          resetLives();
        }
        renderLives();

        referenceGame = new Chess();
        const ok = referenceGame.load_pgn(data.pgn);
        if (!ok) {
          console.error('Не удалось загрузить PGN для партии:', data.id);
          movesList = [];
        } else {
          movesList = referenceGame.history({ verbose: true });
        }
        keyMoments = data.keyMoments || [];

        game.reset();
        currentMoveIndex = 0;
        board.orientation('white');
        board.position('start');
        clearHoverHighlights();
        clearAllUserHighlights();
        clearAllArrows();
        updateBoardAndNotation();

        updateProgress();
        autoFitBoard();
        prevMoveBtn.disabled = false;
        nextMoveBtn.disabled = false;

        updateTocHighlight();

        setEraProgressForGame(index);

        wizardSay('Выбери партию и листай ходы кнопкой Вперед. А в ключевые моменты я буду подсказывать что делать дальше.');
      }

     function updateTocHighlight() {
  tocButtons.forEach((btn) => {
    const idx = parseInt(btn.dataset.gameIndex, 10);
    if (!Number.isNaN(idx) && idx === currentGameIndex) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Подсветка группы, где находится активный пункт
  const groups = document.querySelectorAll('#toc .toc-group');
  groups.forEach(g => g.classList.remove('has-active'));
  const active = document.querySelector('#toc .toc-item.active');
  if (active) {
    const parent = active.closest('.toc-group');
    if (parent) parent.classList.add('has-active');
  }
}


      prevMoveBtn.addEventListener('click', () => {
  if (variationMode) {
    if (variationIndex > 0) {
      variationIndex--;
      renderVariationPosition();
    }
    return;
  }

  if (questionActive) return;
  if (currentMoveIndex > 0) {
    currentMoveIndex--;
    const mv = movesList[currentMoveIndex - 1];
    if (mv && mv.san) wizardSay(`Смотрим позицию после: ${mv.san}`);
    updateBoardAndNotation();
  }
});

      nextMoveBtn.addEventListener('click', () => {
  if (variationMode) {
    if (variationIndex < variationMovesSan.length) {
      variationIndex++;
      renderVariationPosition();
    }
    return;
  }

  if (questionActive) return;
  if (currentMoveIndex < movesList.length) {
    currentMoveIndex++;
    const mv = movesList[currentMoveIndex - 1];
    if (mv && mv.san) wizardSay(`Ход партии: ${mv.san}`);
    updateBoardAndNotation();
  }
});

      document.addEventListener('keydown', (event) => {
        if (questionActive) return;

        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          if (currentMoveIndex > 0) {
            currentMoveIndex--;
            const mv = movesList[currentMoveIndex - 1];
            if (mv && mv.san) wizardSay(`Смотрим позицию после: ${mv.san}`);
            updateBoardAndNotation();
          }
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          if (currentMoveIndex < movesList.length) {
            currentMoveIndex++;
            const mv = movesList[currentMoveIndex - 1];
            if (mv && mv.san) wizardSay(`Ход партии: ${mv.san}`);
            updateBoardAndNotation();
          }
        }
      });

      tocButtons.forEach(btn => {
        const idx = parseInt(btn.dataset.gameIndex, 10);

        btn.addEventListener('mouseenter', () => {
          if (Number.isNaN(idx)) return;
          setEraProgressForGame(idx);
        });

        btn.addEventListener('mouseleave', () => {
          setEraProgressForGame(currentGameIndex);
        });

        btn.addEventListener('click', () => {
if (Number.isNaN(idx)) return;

  /* 1) сворачиваем группу, где был выбран пункт */
  playSound(questChoiceSoundEl, 0.75);
  const parentGroup = btn.closest('.toc-group');
  if (parentGroup) {
    parentGroup.classList.add('collapsed');
  }

  /* 2) закрываем мобильную панель */
  if (isMobileLayout()) {
    closeToc();
  }

  /* 3) грузим квест */
  loadGame(idx);
        });
      });

      const tocGroups = document.querySelectorAll('#toc .toc-group');
      tocGroups.forEach(group => {
        const title = group.querySelector('.toc-group-title');
        const list = group.querySelector('ol');
        if (!title || !list) return;

        title.addEventListener('click', () => {
	  playSound(clickTocSoundEl, 0.6);
          group.classList.toggle('collapsed');
        });
      });

      if (survivalBtnEl) {
        survivalBtnEl.addEventListener('click', () => {
          survivalMode = !survivalMode;

          if (survivalMode) {
            resetLives();
            setSurvivalUIVisible(true);
            survivalBtnEl.classList.add('active');
            wizardSay('Режим выживания включён: у тебя 3 жизни. Каждая ошибка — минус жизнь.');
          } else {
            setSurvivalUIVisible(false);
            survivalBtnEl.classList.remove('active');
            wizardSay('Режим выживания выключен.');
          }

          renderLives();
        });

if (proBtnEl) {
  proBtnEl.addEventListener('click', () => {
    proMode = !proMode;

    if (proMode) {
      // PRO включает жизни: используем твою систему survivalMode + lives
      survivalMode = true;
      resetLives();
      setSurvivalUIVisible(true);
      renderLives();

      proBtnEl.classList.add('active');
      if (survivalBtnEl) survivalBtnEl.classList.add('active');

      wizardSay('PRO режим включён: 3 жизни и 2 минуты на каждый вопрос.');

      // если прямо сейчас уже открыт вопрос — стартуем таймер
      if (questionActive) startQuestionTimer();
      else hideQuestionTimerUI();
    } else {
      // выключаем pro: таймер убрать
      stopQuestionTimer();
      hideQuestionTimerUI();

      proBtnEl.classList.remove('active');

      wizardSay('PRO режим выключен.');
      // survivalMode можно оставить как было (или выключать тоже — как тебе нужно).
      // Если хочешь, чтобы PRO выключал и survival, раскомментируй:
      // survivalMode = false;
      // setSurvivalUIVisible(false);
      // if (survivalBtnEl) survivalBtnEl.classList.remove('active');
    }
  });
}

if (proBtnEl && angelSoundEl) {
  proBtnEl.addEventListener('mouseenter', () => {
    playSound(angelSoundEl, 0.7);
  });
}




      }
if (survivalBtnEl && heartSoundEl) {
  survivalBtnEl.addEventListener('mouseenter', () => {
    playSound(heartSoundEl, 0.7);
  });
}




      function launchVictoryEffect() {
        if (!victoryEffectEl) return;
        victoryEffectEl.innerHTML = '';
        victoryEffectEl.style.display = 'block';

        const colors = [
          '#f97316',
          '#facc15',
          '#22c55e',
          '#06b6d4',
          '#3b82f6',
          '#6366f1',
          '#a855f7',
          '#ec4899',
          '#ffffff'
        ];

        const bursts = 10;
        const particlesPerBurst = 26;

        for (let b = 0; b < bursts; b++) {
          const centerX = 10 + Math.random() * 80;
          const centerY = 15 + Math.random() * 45;

          const core = document.createElement('div');
          core.className = 'firework-core';
          core.style.left = centerX + 'vw';
          core.style.top = centerY + 'vh';
          core.style.background = 'radial-gradient(circle, ' +
            colors[Math.floor(Math.random() * colors.length)] +
            ' 0%, rgba(255,255,255,0) 70%)';
          core.style.animationDelay = (b * 0.12) + 's';
          victoryEffectEl.appendChild(core);

          const ring = document.createElement('div');
          ring.className = 'firework-ring';
          ring.style.left = centerX + 'vw';
          ring.style.top = centerY + 'vh';
          ring.style.borderColor = colors[Math.floor(Math.random() * colors.length)];
          ring.style.animationDelay = (b * 0.12 + 0.05) + 's';
          victoryEffectEl.appendChild(ring);

          for (let i = 0; i < particlesPerBurst; i++) {
            const angle = (Math.PI * 2 * i) / particlesPerBurst;
            const distance = 90 + Math.random() * 80;

            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance;

            const dot = document.createElement('div');
            dot.className = 'firework';
            dot.style.left = centerX + 'vw';
            dot.style.top = centerY + 'vh';
            dot.style.setProperty('--dx', dx + 'px');
            dot.style.setProperty('--dy', dy + 'px');
            dot.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            dot.style.boxShadow =
              '0 0 10px ' + dot.style.backgroundColor +
              ', 0 0 22px ' + dot.style.backgroundColor;
            dot.style.animationDelay = (b * 0.12 + Math.random() * 0.08) + 's';

            victoryEffectEl.appendChild(dot);
          }
        }

        setTimeout(() => {
          stopVictoryEffect();
        }, 2600);
      }

      function stopVictoryEffect() {
        if (!victoryEffectEl) return;
        victoryEffectEl.style.display = 'none';
        victoryEffectEl.innerHTML = '';
      }

      function showGameoverOverlay() {
        if (!gameoverOverlayEl) return;
        gameoverOverlayEl.classList.add('visible');

        if (gameoverVideoEl) {
          try {
            gameoverVideoEl.currentTime = 0;
            gameoverVideoEl.play().catch(() => {});
          } catch (e) {
            console.warn('Не удалось воспроизвести видео Game Over:', e);
          }
        }
      }

      function hideGameoverOverlay() {
        if (!gameoverOverlayEl) return;
        gameoverOverlayEl.classList.remove('visible');

        if (gameoverVideoEl) {
          try {
            gameoverVideoEl.pause();
          } catch (e) {}
        }
      }

      function playVictorySound() {
        if (!victorySoundEl) return;
        try {
          victorySoundEl.currentTime = 0;
          victorySoundEl.volume = 0.7;
          victorySoundEl.play().catch(() => {});
        } catch (e) {
          console.warn('Не удалось проиграть звук победы:', e);
        }
      }

      function stopVictorySound() {
        if (!victorySoundEl) return;
        try {
          victorySoundEl.pause();
          victorySoundEl.currentTime = 0;
        } catch (e) {}
      }

      function playFullVictorySound() {
        if (!fullVictorySoundEl) return;
        try {
          fullVictorySoundEl.currentTime = 0;
          fullVictorySoundEl.volume = 0.8;
          fullVictorySoundEl.play().catch(() => {});
        } catch (e) {
          console.warn('Не удалось проиграть full_victory.mp3:', e);
        }
      }

      function playRightSound() {
        if (!soundRightEl) return;
        try {
          soundRightEl.currentTime = 0;
          soundRightEl.volume = 0.9;
          soundRightEl.play().catch(() => {});
        } catch (e) {
          console.warn('Не удалось проиграть sound_right.mp3:', e);
        }
      }

	function playMagicTwoSound() {
  if (!magicTwoSoundEl) return;
  try {
    magicTwoSoundEl.currentTime = 0;
    magicTwoSoundEl.volume = 0.9;
    magicTwoSoundEl.play().catch(() => {});
  } catch (e) {
    console.warn('Не удалось проиграть magicsound+2.mp3:', e);
  }
}





      function playWrongSound() {
        if (!soundWrongEl) return;
        try {
          soundWrongEl.currentTime = 0;
          soundWrongEl.volume = 0.9;
          soundWrongEl.play().catch(() => {});
        } catch (e) {
          console.warn('Не удалось проиграть sound_no_right.mp3:', e);
        }
      }

      function playDiamondSound() {
        if (!diamondSoundEl) return;
        try {
          diamondSoundEl.currentTime = 0;
          diamondSoundEl.volume = 0.9;
          diamondSoundEl.play().catch(() => {});
        } catch (e) {
          console.warn('Не удалось проиграть diamond.mp3:', e);
        }
      }

      function playGameoverSound() {
        if (!gameoverSoundEl) return;
        try {
          gameoverSoundEl.currentTime = 0;
          gameoverSoundEl.volume = 0.9;
          gameoverSoundEl.play().catch(() => {});
        } catch (e) {
          console.warn('Не удалось проиграть gameover.mp3:', e);
        }
      }

      function stopGameoverSound() {
        if (!gameoverSoundEl) return;
        try {
          gameoverSoundEl.pause();
          gameoverSoundEl.currentTime = 0;
        } catch (e) {}
      }

function showFinalSummary() {
  summaryShown = true;

  stopQuestionTimer();
  hideQuestionTimerUI();

  updateProgress();

  if (!keyMoments || keyMoments.length === 0) {
    questionTitleEl.style.display = 'block';
    questionTextEl.style.display = 'block';
    questionTitleEl.textContent = 'Квест пройден!';
    questionTextEl.textContent =
      'В этой партии не было вопросов‑квестов. Можно спокойно просмотреть ходы и перейти к следующей партии через оглавление слева.';
    answersEl.innerHTML = '';
    statusEl.textContent = '';
    if (explanationEl) explanationEl.textContent = '';

    launchVictoryEffect();
    playVictorySound();

    wizardSay('Партия завершена. Здесь вопросов не было — просто наслаждайся просмотром!');
    return;
  }

  const maxScore = getMaxScoreForCurrentGame();

  questionActive = false;
  manualQuestionActive = false;
  activeManualMoment = null;
  clearHoverHighlights();

  if (introTextEl) {
    introTextEl.style.display = 'none';
  }
  questionTitleEl.style.display = 'block';
  questionTextEl.style.display = 'block';

  questionTitleEl.textContent = 'Квест пройден!';
  questionTextEl.textContent =
    `Твой результат: ${score} из ${maxScore} очков.`;

  // очищаем блок с ответами и статус
  answersEl.innerHTML = '';
  statusEl.textContent = '';
  if (explanationEl) {
    explanationEl.textContent = '';
  }

// Кнопка "Перейти к следующему квесту" (если он есть)
const nextIndex = currentGameIndex + 1;
if (nextIndex < gamesData.length) {
  const nextQuestBtn = document.createElement('button');
  nextQuestBtn.textContent = 'Следующий квест';
  nextQuestBtn.className = 'next-quest-btn';
  nextQuestBtn.classList.add('is-shimmering');
  nextQuestBtn.addEventListener('click', () => {
    goToNextQuest();
    playSound(questChoiceSoundEl, 0.75);
  });

  answersEl.appendChild(nextQuestBtn);
} else {
  const info = document.createElement('p');
  info.textContent = 'Это был последний квест в текущем наборе.';
  info.style.marginTop = '10px';
  answersEl.appendChild(info);
}


  prevMoveBtn.disabled = false;
  nextMoveBtn.disabled = false;

  launchVictoryEffect();
  playVictorySound();

  wizardSay(`Итог: ${score} / ${maxScore}. Отличная работа! Можешь перейти к следующему квесту.`);
}
      function showQuestionForMoment(moment) {
        if (survivalMode && lives <= 0) return;

        questionActive = true;
        manualQuestionActive = false;
        activeManualMoment = null;

        statusEl.textContent = '';
        statusEl.style.color = '';
        if (explanationEl) {
          explanationEl.textContent = '';
          explanationEl.style.color = '#333';
        }
        nextBtn.style.display = 'none';
        answersEl.innerHTML = '';
        clearHoverHighlights();

        if (introTextEl) {
          introTextEl.style.display = 'none';
        }
        questionTitleEl.style.display = 'block';
        questionTextEl.style.display = 'none';

        prevMoveBtn.disabled = true;
        nextMoveBtn.disabled = true;


        if (wizardNextMoveBtn) {
          wizardNextMoveBtn.style.display = 'none';
        }


        const questionIndex = keyMoments.findIndex(m => m.index === moment.index);
        const questionNumber = questionIndex !== -1 ? questionIndex + 1 : '';
        questionTitleEl.textContent = questionNumber ? `Вопрос № ${questionNumber}` : 'Вопрос';

        questionTextEl.textContent = '';

        wizardSay(moment.question);
	// PRO: старт таймера на вопрос
        startQuestionTimer();



        const sanToSquares = {};
        (moment.options || []).forEach(san => {
          sanToSquares[san] = getMoveSquaresForSan(moment, san);
        });

        const shuffledOptions = (moment.options || [])
          .map(o => ({ value: o, sort: Math.random() }))
          .sort((a, b) => a.sort - b.sort)
          .map(o => o.value);

        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

        shuffledOptions.forEach((optionSan, idx) => {
  const row = document.createElement('div');
  row.className = 'answer-row';

  const btn = document.createElement('button');
  btn.textContent = optionSan;
  btn.classList.add('answer-option');
  btn.dataset.letter = letters[idx] || '';

  const squares = sanToSquares[optionSan] || null;

  btn.addEventListener('mouseenter', () => {
    if (!questionActive) return;
    playSound(answerHoverSoundEl, 0.35);
    if (squares) highlightMoveOnBoard(squares.from, squares.to);
  });

  btn.addEventListener('mouseleave', () => {
    if (!questionActive) return;
    clearHoverHighlights();
  });

  btn.addEventListener('click', () => {
    checkAnswerForMoment(optionSan, moment, row);
  });

  row.appendChild(btn);

  // "Глаз" создаём сразу, но скрываем
  const eyeBtn = document.createElement('button');
  eyeBtn.className = 'answer-eye-btn';
  eyeBtn.type = 'button';
  eyeBtn.textContent = '👁';
  eyeBtn.style.display = 'none';
  eyeBtn.title = 'Посмотреть вариант';
  row.appendChild(eyeBtn);

  answersEl.appendChild(row);
});

      }

      function showManualQuestion(moment) {
        if (survivalMode && lives <= 0) return;

        questionActive = true;
        manualQuestionActive = true;
        activeManualMoment = moment;
	updateWizardHintBtnVisibility();
        resetManualHintState();

        statusEl.textContent = '';
        statusEl.style.color = '';
        if (explanationEl) {
          explanationEl.textContent = '';
          explanationEl.style.color = '#333';
        }
        nextBtn.style.display = 'none';
        answersEl.innerHTML = '';
        clearHoverHighlights();

        if (introTextEl) {
          introTextEl.style.display = 'none';
        }
        questionTitleEl.style.display = 'block';
        questionTextEl.style.display = 'none';

        prevMoveBtn.disabled = true;
        nextMoveBtn.disabled = true;


	if (wizardNextMoveBtn) {
          wizardNextMoveBtn.style.display = 'none';
        }

        const questionIndex = keyMoments.findIndex(m => m.index === moment.index);
        const questionNumber = questionIndex !== -1 ? questionIndex + 1 : '';
        questionTitleEl.textContent = questionNumber ? `Вопрос № ${questionNumber}` : 'Вопрос';

        questionTextEl.textContent = '';

        statusEl.style.color = '#333';
        statusEl.textContent = 'Подумай и сделай ход на доске.';

        wizardSay(moment.question + '\nСделай ход на доске.');
        // PRO: старт таймера на вопрос
        startQuestionTimer();
      }

      function checkAnswerForMoment(selectedSan, moment, rowEl) {
	const alt = findAltCorrect(moment, selectedSan);

        if (survivalMode && lives <= 0) return;

        const buttons = Array.from(answersEl.querySelectorAll('button'));

        buttons.forEach(b => b.disabled = true);

        const explanationText =
          (moment.explanations && moment.explanations[selectedSan]) ?
            moment.explanations[selectedSan] :
            '';

        clearHoverHighlights();

        if (selectedSan === moment.correctMoveSan) {
          stopQuestionTimer();
          hideQuestionTimerUI();
          const delta = getMomentPoints(moment);
          score += delta;
          updateScoreDisplay(delta);

          if (delta === 3) {
            playDiamondSound();
            triggerDiamondImpact();
            diamondMoves.add(moment.index);
          } else if (delta === 2) {
    		playMagicTwoSound();      // только магический звук
  		} else {
    			playRightSound();         // обычный звук для 1 очка
  		}
  		playWizardAnimation('yes');
          statusEl.style.color = 'green';
          statusEl.textContent = 'Верно!';

          if (explanationEl) {
            explanationEl.textContent = explanationText;
            explanationEl.style.color = '#333';
          }

          wizardCommentForAnswer(moment, selectedSan, true);

          buttons.forEach(b => {
            if (b.textContent === moment.correctMoveSan) {
              b.classList.add('correct');
            }
          });

          answeredMoments.add(moment.index);
          updateProgress();

          const mv = game.move(moment.correctMoveSan);
board.position(game.fen());

// мы сделали ровно один полуход после позиции момента
currentMoveIndex = moment.index + 1;

questionActive = false;
prevMoveBtn.disabled = false;
nextMoveBtn.disabled = false;
updateBoardAndNotation();

          nextBtn.style.display = 'none';
	  return;
        } 
if (alt) {
 // 1) Подсветка ЖЁЛТЫМ именно кнопки ответа (а не строки)
  const answerBtn = rowEl ? rowEl.querySelector('button.answer-option') : null;
  if (answerBtn) answerBtn.classList.add(alt.highlightClass || 'alt-correct');

  // 2) Сообщение игроку
  statusEl.style.color = '#b45309';
  statusEl.textContent = 'Ход выглядит возможным, но его нужно доказать. Нажми ⊢.';

  // 3) Кнопка ⊢ (создаём один раз)
const existingThinkBtn = rowEl.querySelector('button.answer-think-btn');
if (!existingThinkBtn) {
  const thinkBtn = document.createElement('button');
  thinkBtn.className = 'answer-eye-btn answer-think-btn';
  thinkBtn.type = 'button';
  thinkBtn.textContent = '⊢';
  thinkBtn.title = 'Доказать вариант';
  thinkBtn.style.display = 'inline-flex';

  thinkBtn.addEventListener('click', () => {
    // (опционально) защита от повторного клика по ⊢
    thinkBtn.disabled = true;

    applyMovesUpTo(moment.index);
    currentMoveIndex = moment.index;

    enterProofMode(moment, alt);
  });

  rowEl.appendChild(thinkBtn);
}

// 4) Блокируем повторный клик по ЭТОМУ альтернативному ответу,
// чтобы пользователь не плодил эффекты/состояния
const thisAnswerBtn = rowEl.querySelector('button.answer-option');
if (thisAnswerBtn) thisAnswerBtn.disabled = true;

// 5) Остальные ответы оставляем доступными (чтобы можно было передумать)
const optionButtons = answersEl.querySelectorAll('button.answer-option');
optionButtons.forEach(b => {
  if (b !== thisAnswerBtn) b.disabled = false;
});

if (explanationEl) {
  const expl = moment.explanations && moment.explanations[selectedSan];
  explanationEl.textContent = expl || 'Альтернатива интересная. Докажи её в мини-квесте.';
}

wizardSay('Это может работать. Давай докажем!');
return;

}




else {
          loseLife();
          if (survivalMode && lives <= 0) {
            return;
          }

          const delta = -1;
          score += delta;
          updateScoreDisplay(delta);

          playWrongSound();
	  playWizardAnimation('no');	  

          statusEl.style.color = 'red';
	 // Если для этого неправильного ответа предусмотрен "просмотр варианта"
const lineObj = moment.viewLineForWrong && moment.viewLineForWrong[selectedSan]
  ? moment.viewLineForWrong[selectedSan]
  : null;

if (lineObj && rowEl) {
  const eyeBtn = rowEl.querySelector('.answer-eye-btn');
  if (eyeBtn) {
    eyeBtn.style.display = 'inline-flex';
    eyeBtn.disabled = false;

    eyeBtn.onclick = () => {
  if (survivalMode && lives <= 0) return;

  enterVariationMode(moment, lineObj);

  // Автозапуск проигрывания.
  // Нюанс: кнопка Play создаётся в renderVariationUI().
  // Поэтому запустим play чуть позже, после отрисовки UI.
  setTimeout(() => {
    // Найдём кнопку play в текущем UI
    const playBtn = answersEl.querySelector('.var-icon-btn');
    playVariationAuto(playBtn);
  }, 0);
};
  }
}

          statusEl.textContent = 'Попробуй ещё раз.';

          if (explanationEl) {
            explanationEl.textContent = explanationText;
            explanationEl.style.color = '#333';
          }

          wizardCommentForAnswer(moment, selectedSan, false);

          buttons.forEach(b => {
            if (b.textContent === selectedSan) {
              b.classList.add('incorrect');
            }
          });

          buttons.forEach(b => {
            if (b.textContent !== selectedSan) b.disabled = false;
          });
        }
      }

      if (boardEl) {
        boardEl.addEventListener('contextmenu', (e) => {
          e.preventDefault();
        });
      }

      function getSquareByClientPos(clientX, clientY) {
        const elem = document.elementFromPoint(clientX, clientY);
        if (!elem) return null;
        const sqEl = elem.closest('#board .square-55d63');
        if (!sqEl) return null;
        return sqEl.getAttribute('data-square') || null;
      }

      function toggleSquareHighlight(square) {
        if (!square) return;
        const sqEl = document.querySelector('#board .square-55d63[data-square="' + square + '"]');
        if (!sqEl) return;
        sqEl.classList.toggle('user-highlight-square');
      }

      function clearAllUserHighlights() {
        const squares = document.querySelectorAll('#board .square-55d63.user-highlight-square');
        squares.forEach(sq => sq.classList.remove('user-highlight-square'));
      }

      function toggleArrow(from, to) {
        if (!from || !to || from === to || !boardArrowLayerEl) return;
        const key = from + '-' + to;
        if (boardArrows.has(key)) {
          const obj = boardArrows.get(key);
          if (obj && obj.lineEl && obj.lineEl.parentNode) {
            obj.lineEl.parentNode.removeChild(obj.lineEl);
          }
          boardArrows.delete(key);
          return;
        }

        const coordsFrom = squareToSvgCoords(from);
        const coordsTo = squareToSvgCoords(to);
        if (!coordsFrom || !coordsTo) return;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.classList.add('board-arrow');
        line.setAttribute('x1', coordsFrom.x);
        line.setAttribute('y1', coordsFrom.y);
        line.setAttribute('x2', coordsTo.x);
        line.setAttribute('y2', coordsTo.y);
        line.setAttribute('marker-end', 'url(#board-arrow-head-marker)');
        boardArrowLayerEl.appendChild(line);

        boardArrows.set(key, {
          from,
          to,
          lineEl: line
        });
      }

       function squareToSvgCoords(square) {
        if (!boardEl || !boardArrowLayerEl) return null;

        // Берём любую клетку, чтобы понять смещения и размер
        const sample = document.querySelector('#board .square-55d63');
        if (!sample) return null;

        const boardRect  = boardEl.getBoundingClientRect();
        const svgRect    = boardArrowLayerEl.getBoundingClientRect();
        const sampleRect = sample.getBoundingClientRect();

        const squareSize = sampleRect.width;
        const offsetX = sampleRect.left - boardRect.left;
        const offsetY = sampleRect.top  - boardRect.top;

        const files = ['a','b','c','d','e','f','g','h'];
        const ranks = ['1','2','3','4','5','6','7','8'];

        const fileChar = square[0];
        const rankChar = square[1];

        const fileIndex = files.indexOf(fileChar);
        const rankIndex = ranks.indexOf(rankChar);
        if (fileIndex === -1 || rankIndex === -1) return null;

        const orientation = board.orientation ? board.orientation() : 'white';

        let xIndex, yIndex;
        if (orientation === 'white') {
          xIndex = fileIndex;
          yIndex = 7 - rankIndex;   // верх-низ инвертируются
        } else {
          xIndex = 7 - fileIndex;
          yIndex = rankIndex;
        }

        const centerXInBoard = offsetX + (xIndex + 0.5) * squareSize;
        const centerYInBoard = offsetY + (yIndex + 0.5) * squareSize;

        const x = (boardRect.left - svgRect.left) + centerXInBoard;
        const y = (boardRect.top  - svgRect.top)  + centerYInBoard;

        return { x, y };
      }

      function updateArrowPosition(obj) {
        if (!obj || !obj.lineEl) return;
        const coordsFrom = squareToSvgCoords(obj.from);
        const coordsTo = squareToSvgCoords(obj.to);
        if (!coordsFrom || !coordsTo) return;

        obj.lineEl.setAttribute('x1', coordsFrom.x);
        obj.lineEl.setAttribute('y1', coordsFrom.y);
        obj.lineEl.setAttribute('x2', coordsTo.x);
        obj.lineEl.setAttribute('y2', coordsTo.y);
      }

      function updateAllArrowsPositions() {
        boardArrows.forEach(obj => updateArrowPosition(obj));
      }

      function clearAllArrows() {
        boardArrows.forEach(obj => {
          if (obj.lineEl && obj.lineEl.parentNode) {
            obj.lineEl.parentNode.removeChild(obj.lineEl);
          }
        });
        boardArrows.clear();
      }

      if (boardEl) {
        boardEl.addEventListener('mousedown', (e) => {
          if (e.button === 0) {
            clearAllArrows();
            clearAllUserHighlights();
          }
        });

        boardEl.addEventListener('mousedown', (e) => {
          if (e.button !== 2) return;

          e.preventDefault();
          e.stopPropagation();

          const sqEl = e.target.closest('.square-55d63');
          if (!sqEl) return;

          rightMouseDown = true;
          rightMouseDragged = false;
          rightMouseStartPos = { x: e.clientX, y: e.clientY };
          rightMouseStartSquare = sqEl.getAttribute('data-square') || null;
        }, true);

        document.addEventListener('mousemove', (e) => {
          if (!rightMouseDown) return;
          const dx = e.clientX - rightMouseStartPos.x;
          const dy = e.clientY - rightMouseStartPos.y;
          const dist2 = dx * dx + dy * dy;
          const threshold2 = 6 * 6;
          if (dist2 > threshold2) {
            rightMouseDragged = true;
          }
        });

        document.addEventListener('mouseup', (e) => {
          if (!rightMouseDown || e.button !== 2) return;
          e.preventDefault();

          rightMouseDown = false;

          const endSquare = getSquareByClientPos(e.clientX, e.clientY);

          if (!rightMouseDragged) {
            if (rightMouseStartSquare && rightMouseStartSquare === endSquare) {
              toggleSquareHighlight(rightMouseStartSquare);
            }
          } else {
            if (rightMouseStartSquare && endSquare && rightMouseStartSquare !== endSquare) {
              toggleArrow(rightMouseStartSquare, endSquare);
            }
          }

          rightMouseStartSquare = null;
          rightMouseDragged = false;
        });
      }

      const welcomeScreen = document.getElementById('welcome-screen');
      const layout = document.getElementById('layout');
      const startBtn = document.getElementById('start-quest-btn');




startBtn.addEventListener('click', () => {
  playFullVictorySound();

  if (gameoverRestartBtnEl) {
    gameoverRestartBtnEl.addEventListener('click', () => {
      hideGameoverOverlay();
      stopGameoverSound();
      loadGame(currentGameIndex);
    });
  }

  welcomeScreen.style.display = 'none';
  layout.style.display = 'grid';

  setTimeout(() => autoFitBoard(), 0);
  board.orientation('white');

  if (eraProgressEl) {
    eraProgressEl.style.display = 'block';
  }

  setSurvivalUIVisible(survivalMode);
  renderLives();

  loadGame(0);
});


      currentMoveIndex = 0;
      game.reset();
      board.position('start');
      updateScoreDisplay(0);

      setSurvivalUIVisible(false);
      renderLives();

      setEraProgressForGame(0);

loadGame(0);
setTimeout(() => autoFitBoard(), 0);

window.addEventListener('resize', () => {
  autoFitBoard();
});


// Прокрутка колёсиком: назад/вперёд по ходам
function onWheelScrollMoves(e){
  // если сейчас активен вопрос – не листаем
  if (questionActive) return;

  // чувствительность: игнорировать очень маленькие движения трекпада
  if (Math.abs(e.deltaY) < 10) return;

  e.preventDefault();

  if (e.deltaY > 0) {
    // вниз — следующий ход
    if (currentMoveIndex < movesList.length) {
      currentMoveIndex++;
      playChessMoveNavSound(0.45);
      const mv = movesList[currentMoveIndex - 1];
      if (mv && mv.san) wizardSay(`Ход партии: ${mv.san}`);
      updateBoardAndNotation();
    }
  } else {
    // вверх — предыдущий ход
    if (currentMoveIndex > 0) {
      currentMoveIndex--;
      playChessMoveNavSound(0.45);

      const mv = movesList[currentMoveIndex - 1];
      if (mv && mv.san) wizardSay(`Смотрим позицию после: ${mv.san}`);
      updateBoardAndNotation();
    }
  }
}

// вешаем обработчик на доску и нотацию
if (boardEl) {
  boardEl.addEventListener('wheel', onWheelScrollMoves, { passive: false });
}
if (notationContentEl) {
  notationContentEl.addEventListener('wheel', onWheelScrollMoves, { passive: false });
}
if (questionBlockEl) {
  questionBlockEl.addEventListener('wheel', onWheelScrollMoves, { passive: false });
}












    });

// === WELCOME WIZARD: проиграть один раз и заморозить на последнем кадре ===
const welcomeVideoEl = document.getElementById('welcome-video');

if (welcomeVideoEl) {
  // Видео играет один раз
  welcomeVideoEl.loop = false;

  // На всякий случай: при окончании просто ставим на паузу —
  // браузер обычно сам оставляет последний кадр на экране
  welcomeVideoEl.addEventListener('ended', () => {
    try {
      welcomeVideoEl.pause();
    } catch (e) {}
  });
}



