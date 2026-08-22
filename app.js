const words=[
 {en:'happy',te:'సంతోషంగా',sentence:'I am happy.',teSentence:'నేను సంతోషంగా ఉన్నాను.',emoji:'😊'},
 {en:'water',te:'నీరు',sentence:'I want water.',teSentence:'నాకు నీళ్లు కావాలి.',emoji:'💧'},
 {en:'apple',te:'ఆపిల్',sentence:'I like apples.',teSentence:'నాకు ఆపిల్స్ ఇష్టం.',emoji:'🍎'},
 {en:'ball',te:'బంతి',sentence:'This is my ball.',teSentence:'ఇది నా బంతి.',emoji:'⚽'},
 {en:'book',te:'పుస్తకం',sentence:'I am reading a book.',teSentence:'నేను పుస్తకం చదువుతున్నాను.',emoji:'📖'},
 {en:'sleep',te:'నిద్ర',sentence:'I want to sleep.',teSentence:'నాకు నిద్ర కావాలి.',emoji:'😴'},
 {en:'home',te:'ఇల్లు',sentence:'I am at home.',teSentence:'నేను ఇంట్లో ఉన్నాను.',emoji:'🏠'},
 {en:'play',te:'ఆడటం',sentence:'I want to play.',teSentence:'నాకు ఆడాలని ఉంది.',emoji:'🛝'}
];
const turns=[
 {prompt:'What is your name?',te:'నీ పేరు ఏమిటి?',fallback:'My name is my friend.'},
 {prompt:'How are you today?',te:'ఈ రోజు నువ్వు ఎలా ఉన్నావు?',fallback:'I am happy today.'},
 {prompt:'What do you like to eat?',te:'నీకు ఏమి తినడం ఇష్టం?',fallback:'I like apples.'},
 {prompt:'What is your favorite color?',te:'నీకు ఇష్టమైన రంగు ఏమిటి?',fallback:'My favorite color is blue.'},
 {prompt:'What do you like to play?',te:'నీకు ఏమి ఆడటం ఇష్టం?',fallback:'I like to play.'}
];
let turnIndex=0, wordIndex=0, stars=0, gameScore=0, sound=true, recognition=null;
const $=id=>document.getElementById(id);
function speak(text){if(!sound||!('speechSynthesis'in window))return; speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-IN';u.rate=.82;u.pitch=1.08;speechSynthesis.speak(u)}
function addBubble(who,text,te=''){const el=document.createElement('div');el.className=`bubble ${who}`;el.innerHTML=`<b>${who==='sunny'?'Sunny':'You'}</b><br>${escapeHtml(text)}${te?`<small>${escapeHtml(te)}</small>`:''}`;$('conversation').appendChild(el);$('conversation').scrollTop=$('conversation').scrollHeight}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function setPrompt(){const t=turns[turnIndex%turns.length];$('promptText').textContent=t.prompt;$('promptTe').textContent=t.te;speak(t.prompt)}
function normalize(s){return s.toLowerCase().replace(/[^a-z\s]/g,'').trim()}
async function answer(text){if(!text)return;addBubble('child',text);$('statusText').textContent='Sunny is thinking…';const fallback=turns[turnIndex%turns.length].fallback;let reply='Nice! '+fallback;try{const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,turn:turnIndex,history:[...$('conversation').querySelectorAll('.bubble')].slice(-8).map(x=>x.innerText)})});if(r.ok){const data=await r.json();if(data.reply)reply=data.reply}}catch(e){}addBubble('sunny',reply);speak(reply);stars++;$('stars').textContent=stars;turnIndex++;setPrompt();$('statusText').textContent='Tap the microphone and say your answer.';saveProgress()}
function startListening(){if(!recognition){$('statusText').textContent='Voice input is not supported in this browser. Try Chrome on Android.';return}try{recognition.start()}catch(e){}}
function initSpeech(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return;recognition=new SR();recognition.lang='en-IN';recognition.interimResults=false;recognition.continuous=false;recognition.onstart=()=>{$('micButton').classList.add('listening');$('statusText').textContent='I am listening… Say a sentence!'};recognition.onend=()=>{$('micButton').classList.remove('listening')};recognition.onerror=()=>{$('micButton').classList.remove('listening');$('statusText').textContent='I did not hear you. Try again.'};recognition.onresult=e=>answer(e.results[0][0].transcript)}
function renderWord(){const w=words[wordIndex%words.length];$('wordEnglish').textContent=w.en;$('wordTelugu').textContent=w.te;$('wordSentence').textContent=w.sentence;$('wordEmoji').textContent=w.emoji;$('compareTe').textContent=w.te;$('compareEn').textContent=w.en;$('playWord').onclick=()=>speak(w.sentence)}
const gameItems=[{emoji:'🍎',correct:'apple',options:['apple','ball','book','water']},{emoji:'🐶',correct:'dog',options:['cat','dog','fish','bird']},{emoji:'💧',correct:'water',options:['milk','water','juice','rice']},{emoji:'⚽',correct:'ball',options:['book','ball','shoe','car']}];let gameIndex=0;
function renderGame(){const g=gameItems[gameIndex%gameItems.length];$('gameEmoji').textContent=g.emoji;$('gameFeedback').textContent='Choose one!';$('choices').innerHTML='';g.options.forEach(o=>{const b=document.createElement('button');b.textContent=o;b.onclick=()=>{if(b.disabled)return;const ok=o===g.correct;b.classList.add(ok?'correct':'wrong');if(ok){gameScore++;stars++;$('gameFeedback').textContent='Great job! ⭐';$('gameScore').textContent=gameScore;$('stars').textContent=stars;speak(`Yes! ${o}.`);setTimeout(()=>{gameIndex++;renderGame()},650)}else{$('gameFeedback').textContent=`Almost! Try again.`;speak('Try again.')}};$('choices').appendChild(b)})}
function saveProgress(){localStorage.setItem('littleEnglishProgress',JSON.stringify({stars,gameScore,turnIndex}))}
function loadProgress(){try{const p=JSON.parse(localStorage.getItem('littleEnglishProgress')||'{}');stars=p.stars||0;gameScore=p.gameScore||0;turnIndex=p.turnIndex||0}catch(e){}$('stars').textContent=stars;$('gameScore').textContent=gameScore}
document.querySelectorAll('.mode').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.mode').forEach(x=>x.classList.remove('active'));btn.classList.add('active');['talk','learn','games'].forEach(m=>$(m+'Panel').classList.toggle('hidden',m!==btn.dataset.mode));if(btn.dataset.mode==='learn')renderWord();if(btn.dataset.mode==='games')renderGame()});
$('micButton').onclick=startListening;$('nextWord').onclick=()=>{wordIndex++;renderWord()};document.querySelectorAll('[data-say]').forEach(b=>b.onclick=()=>answer(b.dataset.say));$('soundToggle').onclick=()=>{sound=!sound;$('soundToggle').textContent=sound?'🔊':'🔇';if(sound)speak('Sound on')});
loadProgress();initSpeech();setPrompt();renderWord();renderGame();addBubble('sunny','Hello! I am Sunny. Let us speak English together!','హలో! మనం కలిసి ఇంగ్లీష్ మాట్లాడుదాం!');
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/service-worker.js').catch(()=>{}));
