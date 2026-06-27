(function () {
  const decks = window.flashcardDecks || [];
  const state = {
    currentDeckId: null,
    currentIndex: 0,
    showingAnswer: false,
  };

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

    state.showingAnswer = false;
    flashcard.classList.remove("show-answer");
    cardLabel.textContent = "【問題】 タップして解答を表示";
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
    state.showingAnswer = !state.showingAnswer;

    if (state.showingAnswer) {
      flashcard.classList.add("show-answer");
      cardLabel.textContent = "【解答】";
      cardContent.innerHTML = card.a;

      if (card.a.length > 80 && window.innerWidth < 600) {
        cardContent.style.fontSize = "1.2rem";
      }
    } else {
      updateCard();
    }

    typesetMath();
  }

  function nextCard() {
    const deck = getCurrentDeck();
    if (!deck || state.currentIndex >= deck.cards.length - 1) {
      return;
    }
    state.currentIndex += 1;
    updateCard();
  }

  function prevCard() {
    if (state.currentIndex <= 0) {
      return;
    }
    state.currentIndex -= 1;
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
    state.showingAnswer = false;
    selectionView.classList.add("hidden");
    studyView.classList.remove("hidden");
    updateCard();
  }

  flashcard.addEventListener("click", toggleCard);
  prevButton.addEventListener("click", prevCard);
  nextButton.addEventListener("click", nextCard);
  backButton.addEventListener("click", renderDeckSelection);
  window.addEventListener("resize", updateCard);

  renderDeckSelection();
})();
