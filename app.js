const words = [
  ['happy','సంతోషంగా','I am happy.','నేను సంతోషంగా ఉన్నాను.','😊'],
  ['water','నీరు','I want water.','నాకు నీళ్లు కావాలి.','💧'],
  ['apple','ఆపిల్','I like apples.','నాకు ఆపిల్స్ ఇష్టం.','🍎'],
  ['ball','బంతి','This is my ball.','ఇది నా బంతి.','⚽'],
  ['book','పుస్తకం','I am reading a book.','నేను పుస్తకం చదువుతున్నాను.','📖'],
  ['sleep','నిద్ర','I want to sleep.','నాకు నిద్ర కావాలి.','😴'],
  ['home','ఇల్లు','I am at home.','నేను ఇంట్లో ఉన్నాను.','🏠'],
  ['play','ఆడటం','I want to play.','నాకు ఆడాలని ఉంది.','🛝'],
  ['mother','అమ్మ','This is my mother.','ఇది నా అమ్మ.','👩'],
  ['father','నాన్న','This is my father.','ఇది నా నాన్న.','👨'],
  ['school','పాఠశాల','I go to school.','నేను పాఠశాలకు వెళ్తాను.','🏫'],
  ['friend','స్నేహితుడు','He is my friend.','అతను నా స్నేహితుడు.','🧒'],
  ['toy','బొమ్మ','This is my toy.','ఇది నా బొమ్మ.','🧸'],
  ['milk','పాలు','I drink milk.','నేను పాలు తాగుతాను.','🥛'],
  ['food','ఆహారం','The food is tasty.','ఆహారం రుచిగా ఉంది.','🍚'],
  ['house','ఇల్లు','My house is big.','నా ఇల్లు పెద్దది.','🏡'],
  ['sun','సూర్యుడు','The sun is bright.','సూర్యుడు ప్రకాశంగా ఉన్నాడు.','☀️'],
  ['moon','చంద్రుడు','I can see the moon.','నేను చంద్రుడిని చూడగలను.','🌙'],
  ['dog','కుక్క','The dog is running.','కుక్క పరుగెడుతోంది.','🐶'],
  ['cat','పిల్లి','The cat is sleeping.','పిల్లి నిద్రపోతోంది.','🐱'],
  ['come','రా','Come here.','ఇక్కడికి రా.','👋'],
  ['sit','కూర్చో','Please sit down.','దయచేసి కూర్చో.','🪑'],
  ['stand','నిలబడు','Please stand up.','దయచేసి నిలబడు.','🧍'],
  ['open','తెరువు','Open the door.','తలుపు తెరువు.','🚪'],
  ['close','మూయి','Close the door.','తలుపు మూయి.','🚪'],
  ['give','ఇవ్వు','Give me the ball.','నాకు బంతి ఇవ్వు.','🤲'],
  ['take','తీసుకో','Take the book.','పుస్తకం తీసుకో.','📚'],
  ['wash','కడుగు','Wash your hands.','నీ చేతులు కడుక్కో.','🧼'],
  ['eat','తిను','I want to eat.','నాకు తినాలని ఉంది.','🍽️'],
  ['drink','తాగు','I want to drink water.','నాకు నీళ్లు తాగాలని ఉంది.','🥤']
];

const turns = [
  ['What is your name?','నీ పేరు ఏమిటి?','My name is Nihansh.'],
  ['How are you today?','ఈ రోజు నువ్వు ఎలా ఉన్నావు?','I am happy today.'],
  ['What do you like to eat?','నీకు ఏమి తినడం ఇష్టం?','I like apples.'],
  ['What is your favorite color?','నీకు ఇష్టమైన రంగు ఏమిటి?','My favorite color is blue.'],
  ['What do you like to play?','నీకు ఏమి ఆడటం ఇష్టం?','I like to play.']
];

let turnIndex = 0;
let wordIndex = 0;
let stars = 0;
let gameScore = 0;
let sound = true;
let listening = false;
let mediaRecorder = null;
let chunks = [];
let timer = null;

const $ = id => document.getElementById(id);

function speak(text) {
  if (!sound || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-IN';
  u.rate = 0.82;
  u.pitch = 1.08;
  window.speechSynthesis.speak(u);
}

function addBubble(who, text, telugu) {
  const el = document.createElement('div');
  el.className = 'bubble ' + who;
  const name = document.createElement('b');
  name.textContent = who === 'sunny' ? 'Sunny' : 'You';
  el.appendChild(name);
  el.appendChild(document.createElement('br'));
  el.appendChild(document.createTextNode(text));
  if (telugu) {
    const small = document.createElement('small');
    small.textContent = telugu;
    el.appendChild(small);
  }
  $('conversation').appendChild(el);
  $('conversation').scrollTop = $('conversation').scrollHeight;
}

function setPrompt() {
  const t = turns[turnIndex % turns.length];
  $('promptText').textContent = t[0];
  $('promptTe').textContent = t[1];
  speak(t[0]);
}

function localReply(text) {
  const t = turns[turnIndex % turns.length];
  const answer = text.toLowerCase();
  const good =
    (turnIndex % turns.length === 0 && (answer.includes('name') || answer.includes('nihansh'))) ||
    (turnIndex % turns.length === 1 && /happy|fine|good|well/.test(answer)) ||
    (turnIndex % turns.length === 2 && /apple|rice|mango|food/.test(answer)) ||
    (turnIndex % turns.length === 3 && /red|blue|green|yellow|pink|orange|purple/.test(answer)) ||
    (turnIndex % turns.length === 4 && /play|ball|cricket|football|toy|car/.test(answer));
  return good ? 'Great job! ' + t[2] : 'Good try! Say: “' + t[2] + '”';
}

async function answer(text) {
  if (!text) return;
  addBubble('child', text);
  $('statusText').textContent = 'Sunny is thinking…';
  let reply = localReply(text);
  try {
    const r = await fetch('/api/chat', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({message: text, turn: turnIndex, history: []})
    });
    if (r.ok) {
      const data = await r.json();
      if (data.reply) reply = data.reply;
    }
  } catch (e) {}
  addBubble('sunny', reply);
  speak(reply);
  stars++;
  $('stars').textContent = stars;
  turnIndex++;
  setPrompt();
  $('statusText').textContent = 'Tap the microphone and say your answer.';
  saveProgress();
}

function setListening(on) {
  listening = on;
  $('micButton').classList.toggle('listening', on);
  $('micButton').querySelector('small').textContent = on ? 'Tap to stop' : 'Tap & talk';
}

function recorderMime() {
  const types = ['audio/webm;codecs=opus','audio/webm','audio/mp4'];
  for (const type of types) {
    if (window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

async function startListening() {
  if (listening) { stopListening(); return; }
  if (!window.isSecureContext) {
    $('statusText').textContent = 'Microphone needs a secure HTTPS connection.';
    return;
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
    $('statusText').textContent = 'Voice recording is not supported. Please use Chrome on Android.';
    return;
  }
  try {
    $('statusText').textContent = '🎙️ Starting microphone…';
    const stream = await navigator.mediaDevices.getUserMedia({audio: true});
    const type = recorderMime();
    mediaRecorder = type ? new MediaRecorder(stream, {mimeType: type}) : new MediaRecorder(stream);
    chunks = [];
    mediaRecorder.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    mediaRecorder.onstop = async () => {
      clearTimeout(timer);
      stream.getTracks().forEach(track => track.stop());
      setListening(false);
      const blob = new Blob(chunks, {type: mediaRecorder.mimeType || type || 'audio/webm'});
      if (!blob.size) { $('statusText').textContent = 'I did not hear you. Try again.'; return; }
      $('statusText').textContent = '⏳ Understanding your words…';
      try {
        const buffer = await blob.arrayBuffer();
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
        const r = await fetch('/api/transcribe', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({audio: btoa(binary), mimeType: blob.type})
        });
        const data = await r.json();
        if (!r.ok || !data.text) {
          $('statusText').textContent = data.error || 'Speech recognition is not configured. Add OPENAI_API_KEY in Vercel.';
          return;
        }
        answer(data.text);
      } catch (e) {
        $('statusText').textContent = 'I could not understand the recording. Please try again.';
      }
    };
    mediaRecorder.start();
    setListening(true);
    $('statusText').textContent = '🎧 I am listening… Say your sentence!';
    timer = setTimeout(stopListening, 8000);
  } catch (e) {
    setListening(false);
    $('statusText').textContent = e.name === 'NotAllowedError' ? 'Microphone permission was denied. Allow it and try again.' : 'Could not start the microphone. Tap again.';
  }
}

function stopListening() {
  clearTimeout(timer);
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
}

function renderWord() {
  const w = words[wordIndex % words.length];
  $('wordEnglish').textContent = w[0];
  $('wordTelugu').textContent = w[1];
  $('wordSentence').textContent = w[2];
  $('wordEmoji').textContent = w[4];
  $('compareTe').textContent = w[3];
  $('compareEn').textContent = w[2];
  $('playWord').onclick = () => speak(w[0] + '. ' + w[2]);
}

const games = [
  ['🍎','apple',['apple','ball','book','water']],
  ['🐶','dog',['cat','dog','fish','bird']],
  ['💧','water',['milk','water','juice','rice']],
  ['⚽','ball',['book','ball','shoe','car']]
];
let gameIndex = 0;

function renderGame() {
  const g = games[gameIndex % games.length];
  $('gameEmoji').textContent = g[0];
  $('gameFeedback').textContent = 'Choose one!';
  $('choices').innerHTML = '';
  g[2].forEach(option => {
    const button = document.createElement('button');
    button.textContent = option;
    button.onclick = () => {
      if (option === g[1]) {
        button.classList.add('correct');
        gameScore++;
        stars++;
        $('gameScore').textContent = gameScore;
        $('stars').textContent = stars;
        $('gameFeedback').textContent = 'Great job! ⭐';
        speak('Yes! ' + option + '.');
        setTimeout(() => { gameIndex++; renderGame(); }, 650);
      } else {
        button.classList.add('wrong');
        $('gameFeedback').textContent = 'Almost! Try again.';
        speak('Try again.');
      }
    };
    $('choices').appendChild(button);
  });
}

function saveProgress() { localStorage.setItem('littleEnglishProgress', JSON.stringify({stars, gameScore, turnIndex})); }
function loadProgress() {
  try {
    const p = JSON.parse(localStorage.getItem('littleEnglishProgress') || '{}');
    stars = p.stars || 0; gameScore = p.gameScore || 0; turnIndex = p.turnIndex || 0;
  } catch (e) {}
  $('stars').textContent = stars;
  $('gameScore').textContent = gameScore;
}

document.querySelectorAll('.mode').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.mode').forEach(x => x.classList.remove('active'));
    button.classList.add('active');
    const mode = button.dataset.mode;
    $('talkPanel').classList.toggle('hidden', mode !== 'talk');
    $('learnPanel').classList.toggle('hidden', mode !== 'learn');
    $('gamesPanel').classList.toggle('hidden', mode !== 'games');
    if (mode === 'learn') renderWord();
    if (mode === 'games') renderGame();
  });
});

$('micButton').addEventListener('click', startListening);
$('nextWord').addEventListener('click', () => { wordIndex++; renderWord(); });
document.querySelectorAll('[data-say]').forEach(button => button.addEventListener('click', () => answer(button.dataset.say)));
$('soundToggle').addEventListener('click', () => { sound = !sound; $('soundToggle').textContent = sound ? '🔊' : '🔇'; if (sound) speak('Sound on'); });

loadProgress();
setPrompt();
renderWord();
renderGame();
addBubble('sunny', 'Hello! I am Sunny. Let us speak English together!', 'హలో! మనం కలిసి ఇంగ్లీష్ మాట్లాడుదాం!');

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/service-worker.js').catch(() => {}));
