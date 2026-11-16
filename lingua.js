/* Palestra Facile · lingua (Italiano / English)
   L'app è scritta in italiano. Se scegli English, questo file:
   - traduce i testi che compaiono sullo schermo (dizionario in en.js),
   - fa parlare la voce in inglese e capisce i comandi a voce in inglese,
   - mostra date e numeri all'inglese.
   Così il resto dell'app non va toccato: le novità nuove si traducono aggiungendo righe a en.js. */
(function(){
  'use strict';
  var KEY = 'pf-lang';
  var lang = 'it';
  try { lang = localStorage.getItem(KEY) === 'en' ? 'en' : 'it'; } catch (e) {}
  var EN = lang === 'en';

  var I18N = window.I18N = {
    lang: lang,
    set: function(l){ try { localStorage.setItem(KEY, l); } catch (e) {} location.reload(); },
    t: function(s){ return s; },
    cmd: function(s){ return s; }
  };

  /* ---------- scelta lingua: riquadro in cima alla prima pagina ---------- */
  function addRow(){
    var hero = document.querySelector('#app section.hero');
    if (!hero || (hero.previousElementSibling && hero.previousElementSibling.id === 'langRow')) return;
    var old = document.getElementById('langRow'); if (old) old.remove();
    var r = document.createElement('div');
    r.id = 'langRow'; r.className = 'langrow'; r.setAttribute('data-noi18n', '');
    r.innerHTML = '<span class="lt">🌐 ' + (EN ? 'Language' : 'Lingua') + '</span>' +
      '<button type="button" data-l="it"' + (EN ? '' : ' class="on" aria-pressed="true"') + '>🇮🇹 Italiano</button>' +
      '<button type="button" data-l="en"' + (EN ? ' class="on" aria-pressed="true"' : '') + '>🇬🇧 English</button>';
    r.onclick = function(e){ var b = e.target.closest('button'); if (b && b.dataset.l !== lang) I18N.set(b.dataset.l); };
    hero.parentNode.insertBefore(r, hero);
  }
  var css = '.langrow{display:flex;align-items:center;gap:8px;margin:0 0 12px;padding:8px 10px;background:var(--surface);border:1px solid var(--line);border-radius:16px}' +
            '.langrow .lt{font-weight:700;font-size:14px;margin-right:auto;white-space:nowrap}' +
            '.langrow button{font:600 15px/1 inherit;font-family:inherit;padding:10px 12px;border-radius:999px;border:1px solid var(--line);background:var(--bg);color:var(--fg);cursor:pointer;white-space:nowrap}' +
            '.langrow button.on{background:var(--accent);color:var(--on-accent);border-color:var(--accent)}';
  function boot(){
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    addRow();
    var app = document.getElementById('app');
    if (app) new MutationObserver(addRow).observe(app, {childList: true, subtree: true});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  if (!EN) return;

  document.documentElement.lang = 'en';
  // dizionario: caricato subito, prima dell'app
  document.write('<script src="en.js"><\/script>');

  /* ---------- traduzione ---------- */
  var D = null, PATS = [], cache = new Map(), outs = new Set(), heard = new Map();
  var HAS_WORD = /[A-Za-zÀ-ÿ]{2}/;
  function esc(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function init(){
    if (D) return true;
    var src = window.PF_EN; if (!src) return false;
    D = new Map();
    Object.keys(src).forEach(function(k){
      var v = src[k];
      if (k.indexOf('{*}') < 0) { D.set(k, v); return; }
      var lit = k.replace(/\{\*\}/g, '');
      if (lit.replace(/\s/g, '').length < 2 || !/[A-Za-zÀ-ÿ]/.test(lit)) return;
      var re = new RegExp('^' + k.split('{*}').map(esc).join('(.+?)') + '$');
      PATS.push([re, v, lit.length]);
    });
    PATS.sort(function(a, b){ return b[2] - a[2]; });
    D.forEach(function(v){ outs.add(v); });
    return true;
  }
  function fill(tpl, caps, depth){
    var i = 0;
    return tpl.replace(/\{(\*|\d)\}/g, function(_, n){
      var c = n === '*' ? caps[i++] : caps[+n];
      if (c == null) return '';
      var t = tr(c, depth + 1);
      return t == null ? c : t;
    });
  }
  var upFirst = function(s){ return s.charAt(0).toUpperCase() + s.slice(1); };
  var lowFirst = function(s){ return /^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s; };
  function tr(c, depth){
    depth = depth || 0;
    if (!c || depth > 4 || !HAS_WORD.test(c)) return null;
    if (cache.has(c)) return cache.get(c);
    var r = trCore(c, depth);
    if (depth === 0) cache.set(c, r);
    return r;
  }
  function tryPats(c, depth){
    for (var i = 0; i < PATS.length; i++) {
      var p = PATS[i], mm = p[0].exec(c);
      if (!mm) continue;
      var caps = mm.slice(1), ok = true;
      // un pezzo lungo che resta in italiano: questo modello non va bene, provo il prossimo
      for (var k = 0; k < caps.length; k++) {
        var cp = caps[k];
        if (cp.length > 18 && HAS_WORD.test(cp) && tr(cp, depth + 1) == null && !outs.has(cp)) { ok = false; break; }
      }
      if (ok) return fill(p[1], caps, depth);
    }
    return null;
  }
  var SPLITS = [/((?:[.!?;]|\s·)\s+|\s+—\s+|\s+→\s+)/, /(,\s+|:\s+)/, /(\s+(?:e|o)\s+)/];
  function trCore(c, depth){
    if (heard.has(c)) return heard.get(c);
    var r = D.get(c); if (r != null) return r;
    if (outs.has(c)) return null;
    var f = c.charAt(0), m;
    if (f !== f.toUpperCase()) { r = D.get(upFirst(c)); if (r != null) return lowFirst(r); }
    if (c.length > 3 && c === c.toUpperCase() && c !== c.toLowerCase()) {
      var lc = c.toLowerCase(); r = tr(upFirst(lc), depth + 1) || tr(lc, depth + 1);
      if (r != null) return r.toUpperCase();
    }
    // simboli e punteggiatura all'inizio o alla fine (+ ✓ ▶ → . : …)
    m = c.match(/^([^A-Za-zÀ-ÿ0-9"«(]*)([\s\S]*?[A-Za-zÀ-ÿ0-9)"»%'])([^A-Za-zÀ-ÿ0-9)"»%']*)$/);
    if (m && (m[1] || m[3])) {
      r = tr(m[2], depth + 1); if (r != null) return m[1] + r + m[3];
      if (m[1] && m[3]) { r = tr(m[2] + m[3], depth + 1); if (r != null) return m[1] + r; }
    }
    if (!/[.!?:]$/.test(c) && D.has(c + '.')) return D.get(c + '.').replace(/\.$/, '');
    m = c.match(/^(\d+) di (\d+)$/); if (m) return m[1] + ' of ' + m[2];
    // più frasi insieme: prima provo frase per frase
    r = splitTr(c, depth, 0, true); if (r != null) return r;
    r = tryPats(c, depth); if (r != null) return r;
    if (f !== f.toUpperCase()) { r = tryPats(upFirst(c), depth); if (r != null) return lowFirst(r); }
    // numeri davanti o dietro (3 × …, … 60–75%)
    m = c.match(/^((?:[\d.,–\-]+\s*[×x]\s*)+)([\s\S]+)$/) || c.match(/^([\s\S]*?[A-Za-zÀ-ÿ])(\s+[\d.,–\-%"'\s]+)$/);
    if (m) {
      var lead = /^[\d.,–\-]/.test(m[1]);
      r = tr(lead ? m[2] : m[1], depth + 1);
      if (r != null) return lead ? m[1] + r : r + m[2];
    }
    // frasi composte: traduco pezzo per pezzo
    for (var s = 0; s < SPLITS.length; s++) { r = splitTr(c, depth, s, false); if (r != null) return r; }
    return null;
  }
  function splitTr(c, depth, s, needAll){
    var parts = c.split(SPLITS[s]);
    if (parts.length < 2) return null;
    var any = false, all = true;
    var out = parts.map(function(p, k){
      if (k % 2) return p;
      if (!HAS_WORD.test(p) || outs.has(p)) return p;
      var t = tr(p, depth + 1); if (t != null) { any = true; return t; } all = false; return p;
    });
    return any && (all || (!needAll && s === 0)) ? out.join('') : null;
  }
  function T(s){
    if (s == null) return s;
    s = String(s);
    if (!HAS_WORD.test(s) || !init()) return s;
    var m = s.match(/^(\s*)([\s\S]*?)(\s*)$/);
    var core = m[2].replace(/\s+/g, ' ');
    var r = tr(core);
    if (r == null) return s;
    outs.add(r);
    return m[1] + r + m[3];
  }
  I18N.t = T;

  /* ---------- testi sullo schermo ---------- */
  var ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
  var SKIP = {SCRIPT: 1, STYLE: 1, TEXTAREA: 1, CODE: 1, PRE: 1};
  function doText(n){
    var p = n.parentNode; if (!p || SKIP[p.nodeName] || (p.closest && p.closest('[data-noi18n],[contenteditable]'))) return;
    var v = n.nodeValue; if (!HAS_WORD.test(v)) return;
    var t = T(v); if (t !== v) n.nodeValue = t;
  }
  function doEl(el){
    if (el.nodeName === 'SCRIPT' || el.nodeName === 'STYLE' || el.hasAttribute('data-noi18n')) return;
    for (var i = 0; i < ATTRS.length; i++) {
      var a = el.getAttribute(ATTRS[i]);
      if (a && HAS_WORD.test(a)) { var t = T(a); if (t !== a) el.setAttribute(ATTRS[i], t); }
    }
    if (el.nodeName === 'INPUT' && (el.type === 'button' || el.type === 'submit') && el.value) { var tv = T(el.value); if (tv !== el.value) el.value = tv; }
  }
  function walk(root){
    if (root.nodeType === 3) return doText(root);
    if (root.nodeType !== 1) return;
    doEl(root);
    if (SKIP[root.nodeName]) return;
    var w = document.createTreeWalker(root, 5, null), n;
    while ((n = w.nextNode())) { if (n.nodeType === 3) doText(n); else doEl(n); }
  }
  function start(){
    if (!init()) return;
    document.title = T(document.title);
    walk(document.body);
    new MutationObserver(function(list){
      for (var i = 0; i < list.length; i++) {
        var m = list[i];
        if (m.type === 'childList') { for (var j = 0; j < m.addedNodes.length; j++) walk(m.addedNodes[j]); }
        else if (m.type === 'characterData') doText(m.target);
        else if (m.type === 'attributes') doEl(m.target);
      }
    }).observe(document.body, {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  /* ---------- finestre del browser e disegni su canvas ---------- */
  ['alert', 'confirm', 'prompt'].forEach(function(k){
    var o = window[k]; if (!o) return;
    window[k] = function(msg){ var a = [].slice.call(arguments); a[0] = T(msg); return o.apply(window, a); };
  });
  try {
    var C2 = CanvasRenderingContext2D.prototype;
    ['fillText', 'strokeText'].forEach(function(k){
      var o = C2[k];
      C2[k] = function(t){ var a = [].slice.call(arguments); a[0] = T(t); return o.apply(this, a); };
    });
  } catch (e) {}

  /* ---------- date e numeri all'inglese ---------- */
  var LOC = 'en-GB';
  function loc(l){ return (l === 'it-IT' || l === 'it') ? LOC : l; }
  try {
    var NDF = Intl.DateTimeFormat;
    var DF = function(l, o){ return new NDF(loc(l), o); };
    DF.prototype = NDF.prototype; DF.supportedLocalesOf = NDF.supportedLocalesOf;
    Intl.DateTimeFormat = DF;
    var NNF = Intl.NumberFormat;
    var NF = function(l, o){ return new NNF(loc(l), o); };
    NF.prototype = NNF.prototype; NF.supportedLocalesOf = NNF.supportedLocalesOf;
    Intl.NumberFormat = NF;
    var nTL = Number.prototype.toLocaleString;
    Number.prototype.toLocaleString = function(l, o){ return nTL.call(this, loc(l), o); };
    ['toLocaleString', 'toLocaleDateString', 'toLocaleTimeString'].forEach(function(k){
      var o = Date.prototype[k];
      Date.prototype[k] = function(l, opt){ return o.call(this, loc(l), opt); };
    });
  } catch (e) {}

  /* ---------- voce in inglese ---------- */
  var enVoice = null;
  function pickVoice(){
    try {
      var vs = speechSynthesis.getVoices();
      enVoice = vs.find(function(v){ return /^en[-_]GB/i.test(v.lang) && v.localService; }) ||
                vs.find(function(v){ return /^en[-_]US/i.test(v.lang) && v.localService; }) ||
                vs.find(function(v){ return /^en/i.test(v.lang); }) || null;
    } catch (e) {}
  }
  function forSpeech(t){
    return String(t).replace(/(\d) gradi\b/g, '$1°').replace(/chilometri orari/g, 'km/h').replace(/(\d) virgola (\d)/g, '$1,$2');
  }
  if ('speechSynthesis' in window) {
    pickVoice();
    try { speechSynthesis.addEventListener('voiceschanged', pickVoice); } catch (e) {}
    var speak = speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak = function(u){
      try {
        var it = u.text, en = T(forSpeech(it));
        if (en === forSpeech(it)) en = it;
        u.text = en.replace(/(\d),(\d)/g, '$1.$2');
        u.lang = enVoice ? enVoice.lang : 'en-GB';
        u.voice = enVoice || null;
        try { if (typeof mic !== 'undefined' && mic) { mic.said = (Date.now() - (mic.saidAt || 0) < 3000 ? (mic.said || '') + ' ' : '') + u.text; } } catch (e) {}
      } catch (e) {}
      return speak(u);
    };
  }

  /* ---------- comandi a voce in inglese ---------- */
  var ONES = {zero:0, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10, eleven:11, twelve:12, thirteen:13, fourteen:14, fifteen:15, sixteen:16, seventeen:17, eighteen:18, nineteen:19};
  var TENS = {twenty:20, thirty:30, forty:40, fifty:50, sixty:60, seventy:70, eighty:80, ninety:90};
  function words2num(s){
    s = s.replace(/\b(a|one) hundred( and)?\s*/g, '1HUNDRED ');
    s = s.replace(/\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[\s-]+(one|two|three|four|five|six|seven|eight|nine)\b/g, function(_, t, o){ return String(TENS[t] + ONES[o]); });
    s = s.replace(/\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\b/g, function(_, t){ return String(TENS[t]); });
    s = s.replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)\b/g, function(_, o){ return String(ONES[o]); });
    s = s.replace(/1HUNDRED (\d+)/g, function(_, n){ return String(100 + +n); }).replace(/1HUNDRED/g, '100');
    return s;
  }
  var RULES = [
    // domande al coach e volume (prima delle altre regole)
    [/\bwhat time is it\b|\bwhat'?s the time\b|\btell me the time\b/g, ' che ore sono '],
    [/\bturn ([a-z ]{0,20}?) ?up\b/g, ' alza $1 '], [/\bturn ([a-z ]{0,20}?) ?down\b/g, ' abbassa $1 '],
    [/\b(volume|music|voice) up\b/g, ' alza $1 '], [/\b(volume|music|voice) down\b/g, ' abbassa $1 '],
    [/\b(turn up|raise|increase|louder)\b/g, ' alza '], [/\b(turn down|lower|decrease|quieter|softer)\b/g, ' abbassa '],
    [/\bvoice\b/g, ' voce '],
    [/\b(goal|target|i want to (run|do))\s*(\d+(?:\.\d+)?)\s*(k|km|kms|kilometers?|kilometres?)\b/g, ' obiettivo $3 km '],
    [/\bhow (far|many (km|kilometers|kilometres)) (have i|did i) (run|gone|done|go)\b|\b(my )?distance\b/g, ' distanza '],
    [/\bhow (far|much|long)( is it| is)?( still)? (left|to go|remaining|longer|further)\b|\bhow (far|much|long) (left|to go)\b|\bhow many (sets|exercises|km|kilometers|kilometres|minutes) (are )?(left|to go|remaining)\b|\bhow far to go\b/g, ' quanto manca '],
    [/\bhow (fast|quick)\b|\bwhat'?s? (is )?my (speed|pace)\b|\b(my )?(speed|pace)\b/g, ' velocita '],
    [/\bhow (am i|are we) (doing|going)\b|\bhow'?s it going\b|\bam i doing (ok|okay|well|good)\b/g, ' come sto andando '],
    [/\bhow long have i been\b|\btime so far\b|\belapsed\b/g, ' da quanto '],
    [/\bcalories\b/g, ' calorie '],
    [/\b(what|which|how much) weight\b/g, ' che peso '],
    [/\bwhat'?s? (is |comes )?next\b|\bwhat comes next\b/g, ' cosa viene dopo '],
    [/(\d+) point (\d+)/g, '$1.$2'], [/(\d+) and a half/g, '$1.5'], [/\bhalf\b/g, '.5'],
    [/\b(turn off|switch off|disable|stop)( the)? (microphone|mic|voice commands|listening)\b|\bmic off\b/g, ' spegni microfono '],
    [/\b(end|finish|stop|close)( the)? (workout|session|training)\b|\bthat'?s it for today\b/g, ' fine allenamento '],
    [/\b(start|begin)( the| my)? (workout|session|training)\b|\blet'?s start\b/g, ' inizio allenamento '],
    [/\b(skip|next)( the)? exercise\b/g, ' salta esercizio '],
    [/\b(next|change|another)( the)? (song|track)\b|\bskip( the)? song\b/g, ' musica prossima '],
    [/\b(more|extra|add|plus) (time|\d+ seconds?|seconds)\b|\b\d+ (more|extra) seconds?\b/g, ' altri 15 secondi '],
    [/\b(less|minus|fewer) (time|\d+ seconds?|seconds)\b|\b\d+ (less|fewer) seconds?\b/g, ' meno tempo '],
    [/\b(what can i say|help|commands)\b/g, ' aiuto '],
    [/\b(heart ?rate|heart|pulse|bpm)\b/g, ' battito '],
    [/\b(repeat|say again|where am i|what now)\b/g, ' ripeti '],
    [/\b(kilos?|kilograms?|kgs?)\b/g, ' chili '],
    [/\b(reps?|repetitions?|times)\b/g, ' ripetizioni '],
    [/\b(finished|done|complete|completed|set done)\b/g, ' fatta '],
    [/\b(pause|wait|hold on)\b/g, ' pausa '],
    [/\b(resume|continue|carry on|unpause|go again)\b/g, ' riprendi '],
    [/\b(music|song|play)\b/g, ' musica '],
    [/\b(skip|ready|go|next)\b/g, ' salta '],
    [/^\s*(yes|yeah|yep|confirm|save|sure)\b/g, ' si '],
    [/^\s*(no|nope|cancel)\b/g, ' no '],
    [/^\s*(finish|end|stop)\s*$/g, ' fine '],
    [/\b(start|begin)\b/g, ' inizio ']
  ];
  I18N.cmd = function(t){
    var s = ' ' + words2num(String(t).toLowerCase().replace(/[’']/g, "'")) + ' ';
    s = s.replace(/(\d+)\s*(kg|lbs?)\b/g, '$1 $2');
    for (var i = 0; i < RULES.length; i++) s = s.replace(RULES[i][0], RULES[i][1]);
    s = s.replace(/\s+/g, ' ').trim();
    heard.set(s, String(t).trim()); cache.delete(s);
    if (heard.size > 50) heard.delete(heard.keys().next().value);
    return s;
  };
  function patchSR(SR){
    if (!SR || SR.__pfEn) return; SR.__pfEn = 1;
    var P = SR.prototype;
    var dl = Object.getOwnPropertyDescriptor(P, 'lang');
    if (dl && dl.set) Object.defineProperty(P, 'lang', {configurable: true, enumerable: dl.enumerable, get: dl.get, set: function(){ dl.set.call(this, 'en-US'); }});
    var dr = Object.getOwnPropertyDescriptor(P, 'onresult');
    if (dr && dr.set) Object.defineProperty(P, 'onresult', {configurable: true, enumerable: dr.enumerable, get: dr.get, set: function(fn){
      if (typeof fn !== 'function') return dr.set.call(this, fn);
      dr.set.call(this, function(e){
        var res = [];
        for (var k = 0; k < e.results.length; k++) {
          var r = e.results[k], alts = [];
          for (var j = 0; j < r.length; j++) alts.push({transcript: I18N.cmd(r[j].transcript), confidence: r[j].confidence});
          alts.isFinal = r.isFinal; res.push(alts);
        }
        return fn.call(this, {resultIndex: e.resultIndex, results: res, type: e.type});
      });
    }});
  }
  try { patchSR(window.SpeechRecognition); patchSR(window.webkitSpeechRecognition); } catch (e) {}
})();
