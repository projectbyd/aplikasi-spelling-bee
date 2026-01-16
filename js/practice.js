/*************************
 * PRACTICE MODE – FINAL *
 *************************/

let questions = [];
let session = [];
let currentIndex = 0;
let score = 0;
let answers = [];
let timerInterval = null;
let timeLeft = 20;
let audioCtx = null;
let currentQuestion = null;
let isAnswering = false;

/* ===== ELEMENTS ===== */
const startScreen = document.getElementById("startScreen");
const practiceScreen = document.getElementById("practiceScreen");
const reviewSection = document.getElementById("reviewSection");
const studentName = document.getElementById("studentName");
const levelSelect = document.getElementById("level");
const answerInput = document.getElementById("answerInput");
const questionInfo = document.getElementById("questionInfo");
const submitBtn = document.getElementById("submitBtn");
const timerEl = document.getElementById("timer");
const statusEl = document.getElementById("status");
const reviewList = document.getElementById("reviewList");

/* ===== AUDIO ===== */
function unlockAudio(){
  if(!audioCtx){
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if(audioCtx.state === "suspended"){
    audioCtx.resume();
  }
  speechSynthesis.speak(new SpeechSynthesisUtterance(" "));
}

/* ===== CSV PARSER (AMAN ADA KOMA) ===== */
function parseCSV(text){
  const rows = text.trim().split("\n").slice(1);
  return rows.map(row=>{
    const match = row.match(/^([^,]+),([^,]+),"(.*)"$/);
    if(!match) return null;
    return {
      level: match[1].trim(),
      word: match[2].trim(),
      sentence: match[3].trim()
    };
  }).filter(Boolean);
}

/* ===== LOAD QUESTIONS ===== */
async function loadQuestions(){
  const res = await fetch("data/questions.csv");
  const text = await res.text();
  questions = parseCSV(text);
}

/* ===== START ===== */
async function startPractice(){
  unlockAudio();

  const name = studentName.value.trim();
  const level = levelSelect.value;

  if(!name || !level){
    alert("Isi nama dan pilih level");
    return;
  }

  await loadQuestions();

  session = questions
    .filter(q => q.level === level)
    .sort(() => Math.random() - 0.5)
    .slice(0, 25);

  if(session.length === 0){
    alert("Soal level ini belum tersedia");
    return;
  }

  currentIndex = 0;
  score = 0;
  answers = [];

  startScreen.style.display = "none";
  practiceScreen.style.display = "block";
  reviewSection.classList.add("hidden");

  nextQuestion();
}

/* ===== TIMER ===== */
function startTimer(){
  clearInterval(timerInterval);
  timeLeft = 20;
  timerEl.textContent = `⏱️ ${timeLeft}`;
  timerInterval = setInterval(()=>{
    timeLeft--;
    timerEl.textContent = `⏱️ ${timeLeft}`;
    if(timeLeft <= 0){
      clearInterval(timerInterval);
      submitAnswer(true);
    }
  },1000);
}

/* ===== QUESTION ===== */
function nextQuestion(){
  if(currentIndex >= session.length){
    finishPractice();
    return;
  }

  currentQuestion = session[currentIndex];
  questionInfo.textContent = `Soal ${currentIndex+1} / ${session.length}`;
  answerInput.value = "";
  isAnswering = false;

  const u1 = new SpeechSynthesisUtterance(currentQuestion.word);
  const u2 = new SpeechSynthesisUtterance(currentQuestion.sentence);
  const u3 = new SpeechSynthesisUtterance(currentQuestion.word);

  [u1,u2,u3].forEach(u=>{
    u.lang="en-US";
    u.rate=0.9;
  });

  u1.onend=()=>speechSynthesis.speak(u2);
  u2.onend=()=>speechSynthesis.speak(u3);
  u3.onend=()=>{
    isAnswering = true;
    answerInput.focus();
    startTimer();
  };

  speechSynthesis.speak(u1);
}

/* ===== SUBMIT ===== */
function submitAnswer(timeout=false){
  if(!isAnswering && !timeout) return;
  clearInterval(timerInterval);

  const userAns = timeout ? "" : answerInput.value.trim().toLowerCase();
  const correct = userAns === currentQuestion.word.toLowerCase();

  if(correct) score++;

  answers.push({
    word: currentQuestion.word,
    userAnswer: userAns,
    correct
  });

  currentIndex++;
  setTimeout(nextQuestion,500);
}

/* ===== FINISH ===== */
function finishPractice(){
  practiceScreen.style.display="none";
  reviewSection.classList.remove("hidden");
  document.getElementById("reviewScore").textContent =
    `Nilai kamu: ${score} / ${session.length}`;

  reviewList.innerHTML="";
  answers.forEach((a,i)=>{
    reviewList.innerHTML+=`
      <b>${i+1}. ${a.word}</b><br>
      Jawaban: ${a.userAnswer||"(kosong)"}<br>
      ${a.correct?"✔ Benar":"✖ Salah"}<hr>`;
  });
}

function goHome(){
  location.href="index.html";
}