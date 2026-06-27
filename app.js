(function () {
  const decks = window.flashcardDecks || [];
  const state = {
    currentDeckId: null,
    currentIndex: 0,
    // stage: 0=question, 1=calculation+answer
    stage: 0,
  };

  // Normalize LaTeX math delimiters in card text to consistent forms
  function normalizeMathInline(str) {
    if (!str || typeof str !== "string") return str;
    // convert \( ... \) -> $...$
    str = str.replace(/\\\(([\s\S]*?)\\\)/g, "$$INLINE_OPEN$$$1$$INLINE_CLOSE$$");
    // convert \\\[ ... \\\] -> $$...$$ (display math)
    str = str.replace(/\\\[([\s\S]*?)\\\]/g, "$$$1$$");
    // restore inline markers to single-dollar
    str = str.replace(/\$\$INLINE_OPEN\$\$(.*?)\$\$INLINE_CLOSE\$\$/g, "$1");
    return str;
  }

  function sanitizeCardMath(card) {
    if (!card || typeof card !== "object") return;
    if (card.q) card.q = normalizeMathInline(card.q);
    if (card.a) card.a = normalizeMathInline(card.a);
    if (card.calculation) card.calculation = normalizeMathInline(card.calculation);
  }

  function sanitizeDeckMath(deck) {
    if (!deck || !Array.isArray(deck.cards)) return;
    deck.cards.forEach((c) => sanitizeCardMath(c));
  }

  const selectionView = document.getElementById("deck-selection");
  const studyView = document.getElementById("study-view");
  const deckList = document.getElementById("deck-list");
  const backButton = document.getElementById("back-to-selection");
  const prevButton = document.getElementById("prev-button");
  const nextButton = document.getElementById("next-button");
  const cardLabel = document.getElementById("card-label");
  const cardContent = document.getElementById("card-content");
  const progress = document.getElementById("progress");
  const flashcard = document.getElementById("flashcard");
  const deckTitle = document.getElementById("deck-title");
  const cardJumpInput = document.getElementById("card-jump-num");
  const cardJumpButton = document.getElementById("card-jump-button");

  function getCurrentDeck() {
    return decks.find((deck) => deck.id === state.currentDeckId) || decks[0];
  }

  function typesetMath() {
    if (window.MathJax && typeof window.MathJax.typesetPromise === "function") {
      window.MathJax.typesetPromise([cardContent]).catch((err) =>
        console.log(err),
      );
    }
  }

  function updateCard() {
    const deck = getCurrentDeck();
    if (!deck) {
      return;
    }

    state.stage = 0;
    flashcard.classList.remove("show-answer");
    cardLabel.textContent = "【問題】 タップして計算と解答を表示";
    deckTitle.textContent = deck.title;

    if (!deck.cards.length) {
      cardContent.innerHTML =
        "まだ問題はありません。<br>この単語帳に問題を追加してください。";
      progress.textContent = `0 / 0`;
      cardContent.style.fontSize =
        window.innerWidth < 600 ? "1.2rem" : "1.4rem";
      return;
    }

    const card = deck.cards[state.currentIndex];
    cardContent.innerHTML = card.q;
    progress.textContent = `${state.currentIndex + 1} / ${deck.cards.length}`;

    if (card.q.length > 80 && window.innerWidth < 600) {
      cardContent.style.fontSize = "1.2rem";
    } else if (window.innerWidth < 600) {
      cardContent.style.fontSize = "1.4rem";
    } else {
      cardContent.style.fontSize = "1.8rem";
    }

    typesetMath();
  }

  function toggleCard() {
    const deck = getCurrentDeck();
    if (!deck || !deck.cards.length) {
      return;
    }

    const card = deck.cards[state.currentIndex];
    // behavior: 0 -> 1 (show calculation + answer), then back to 0
    if (state.stage === 0) {
      flashcard.classList.add("show-answer");
      cardLabel.textContent = "【計算と解答】";
      if (card.calculation) {
        cardContent.innerHTML = card.calculation;
      } else {
        // fallback: show concise answer if no calculation provided
        cardContent.innerHTML = card.a;
      }
      state.stage = 1;
      typesetMath();
      return;
    }

    // stage === 1 -> return to question
    if (state.stage === 1) {
      updateCard();
      return;
    }
  }

  function nextCard() {
    const deck = getCurrentDeck();
    if (!deck) return;
    if (state.currentIndex >= deck.cards.length - 1) {
      // wrap to first card
      state.currentIndex = 0;
    } else {
      state.currentIndex += 1;
    }
    updateCard();
  }

  function prevCard() {
    const deck = getCurrentDeck();
    if (!deck || !deck.cards.length) return;
    if (state.currentIndex <= 0) {
      state.currentIndex = deck.cards.length - 1;
    } else {
      state.currentIndex -= 1;
    }
    updateCard();
  }

  function renderDeckSelection() {
    selectionView.classList.remove("hidden");
    studyView.classList.add("hidden");
    deckList.innerHTML = "";

    decks.forEach((deck) => {
      const button = document.createElement("button");
      button.className = "deck-card";
      button.innerHTML = `<h2>${deck.title}</h2><p>${deck.description}</p>`;
      button.addEventListener("click", () => startDeck(deck.id));
      deckList.appendChild(button);
    });
  }

  function startDeck(deckId) {
    state.currentDeckId = deckId;
    state.currentIndex = 0;
    state.stage = 0;
    selectionView.classList.add("hidden");
    studyView.classList.remove("hidden");
    // sanitize math delimiters in the deck's cards for consistent MathJax rendering
    const deck = getCurrentDeck();
    sanitizeDeckMath(deck);
    updateCard();
  }

  if (cardJumpButton && cardJumpInput) {
    cardJumpButton.addEventListener("click", () => {
      const deck = getCurrentDeck();
      if (!deck) return;
      const raw = cardJumpInput.value;
      const n = Number(raw);
      if (!raw || !Number.isInteger(n) || n < 1 || n > deck.cards.length) {
        window.alert(
          `有効なカード番号を入力してください（1〜${deck.cards.length}）。`,
        );
        return;
      }
      state.currentIndex = n - 1;
      state.stage = 0;
      updateCard();
    });
  }

  flashcard.addEventListener("click", toggleCard);
  prevButton.addEventListener("click", prevCard);
  nextButton.addEventListener("click", nextCard);
  backButton.addEventListener("click", renderDeckSelection);
  window.addEventListener("resize", updateCard);

  renderDeckSelection();
})();
