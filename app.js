(function () {
  'use strict';
  var state = { lesson: 0, game: 0, score: 0, sound: true, recognition: null, listening: false };
  function el(id) { return document.getElementById(id); }
  function all(selector) { return Array.prototype.slice.call(document.querySelectorAll(selector)); }
  function lessons() {
    var source = Array.isArray(window.LITTLE_ENGLISH_LESSONS) ? window.LITTLE_ENGLISH_LESSONS : [];
    var seen = {};
    return source.filter(function (item) {
      if (!item || item.length < 5) return false;
      var key = String(item[2]).trim().toLowerCase();
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }
  function gameWords() { return Array.isArray(window.UKG_GAME_WORDS) ? window.UKG_GAME_WORDS : []; }
  function speak(text, lang) {
    if (!state.sound || !('speechSynthesis' in window) || !text) return;
    try { window.speechSynthesis.cancel(); var utterance = new SpeechSynthesisUtterance(text); utterance.lang = lang || 'en-IN'; utterance.rate = 0.78; utterance.pitch = 1.05; window.speechSynthesis.speak(utterance); } catch (_) {}
  }
  function setStatus(text) { if (el('statusText')) el('statusText').textContent = text; }
  function renderLesson() {
    var list = lessons();
    if (!list.length) { el('learnEmpty').classList.remove('hidden'); el('learnContent').classList.add('hidden'); return; }
    el('learnEmpty').classList.add('hidden'); el('learnContent').classList.remove('hidden');
    state.lesson = (state.lesson + list.length) % list.length;
    var item = list[state.lesson];
    el('wordEnglish').textContent = item[0]; el('wordTelugu').textContent = item[1]; el('wordSentence').textContent = item[2]; el('wordTeluguSentence').textContent = item[3]; el('wordEmoji').textContent = item[4]; el('compareTe').textContent = item[1]; el('compareEn').textContent = item[0];
    el('lessonProgress').textContent = 'Lesson ' + (state.lesson + 1) + ' of ' + list.length;
    el('lessonBar').style.width = (((state.lesson + 1) / list.length) * 100).toFixed(1) + '%';
    el('lessonSelect').value = String(state.lesson);
  }
  function populateLessonSelect() {
    var select = el('lessonSelect'); var list = lessons(); select.innerHTML = '';
    list.forEach(function (item, index) { var option = document.createElement('option'); option.value = String(index); option.textContent = (index + 1) + '. ' + item[0] + ' — ' + item[2]; select.appendChild(option); });
  }
  function showMode(name) {
    ['talk', 'learn', 'games'].forEach(function (mode) { el(mode + 'Panel').classList.toggle('hidden', mode !== name); });
    all('.mode').forEach(function (button) { button.classList.toggle('active', button.getAttribute('data-mode') === name); });
    if (name === 'learn') renderLesson(); if (name === 'games') renderGame();
  }
  function addBubble(text, type) { var conversation = el('conversation'); var bubble = document.createElement('div'); bubble.className = 'bubble ' + type; bubble.textContent = text; conversation.appendChild(bubble); conversation.scrollTop = conversation.scrollHeight; }
  function answerTo(text) {
    var value = text.toLowerCase().trim(); var reply = 'That is nice! Can you say it again in English?';
    if (/^(hi|hello|hey)/.test(value)) reply = 'Hello! How are you today?'; else if (/name/.test(value)) reply = 'Nice to meet you! My name is Sunny.'; else if (/happy|good|fine/.test(value)) reply = 'Wonderful! I am happy too!'; else if (/water|thirsty/.test(value)) reply = 'Sure! You can say: I want water.'; else if (/apple|banana|mango|food|eat/.test(value)) reply = 'Yummy! You can say: I like apples.'; else if (/mother|mom|mummy|father|dad|daddy/.test(value)) reply = 'Very good! Tell me more about your family.'; else if (/school|teacher|book|read/.test(value)) reply = 'Great! I love learning too.'; else if (/play|ball|toy|game/.test(value)) reply = 'That sounds fun! What do you want to play?'; else if (/thank/.test(value)) reply = 'You are welcome!';
    return reply;
  }
  function handleSpeech(text) { if (!text) return; addBubble('You: ' + text, 'child'); var reply = answerTo(text); addBubble('Sunny: ' + reply, 'sunny'); speak(reply, 'en-IN'); }
  function stopRecognition() { if (state.recognition) { try { state.recognition.stop(); } catch (_) {} } state.listening = false; el('micButton').classList.remove('listening'); el('micLabel').textContent = 'Tap & talk'; }
  function startRecognition() {
    var Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { setStatus('Voice recognition is not supported in this browser. Use the example buttons below.'); return; }
    if (state.listening) { stopRecognition(); return; }
    var recognition = new Recognition(); state.recognition = recognition; recognition.lang = 'en-IN'; recognition.interimResults = false; recognition.continuous = false;
    recognition.onstart = function () { state.listening = true; el('micButton').classList.add('listening'); el('micLabel').textContent = 'Listening…'; setStatus('I am listening. Say a short English sentence.'); };
    recognition.onresult = function (event) { var transcript = event.results[0][0].transcript; setStatus('I heard: “' + transcript + '”'); handleSpeech(transcript); };
    recognition.onerror = function (event) { setStatus(event.error === 'not-allowed' ? 'Please allow microphone access.' : 'I could not hear you. Try again.'); };
    recognition.onend = stopRecognition;
    try { recognition.start(); } catch (_) { setStatus('Tap the microphone again.'); }
  }
  function renderGame() {
    var words = gameWords(); if (!words.length) return; var answer = words[state.game % words.length]; var emojiMap = window.UKG_GAME_EMOJI || {};
    el('gameEmoji').textContent = emojiMap[answer] || '❓'; el('gameWordHint').textContent = 'What is this?'; el('gameFeedback').textContent = 'Choose the English word.';
    var choices = [answer]; while (choices.length < 4 && choices.length < words.length) { var candidate = words[Math.floor(Math.random() * words.length)]; if (choices.indexOf(candidate) === -1) choices.push(candidate); }
    choices.sort(function () { return Math.random() - 0.5; }); var container = el('choices'); container.innerHTML = '';
    choices.forEach(function (choice) { var button = document.createElement('button'); button.type = 'button'; button.textContent = choice; button.addEventListener('click', function () { if (choice === answer) { button.classList.add('correct'); el('gameFeedback').textContent = 'Great job! ⭐'; state.score += 1; el('gameScore').textContent = state.score; el('gameScoreHero').textContent = state.score; speak('Great job! ' + choice, 'en-IN'); window.setTimeout(function () { state.game += 1; renderGame(); }, 650); } else { button.classList.add('wrong'); el('gameFeedback').textContent = 'Try again!'; speak('Try again', 'en-IN'); } }); container.appendChild(button); });
  }
  function registerPwa() { if ('serviceWorker' in navigator) navigator.serviceWorker.register('/service-worker.js').catch(function () {}); }
  function init() {
    try {
      populateLessonSelect(); renderLesson(); renderGame();
      all('.mode').forEach(function (button) { button.addEventListener('click', function () { showMode(button.getAttribute('data-mode')); }); });
      el('nextWord').addEventListener('click', function () { state.lesson += 1; renderLesson(); }); el('prevWord').addEventListener('click', function () { state.lesson -= 1; renderLesson(); }); el('lessonSelect').addEventListener('change', function () { state.lesson = Number(this.value) || 0; renderLesson(); });
      el('playEnglish').addEventListener('click', function () { var list = lessons(); if (list.length) speak(list[state.lesson][2], 'en-IN'); }); el('playTelugu').addEventListener('click', function () { var list = lessons(); if (list.length) speak(list[state.lesson][3], 'te-IN'); });
      el('soundToggle').addEventListener('click', function () { state.sound = !state.sound; this.textContent = state.sound ? '🔊' : '🔇'; if (!state.sound && window.speechSynthesis) window.speechSynthesis.cancel(); });
      el('micButton').addEventListener('click', startRecognition); all('[data-say]').forEach(function (button) { button.addEventListener('click', function () { handleSpeech(button.getAttribute('data-say')); }); });
      el('clearConversation').addEventListener('click', function () { el('conversation').innerHTML = ''; }); el('nextGame').addEventListener('click', function () { state.game += 1; renderGame(); }); el('errorReload').addEventListener('click', function () { window.location.reload(); }); registerPwa();
    } catch (error) { el('fatalError').classList.remove('hidden'); el('fatalMessage').textContent = 'The app could not start. Please reload the app.'; console.error(error); }
  }
  window.addEventListener('error', function () { el('fatalError').classList.remove('hidden'); }); window.addEventListener('unhandledrejection', function () { el('fatalError').classList.remove('hidden'); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();