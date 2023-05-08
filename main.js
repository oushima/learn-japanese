const quizSelector = document.getElementById("quiz-selector");
const quizContainer = document.getElementById("quiz-container");
const quizList = document.getElementById("quiz-list");
const wordGrid = document.getElementById("word-grid");
const results = document.getElementById("results");
const restartBtn = document.getElementById("restart-btn");
const shuffleMode = document.getElementById("shuffle-mode");
const reverseMode = document.getElementById("reverse-mode");
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
      console.log(`Loaded quiz${quizIndex}.json`, quiz);
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
          possibleAnswers.includes(ans)
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
            .split(",")
            .map((ans) => ans.trim().toLowerCase());
          const userAnswers = input.value
            .split(",")
            .map((ans) => ans.trim().toLowerCase());

          const isCorrect = userAnswers.every((ans) =>
            possibleAnswers.includes(ans)
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

restartBtn.onclick = restartQuiz;

displayQuizzes();
