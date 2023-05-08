const quizSelector = document.getElementById("quiz-selector");
const quizContainer = document.getElementById("quiz-container");
const quizList = document.getElementById("quiz-list");
const wordGrid = document.getElementById("word-grid");
const results = document.getElementById("results");
const restartBtn = document.getElementById("restart-btn");
const shuffleMode = document.getElementById("shuffle-mode");
const reverseMode = document.getElementById("reverse-mode");
const translationMode = document.getElementById("translation-mode");

let originalQuiz;
let originalQuizId;

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

const displayResults = () => {
  const total = wordGrid.querySelectorAll(".word-container").length;
  const correct = wordGrid.querySelectorAll(".correct").length;
  const wrong = wordGrid.querySelectorAll(".wrong").length;

  results.innerHTML = `
    <p>Correct: ${correct}</p>
    <p>Wrong: ${wrong}</p>
    <p>Percentage Correct: ${(correct / total) * 100}%</p>
  `;
  results.hidden = false;
};

async function loadQuizzes() {
  const quizzes = {};

  let quizIndex = 1;
  while (true) {
    try {
      const response = await fetch(`./quizzes/quiz${quizIndex}.json`);
      if (!response.ok) {
        console.error(`Failed to load quiz${quizIndex}.json`, response);
        break;
      }
      const quizData = await response.json();
      const quizName = quizData.name; // Extract the quiz name from the 'name' property
      const quiz = quizData.questions; // Use the 'questions' property as the quiz data
      quizzes[`quiz${quizIndex}`] = { name: quizName, data: quiz };
      quizIndex++;
    } catch (error) {
      console.error(`Error while loading quiz${quizIndex}.json`, error);
      break;
    }
  }

  return quizzes;
}

async function displayQuizzes() {
  const quizzes = await loadQuizzes();
  console.log("Quizzes:", quizzes);

  for (const [quizId, quiz] of Object.entries(quizzes)) {
    const button = document.createElement("button");
    button.classList.add("quiz-button");

    // Use the 'name' property from the quiz object for the button text
    button.textContent = quiz.name || quizId;

    button.onclick = () => startQuiz(quizId, quiz);
    quizList.appendChild(button);
  }
}

async function startQuiz(quizId, quiz) {
  originalQuizId = quizId;
  originalQuiz = quiz;
  restartBtn.style.display = "block";

  function updateQuiz(reverse, shuffle) {
    wordGrid.innerHTML = "";

    let quizItems = quiz.data;
    if (shuffle) {
      // Make a copy of the quiz data before shuffling it
      quizItems = quiz.data.slice();
      shuffleArray(quizItems);
    } else {
      quizItems = quiz.data.slice();
    }

    quizItems.forEach((item, index) => {
      const container = document.createElement("div");
      container.className = "word-container";
      container.innerHTML = `
        <div>${reverse ? item.answer : item.word}</div>
        <input type="text" data-answer="${
          reverse ? item.word : item.answer
        }" data-index="${index}">
      `;

      // Translate hiragana and katakana to romaji if the translation mode is enabled
      if (translationMode.checked && isKana(item.word)) {
        const romaji = kanaToRomaji(item.word);
        container.querySelector("div").textContent = romaji;
      } else {
        container.querySelector("div").textContent = item.word;
      }
      wordGrid.appendChild(container);
    });

    attachEventListeners();

    if (autoplayMode.checked) {
      autoplay(reverse);
    }
  }

  function attachEventListeners() {
    const inputs = wordGrid.querySelectorAll("input");

    inputs.forEach((input, index) => {
      input.addEventListener("blur", () => {
        const answer = input.getAttribute("data-answer");
        const possibleAnswers = answer
          .split(",")
          .map((ans) => ans.trim().toLowerCase());
        const userAnswers = input.value
          .split(",")
          .map((ans) => ans.trim().toLowerCase());

        const isCorrect = userAnswers.every((ans) =>
          possibleAnswers.includes(ans.replace(".", ""))
        );
        if (isCorrect) {
          input.parentNode.classList.add("correct");
          input.parentNode.classList.remove("wrong");
          input.parentNode.classList.remove("selected");
          input.disabled = true;

          // Focus the next input if the answer is correct
          const nextInput = inputs[index + 1];
          if (nextInput) {
            nextInput.focus();
          }
        } else if (input.value.trim() !== "") {
          if (!input.parentNode.classList.contains("correct")) {
            input.parentNode.classList.add("wrong");
          }
        }
      });

      input.addEventListener("keydown", (event) => {
        if (
          event.key === "Enter" ||
          event.key === "Tab" ||
          event.key === "Return"
        ) {
          event.preventDefault();

          const answer = input.getAttribute("data-answer");
          const possibleAnswers = answer
            .replace(".", "")
            .split(",")
            .map((ans) => ans.trim().toLowerCase());
          const userAnswers = input.value
            .split(",")
            .map((ans) => ans.trim().toLowerCase());

          const isCorrect = userAnswers.every((ans) =>
            possibleAnswers.includes(ans.replace(".", ""))
          );
          if (isCorrect) {
            input.parentNode.classList.add("correct");
            input.parentNode.classList.remove("wrong");
            input.parentNode.classList.remove("selected");
            input.disabled = true;

            // Focus the next input if the answer is correct
            const nextInput = inputs[index + 1];
            if (nextInput) {
              nextInput.focus();
            }
          } else if (input.value.trim() !== "") {
            if (!input.parentNode.classList.contains("correct")) {
              input.parentNode.classList.add("wrong");
            }
          }
        }
      });

      // Add event listeners for focus and blur
      input.addEventListener("focus", () => {
        // Remove the 'deselected' class if it's present
        input.parentNode.classList.remove("deselected");
        // Add the 'selected' class
        input.parentNode.classList.add("selected");
      });

      input.addEventListener("blur", () => {
        // Remove the 'selected' class
        input.parentNode.classList.remove("selected");
        // Add the 'deselected' class
        input.parentNode.classList.add("deselected");
      });
    });
  }

  quizSelector.hidden = true;
  quizContainer.hidden = false;

  updateQuiz(reverseMode.checked);

  shuffleMode.addEventListener("change", () => {
    updateQuiz(reverseMode.checked, shuffleMode.checked);
  });

  reverseMode.addEventListener("change", () => {
    updateQuiz(reverseMode.checked, shuffleMode.checked);
  });

  translationMode.addEventListener("change", () => {
    updateQuiz(reverseMode.checked, shuffleMode.checked);
  });

  // Update the line with the autoplayMode event listener
  autoplayMode.addEventListener("change", () => {
    if (autoplayMode.checked) {
      autoplay(reverseMode.checked);
    } else {
      // Restart the quiz if autoplay mode is unchecked
      restartQuiz();
      startQuiz(quizId, quiz);
    }
  });

  // Call the autoplay function when the quiz starts, if the autoplay mode is enabled
  if (autoplayMode.checked) {
    autoplay(reverseMode.checked);
  }

  let selectedContainer = null;

  wordGrid.querySelectorAll(".word-container input").forEach((input, index) => {
    input.addEventListener("focus", () => {
      if (selectedContainer) {
        selectedContainer.classList.add("deselected");
        selectedContainer.classList.remove("selected");
      }
      input.parentNode.classList.add("selected");
      input.parentNode.classList.remove("deselected");
      selectedContainer = input.parentNode;
    });

    input.addEventListener("blur", () => {
      input.parentNode.classList.remove("selected");
      input.parentNode.classList.add("deselected");
    });
  });
  updateQuiz(reverseMode.checked, shuffleMode.checked);
}

function autoplay(reverse) {
  const inputs = wordGrid.querySelectorAll("input");
  let inputIndex = 0;

  function fillAnswer() {
    if (inputIndex < inputs.length) {
      const input = inputs[inputIndex];
      const answer = input.getAttribute("data-answer");
      input.focus();
      input.value = answer;
      input.parentNode.classList.add("correct");
      input.parentNode.classList.remove("wrong");
      input.disabled = true;

      inputIndex++;
      setTimeout(fillAnswer, 30);
    } else {
      displayResults();
    }
  }

  fillAnswer();
}

// Inside the startQuiz function, after the line "updateQuiz(reverseMode.checked);"
const autoplayMode = document.getElementById("autoplay-mode");
autoplayMode.addEventListener("change", () => {
  if (autoplayMode.checked) {
    autoplay(reverseMode.checked);
  }
});

function restartQuiz() {
  quizContainer.hidden = true;
  quizSelector.hidden = false;
  document.getElementById("autoplay-mode").checked = false;
  wordGrid.querySelectorAll(".word-container").forEach((container) => {
    container.classList.remove("correct", "wrong");
  });
  wordGrid.querySelectorAll("input").forEach((input) => {
    input.value = "";
    input.disabled = false;
  });
  results.hidden = true;

  quizId = originalQuizId;
  quiz = originalQuiz;
  startQuiz(quizId, quiz);
}

function isKana(str) {
  const kanaRegExp =
    /^[\s\u3000\u3040-\u309F\u30A0-\u30FF\uFF65-\uFF9F\u4E00-\u9FAF\u30FCっ]+$/;
  return kanaRegExp.test(str);
}

const hiraganaToRomaji = {
  あ: "a",
  い: "i",
  う: "u",
  え: "e",
  お: "o",
  か: "ka",
  き: "ki",
  く: "ku",
  け: "ke",
  こ: "ko",
  さ: "sa",
  し: "shi",
  す: "su",
  せ: "se",
  そ: "so",
  た: "ta",
  ち: "chi",
  つ: "tsu",
  っ: "tsu",
  て: "te",
  と: "to",
  な: "na",
  に: "ni",
  ぬ: "nu",
  ね: "ne",
  の: "no",
  は: "ha",
  ひ: "hi",
  ふ: "fu",
  へ: "he",
  ほ: "ho",
  ま: "ma",
  み: "mi",
  む: "mu",
  め: "me",
  も: "mo",
  や: "ya",
  ゆ: "yu",
  よ: "yo",
  ら: "ra",
  り: "ri",
  る: "ru",
  れ: "re",
  ろ: "ro",
  わ: "wa",
  を: "wo",
  ん: "n",
  が: "ga",
  ぎ: "gi",
  ぐ: "gu",
  げ: "ge",
  ご: "go",
  ざ: "za",
  じ: "ji",
  ず: "zu",
  ぜ: "ze",
  ぞ: "zo",
  だ: "da",
  ぢ: "ji",
  づ: "zu",
  で: "de",
  ど: "do",
  ば: "ba",
  び: "bi",
  ぶ: "bu",
  べ: "be",
  ぼ: "bo",
  ぱ: "pa",
  ぴ: "pi",
  ぷ: "pu",
  ぺ: "pe",
  ぽ: "po",
  きゃ: "kya",
  きゅ: "kyu",
  きょ: "kyo",
  しゃ: "sha",
  しゅ: "shu",
  しょ: "sho",
  ちゃ: "cha",
  ちゅ: "chu",
  ちょ: "cho",
  にゃ: "nya",
  にゅ: "nyu",
  にょ: "nyo",
  ひゃ: "hya",
  ひゅ: "hyu",
  ひょ: "hyo",
  みゃ: "mya",
  みゅ: "myu",
  みょ: "myo",
  りゃ: "rya",
  りゅ: "ryu",
  りょ: "ryo",
};

const katakanaToRomaji = {
  ア: "a",
  イ: "i",
  ウ: "u",
  エ: "e",
  オ: "o",
  カ: "ka",
  キ: "ki",
  ク: "ku",
  ケ: "ke",
  コ: "ko",
  サ: "sa",
  シ: "shi",
  ス: "su",
  セ: "se",
  ソ: "so",
  タ: "ta",
  チ: "chi",
  ツ: "tsu",
  テ: "te",
  ト: "to",
  ナ: "na",
  ニ: "ni",
  ヌ: "nu",
  ネ: "ne",
  ノ: "no",
  ハ: "ha",
  ヒ: "hi",
  フ: "fu",
  ヘ: "he",
  ホ: "ho",
  マ: "ma",
  ミ: "mi",
  ム: "mu",
  メ: "me",
  モ: "mo",
  ヤ: "ya",
  ユ: "yu",
  ヨ: "yo",
  ラ: "ra",
  リ: "ri",
  ル: "ru",
  レ: "re",
  ロ: "ro",
  ワ: "wa",
  ヲ: "wo",
  ン: "n",
  ガ: "ga",
  ギ: "gi",
  グ: "gu",
  ゲ: "ge",
  ゴ: "go",
  ザ: "za",
  ジ: "ji",
  ズ: "zu",
  ゼ: "ze",
  ゾ: "zo",
  ダ: "da",
  ヂ: "ji",
  ヅ: "zu",
  デ: "de",
  ド: "do",
  バ: "ba",
  ビ: "bi",
  ブ: "bu",
  ベ: "be",
  ボ: "bo",
  パ: "pa",
  ピ: "pi",
  プ: "pu",
  ペ: "pe",
  ポ: "po",
  キャ: "kya",
  キュ: "kyu",
  キョ: "kyo",
  シャ: "sha",
  シュ: "shu",
  ショ: "sho",
  チャ: "cha",
  チュ: "chu",
  チョ: "cho",
  ニャ: "nya",
  ニュ: "nyu",
  ニョ: "nyo",
  ヒャ: "hya",
  ヒュ: "hyu",
  ヒョ: "hyo",
  ミャ: "mya",
  ミュ: "myu",
  ミョ: "myo",
  リャ: "rya",
  リュ: "ryu",
  リョ: "ryo",
};

function kanaToRomaji(kanaStr) {
  let romajiStr = "";
  let skipNext = false;

  for (let i = 0; i < kanaStr.length; i++) {
    if (skipNext) {
      skipNext = false;
      continue;
    }

    const kanaChar = kanaStr[i];
    const kanaCharPair = kanaStr.slice(i, i + 2);

    if (hiraganaToRomaji[kanaCharPair]) {
      romajiStr += hiraganaToRomaji[kanaCharPair];
      skipNext = true;
    } else if (katakanaToRomaji[kanaCharPair]) {
      romajiStr += katakanaToRomaji[kanaCharPair];
      skipNext = true;
    } else if (hiraganaToRomaji[kanaChar]) {
      romajiStr += hiraganaToRomaji[kanaChar];
    } else if (katakanaToRomaji[kanaChar]) {
      romajiStr += katakanaToRomaji[kanaChar];
    } else {
      romajiStr += kanaChar;
    }
  }

  return romajiStr;
}

restartBtn.onclick = restartQuiz;

displayQuizzes();
