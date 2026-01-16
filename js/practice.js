/*************************
 * PRACTICE MODE - FINAL *
 *************************/

/* ===== STATE ===== */
let isReading = false;
let isAnswering = false;
let questions = [];
let session = [];
let currentIndex = 0;
let score = 0;
let answers = [];
let timerInterval = null;
let timeLeft = 20;
let audioCtx = null;
let currentQuestion = null;

/* ===== ELEMENTS ===== */
const startScreen   = document.getElementById("startScreen");
const practiceScreen = document.getElementById("practiceScreen");
const reviewSection  = document.getElementById("reviewSection");
const studentName    = document.getElementById("studentName");
const levelSelect    = document.getElementById("level");
const answerInput    = document.getElementById("answerInput");
const questionInfo   = document.getElementById("questionInfo");
const submitBtn      = document.getElementById("submitBtn");
const timerEl        = document.getElementById("timer");
const statusEl       = document.getElementById("status");
const reviewList     = document.getElementById("reviewList");

/* ===== AUDIO ===== */
function unlockAudio(){
  if(!audioCtx){
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if(audioCtx.state === "suspended"){
    audioCtx.resume();
  }

  // iOS unlock
  speechSynthesis.speak(new SpeechSynthesisUtterance(" "));
}

function tickSound(){
  if(!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.frequency.value = 700;
  g.gain.value = 0.04;
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start();
  o.stop(audioCtx.currentTime + 0.08);
}

function endBell(){
  if(!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.frequency.setValueAtTime(880, audioCtx.currentTime);
  o.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 1);
  g.gain.setValueAtTime(0.2, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1);
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start();
  o.stop(audioCtx.currentTime + 1);
}

/* ===== UTILS ===== */
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ===== LOAD CSV (AMAN DENGAN KOMA) ===== */
async function loadQuestions(){
  const res = await fetch("data/questions.csv");
  if(!res.ok) throw new Error("CSV not found");

  const text = await res.text();
  const lines = text.trim().split(/\r?\n/).slice(1);

  questions = lines.map(line=>{
    const parts = line.split(",");
    return {
      level: parts[0].trim(),
      word: parts[1].trim(),
      sentence: parts.slice(2).join(",").trim() // 🔥 FIX UTAMA
    };
  });
}

/* ===== START PRACTICE ===== */
async function startPractice(){
  alert("START PRACTICE TERPANGGIL");
  unlockAudio();

  const name  = studentName.value.trim();
  const level = levelSelect.value;

  if(!name || !level){
    alert("Isi nama dan pilih level");
    return;
  }

  await loadQuestions();
  console.log("TOTAL QUESTIONS:", questions.length);

  session = questions
    .filter(q => q.level === level)
    .sort(() => Math.random() - 0.5)
    .slice(0, 25);

  if(session.length === 0){
    alert("Soal belum tersedia untuk level ini");
    return;
  }

  currentIndex = 0;
  score = 0;
  answers = [];

  startScreen.style.display = "none";
  practiceScreen.style.display = "block";
  reviewSection.classList.add("hidden");

  await readyCountdown();
  playQuestion();
}

/* ===== COUNTDOWN ===== */
async function readyCountdown(){
  for(let i=3;i>0;i--){
    statusEl.textContent = `Mulai dalam ${i}...`;
    tickSound();
    await wait(1000);
  }
  endBell();
  statusEl.textContent = "";
}

/* ===== TIMER ===== */
function startTimer(){
  stopTimer();
  timeLeft = 20;
  timerEl.textContent = `⏱️ ${timeLeft}`;

  timerInterval = setInterval(()=>{
    timeLeft--;
    timerEl.textContent = `⏱️ ${timeLeft}`;
    if(timeLeft > 0) tickSound();
    if(timeLeft <= 0){
      stopTimer();
      handleTimeout();
    }
  },1000);
}

function stopTimer(){
  if(timerInterval){
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

/* ===== PLAY QUESTION ===== */
function playQuestion(){
  if(currentIndex >= session.length) return;

  speechSynthesis.cancel();
  isReading = true;
  isAnswering = false;

  submitBtn.disabled = true;
  submitBtn.style.opacity = 0.5;

  stopTimer();
  timerEl.textContent = `⏱️ 20`;

  currentQuestion = session[currentIndex];
  questionInfo.textContent =
    `Soal ${currentIndex + 1} dari ${session.length}`;

  answerInput.value = "";
  answerInput.blur();

  const u1 = new SpeechSynthesisUtterance(currentQuestion.word);
  const u2 = new SpeechSynthesisUtterance(currentQuestion.sentence);
  const u3 = new SpeechSynthesisUtterance(currentQuestion.word);

  [u1,u2,u3].forEach(u=>{
    u.lang = "en-US";
    u.rate = 0.9;
  });

  u1.onend = () => speechSynthesis.speak(u2);
  u2.onend = () => speechSynthesis.speak(u3);

  u3.onend = () => {
    isReading = false;
    isAnswering = true;
    submitBtn.disabled = false;
    submitBtn.style.opacity = 1;
    answerInput.focus();
    startTimer();
  };

  speechSynthesis.speak(u1);
}

/* ===== ANSWER ===== */
function handleTimeout(){
  if(!isAnswering) return;

  isAnswering = false;
  stopTimer();

  answers.push({
    word: currentQuestion.word,
    userAnswer: "",
    correct: false
  });

  nextQuestion();
}

function submitAnswer(){
  if(!isAnswering) return;

  isAnswering = false;
  stopTimer();

  const userAns = answerInput.value.trim().toLowerCase();
  const correct = userAns === currentQuestion.word.toLowerCase();

  if(correct) score++;

  answers.push({
    word: currentQuestion.word,
    userAnswer: userAns,
    correct
  });

  nextQuestion();
}

function nextQuestion(){
  currentIndex++;
  if(currentIndex >= session.length){
    finishPractice();
  }else{
    setTimeout(playQuestion, 400);
  }
}

/* ===== FINISH ===== */
function finishPractice(){
  practiceScreen.style.display = "none";
  reviewSection.classList.remove("hidden");

  document.getElementById("reviewScore").textContent =
    `Nilai kamu: ${score} / ${session.length}`;

  renderReview();
}

/* ===== REVIEW ===== */
function renderReview(){
  reviewList.innerHTML = "";
  answers.forEach((a,i)=>{
    const div = document.createElement("div");
    div.innerHTML = `
      <b>${i+1}. ${a.word}</b><br>
      Jawaban kamu: ${a.userAnswer || "(kosong)"}<br>
      Status: ${a.correct ? "✔ Benar" : "✖ Salah"}
      <hr>
    `;
    reviewList.appendChild(div);
  });
}

/* ===== EXPORT PDF ===== */
function exportPDF(){
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  let y = 20;
  pdf.text("HASIL PRACTICE SPELLING BEE", 20, y);
  y += 10;
  pdf.text(`Nama: ${studentName.value}`, 20, y);
  y += 8;
  pdf.text(`Skor: ${score} / ${session.length}`, 20, y);
  y += 10;

  answers.forEach((a,i)=>{
    if(y > 270){
      pdf.addPage();
      y = 20;
    }
    pdf.text(
      `${i+1}. ${a.word} | Jawaban: ${a.userAnswer || "-"}`,
      20, y
    );
    y += 8;
  });

  pdf.save("hasil-practice-spelling-bee.pdf");
}

/* ===== NAV ===== */
function restartPractice(){
  location.reload();
}

function goHome(){
  location.href = "index.html";
}