// sound.js — 程序化音效（Web Audio API，无需外部文件）
// 微信小游戏：wx.createWebAudioContext() ≈ AudioContext

var audioCtx = null;

function ensureCtx() {
  if (!audioCtx) {
    try {
      audioCtx = wx.createWebAudioContext();
    } catch (e) {
      audioCtx = null;
    }
  }
  return audioCtx;
}

// ---- 拍翅膀：短促上滑音 ----
function playFlap() {
  var ctx = ensureCtx();
  if (!ctx) return;
  var now = ctx.currentTime;
  var osc = ctx.createOscillator();
  var gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.linearRampToValueAtTime(750, now + 0.06);
  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.08);
}

// ---- 得分：双音上行叮咚 ----
function playScore() {
  var ctx = ensureCtx();
  if (!ctx) return;
  var now = ctx.currentTime;
  // 第一音
  var o1 = ctx.createOscillator();
  var g1 = ctx.createGain();
  o1.type = 'sine';
  o1.frequency.value = 523; // C5
  g1.gain.setValueAtTime(0.2, now);
  g1.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
  o1.connect(g1); g1.connect(ctx.destination);
  o1.start(now); o1.stop(now + 0.1);
  // 第二音
  var o2 = ctx.createOscillator();
  var g2 = ctx.createGain();
  o2.type = 'sine';
  o2.frequency.value = 659; // E5
  g2.gain.setValueAtTime(0.2, now + 0.08);
  g2.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
  o2.connect(g2); g2.connect(ctx.destination);
  o2.start(now + 0.08); o2.stop(now + 0.2);
}

// ---- 死亡：低沉下滑音 ----
function playDie() {
  var ctx = ensureCtx();
  if (!ctx) return;
  var now = ctx.currentTime;
  var osc = ctx.createOscillator();
  var gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(280, now);
  osc.frequency.linearRampToValueAtTime(60, now + 0.3);
  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.35);
}

// ---- 按钮点击：清脆短促 ----
function playClick() {
  var ctx = ensureCtx();
  if (!ctx) return;
  var now = ctx.currentTime;
  var osc = ctx.createOscillator();
  var gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 1000;
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.04);
}

// ---- 下落呼啸：顶点转下落时的风声 ----
function playFall() {
  var ctx = ensureCtx();
  if (!ctx) return;
  var now = ctx.currentTime;
  // 双层 detuned 锯齿波模拟风噪
  for (var i = 0; i < 2; i++) {
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400 + i * 15, now);
    osc.frequency.linearRampToValueAtTime(200, now + 0.25);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.25);
  }
}

// ---- 星星拾取：上行叮 ----
function playStarPickup() {
  var ctx = ensureCtx();
  if (!ctx) return;
  var now = ctx.currentTime;
  var osc = ctx.createOscillator();
  var gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, now);
  osc.frequency.linearRampToValueAtTime(1800, now + 0.05);
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.07);
}

// ---- 蓄力音效：持续嗡声 + 释放音 ----
var _chargeOsc = null, _chargeGain = null;

function startCharge() {
  var ctx = ensureCtx();
  if (!ctx || _chargeOsc) return;
  try {
    _chargeOsc = ctx.createOscillator();
    _chargeGain = ctx.createGain();
    _chargeOsc.type = 'sine';
    _chargeOsc.frequency.value = 250;
    _chargeGain.gain.value = 0;
    _chargeOsc.connect(_chargeGain);
    _chargeGain.connect(ctx.destination);
    _chargeOsc.start();
  } catch (e) { _chargeOsc = null; _chargeGain = null; }
}

function updateCharge(ratio) {
  if (!_chargeOsc || !_chargeGain) return;
  try {
    _chargeOsc.frequency.value = 250 + ratio * 450;
    _chargeGain.gain.value = ratio * 0.06;
  } catch (e) {}
}

function stopCharge(ratio) {
  if (!_chargeGain || !_chargeOsc) return;
  var ctx = audioCtx;
  try {
    _chargeGain.gain.cancelScheduledValues(ctx.currentTime);
    _chargeGain.gain.setValueAtTime(_chargeGain.gain.value, ctx.currentTime);
    _chargeGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    var osc = _chargeOsc, gain = _chargeGain;
    setTimeout(function() {
      try { osc.stop(); } catch (e) {}
    }, 100);
  } catch (e) {}
  _chargeOsc = null; _chargeGain = null;
  // 释放爆发音
  if (ratio > 0.01) {
    var c = ensureCtx(); if (!c) return;
    var n = c.currentTime;
    var o = c.createOscillator(), g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(400 + ratio * 500, n);
    o.frequency.linearRampToValueAtTime(800 + ratio * 300, n + 0.1);
    g.gain.setValueAtTime(0.08 + ratio * 0.1, n);
    g.gain.exponentialRampToValueAtTime(0.01, n + 0.15);
    o.connect(g); g.connect(c.destination);
    o.start(n); o.stop(n + 0.15);
  }
}

// ---- 无敌激活：上行琶音 ----
function playInvincible() {
  var ctx = ensureCtx();
  if (!ctx) return;
  var now = ctx.currentTime;
  var notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
  for (var ni = 0; ni < notes.length; ni++) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = notes[ni];
    var t = now + ni * 0.06;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.15, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + 0.15);
  }
}

// ---- 蓄力满蓄提示音：短促清亮双音 ----
function playChargeFull() {
  var ctx = ensureCtx();
  if (!ctx) return;
  var now = ctx.currentTime;
  // 第一音 1200Hz 30ms
  var o1 = ctx.createOscillator();
  var g1 = ctx.createGain();
  o1.type = 'sine';
  o1.frequency.value = 1200;
  g1.gain.setValueAtTime(0.2, now);
  g1.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
  o1.connect(g1); g1.connect(ctx.destination);
  o1.start(now); o1.stop(now + 0.03);
  // 第二音 1600Hz 30ms
  var o2 = ctx.createOscillator();
  var g2 = ctx.createGain();
  o2.type = 'sine';
  o2.frequency.value = 1600;
  g2.gain.setValueAtTime(0.2, now + 0.03);
  g2.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
  o2.connect(g2); g2.connect(ctx.destination);
  o2.start(now + 0.03); o2.stop(now + 0.06);
}

// ---- 连击音效：消消乐式旋律递增 ----
function playCombo(level) {
  var ctx = ensureCtx();
  if (!ctx || level < 1) return;
  var now = ctx.currentTime;
  // GOOD(1): 单音, GREAT(2): 双音上行, AMAZING(3): 三音, FANTASTIC(5): 四音, LEGENDARY(7+): 五音
  var count = level >= 7 ? 5 : level >= 5 ? 4 : level >= 3 ? 3 : level >= 2 ? 2 : 1;
  var notes;
  if (count === 1) notes = [523];                          // C5
  else if (count === 2) notes = [523, 659];                 // C5 E5
  else if (count === 3) notes = [523, 659, 784];            // C5 E5 G5
  else if (count === 4) notes = [392, 523, 659, 784];       // G4 C5 E5 G5
  else notes = [330, 392, 523, 659, 784];                   // E4 G4 C5 E5 G5
  for (var ni = 0; ni < notes.length; ni++) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = notes[ni];
    var t = now + ni * 0.07;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.18, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + 0.2);
  }
}

// ---- 销毁 ----
function destroy() {
  if (audioCtx) {
    try { audioCtx.close(); } catch (e) {}
    audioCtx = null;
  }
}

module.exports = {
  playFlap: playFlap,
  playScore: playScore,
  playDie: playDie,
  playClick: playClick,
  playFall: playFall,
  playStarPickup: playStarPickup,
  startCharge: startCharge,
  updateCharge: updateCharge,
  stopCharge: stopCharge,
  playInvincible: playInvincible,
  playChargeFull: playChargeFull,
  playCombo: playCombo,
  destroy: destroy
};
