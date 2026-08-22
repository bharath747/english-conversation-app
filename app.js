const LESSONS=[
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
 ['cat','పిల్లి','The cat is sleeping.','పిల్లి నిద్రపోతోంది.','🐱']
];
let lessonIndex=0,soundOn=true;
function $(id){return document.getElementById(id)}
function speak(text,lang){if(!soundOn||!window.speechSynthesis)return;window.speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(text);u.lang=lang||'en-IN';u.rate=.8;u.pitch=1.05;window.speechSynthesis.speak(u)}
function lesson(){return LESSONS[lessonIndex%LESSONS.length]}
function renderLesson(){var w=lesson();$('wordEnglish').textContent=w[0];$('wordTelugu').textContent=w[1];$('wordSentence').textContent=w[2];$('wordTeluguSentence').textContent=w[3];$('wordEmoji').textContent=w[4];$('compareTe').textContent=w[1];$('compareEn').textContent=w[0]}
function showMode(name){['talk','learn','games'].forEach(function(x){$(x+'Panel').classList.toggle('hidden',x!==name)});document.querySelectorAll('.mode').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-mode')===name)});if(name==='learn')renderLesson()}
function init(){
 document.querySelectorAll('.mode').forEach(function(b){b.onclick=function(){showMode(b.getAttribute('data-mode'))}});
 $('nextWord').onclick=function(){lessonIndex++;renderLesson()};
 $('playEnglish').onclick=function(){speak(lesson()[2],'en-IN')};
 $('playTelugu').onclick=function(){speak(lesson()[3],'te-IN')};
 $('soundToggle').onclick=function(){soundOn=!soundOn;$('soundToggle').textContent=soundOn?'🔊':'🔇';if(soundOn)speak('Sound on','en-IN')};
 document.querySelectorAll('[data-say]').forEach(function(b){b.onclick=function(){talk(b.getAttribute('data-say'))}});
 $('micButton').onclick=function(){mic()};
 renderLesson();renderGame();
 $('statusText').textContent='Tap the microphone and say your answer.';
 speak('Hello! I am Sunny. Let us speak English together.','en-IN');
}
function talk(text){var c=$('conversation'),d=document.createElement('div');d.className='bubble child';d.textContent='You: '+text;c.appendChild(d);var s=document.createElement('div');s.className='bubble sunny';s.textContent='Sunny: Nice! '+text;c.appendChild(s);speak('Nice! '+text,'en-IN');c.scrollTop=c.scrollHeight}
function mic(){if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){$('statusText').textContent='Microphone is not available. You can use the buttons below.';return}navigator.mediaDevices.getUserMedia({audio:true}).then(function(stream){stream.getTracks().forEach(function(t){t.stop()});$('statusText').textContent='Microphone is ready. Say your answer using the microphone.'}).catch(function(e){$('statusText').textContent='Please allow microphone access and try again.'})}
var GAME=[['🍎','apple',['apple','ball','book','water']],['🐶','dog',['cat','dog','fish','bird']],['💧','water',['milk','water','juice','rice']],['⚽','ball',['book','ball','shoe','car']]],gameIndex=0,gameScore=0;
function renderGame(){var g=GAME[gameIndex%GAME.length];$('gameEmoji').textContent=g[0];$('gameFeedback').textContent='Choose one!';$('choices').innerHTML='';g[2].forEach(function(x){var b=document.createElement('button');b.textContent=x;b.onclick=function(){if(x===g[1]){$('gameFeedback').textContent='Great job! ⭐';gameScore++;$('gameScore').textContent=gameScore;speak('Great job! '+x,'en-IN');setTimeout(function(){gameIndex++;renderGame()},600)}else{$('gameFeedback').textContent='Try again!';speak('Try again','en-IN')}};$('choices').appendChild(b)})}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init)}else{init()}