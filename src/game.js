// game.js — 主控制器：状态机 + 模块编排
// 依赖: config, storage, bird, pipe, particles, memorial, ui

var C = require('./config.js');
var Storage = require('./storage.js');
var Bird = require('./bird.js');
var Pipe = require('./pipe.js');
var Particles = require('./particles.js');
var Memorial = require('./memorial.js');
var UI = require('./ui.js');
var Sound = require('./sound.js');
var Star = require('./star.js');
var Item = require('./item.js');

// ---- 游戏运行时状态 ----
var state, birdY, birdVY, pipes, score, best, pipesPassed;
var medalLevel, shakeTimer;
var onExit;
var isDailyChallenge;

// ---- 蓄力跳 ----
var chargeStartTime = 0, isCharging = false, chargeRatio = 0;
var chargeWasFull = false;

// ---- 星星收集 ----
var stars = [];

// ---- 连击 & 倍率 ----
var combo = 0;
var chargeMultiplier = 1;
var chargeBoostTimer = 0;
var multiBurstTime = 0;
var invincibleTimer = 0;

// ---- 主题 & 配饰 ----
var currentTheme, currentAccessory, unlockedThemes;
var unlockedAccessories = {};
var paneling = null;
var panelJustOpened = false;
var showingLeaderboard = false;
var leaderboardJustOpened = false;
var leaderboardMode = 0; // 0=单人榜 1=双人榜

// ---- 花瓣粒子 ----
var petals = [];
// ---- 得分飞行文字 ----
var scoreFlyTexts = [];
var scoreFlash = 0;   // 分数面板闪烁计时器

// ---- 纪念卡 ----
var memorialMsg;

// ---- 死亡动画 ----
var deathAnimPhase = 0;    // 0=坠落, 1=弹起, 2=落地
var deathGroundOffset = 0; // 冻结地面纹理偏移

// ---- 双人模式 ----
var isTwoPlayer = false;
var birdA = null, birdB = null;
var _activeTouchMap = {};     // { touchId: 'A'|'B' }
var _activeCountA = 0, _activeCountB = 0;
var _splitLineTimer = 0;      // 双人开场分屏线倒计时
var _rescueFade = 0;           // 营救提示淡入淡出
// ---- 道具系统 ----
var items = [];              // 漂浮盲盒 [{x,y,collected,type,opened,phase}]
var activeItem = null;       // 当前激活道具（单人/双人鸟A） {type, timer}
var activeItemB = null;      // 当前激活道具（双人鸟B）

function _createBirdState(bx) {
  return {
    x: bx, y: C.GAME_TOP + C.GAME_H / 2, vy: 0, alive: true,
    stunned: false, stunTimer: 0, wakeFlash: 0,
    isCharging: false, chargeStartTime: 0, chargeRatio: 0, chargeWasFull: false,
    combo: 0, chargeMultiplier: 1, multiBurstTime: 0, invincibleTimer: 0
  };
}

function _applyRopeConstraint(s) {
  if (!birdA || !birdB) return;
  var dx = birdB.x - birdA.x;
  var dy = birdB.y - birdA.y;
  var dist = Math.sqrt(dx * dx + dy * dy);
  if (dist <= C.ROPE_MAX_LENGTH) return;
  var overlap = dist - C.ROPE_MAX_LENGTH;
  var ny = dy / dist;
  var force = overlap * C.ROPE_STIFFNESS * 60 * s;
  // 眩晕鸟更轻（0.6x质量），搭档拉它更容易
  var massA = birdA.stunned ? 0.3 : 1;
  var massB = birdB.stunned ? 0.6 : 1;
  if (!birdA.alive && birdB.alive)      { birdA.vy += ny * force * 0.25; birdB.vy -= ny * force * 0.75 * massA; }
  else if (birdA.alive && !birdB.alive) { birdA.vy += ny * force * 0.75 * massB; birdB.vy -= ny * force * 0.25; }
  else if (birdA.alive && birdB.alive)  { birdA.vy += ny * force * 0.5 * massB; birdB.vy -= ny * force * 0.5 * massA; }
}

function _hitBird(bird, other) {
  if (!isTwoPlayer || !bird.alive) return;
  // 已眩晕再撞 → 保持眩晕（不致死，只有两只同时晕才死）
  if (bird.stunned) {
    bird.stunTimer = 1.0; // 刷新眩晕时间
    return;
  }
  // 首次碰撞 → 眩晕
  bird.stunned = true;
  bird.stunTimer = 1.0;
  if (bird.isCharging) {
    if (bird === birdA) Sound.stopCharge(0); else Sound.stopCharge2(0);
    bird.isCharging = false; bird.chargeRatio = 0;
  }
  // 搭档还活着 → 播放营救紧急提示音
  if (other && other.alive && !other.stunned) {
    Sound.playRescueUrge();
  }
  // 两只都晕 → 全死
  if (birdA.stunned && birdB.stunned) {
    birdA.alive = false; birdB.alive = false;
    Sound.playDie();
    var t2 = C.getT(currentTheme);
    Particles.spawnDeathPetals(petals, birdA.y, t2);
    Particles.spawnDeathPetals(petals, birdB.y, t2);
    _finalizeDualDeath();
  }
}

function _finalizeDualDeath() {
  if (!isTwoPlayer) { console.log('[finalizeDualDeath] BLOCKED - isTwoPlayer false'); return; }
  console.log('[finalizeDualDeath] called! isTwoPlayer:', isTwoPlayer, 'birdA.alive:', birdA && birdA.alive, 'birdB.alive:', birdB && birdB.alive);
  state = C.STATE.DEAD;
  shakeTimer = 0; deathAnimPhase = 0;
  deathGroundOffset = (Date.now() * 0.06) % 40;
  birdY = Math.min(birdA.y, birdB.y);
  birdVY = 0;
  // 勋章/积分/解锁 — 复用单人逻辑
  if (score >= 30) medalLevel = 3;
  else if (score >= 20) medalLevel = 2;
  else if (score >= 10) medalLevel = 1;
  if (score > best) best = score;
  Storage.saveData(buildSaveData());
  var earned = 0;
  if (score >= 2) { earned = 1 + Math.floor((score - 2) / 5); if (combo >= 7) earned += 3; else if (combo >= 5) earned += 2; }
  earned = Math.min(earned, 20);
  if (earned > 0) { points += earned; Storage.savePoints(points); showToastSafe('+' + earned + ' 💎', 'none', 1200); }
  if (combo >= 5) score += Math.floor(combo / 2);
  Memorial.renderMemorialCard(score, pipesPassed, currentTheme, currentAccessory, memorialMsg, Bird.drawAccessoryOnCtx);
  Memorial.prepareShareImage();
  if (score > 0) {
    var composite = score * 100 + Math.floor(score / Math.max(pipesPassed, 1));
    // 云端对比和写入委托 ODC 处理（ODC 有读写云端的完整能力）
    try { wx.getOpenDataContext().postMessage({ type: 'UPDATE_SCORE', score: composite, mode: 1 }); } catch(e) {}
  }
}

// ---- 积分 ----
var points;
var gameJustStarted = false;
var gameCanvas = null;
var userAvatarUrl = '';
var avatarEnabled = false;
var avatarImg = null;
var rankManager = null;

// ==================== 辅助函数 ====================

function buildSaveData() {
  return {
    best: best,
    currentTheme: currentTheme,
    currentAccessory: currentAccessory,
    unlockedThemes: unlockedThemes,
    unlockedAccessories: unlockedAccessories,
    avatarEnabled: avatarEnabled
  };
}

// 防吞 toast：先 hide 再延迟 60ms 显示，避免被前一个 toast 吞掉
function showToastSafe(msg, icon, dur) {
  try { wx.hideToast(); } catch(e) {}
  setTimeout(function() {
    try { wx.showToast({ title: msg, icon: icon || 'none', duration: dur || 2000 }); } catch(e) {}
  }, 60);
}

var _uploadSettled = false;

function uploadToCloud(mode, score) {
  mode = mode || 0;
  score = score || 0;
  var now = Math.floor(Date.now() / 1000);
  var key = mode === 1 ? 'bestScore2P' : 'bestScore';
  console.log('[Leaderboard] 上传 mode=' + mode + ' score=' + score);

  // 1. 官方排行榜上报
  if (rankManager) {
    try {
      rankManager.update({ scoreList: [{ score: score }] });
    } catch(e) {}
  }

  // 2. 关系链KV
  if (typeof wx.setUserCloudStorage !== 'function') {
    console.error('[Leaderboard] setUserCloudStorage 不存在');
    showToastSafe('❌无云存储API', 'none', 3000);
    return;
  }
  _uploadSettled = false;
  showToastSafe('↪上报调用 ' + key, 'none', 1500);
  try {
    wx.setUserCloudStorage({
      KVDataList: [
        { key: key, value: JSON.stringify({ wxgame: { score: score, update_time: now } }) }
      ],
      success: function() {
        _uploadSettled = true;
        console.log('[Leaderboard] setUserCloudStorage OK key=' + key);
        showToastSafe('✅上报成功 ' + key + '=' + score, 'success', 2500);
        if (showingLeaderboard) {
          var tU = C.getT(currentTheme);
          try { wx.getOpenDataContext().postMessage({ type: 'refresh', mode: leaderboardMode, accent: tU.accent, accentDark: tU.accentDark }); } catch(e) {}
        }
      },
      fail: function(err) {
        _uploadSettled = true;
        console.error('[Leaderboard] setUserCloudStorage FAIL:', JSON.stringify(err));
        var em = err && err.errMsg ? err.errMsg : JSON.stringify(err);
        showToastSafe('❌上报失败 ' + key + ' ' + em, 'none', 3500);
      },
      complete: function(res) {
        _uploadSettled = true;
        console.log('[Leaderboard] setUserCloudStorage complete key=' + key + ' res=' + JSON.stringify(res));
      }
    });
  } catch (e) {
    _uploadSettled = true;
    console.error('[Leaderboard] setUserCloudStorage THROW:', e && e.message);
    showToastSafe('❌上报异常 ' + (e && e.message ? e.message : e), 'none', 3500);
  }
  // 看门狗：3 秒内回调没回来 → 判定 API 无响应
  setTimeout(function() {
    if (!_uploadSettled) showToastSafe('⚠上报无回调 ' + key, 'none', 3000);
  }, 3000);
}

function showLeaderboardOverlay() {
  showingLeaderboard = true;
  leaderboardJustOpened = true;
  leaderboardMode = isTwoPlayer ? 1 : 0;
  try {
    var openDataContext = wx.getOpenDataContext();
    var si = wx.getSystemInfoSync();
    var t = C.getT(currentTheme);
    openDataContext.postMessage({
      type: 'show',
      mode: leaderboardMode,
      accent: t.accent,
      accentDark: t.accentDark,
      userAvatarUrl: userAvatarUrl || '',
      W: si.windowWidth,
      H: si.windowHeight,
      dpr: si.pixelRatio || 1
    });
  } catch(e) {}
}

function hideLeaderboardOverlay() {
  showingLeaderboard = false;
  try {
    wx.getOpenDataContext().postMessage({ type: 'hide' });
  } catch(e) {}
}

function forwardTouchToLeaderboard(tx, ty, phase) {
  try {
    wx.getOpenDataContext().postMessage({ type: 'touch', x: tx, y: ty, phase: phase });
  } catch(e) {}
}

function gotoMenu() {
  birdY = C.GAME_TOP + C.GAME_H / 2;
  birdVY = 0;
  pipes = [];
  petals = [];
  scoreFlyTexts = []; scoreFlash = 0;
  stars = [];
  score = 0;
  pipesPassed = 0;
  combo = 0;
  chargeMultiplier = 1;
  multiBurstTime = 0;
  invincibleTimer = 0;
  medalLevel = 0;
  shakeTimer = 0;
  isTwoPlayer = false;
  birdA = null; birdB = null;
  _activeTouchMap = {}; _activeCountA = 0; _activeCountB = 0;
  items = []; activeItem = null; activeItemB = null;
  memorialMsg = C.MEMORIAL_MSGS[Math.floor(Math.random() * C.MEMORIAL_MSGS.length)];
  state = C.STATE.MENU;
  // 未授权时提前创建原生按钮，点击即授权（一步到位）
  if (!userAvatarUrl) showUserInfoButton();
}

function startGame() {
  console.log('[startGame] isTwoPlayer:', isTwoPlayer, 'birdA:', !!birdA);
  birdY = C.GAME_TOP + C.GAME_H / 2;
  birdVY = 0;
  pipes = [];
  petals = [];
  scoreFlyTexts = []; scoreFlash = 0;
  stars = [];
  score = 0;
  pipesPassed = 0;
  combo = 0;
  isCharging = false;
  chargeRatio = 0;
  chargeWasFull = false;
  chargeMultiplier = 1;
  multiBurstTime = 0;
  invincibleTimer = 0;
  medalLevel = 0;
  shakeTimer = 0;
  items = []; activeItem = null; activeItemB = null;
  memorialMsg = C.MEMORIAL_MSGS[Math.floor(Math.random() * C.MEMORIAL_MSGS.length)];
  destroyUserInfoButton();
  if (isTwoPlayer) {
    birdA = _createBirdState(C.BIRD_X_A);
    birdB = _createBirdState(C.BIRD_X_B);
    _activeTouchMap = {}; _activeCountA = 0; _activeCountB = 0;
    _splitLineTimer = 2.0;
    _rescueFade = 0;
  }
  gameJustStarted = true;
  state = C.STATE.PLAYING;
}

function flap(velocity) {
  birdVY = velocity || C.CHARGE_MIN_VELOCITY;
  Sound.playFlap();
}

function die() {
  console.log('[die] isTwoPlayer:', isTwoPlayer, 'score:', score, 'pipes:', pipesPassed);
  if (isTwoPlayer) return; // 双人模式由 _hitBird / _finalizeDualDeath 处理
  state = C.STATE.DEAD;
  shakeTimer = 0;
  deathAnimPhase = 0;
  deathGroundOffset = (Date.now() * 0.06) % 40;
  if (isCharging) { Sound.stopCharge(0); }
  isCharging = false;
  chargeRatio = 0;
  chargeWasFull = false;
  chargeMultiplier = 1;
  multiBurstTime = 0;
  invincibleTimer = 0;
  Sound.playDie();

  // 勋章等级
  if (score >= 30) medalLevel = 3;
  else if (score >= 20) medalLevel = 2;
  else if (score >= 10) medalLevel = 1;

  // 死亡花瓣雨
  var t = C.getT(currentTheme);
  Particles.spawnDeathPetals(petals, birdY, t);

  // 更新最佳分数
  if (score > best) best = score;
  Storage.saveData(buildSaveData());

  // 积分奖励：2分起奖，基础1 + 每5分+1，连击加成，单局上限20
  var earned = 0;
  if (score >= 2) {
    earned = 1 + Math.floor((score - 2) / 5);
    if (combo >= 7) earned += 3;
    else if (combo >= 5) earned += 2;
  }
  earned = Math.min(earned, 20);
  if (earned > 0) {
    points += earned;
    Storage.savePoints(points);
    wx.showToast({ title: '+' + earned + ' 💎', icon: 'none', duration: 1200 });
  }

  // 连击加分
  if (combo >= 5) {
    var bonus = Math.floor(combo / 2);
    score += bonus;
  }

  // 预渲染纪念卡 + 提前生成分享图
  Memorial.renderMemorialCard(score, pipesPassed, currentTheme, currentAccessory, memorialMsg, Bird.drawAccessoryOnCtx);
  Memorial.prepareShareImage();

  // 委托 ODC 处理云端对比和写入
  if (score > 0) {
    var composite = score * 100 + Math.floor(score / Math.max(pipesPassed, 1));
    try { wx.getOpenDataContext().postMessage({ type: 'UPDATE_SCORE', score: composite, mode: 0 }); } catch(e) {}
  }
}

function restartGame() {
  if (score > best) { best = score; Storage.saveData(buildSaveData()); }
  birdY = C.GAME_TOP + C.GAME_H / 2;
  birdVY = 0;
  pipes = [];
  petals = [];
  scoreFlyTexts = []; scoreFlash = 0;
  stars = [];
  score = 0;
  pipesPassed = 0;
  combo = 0;
  isCharging = false;
  chargeRatio = 0;
  chargeWasFull = false;
  chargeMultiplier = 1;
  multiBurstTime = 0;
  invincibleTimer = 0;
  medalLevel = 0;
  shakeTimer = 0;
  items = []; activeItem = null; activeItemB = null;
  memorialMsg = C.MEMORIAL_MSGS[Math.floor(Math.random() * C.MEMORIAL_MSGS.length)];
  destroyUserInfoButton();
  if (isTwoPlayer) {
    birdA = _createBirdState(C.BIRD_X_A);
    birdB = _createBirdState(C.BIRD_X_B);
    _activeTouchMap = {}; _activeCountA = 0; _activeCountB = 0;
    _splitLineTimer = 2.0;
    _rescueFade = 0;
  }
  gameJustStarted = true;
  state = C.STATE.PLAYING;
}

function fetchUserAvatar() {
  wx.getSetting({
    success: function(s) {
      if (s.authSetting['scope.userInfo']) {
        wx.getUserInfo({
          success: function(u) {
            userAvatarUrl = u.userInfo.avatarUrl;
            if (userAvatarUrl && (!avatarImg || avatarImg._src !== userAvatarUrl)) {
              avatarImg = wx.createImage();
              avatarImg._src = userAvatarUrl;
              avatarImg.src = userAvatarUrl;
            }
          }
        });
      }
    }
  });
}

function setUserAvatar(url) {
  userAvatarUrl = url;
  if (userAvatarUrl && (!avatarImg || avatarImg._src !== userAvatarUrl)) {
    avatarImg = wx.createImage();
    avatarImg._src = userAvatarUrl;
    avatarImg.src = userAvatarUrl;
  }
  avatarEnabled = true;
  Storage.saveData(buildSaveData());
}

var _userInfoButton = null;

function showUserInfoButton() {
  // 销毁旧的
  if (_userInfoButton) { _userInfoButton.destroy(); _userInfoButton = null; }

  if (!wx.createUserInfoButton) {
    wx.showToast({ title: '当前版本不支持，请在设置中授权', icon: 'none' });
    return;
  }

  // 计算头像按钮在屏幕上的位置（与 ui.js drawStartScreen 同步）
  var titleY = C.GAME_TOP + 40;
  var logoY = titleY + 200;
  var avatarBtnY = logoY + C.BIRD_SIZE * 3 + 22 + 14;
  var btnCX = C.W / 2;
  var btnCY = avatarBtnY;

  var btnSize = 48;
  _userInfoButton = wx.createUserInfoButton({
    type: 'text',
    text: '',
    style: {
      left: btnCX - btnSize / 2,
      top: btnCY - btnSize / 2,
      width: btnSize,
      height: btnSize,
      lineHeight: btnSize,
      backgroundColor: 'transparent',
      color: 'transparent',
      textAlign: 'center',
      fontSize: 0,
      borderRadius: btnSize / 2
    }
  });

  _userInfoButton.onTap(function(res) {
    if (res.userInfo) {
      _userInfoButton.destroy();
      _userInfoButton = null;
      setUserAvatar(res.userInfo.avatarUrl);
      wx.showToast({ title: '头像已开启', icon: 'none', duration: 1500 });
    }
    // 拒绝不销毁，保留按钮可重试
  });
}

function destroyUserInfoButton() {
  if (_userInfoButton) { _userInfoButton.destroy(); _userInfoButton = null; }
}

function toggleAvatar() {
  if (userAvatarUrl) return; // 已登录，无需重复
  // 原生按钮已在 gotoMenu 时创建，这里仅兜底
  if (!_userInfoButton) showUserInfoButton();
}

// ==================== 对外 API ====================

function init(canvas, ctx, params) {
  var si = wx.getSystemInfoSync();
  C.setLayout(si);

  onExit = (params && params.onExit) ? params.onExit : null;

  // 读取存储数据
  var data = Storage.loadData();
  best = data.best;
  currentTheme = data.currentTheme;
  currentAccessory = data.currentAccessory;
  unlockedThemes = data.unlockedThemes;
  unlockedAccessories = data.unlockedAccessories || { none: true };
  points = data.points;
  avatarEnabled = data.avatarEnabled || false;

  // 官方排行榜
  try { rankManager = wx.getRankManager(); } catch(e) { rankManager = null; }

  // 朋友圈分享：小游戏不能主动调起，需通过右上角 ··· 菜单
  try {
    wx.showShareMenu({ menus: ['shareAppMessage', 'shareTimeline'] });
    wx.onShareTimeline(function() {
      return {
        title: '噗噗鸟 · 治愈飞行日记',
        imageUrl: Memorial.getShareImagePath() || ''
      };
    });
  } catch(e) {}

  isDailyChallenge = false;
  Memorial.ensureMemorialCanvas();
  // 如果之前开启了头像模式，静默拉取头像（已授权则成功，未授权则无声失败）
  if (avatarEnabled) fetchUserAvatar();
  gotoMenu();
}

function update(dt) {
  Particles.updatePetals(petals, dt, state);
  if (scoreFlyTexts.length > 0) {
    if (Particles.updateScoreFlies(scoreFlyTexts, dt, C.W / 2, C.GAME_TOP + 18) > 0) scoreFlash = 0.35;
  }
  if (scoreFlash > 0) scoreFlash = Math.max(0, scoreFlash - Math.min(dt, 0.1));

  if (state !== C.STATE.PLAYING && state !== C.STATE.DEAD) return;

  var s = Math.min(dt, 0.1);

  // ---- 死亡动画：坠落 → 弹跳 → 落地 ----
  if (state === C.STATE.DEAD) {
    if (shakeTimer > 0) shakeTimer = Math.max(0, shakeTimer - s);

    if (isTwoPlayer && birdA && birdB) {
      // 双人：两鸟各自落向地面
      var groundYA = C.GROUND_Y - C.BIRD_SIZE * 0.6;
      if (birdA.y < groundYA) {
        birdA.vy = Math.min(C.TERMINAL_V, birdA.vy + C.GRAVITY_PX * s);
        birdA.y += birdA.vy * s;
      } else {
        birdA.y = groundYA; birdA.vy = 0;
      }
      if (birdB.y < groundYA) {
        birdB.vy = Math.min(C.TERMINAL_V, birdB.vy + C.GRAVITY_PX * s);
        birdB.y += birdB.vy * s;
      } else {
        birdB.y = groundYA; birdB.vy = 0;
      }
      // 绳索在死后仍施加约束，直到两鸟都落地
      if (birdA.y < groundYA || birdB.y < groundYA) _applyRopeConstraint(s);
      if (birdA.y >= groundYA && birdB.y >= groundYA && deathAnimPhase < 2) {
        deathAnimPhase = 2; shakeTimer = 0.3;
        var td = C.getT(currentTheme);
        Particles.spawnDeathPetals(petals, birdA.y, td);
        Particles.spawnDeathPetals(petals, birdB.y, td);
      }
    } else {
      // 单人：原有逻辑
      if (deathAnimPhase < 2) {
        birdVY = Math.min(C.TERMINAL_V, birdVY + C.GRAVITY_PX * s);
        birdY += birdVY * s;
        var groundY = C.GROUND_Y - C.BIRD_SIZE * 0.6;
        if (birdY >= groundY && deathAnimPhase === 0) {
          birdY = groundY;
          birdVY = -Math.abs(birdVY) * 0.3;
          deathAnimPhase = 1; shakeTimer = 0.5;
          var t2 = C.getT(currentTheme);
          Particles.spawnDeathPetals(petals, groundY, t2);
        } else if (birdY >= groundY && deathAnimPhase === 1) {
          birdY = groundY; birdVY = 0;
          deathAnimPhase = 2; shakeTimer = 0.3;
        }
      }
    }
    return;
  }

  // 激活道具计时
  if (activeItem) {
    activeItem.timer -= s;
    if (activeItem.timer <= 0) activeItem = null;
  }
  if (activeItemB) {
    activeItemB.timer -= s;
    if (activeItemB.timer <= 0) activeItemB = null;
  }

  // ---- 双人模式：独立物理 + 绳索约束 + 碰撞 ----
  if (isTwoPlayer) {
    if (_splitLineTimer > 0) _splitLineTimer = Math.max(0, _splitLineTimer - s);
    if (birdA && birdA.wakeFlash > 0) birdA.wakeFlash = Math.max(0, birdA.wakeFlash - s);
    if (birdB && birdB.wakeFlash > 0) birdB.wakeFlash = Math.max(0, birdB.wakeFlash - s);
    // 营救提示淡入淡出
    var needRescue = (birdA && birdA.alive && birdA.stunned && birdB && birdB.alive && !birdB.stunned)
                  || (birdB && birdB.alive && birdB.stunned && birdA && birdA.alive && !birdA.stunned);
    var fadeSpeed = needRescue ? 6.0 : 3.0; // 淡入快，淡出慢
    _rescueFade += (needRescue ? 1 : 0 - _rescueFade) * Math.min(1, fadeSpeed * s);
    var t2 = C.getT(currentTheme);
    // 更新活鸟物理 + 蓄力（眩晕鸟不能蓄力，蓄力释放后恢复）
    if (birdA.alive) {
      birdA.vy = Math.min(C.TERMINAL_V, birdA.vy + C.GRAVITY_PX * s * (birdA.stunned ? 0.7 : 1));
      birdA.y += birdA.vy * s;
      if (birdA.isCharging && !birdA.stunned) {
        birdA.chargeRatio = Math.min((Date.now() - birdA.chargeStartTime) / 1000 / C.CHARGE_MAX_TIME, 1.0);
        if (birdA.chargeRatio >= 0.95 && !birdA.chargeWasFull) { birdA.chargeWasFull = true; Sound.playChargeFull(); }
        Sound.updateCharge(birdA.chargeRatio);
      }
    }
    if (birdB.alive) {
      birdB.vy = Math.min(C.TERMINAL_V, birdB.vy + C.GRAVITY_PX * s * (birdB.stunned ? 1.1 : 1));
      birdB.y += birdB.vy * s;
      if (birdB.isCharging && !birdB.stunned) {
        birdB.chargeRatio = Math.min((Date.now() - birdB.chargeStartTime) / 1000 / C.CHARGE_MAX_TIME, 1.0);
        if (birdB.chargeRatio >= 0.95 && !birdB.chargeWasFull) { birdB.chargeWasFull = true; Sound.playChargeFull(); }
        Sound.updateCharge2(birdB.chargeRatio);
      }
    }
    // 死鸟继续下落
    if (!birdA.alive) { birdA.vy = Math.min(C.TERMINAL_V, birdA.vy + C.GRAVITY_PX * s); birdA.y += birdA.vy * s; }
    if (!birdB.alive) { birdB.vy = Math.min(C.TERMINAL_V, birdB.vy + C.GRAVITY_PX * s); birdB.y += birdB.vy * s; }
    // 绳索约束 + 蓄力拉升
    _applyRopeConstraint(s);
    // 蓄力差拉升：高蓄力方拉起低蓄力方
    if (birdA.alive && birdB.alive && !birdA.stunned && !birdB.stunned) {
      var liftDiff = (birdA.chargeRatio - birdB.chargeRatio);
      birdA.vy -= liftDiff * 120 * s;
      birdB.vy += liftDiff * 120 * s;
    }
    // 各自无敌计时
    if (birdA.alive && birdA.invincibleTimer > 0) birdA.invincibleTimer = Math.max(0, birdA.invincibleTimer - s);
    if (birdB.alive && birdB.invincibleTimer > 0) birdB.invincibleTimer = Math.max(0, birdB.invincibleTimer - s);

    // 管道生成
    var last = pipes[pipes.length - 1];
    if (!last || last.x <= C.W - C.PIPE_SPACING) {
      pipes.push(Pipe.createPipe(C.W, Pipe.randomGapCenter(pipes.length, false)));
      if (Math.random() < 0.6) {
        var gapCY2 = pipes[pipes.length - 1].gapCenter;
        var isDanger = Math.random() < 0.2;
        var offY = isDanger ? (Math.random() - 0.5) * C.PIPE_GAP * 0.9 : (Math.random() - 0.5) * C.PIPE_GAP * 0.5;
        stars.push(Star.createStar(pipes[pipes.length - 1].x + C.PIPE_WIDTH + 40, gapCY2 + offY, isDanger));
      }
      if (Math.random() < (C.DEBUG ? C.BALANCE.itemProbDebug : C.BALANCE.itemProb)) {
        var ig2 = pipes[pipes.length - 1].gapCenter;
        items.push(Item.createItem(pipes[pipes.length - 1].x + C.PIPE_WIDTH + 45, ig2 + (Math.random() - 0.5) * C.PIPE_GAP * 0.6));
      }
    }

    // 管道移动 & 双鸟计分（取最大倍率 × 各自双倍道具）
    var scroll = C.SCROLL_SPEED * s;
    for (var pi = 0; pi < pipes.length; pi++) {
      var pp = pipes[pi];
      pp.x -= scroll;
      if (Pipe.hasPassedPipeBird(pp, birdA.x, 'A')) { pp.passedByA = true; }
      if (Pipe.hasPassedPipeBird(pp, birdB.x, 'B')) { pp.passedByB = true; }
      if (pp.passedByA && pp.passedByB && !pp.passed) {
        pp.passed = true;
        pipesPassed++;
        var mA = birdA.chargeMultiplier * ((activeItem && activeItem.type === 'double') ? 2 : 1);
        var mB = birdB.chargeMultiplier * ((activeItemB && activeItemB.type === 'double') ? 2 : 1);
        var mxMul = Math.max(mA, mB);
        var pipeScore = 1 * mxMul;
        score += pipeScore;
        if (scoreFlyTexts.length === 0 || scoreFlyTexts[scoreFlyTexts.length - 1].life < 0.15) Particles.spawnScoreFly(scoreFlyTexts, (birdA.x + birdB.x) / 2, (birdA.y + birdB.y) / 2, pipeScore);
        birdA.chargeMultiplier = 1; birdB.chargeMultiplier = 1;
        Sound.playScore();
        Particles.spawnPetals(petals, (birdA.x + birdB.x) / 2, (birdA.y + birdB.y) / 2, 8, t2, 80, 50);
      }
    }
    while (pipes.length > 0 && pipes[0].x + C.PIPE_WIDTH < -10) pipes.shift();

    // 辅助：单鸟拾星计分
    function _pickupStar(bird, starObj, birdKey) {
      var starScore = starObj.bonus ? 4 : 2;
      bird.combo++;
      var cb = 0;
      if (bird.combo >= 7) cb = 4;
      else if (bird.combo >= 5) cb = 3;
      else if (bird.combo >= 3) cb = 2;
      else if (bird.combo >= 2) cb = 1;
      var birdItem = birdKey === 'A' ? activeItem : activeItemB;
      var dbMul = (birdItem && birdItem.type === 'double') ? 2 : 1;
      score += (starScore + cb) * bird.chargeMultiplier * dbMul;
      Sound.playCombo(bird.combo);
      Sound.playStarPickup();
      // 里程碑
      if (bird.combo % 3 === 0) { bird.invincibleTimer += Math.min(3.5, 2 + Math.floor(bird.combo / 3) * 0.5); Sound.playInvincible(); }
      else if (bird.combo === 5) { score += 15; }
      else if (bird.combo === 7) { score += 30; }
    }

    // 磁铁吸引星星（双人各自磁铁）
    for (var si2 = 0; si2 < stars.length; si2++) {
      var ax = 0, ay = 0;
      if (activeItem && activeItem.type === 'magnet' && birdA.alive) {
        var dxA = birdA.x - stars[si2].x;
        var dyA = birdA.y - stars[si2].y;
        var distA = Math.sqrt(dxA * dxA + dyA * dyA);
        if (distA < C.W * 0.35 && distA > 1) { ax += dxA / distA * scroll * 4; ay += dyA / distA * scroll * 4; }
      }
      if (activeItemB && activeItemB.type === 'magnet' && birdB.alive) {
        var dxB = birdB.x - stars[si2].x;
        var dyB = birdB.y - stars[si2].y;
        var distB = Math.sqrt(dxB * dxB + dyB * dyB);
        if (distB < C.W * 0.35 && distB > 1) { ax += dxB / distB * scroll * 4; ay += dyB / distB * scroll * 4; }
      }
      stars[si2].x += ax; stars[si2].y += ay;
    }

    var birdR = C.BIRD_SIZE / 2;
    for (var si3 = 0; si3 < stars.length; si3++) {
      stars[si3].x -= scroll;
      if (birdA.alive && Star.checkPickup(stars[si3], birdA.x, birdA.y, birdR)) {
        stars[si3].collected = true; _pickupStar(birdA, stars[si3], 'A');
      }
      if (birdB.alive && !stars[si3].collected && Star.checkPickup(stars[si3], birdB.x, birdB.y, birdR)) {
        stars[si3].collected = true; _pickupStar(birdB, stars[si3], 'B');
      }
    }
    for (var si4 = stars.length - 1; si4 >= 0; si4--) {
      if (stars[si4].x < -20) {
        if (!stars[si4].collected) { birdA.combo = 0; birdB.combo = 0; }
        stars.splice(si4, 1);
      }
    }

    // 碰撞检测（无敌或护盾免伤）
    if (birdA.alive && birdA.invincibleTimer <= 0) {
      var aHit = birdA.y < C.GAME_TOP || birdA.y > C.GAME_BOTTOM;
      if (!aHit) for (var ci = 0; ci < pipes.length; ci++) { if (Pipe.checkCollision(pipes[ci], birdA.x, birdA.y, birdR)) { aHit = true; break; } }
      if (aHit) {
        if (activeItem && activeItem.type === 'shield') { activeItem = null; birdA.invincibleTimer = 0.4; }
        else _hitBird(birdA, birdB);
      }
    }
    if (birdB.alive && birdB.invincibleTimer <= 0 && state === C.STATE.PLAYING) {
      var bHit = birdB.y < C.GAME_TOP || birdB.y > C.GAME_BOTTOM;
      if (!bHit) for (var cj = 0; cj < pipes.length; cj++) { if (Pipe.checkCollision(pipes[cj], birdB.x, birdB.y, birdR)) { bHit = true; break; } }
      if (bHit) {
        if (activeItemB && activeItemB.type === 'shield') { activeItemB = null; birdB.invincibleTimer = 0.4; }
        else _hitBird(birdB, birdA);
      }
    }

	    // 道具移动 & 拾取（双人各自背包）
	    for (var ii = 0; ii < items.length; ii++) {
	      items[ii].x -= scroll;
	      var pickedBy = null;
	      if (birdA.alive && Item.checkPickup(items[ii], birdA.x, birdA.y, birdR)) pickedBy = 'A';
	      else if (birdB.alive && Item.checkPickup(items[ii], birdB.x, birdB.y, birdR)) pickedBy = 'B';
	      if (pickedBy) {
	        items[ii].collected = true;
	        if (items[ii].type === 'invincible') {
	          var bd2 = pickedBy === 'A' ? birdA : birdB;
	          bd2.invincibleTimer += C.BALANCE.itemDurations.invincible;
	        } else {
	          var newIt = { type: items[ii].type, timer: items[ii].type === 'double' ? C.BALANCE.itemDurations.double : items[ii].type === 'magnet' ? C.BALANCE.itemDurations.magnet : C.BALANCE.itemDurations.shield };
	          if (pickedBy === 'A') activeItem = newIt; else activeItemB = newIt;
	        }
	      }
	    }
	    for (ii = items.length - 1; ii >= 0; ii--) {
	      if (items[ii].x < -20 || items[ii].collected) items.splice(ii, 1);
	    }
    return;
  }

  // 防护：如果死了还在跑，强制停止
  if (birdY > C.H + 50 || birdY < -200) { die(); return; }

  // 震动衰减
  if (shakeTimer > 0) shakeTimer = Math.max(0, shakeTimer - s);

  // 小鸟物理
  var prevVY = birdVY;
  birdVY = Math.min(C.TERMINAL_V, birdVY + C.GRAVITY_PX * s);
  if (prevVY <= 0 && birdVY > 0) Sound.playFall();
  birdY += birdVY * s;

  // 蓄力计时（每帧更新，不依赖 touchMove）
  if (isCharging) {
    chargeRatio = Math.min((Date.now() - chargeStartTime) / 1000 / C.CHARGE_MAX_TIME, 1.0);
    if (chargeRatio >= 0.95 && !chargeWasFull) {
      chargeWasFull = true;
      Sound.playChargeFull();
    }
    Sound.updateCharge(chargeRatio);
  }

  // 无敌衰减 + 倒计时警示音
  if (invincibleTimer > 0) {
    invincibleTimer = Math.max(0, invincibleTimer - s);
    if (invincibleTimer <= 3 && invincibleTimer > 0) Sound.playInvincibleCountdown(invincibleTimer);
    if (invincibleTimer <= 0) Sound.resetInvincibleBeep();
  }

  // 管道生成
  var last = pipes[pipes.length - 1];
  if (!last || last.x <= C.W - C.PIPE_SPACING) {
    var newPipe = Pipe.createPipe(C.W, Pipe.randomGapCenter(pipes.length, false));
    pipes.push(newPipe);
    // 60% 概率在 gap 中心生成星星
    if (Math.random() < 0.6) {
      var gapCY = newPipe.gapCenter;
      var isDangerStar = Math.random() < 0.2;
      var offsetY;
      if (isDangerStar) {
        offsetY = (Math.random() - 0.5) * C.PIPE_GAP * 0.9;
      } else {
        offsetY = (Math.random() - 0.5) * C.PIPE_GAP * 0.5;
      }
      stars.push(Star.createStar(newPipe.x + C.PIPE_WIDTH + 40, gapCY + offsetY, isDangerStar));
    }
    if (Math.random() < (C.DEBUG ? C.BALANCE.itemProbDebug : C.BALANCE.itemProb)) {
      items.push(Item.createItem(newPipe.x + C.PIPE_WIDTH + 45, gapCY + (Math.random() - 0.5) * C.PIPE_GAP * 0.6));
    }
  }

  // 管道移动 & 计分
  var scrollSpeed = C.SCROLL_SPEED;
  if (invincibleTimer > 0) scrollSpeed *= 1.5;
  // 无敌道具首次激活时叠加时长（在背包点击/AUTO拾取处设置初始值，此处不再重复）
  var scroll = scrollSpeed * s;
  var t = C.getT(currentTheme);
  for (var i = 0; i < pipes.length; i++) {
    var p = pipes[i];
    p.x -= scroll;
    var mul = (activeItem && activeItem.type === 'double') ? 2 : 1;
    if (Pipe.hasPassedPipe(p, C.BIRD_X)) {
      p.passed = true;
      pipesPassed++;
      var pipeScore = 1 * chargeMultiplier * mul;
      score += pipeScore;
      if (scoreFlyTexts.length === 0 || scoreFlyTexts[scoreFlyTexts.length - 1].life < 0.15) Particles.spawnScoreFly(scoreFlyTexts, C.BIRD_X, birdY, pipeScore);
      chargeMultiplier = 1;
      chargeBoostTimer = 0;
      Sound.playScore();
      Particles.spawnPetals(petals, C.BIRD_X, birdY, 8, t, 60, 50);
    }
  }
  while (pipes.length > 0 && pipes[0].x + C.PIPE_WIDTH < -10) pipes.shift();

  // 磁铁吸引星星
  if (activeItem && activeItem.type === 'magnet') {
    for (var si = 0; si < stars.length; si++) {
      var dx = C.BIRD_X - stars[si].x;
      var dy = birdY - stars[si].y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < C.W * 0.35 && dist > 1) {
        stars[si].x += dx / dist * scroll * 4;
        stars[si].y += dy / dist * scroll * 4;
      }
    }
  }

  // 星星拾取检测
  var birdR = C.BIRD_SIZE / 2;
  var mul2 = (activeItem && activeItem.type === 'double') ? 2 : 1;
  for (var si = 0; si < stars.length; si++) {
    stars[si].x -= scroll;
    if (Star.checkPickup(stars[si], C.BIRD_X, birdY, birdR)) {
      stars[si].collected = true;
      var starScore = stars[si].bonus ? (2 + 2) * chargeMultiplier : 2 * chargeMultiplier;
      // 连击加成：GREAT+1, AMAZING+2, FANTASTIC+3, LEGENDARY+4
      if (combo >= 7) starScore += 4;
      else if (combo >= 5) starScore += 3;
      else if (combo >= 3) starScore += 2;
      else if (combo >= 2) starScore += 1;
      score += starScore * mul2;
      combo++;
      Sound.playCombo(combo);
      // 里程碑奖励
      if (combo % 3 === 0) { invincibleTimer += Math.min(3.5, 2 + Math.floor(combo / 3) * 0.5); Sound.resetInvincibleBeep(); Sound.playInvincible(); }
      else if (combo === 5) { score += 15; }
      else if (combo === 7) { score += 30; }
      Sound.playStarPickup();
    }
  }

  // 碰撞检测（无敌或护盾时不检测）
  if (invincibleTimer <= 0) {
    if (birdY < C.GAME_TOP || birdY > C.GAME_BOTTOM) { die(); return; }
    for (i = 0; i < pipes.length; i++) {
      if (Pipe.checkCollision(pipes[i], C.BIRD_X, birdY, birdR)) {
        if (activeItem && activeItem.type === 'shield') { activeItem = null; invincibleTimer = 0.4; }
        else { die(); return; }
      }
    }
  }
  // 二次防护：die 后不走后续逻辑
  if (state !== C.STATE.PLAYING) return;

  // 道具移动 & 拾取
  for (var ii = 0; ii < items.length; ii++) {
    items[ii].x -= scroll;
    if (Item.checkPickup(items[ii], C.BIRD_X, birdY, birdR)) {
      items[ii].collected = true;
      if (items[ii].type === 'invincible') { invincibleTimer += C.BALANCE.itemDurations.invincible; }
      else { activeItem = { type: items[ii].type, timer: items[ii].type === 'double' ? C.BALANCE.itemDurations.double : items[ii].type === 'magnet' ? C.BALANCE.itemDurations.magnet : C.BALANCE.itemDurations.shield }; }
    }
  }
  // 清除屏幕外道具/星星
  for (ii = items.length - 1; ii >= 0; ii--) {
    if (items[ii].x < -20 || items[ii].collected) items.splice(ii, 1);
  }
  // 移除屏幕外星星（未收集的星星漏掉 → 断连击）
  for (si = stars.length - 1; si >= 0; si--) {
    if (stars[si].x < -20) {
      if (!stars[si].collected) combo = 0;
      stars.splice(si, 1);
    }
  }
}

function draw(ctx) {
  var t = C.getT(currentTheme);

  UI.drawSky(ctx, t);

  if (state === C.STATE.PLAYING || state === C.STATE.DEAD) {
    for (var i = 0; i < pipes.length; i++) {
      Pipe.drawPipe(ctx, pipes[i], t);
    }
  }

  // 死亡后地面纹理冻结
  UI.drawGround(ctx, t, state === C.STATE.DEAD ? deathGroundOffset : undefined);

  // 星星/道具在 ground 之后画
  if (state === C.STATE.PLAYING || state === C.STATE.DEAD) {
    for (var si = 0; si < stars.length; si++) {
      if (!stars[si].collected) Star.drawStar(ctx, stars[si], t);
    }
    for (var ii = 0; ii < items.length; ii++) {
      if (!items[ii].collected) Item.drawItem(ctx, items[ii]);
    }
  }


  if (state === C.STATE.MENU) {
    if (scoreFlyTexts.length > 0) Particles.drawScoreFlies(ctx, scoreFlyTexts);
    if (petals.length > 0) Particles.drawPetals(ctx, petals);
    UI.drawStartScreen(ctx, t, {
      currentAccessory: currentAccessory,
      unlockedThemes: unlockedThemes,
      currentTheme: currentTheme,
      points: points,
      paneling: paneling,
      unlockedAccessories: unlockedAccessories,
      avatarEnabled: avatarEnabled,
      avatarImg: avatarImg,
      userAvatarUrl: userAvatarUrl,
      isTwoPlayer: isTwoPlayer,
      isTwoPlayer: isTwoPlayer
    });
    if (paneling === 'theme') UI.drawThemePanel(ctx, t, { points: points, unlockedThemes: unlockedThemes, currentTheme: currentTheme });
    if (paneling === 'accessory') UI.drawAccessoryPanel(ctx, t, { currentAccessory: currentAccessory, unlockedAccessories: unlockedAccessories });
    if (paneling === 'debug') UI.drawDebugPanel(ctx);
    if (paneling === 'upscore') UI.drawUploadPanel(ctx);
    if (paneling === 'debugParams') UI.drawDebugParamsPanel(ctx);
    UI.drawDebugButton(ctx);
  } else if (state === C.STATE.PLAYING) {
    // ---- 双人模式绘制 ----
    if (isTwoPlayer) {
      // 无敌光环
      [birdA, birdB].forEach(function(bd) {
        if (bd.alive && bd.invincibleTimer > 0) {
          var maxInv = Math.min(3.5, 2 + Math.floor(bd.combo / 3) * 0.5);
          var ratio = bd.invincibleTimer / maxInv;
          var rr = 255, gg = Math.floor(215 * ratio + 51 * (1 - ratio)), bb = Math.floor(0 * ratio + 51 * (1 - ratio));
          var invColor = 'rgb(' + rr + ',' + gg + ',' + bb + ')';
          var pulse = 0.6 + 0.4 * Math.sin(Date.now() * 0.015);
          ctx.save();
          ctx.globalAlpha = 0.35 * pulse;
          ctx.fillStyle = invColor;
          ctx.beginPath(); ctx.arc(bd.x, bd.y, C.BIRD_SIZE * 0.9, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 0.25 * pulse;
          ctx.beginPath(); ctx.arc(bd.x, bd.y, C.BIRD_SIZE * 1.1, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
      });
      // 画鸟 + 绳索
      Bird.drawBird(ctx, birdA.y, birdA.vy, state, 0, t, currentAccessory, birdA.chargeRatio,birdA.x, !birdA.alive);
      Bird.drawBird(ctx, birdB.y, birdB.vy, state, 0, t, currentAccessory, birdB.chargeRatio,birdB.x, !birdB.alive);
      // 眩晕视觉+醒闪光
      [birdA, birdB].forEach(function(bd) {
        // 醒闪光
        if (bd.alive && bd.wakeFlash > 0) {
          ctx.fillStyle = 'rgba(255,255,255,' + (bd.wakeFlash * 0.6) + ')';
          ctx.beginPath();
          ctx.arc(bd.x, bd.y, C.BIRD_SIZE * 1.3, 0, Math.PI * 2);
          ctx.fill();
        }
        // 状态文字排列
        var labelY = bd.y + C.BIRD_SIZE * 0.7;
        function _lbl(t, c) {
          ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
          ctx.fillStyle = c; ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;
          ctx.strokeText(t, bd.x, labelY); ctx.fillText(t, bd.x, labelY);
          labelY += 14;
        }
        // 眩晕
        if (bd.alive && bd.stunned) {
          var stAlpha = 0.5 + 0.3 * Math.sin(Date.now() * 0.02);
          ctx.fillStyle = 'rgba(255,215,0,' + (stAlpha * 0.25) + ')';
          ctx.beginPath(); ctx.arc(bd.x, bd.y, C.BIRD_SIZE * 0.8, 0, Math.PI * 2); ctx.fill();
          for (var si = 0; si < 3; si++) {
            var sa = (si * Math.PI * 2) / 3 + Date.now() * 0.006;
            var sr = C.BIRD_SIZE * 0.6;
            ctx.fillStyle = '#FFD700'; ctx.globalAlpha = stAlpha;
            ctx.beginPath();
            ctx.arc(bd.x + Math.cos(sa) * sr, bd.y - C.BIRD_SIZE * 0.9 + Math.sin(sa) * sr, 4, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
          ctx.globalAlpha = stAlpha; ctx.fillStyle = '#FFD700';
          ctx.fillText('💫', bd.x, bd.y - C.BIRD_SIZE * 1.2);
          ctx.globalAlpha = 1;
          _lbl('眩晕', '#FFD700');
        }
        // 无敌倒计时
        if (bd.alive && bd.invincibleTimer > 0) {
          _lbl('无敌 ' + bd.invincibleTimer.toFixed(1) + 's', '#FFD700');
        }
        // 护盾
        var aIt = bd === birdA ? activeItem : activeItemB;
        if (aIt && aIt.type === 'shield' && bd.alive) {
          var shA = 0.5 + 0.2 * Math.sin(Date.now() * 0.01);
          var shR = C.BIRD_SIZE * 1.05;
          ctx.save(); ctx.globalAlpha = shA;
          ctx.strokeStyle = '#5BB5F5'; ctx.lineWidth = 2.5;
          ctx.shadowColor = '#5BB5F5'; ctx.shadowBlur = 10;
          ctx.beginPath();
          for (var hi = 0; hi < 6; hi++) {
            var ha = (hi * Math.PI) / 3 + Date.now() * 0.002;
            var hx = bd.x + Math.cos(ha) * shR, hy = bd.y + Math.sin(ha) * shR;
            if (hi === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx, hy);
          }
          ctx.closePath(); ctx.stroke();
          ctx.strokeStyle = 'rgba(150,210,255,0.6)'; ctx.lineWidth = 1; ctx.shadowBlur = 0;
          ctx.beginPath();
          for (hi = 0; hi < 6; hi++) {
            ha = (hi * Math.PI) / 3 - Date.now() * 0.003;
            hx = bd.x + Math.cos(ha) * shR * 0.85; hy = bd.y + Math.sin(ha) * shR * 0.85;
            if (hi === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx, hy);
          }
          ctx.closePath(); ctx.stroke();
          ctx.restore();
          _lbl('护盾 ' + Math.ceil(aIt.timer) + 's', '#5BB5F5');
        }
        // 磁铁
        aIt = bd === birdA ? activeItem : activeItemB;
        if (aIt && aIt.type === 'magnet' && bd.alive) {
          var mgA = 0.4 + 0.2 * Math.sin(Date.now() * 0.015);
          var mgP = (Date.now() * 0.003) % 1;
          ctx.save(); ctx.globalAlpha = mgA;
          for (var mi = 0; mi < 3; mi++) {
            var mp = (mgP + mi * 0.33) % 1;
            var mr = C.BIRD_SIZE * (0.8 + mp * 1.2);
            ctx.strokeStyle = '#B06EE0'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(bd.x, bd.y, mr, 0, Math.PI * 2); ctx.stroke();
          }
          ctx.restore();
          _lbl('磁铁 ' + Math.ceil(aIt.timer) + 's', '#B06EE0');
        }
        // 双倍 — 浮动 ×2 粒子（得分翻倍，非保护环）
        aIt = bd === birdA ? activeItem : activeItemB;
        if (aIt && aIt.type === 'double' && bd.alive) {
          ctx.save();
          // 柔和金色光晕（非环状）
          var glow = ctx.createRadialGradient(bd.x, bd.y, C.BIRD_SIZE * 0.2, bd.x, bd.y, C.BIRD_SIZE * 0.9);
          glow.addColorStop(0, 'rgba(255,200,0,0.18)');
          glow.addColorStop(1, 'rgba(255,200,0,0)');
          ctx.fillStyle = glow;
          ctx.beginPath(); ctx.arc(bd.x, bd.y, C.BIRD_SIZE * 0.9, 0, Math.PI * 2); ctx.fill();
          // 浮动 ×2 粒子
          for (var di = 0; di < 3; di++) {
            var dp = ((Date.now() * 0.0012 + di * 0.33) % 1);
            var da = di * Math.PI * 2 / 3 + Date.now() * 0.003;
            var dr = C.BIRD_SIZE * (0.65 + dp * 0.5);
            var dyOff = Math.sin(Date.now() * 0.006 + di) * 5;
            var dx2 = bd.x + Math.cos(da) * dr;
            var dy2 = bd.y + Math.sin(da) * dr + dyOff - dp * 10;
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#FFD700';
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 5;
            ctx.globalAlpha = 0.35 + dp * 0.5;
            ctx.fillText('×2', dx2, dy2);
          }
          ctx.shadowBlur = 0;
          ctx.restore();
          _lbl('双倍 ' + Math.ceil(aIt.timer) + 's', '#FFD700');
        }
      });
      UI.drawRope(ctx, birdA, birdB, t);
      // 开场分屏分隔线动画
      if (_splitLineTimer > 0) {
        var lineAlpha;
        if (_splitLineTimer > 1.6) lineAlpha = (2.0 - _splitLineTimer) / 0.4 * 0.6;       // 0→0.6 淡入
        else if (_splitLineTimer > 0.4) lineAlpha = 0.6;                                     // 保持
        else lineAlpha = _splitLineTimer / 0.4 * 0.6;                                        // 淡出
        ctx.save();
        ctx.globalAlpha = lineAlpha;
        ctx.strokeStyle = t.accentDark;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(C.TOUCH_SPLIT_X, C.GAME_TOP);
        ctx.lineTo(C.TOUCH_SPLIT_X, C.GROUND_Y);
        ctx.stroke();
        ctx.setLineDash([]);
        // A / B 标签
        ctx.fillStyle = t.accentDark;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        var labelY = C.GAME_TOP + C.GAME_H / 2;
        ctx.fillText('A', C.TOUCH_SPLIT_X - 24, labelY);
        ctx.fillText('B', C.TOUCH_SPLIT_X + 24, labelY);
        ctx.restore();
      }
      // 营救提示：半屏脉冲 + 淡入淡出
      if (_rescueFade > 0.01) {
        var rescueSide = (birdA && birdA.stunned) ? 'B' : 'A';
        UI.drawRescuePrompt(ctx, rescueSide, t, _rescueFade);
      }
      if (scoreFlyTexts.length > 0) Particles.drawScoreFlies(ctx, scoreFlyTexts);
    if (petals.length > 0) Particles.drawPetals(ctx, petals);
      UI.drawScorePanel(ctx, score, t);
      // 得分闪烁
      if (scoreFlash > 0) {
        ctx.save();
        ctx.globalAlpha = scoreFlash / 0.35 * 0.5;
        ctx.fillStyle = '#FFD700';
        C.roundRect(ctx, (C.W - 90) / 2, C.GAME_TOP + 2, 90, 32, 16);
        ctx.fill();
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 20 * (scoreFlash / 0.35);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        C.roundRect(ctx, (C.W - 90) / 2, C.GAME_TOP + 2, 90, 32, 16);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
      }
      // 各自 combo 文字（在鸟附近）
      [birdA, birdB].forEach(function(bd) {
        if (bd.alive && bd.combo >= 1) {
          var comboText, comboColor, comboSize;
          if (bd.combo >= 7)      { comboText = 'LEGENDARY'; comboColor = '#FF44FF'; comboSize = 22; }
          else if (bd.combo >= 5) { comboText = 'FANTASTIC'; comboColor = '#FF4444'; comboSize = 20; }
          else if (bd.combo >= 3) { comboText = 'AMAZING';  comboColor = '#FF8800'; comboSize = 18; }
          else if (bd.combo >= 2) { comboText = 'GREAT';    comboColor = '#FFCC00'; comboSize = 16; }
          else                    { comboText = 'GOOD';      comboColor = '#FFFFFF'; comboSize = 14; }
          ctx.save();
          var cPop = 1 + 0.08 * Math.sin(Date.now() * 0.018);
          var cSize = Math.floor(comboSize * cPop);
          var cyOff = bd.y - C.BIRD_SIZE * 1.3;
          ctx.font = 'bold ' + cSize + 'px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'alphabetic';
          ctx.strokeStyle = t.accentDark;
          ctx.lineWidth = cSize * 0.15;
          ctx.globalAlpha = 0.55;
          ctx.lineJoin = 'round';
          ctx.strokeText(comboText, bd.x, cyOff);
          ctx.shadowColor = comboColor;
          ctx.shadowBlur = 8;
          ctx.globalAlpha = 0.85;
          ctx.fillStyle = comboColor;
          ctx.fillText(comboText, bd.x, cyOff);
          ctx.shadowBlur = 0;
          // xN 连击数
          ctx.globalAlpha = 0.55;
          ctx.font = 'bold ' + Math.floor(cSize * 0.65) + 'px sans-serif';
          ctx.fillStyle = comboColor;
          ctx.strokeStyle = t.accentDark;
          ctx.lineWidth = Math.floor(cSize * 0.1);
          ctx.lineJoin = 'round';
          ctx.strokeText('x' + bd.combo, bd.x, cyOff + cSize * 0.6);
          ctx.fillText('x' + bd.combo, bd.x, cyOff + cSize * 0.6);
          ctx.restore();
        }
      });
    } else {
    // 无敌光环（金→红递减警告）
    if (invincibleTimer > 0) {
      var maxInv = Math.min(3.5, 2 + Math.floor(combo / 3) * 0.5);
      var ratio = invincibleTimer / maxInv;
      var r = 255, g = Math.floor(215 * ratio + 51 * (1 - ratio)), b = Math.floor(0 * ratio + 51 * (1 - ratio));
      var invColor = 'rgb(' + r + ',' + g + ',' + b + ')';
      var pulse = 0.6 + 0.4 * Math.sin(Date.now() * 0.015);
      ctx.save();
      ctx.globalAlpha = 0.35 * pulse;
      ctx.fillStyle = invColor;
      ctx.beginPath();
      ctx.arc(C.BIRD_X, birdY, C.BIRD_SIZE * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.25 * pulse;
      ctx.beginPath();
      ctx.arc(C.BIRD_X, birdY, C.BIRD_SIZE * 1.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    Bird.drawBird(ctx, birdY, birdVY, state, shakeTimer, t, currentAccessory, chargeRatio, );
    if (scoreFlyTexts.length > 0) Particles.drawScoreFlies(ctx, scoreFlyTexts);
    if (petals.length > 0) Particles.drawPetals(ctx, petals);
    UI.drawScorePanel(ctx, score, t);
    // 得分闪烁
    if (scoreFlash > 0) {
      ctx.save();
      ctx.globalAlpha = scoreFlash / 0.35 * 0.5;
      ctx.fillStyle = '#FFD700';
      C.roundRect(ctx, (C.W - 90) / 2, C.GAME_TOP + 2, 90, 32, 16);
      ctx.fill();
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 20 * (scoreFlash / 0.35);
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      C.roundRect(ctx, (C.W - 90) / 2, C.GAME_TOP + 2, 90, 32, 16);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    }
    // 无敌倒计时
    var sLabY = birdY + C.BIRD_SIZE * 0.9 + 8;
    if (invincibleTimer > 0) {
      var pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.02);
      ctx.save(); ctx.globalAlpha = 0.75 + 0.25 * pulse;
      ctx.fillStyle = '#FFD700'; ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2;
      ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.strokeText('无敌 ' + invincibleTimer.toFixed(1) + 's', C.BIRD_X, sLabY);
      ctx.fillText('无敌 ' + invincibleTimer.toFixed(1) + 's', C.BIRD_X, sLabY);
      ctx.restore();
      sLabY += 16;
    }
    // 护盾
    if (activeItem && activeItem.type === 'shield') {
      var shA = 0.5 + 0.2 * Math.sin(Date.now() * 0.01);
      var shR2 = C.BIRD_SIZE * 1.05;
      ctx.save(); ctx.globalAlpha = shA;
      ctx.strokeStyle = '#5BB5F5'; ctx.lineWidth = 2.5;
      ctx.shadowColor = '#5BB5F5'; ctx.shadowBlur = 10;
      ctx.beginPath();
      for (var hi2 = 0; hi2 < 6; hi2++) {
        var ha2 = (hi2 * Math.PI) / 3 + Date.now() * 0.002;
        var hx2 = C.BIRD_X + Math.cos(ha2) * shR2, hy2 = birdY + Math.sin(ha2) * shR2;
        if (hi2 === 0) ctx.moveTo(hx2, hy2); else ctx.lineTo(hx2, hy2);
      }
      ctx.closePath(); ctx.stroke();
      ctx.strokeStyle = 'rgba(150,210,255,0.6)'; ctx.lineWidth = 1; ctx.shadowBlur = 0;
      ctx.beginPath();
      for (hi2 = 0; hi2 < 6; hi2++) {
        ha2 = (hi2 * Math.PI) / 3 - Date.now() * 0.003;
        hx2 = C.BIRD_X + Math.cos(ha2) * shR2 * 0.85; hy2 = birdY + Math.sin(ha2) * shR2 * 0.85;
        if (hi2 === 0) ctx.moveTo(hx2, hy2); else ctx.lineTo(hx2, hy2);
      }
      ctx.closePath(); ctx.stroke();
      ctx.restore();
      ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillStyle = '#5BB5F5'; ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2;
      ctx.strokeText('护盾 ' + Math.ceil(activeItem.timer) + 's', C.BIRD_X, sLabY);
      ctx.fillText('护盾 ' + Math.ceil(activeItem.timer) + 's', C.BIRD_X, sLabY);
      sLabY += 16;
    }
    // 磁铁
    if (activeItem && activeItem.type === 'magnet') {
      var mgA = 0.4 + 0.2 * Math.sin(Date.now() * 0.015);
      var mgP = (Date.now() * 0.003) % 1;
      ctx.save(); ctx.globalAlpha = mgA;
      for (var mi2 = 0; mi2 < 3; mi2++) {
        var mp2 = (mgP + mi2 * 0.33) % 1;
        var mr2 = C.BIRD_SIZE * (0.8 + mp2 * 1.2);
        ctx.strokeStyle = '#B06EE0'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(C.BIRD_X, birdY, mr2, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
      ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillStyle = '#B06EE0'; ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2;
      ctx.strokeText('磁铁 ' + Math.ceil(activeItem.timer) + 's', C.BIRD_X, sLabY);
      ctx.fillText('磁铁 ' + Math.ceil(activeItem.timer) + 's', C.BIRD_X, sLabY);
      sLabY += 16;
    }
    // 双倍 — 浮动 ×2 粒子（得分翻倍，非保护环）
    if (activeItem && activeItem.type === 'double') {
      ctx.save();
      var glow = ctx.createRadialGradient(C.BIRD_X, birdY, C.BIRD_SIZE * 0.2, C.BIRD_X, birdY, C.BIRD_SIZE * 0.9);
      glow.addColorStop(0, 'rgba(255,200,0,0.18)');
      glow.addColorStop(1, 'rgba(255,200,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(C.BIRD_X, birdY, C.BIRD_SIZE * 0.9, 0, Math.PI * 2); ctx.fill();
      for (var di2 = 0; di2 < 3; di2++) {
        var dp2 = ((Date.now() * 0.0012 + di2 * 0.33) % 1);
        var da2 = di2 * Math.PI * 2 / 3 + Date.now() * 0.003;
        var dr2 = C.BIRD_SIZE * (0.65 + dp2 * 0.5);
        var dyOff2 = Math.sin(Date.now() * 0.006 + di2) * 5;
        var dx2 = C.BIRD_X + Math.cos(da2) * dr2;
        var dy2 = birdY + Math.sin(da2) * dr2 + dyOff2 - dp2 * 10;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 5;
        ctx.globalAlpha = 0.35 + dp2 * 0.5;
        ctx.fillText('×2', dx2, dy2);
      }
      ctx.shadowBlur = 0;
      ctx.restore();
      ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillStyle = '#FFD700'; ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2;
      ctx.strokeText('双倍 ' + Math.ceil(activeItem.timer) + 's', C.BIRD_X, sLabY);
      ctx.fillText('双倍 ' + Math.ceil(activeItem.timer) + 's', C.BIRD_X, sLabY);
    }
    // 连击大字（跟随小鸟）
    if (combo >= 1) {
      var comboText, comboColor, comboSize;
      if (combo >= 7)      { comboText = 'LEGENDARY'; comboColor = '#FF44FF'; comboSize = 34; }
      else if (combo >= 5) { comboText = 'FANTASTIC'; comboColor = '#FF4444'; comboSize = 32; }
      else if (combo >= 3) { comboText = 'AMAZING';  comboColor = '#FF8800'; comboSize = 30; }
      else if (combo >= 2) { comboText = 'GREAT';    comboColor = '#FFCC00'; comboSize = 26; }
      else                 { comboText = 'GOOD';      comboColor = '#FFFFFF'; comboSize = 22; }
      ctx.save();
      var cPop = 1 + 0.08 * Math.sin(Date.now() * 0.018);
      var cSize = Math.floor(comboSize * cPop);
      var cyOff = birdY - C.BIRD_SIZE * 1.5;
      ctx.font = 'bold ' + cSize + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.strokeStyle = t.accentDark;
      ctx.lineWidth = cSize * 0.15;
      ctx.globalAlpha = 0.55;
      ctx.lineJoin = 'round';
      ctx.strokeText(comboText, C.BIRD_X, cyOff);
      ctx.shadowColor = comboColor;
      ctx.shadowBlur = 12;
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = comboColor;
      ctx.fillText(comboText, C.BIRD_X, cyOff);
      ctx.shadowBlur = 0;
      // 小字 xN（带阴影）
      ctx.globalAlpha = 0.55;
      ctx.font = 'bold ' + Math.floor(cSize * 0.6) + 'px sans-serif';
      ctx.fillStyle = comboColor;
      ctx.strokeStyle = t.accentDark;
      ctx.lineWidth = Math.floor(cSize * 0.1);
      ctx.lineJoin = 'round';
      ctx.strokeText('x' + combo, C.BIRD_X, cyOff + cSize * 0.6);
      ctx.fillText('x' + combo, C.BIRD_X, cyOff + cSize * 0.6);
      ctx.restore();
    }
    } // end single-player block
  } else if (state === C.STATE.DEAD) {
    // 半透明遮罩：保留底下死亡场景（管道+地面+鸟），游戏结束面板浮动在上
    ctx.fillStyle = t.deathDim;
    ctx.fillRect(0, 0, C.W, C.H);
    if (isTwoPlayer && birdA && birdB) {
      Bird.drawBird(ctx, birdA.y, birdA.vy, state, shakeTimer, t, currentAccessory, 0,birdA.x, true);
      Bird.drawBird(ctx, birdB.y, birdB.vy, state, shakeTimer, t, currentAccessory, 0,birdB.x, true);
      UI.drawRope(ctx, birdA, birdB, t);
    } else {
      Bird.drawBird(ctx, birdY, birdVY, state, shakeTimer, t, currentAccessory, chargeRatio, );
    }
    if (scoreFlyTexts.length > 0) Particles.drawScoreFlies(ctx, scoreFlyTexts);
    if (petals.length > 0) Particles.drawPetals(ctx, petals);
    UI.drawGameOverPanel(ctx, t, {
      score: score,
      medalLevel: medalLevel,
      best: best,
      isTwoPlayer: isTwoPlayer
    });
  } else if (state === C.STATE.MEMORIAL) {
    UI.drawMemorialScreen(ctx, t, {
      score: score,
      pipesPassed: pipesPassed,
      currentAccessory: currentAccessory,
      memorialMsg: memorialMsg,
      petals: petals,
      userAvatarUrl: userAvatarUrl,
      avatarEnabled: avatarEnabled,
      avatarImg: avatarImg
    });
  }

  if (state !== C.STATE.MENU) UI.drawBackButton(ctx, currentTheme);
}

function onTouch(e) {
  // touchEnd 用 changedTouches 解决面板滚动后选择失效
  var tc = (e.touches && e.touches.length > 0) ? e.touches[0] : (e.changedTouches ? e.changedTouches[0] : null);
  if (!tc) return;
  var tx = tc.clientX;
  var ty = tc.clientY;

  // 返回按钮优先
  if (UI.hitBackButton(tx, ty)) {
    gotoMenu();
    return;
  }

  // MEMORIAL：保存分享 / 再来一次 / 授权头像（仅松手触发）
  if (state === C.STATE.MEMORIAL && !(e.touches && e.touches.length > 0)) {
    var mAct = UI.hitTestMemorial(tx, ty, userAvatarUrl);
    if (mAct.action === 'authAvatar') {
      fetchUserAvatar();
    } else if (mAct.action === 'shareCard') {
      Memorial.renderMemorialCard(score, pipesPassed, currentTheme, currentAccessory, memorialMsg, Bird.drawAccessoryOnCtx);
      Memorial.shareMemorialCard();
    } else if (mAct.action === 'shareTimeline') {
      wx.showToast({ title: '请点击右上角 ··· → 分享到朋友圈', icon: 'none', duration: 2000 });
    } else if (mAct.action === 'shareImage') {
      Memorial.renderMemorialCard(score, pipesPassed, currentTheme, currentAccessory, memorialMsg, Bird.drawAccessoryOnCtx);
      Memorial.shareImage();
    } else if (mAct.action === 'replay') {
      restartGame();
    }
    return;
  }

  // DEAD：查看纪念卡 / 再来一次（仅松手触发）
  if (state === C.STATE.DEAD && !(e.touches && e.touches.length > 0)) {
    var dAct = UI.hitTestGameOver(tx, ty, {});
    if (dAct.action === 'showMemorial') {
      fetchUserAvatar();
      state = C.STATE.MEMORIAL;
    } else if (dAct.action === 'replay') {
      restartGame();
    }
    return;
  }

  // 参数面板（仅松手触发）
  if (paneling === 'debugParams' && state === C.STATE.MENU && !(e.touches && e.touches.length > 0)) {
    var dpAct = UI.hitTestDebugParams(tx, ty, paneling);
    if (dpAct) {
      if (dpAct.action === 'closeDebugParams') { paneling = null; return; }
      if (dpAct.action === 'dbgDec' || dpAct.action === 'dbgInc') {
        var dp = UI.DBG_PARAMS[dpAct.idx];
        C.BALANCE[dp.k] = Math.max(0, C.BALANCE[dp.k] + (dpAct.action === 'dbgInc' ? (dp.s || 1) : -(dp.s || 1)));
        return;
      }
      if (dpAct.action === 'dbgReset') {
        C.BALANCE.itemProb = 0.15; C.BALANCE.backpackSlots = 2;
        C.BALANCE.chargeMaxTime = 0.25; C.BALANCE.chargeMaxVel = -580;
        C.BALANCE.pointsMaxPerGame = 20; C.BALANCE.scrollSpeed = 120;
        C.BALANCE.gravity = 980; C.BALANCE.ropeChargeLift = 120;
        return;
      }
    }
    return;
  }

  // 上传面板（仅松手触发，防双击）
  if (paneling === 'upscore' && state === C.STATE.MENU && !(e.touches && e.touches.length > 0)) {
    var upAct = UI.hitTestUpload(tx, ty, paneling);
    if (upAct) {
      if (upAct.action === 'closeUpload') { paneling = null; return; }
      if (upAct.action === 'upScoreDec') { var d0 = UI.getUploadData(); UI.initUploadPanel(Math.max(0, d0.score - 1), d0.pipes, d0.mode); return; }
      if (upAct.action === 'upScoreInc') { var d1 = UI.getUploadData(); UI.initUploadPanel(d1.score + 1, d1.pipes, d1.mode); return; }
      if (upAct.action === 'upPipesDec') { var d2 = UI.getUploadData(); UI.initUploadPanel(d2.score, Math.max(1, d2.pipes - 1), d2.mode); return; }
      if (upAct.action === 'upPipesInc') { var d3 = UI.getUploadData(); UI.initUploadPanel(d3.score, d3.pipes + 1, d3.mode); return; }
      if (upAct.action === 'upModeToggle') { var d4 = UI.getUploadData(); UI.initUploadPanel(d4.score, d4.pipes, d4.mode === 0 ? 1 : 0); return; }
      if (upAct.action === 'upDoUpload') {
        var d5 = UI.getUploadData();
        var comp = d5.score * 100 + Math.floor(d5.score / Math.max(d5.pipes, 1));
        console.log('[UpScore] score:', d5.score, 'pipes:', d5.pipes, 'mode:', d5.mode, 'composite:', comp);
        uploadToCloud(d5.mode, comp);
        wx.showToast({ title: '已上报 mode=' + d5.mode + ' comp=' + comp, icon: 'none' });
        paneling = null;
        return;
      }
      if (upAct.action === 'upDoClear') {
        var dc = UI.getUploadData();
        var key = dc.mode === 1 ? 'bestScore2P' : 'bestScore';
        var now = Math.floor(Date.now() / 1000);
        console.log('[UpClear] key:', key, 'mode:', dc.mode);
        wx.setUserCloudStorage({
          KVDataList: [{ key: key, value: JSON.stringify({ wxgame: { score: 0, update_time: now } }) }],
          success: function() { wx.showToast({ title: '已清除 ' + key, icon: 'none' }); },
          fail: function(err) { console.error('[UpClear] FAIL:', JSON.stringify(err)); wx.showToast({ title: '清除失败', icon: 'none' }); }
        });
        paneling = null;
        return;
      }
    }
    return;
  }

  // 调试面板（MENU 下优先处理）
  if (state === C.STATE.MENU) {
    var dbg = UI.hitTestDebug(tx, ty, paneling);
    if (dbg) {
      if (dbg.action === 'openDebug') { paneling = 'debug'; panelJustOpened = true; return; }
      if (dbg.action === 'closeDebug') { 
        if (panelJustOpened) { panelJustOpened = false; return; }
        paneling = null; return; 
      }
      if (dbg.action === 'add5') { points += 5; Storage.savePoints(points); return; }
      if (dbg.action === 'add50') { points += 50; Storage.savePoints(points); return; }
      if (dbg.action === 'clear') {
        console.log('[Clear] 开始清除云端数据');
        var now = Math.floor(Date.now() / 1000);
        var zero = JSON.stringify({ wxgame: { score: 0, update_time: now } });
        wx.setUserCloudStorage({
          KVDataList: [
            { key: 'bestScore', value: zero },
            { key: 'bestScore2P', value: zero }
          ],
          success: function() {
            wx.showToast({ title: '✅ 已清除云端排行榜', icon: 'none' });
            console.log('[Clear] 云端清除成功');
            if (showingLeaderboard) {
              try { wx.getOpenDataContext().postMessage({ type: 'refresh', mode: leaderboardMode }); } catch(e) {}
            }
          },
          fail: function(err) {
            wx.showToast({ title: '⚠ 云端清除失败', icon: 'none' });
            console.log('[Clear] 云端清除失败:', JSON.stringify(err));
          }
        });
        return;
      }
      if (dbg.action === 'unlockAll') {
        var tk = Object.keys(C.THEMES);
        for (var ti = 0; ti < tk.length; ti++) unlockedThemes[tk[ti]] = true;
        for (var ai = 0; ai < C.ACC_KEYS.length; ai++) unlockedAccessories[C.ACC_KEYS[ai]] = true;
        Storage.saveData(buildSaveData());
        return;
      }
      if (dbg.action === 'upScore') {
        paneling = 'upscore'; panelJustOpened = true;
        UI.initUploadPanel(517, 100, 0);
        return;
      }
      if (dbg.action === 'openParams') {
        paneling = 'debugParams'; panelJustOpened = true;
        return;
      }
    }
  }

  // 排行榜显示中：转发触摸给开放数据域 / 关闭
  if (showingLeaderboard && state === C.STATE.MENU) {
    var hasTouchesLB = e.touches && e.touches.length > 0;
    if (hasTouchesLB) {
      // touchStart/Move：转发给开放数据域滚动
      leaderboardJustOpened = false;
      var phase = e.type === 'touchstart' ? 'start' : 'move';
      forwardTouchToLeaderboard(tx, ty, phase);
    } else {
      // touchEnd
      if (leaderboardJustOpened) { leaderboardJustOpened = false; return; }
      // 排行榜面板尺寸（与主题面板统一）
      var lbW = C.W * 0.82, lbH = C.H * 0.55;
      var lbX = (C.W - lbW) / 2, lbY = (C.H - lbH) / 2;
      // 关闭按钮 ✕（最优先）
      var closeCX = lbX + lbW - 22, closeCY = lbY + 18;
      if (Math.sqrt((tx - closeCX) * (tx - closeCX) + (ty - closeCY) * (ty - closeCY)) < 16) {
        hideLeaderboardOverlay();
        return;
      }
      // 点击面板外 → 关闭
      if (tx < lbX || tx > lbX + lbW || ty < lbY || ty > lbY + lbH) {
        hideLeaderboardOverlay();
        return;
      }
      // 标题栏双 tab：单人 | 双人（原地刷新，不重开关）
      var tabW2 = 60, tabH2 = 24, tabGap2 = 6;
      var tabTotalW = tabW2 * 2 + tabGap2;
      var tabX2 = lbX + (lbW - tabTotalW) / 2;
      var tabY2 = lbY + 13;
      if (ty >= tabY2 && ty <= tabY2 + tabH2) {
        if (tx >= tabX2 && tx <= tabX2 + tabW2 && leaderboardMode !== 0) {
          leaderboardMode = 0;
          var od2 = wx.getOpenDataContext();
          od2.postMessage({ type: 'switchMode', mode: 0, accent: C.getT(currentTheme).accent, accentDark: C.getT(currentTheme).accentDark });
          return;
        }
        if (tx >= tabX2 + tabW2 + tabGap2 && tx <= tabX2 + tabTotalW && leaderboardMode !== 1) {
          leaderboardMode = 1;
          var od3 = wx.getOpenDataContext();
          od3.postMessage({ type: 'switchMode', mode: 1, accent: C.getT(currentTheme).accent, accentDark: C.getT(currentTheme).accentDark });
          return;
        }
      }
      forwardTouchToLeaderboard(tx, ty, 'end');
    }
    return;
  }

  // 面板内交互委托给 UI 模块
  if (paneling && state === C.STATE.MENU) {
    // touchStart 时清除 panelJustOpened，避免吞掉关闭按钮的首次点击
    if (e.touches && e.touches.length > 0) {
      panelJustOpened = false;
    }
    var pAct = UI.handlePanelTouch(tx, ty, e, { paneling: paneling, points: points, unlockedThemes: unlockedThemes, currentTheme: currentTheme, currentAccessory: currentAccessory, unlockedAccessories: unlockedAccessories });
    if (pAct) {
      if (pAct.action === 'closePanel') { paneling = null; }
      else if (pAct.action === 'switchTheme') { currentTheme = pAct.theme; if (pAct.closePanel) paneling = null; Storage.saveData(buildSaveData()); }
      else if (pAct.action === 'unlockTheme') { if (points >= pAct.cost) { points -= pAct.cost; unlockedThemes[pAct.theme] = true; currentTheme = pAct.theme; paneling = null; Storage.savePoints(points); Storage.saveData(buildSaveData()); } }
      else if (pAct.action === 'switchAccessory') { currentAccessory = pAct.accessory; if (pAct.closePanel) paneling = null; Storage.saveData(buildSaveData()); }
      else if (pAct.action === 'unlockAccessory') { if (points >= pAct.cost) { points -= pAct.cost; unlockedAccessories = unlockedAccessories || {}; unlockedAccessories[pAct.accessory] = true; currentAccessory = pAct.accessory; paneling = null; Storage.savePoints(points); Storage.saveData(buildSaveData()); } }
    }
    return;
  }

  // MENU：主题 / 配饰 / 头像 / 开始（仅松手触发，防止重复）
  if (state === C.STATE.MENU && !(e.touches && e.touches.length > 0)) {
    var t = C.getT(currentTheme);
    var mAct = UI.hitTestMenu(tx, ty, {
      t: t,
      currentTheme: currentTheme,
      currentAccessory: currentAccessory,
      unlockedThemes: unlockedThemes,
      points: points,
      paneling: paneling,
      unlockedAccessories: unlockedAccessories,
      avatarEnabled: avatarEnabled,
      userAvatarUrl: userAvatarUrl,
      isTwoPlayer: isTwoPlayer,
      isTwoPlayer: isTwoPlayer
    });

    if (!mAct) return;
    if (mAct.action === 'closePanel') {
      paneling = null;
    } else if (mAct.action === 'openPanel') {
      destroyUserInfoButton();
      paneling = mAct.panel;
      panelJustOpened = true;
    } else if (mAct.action === 'debug') {
      points = mAct.points;
      Storage.savePoints(points);
    } else if (mAct.action === 'switchTheme') {
      currentTheme = mAct.theme;
      if (mAct.closePanel) paneling = null;
      Storage.saveData(buildSaveData());
    } else if (mAct.action === 'unlockTheme') {
      if (points >= mAct.cost) {
        points -= mAct.cost;
        unlockedThemes[mAct.theme] = true;
        currentTheme = mAct.theme;
        paneling = null;
        Storage.savePoints(points);
        Storage.saveData(buildSaveData());
      }
    } else if (mAct.action === 'switchAccessory') {
      currentAccessory = mAct.accessory;
      if (mAct.closePanel) paneling = null;
      Storage.saveData(buildSaveData());
    } else if (mAct.action === 'toast') {
      wx.showToast({ title: mAct.msg, icon: 'none' });
    } else if (mAct.action === 'toggleAvatar') {
      toggleAvatar();
    } else if (mAct.action === 'toggleMode') {
      isTwoPlayer = !isTwoPlayer;
    } else if (mAct.action === 'startGame') {
      console.log('[Start] isTwoPlayer:', isTwoPlayer);
      startGame();
    } else if (mAct.action === 'showLeaderboard') {
      showLeaderboardOverlay();
    }
    return;
  }



  // PLAYING：长按蓄力 / 点击飞行
  if (state === C.STATE.PLAYING) {
    // ---- 双人模式多触控（长按蓄力+释放跳跃） ----
    if (isTwoPlayer) {
      if (e.touches && e.touches.length > 0) {
        if (gameJustStarted) gameJustStarted = false;
        var newMap = {};
        for (var ti = 0; ti < e.touches.length; ti++) {
          var tp = e.touches[ti];
          var key = tp.clientX < C.TOUCH_SPLIT_X ? 'A' : 'B';
          newMap[tp.identifier] = key;
          var bd = key === 'A' ? birdA : birdB;
          // 任何触控都唤醒对方（即使不蓄力）
          var otherBd = key === 'A' ? birdB : birdA;
          if (otherBd && otherBd.alive && otherBd.stunned) { otherBd.stunned = false; otherBd.wakeFlash = 0.4; otherBd.invincibleTimer = 0.2; }
          // 开始蓄力
          if (!_activeTouchMap[tp.identifier] && bd.alive && !bd.stunned && !bd.isCharging) {
            bd.isCharging = true; bd.chargeStartTime = Date.now(); bd.chargeWasFull = false;
            if (key === 'A') Sound.startCharge(); else Sound.startCharge2();
          }
        }
        // 松开的触控→释放跳跃
        for (var id in _activeTouchMap) {
          if (!newMap[id]) {
            var rk = _activeTouchMap[id];
            var rd = rk === 'A' ? birdA : birdB;
            if (rd.isCharging) {
              var rRatio = rd.chargeRatio < 0.4 ? 0 : rd.chargeRatio;
              var rVel = C.CHARGE_MIN_VELOCITY + (C.CHARGE_MAX_VELOCITY - C.CHARGE_MIN_VELOCITY) * rRatio;
              if (rRatio > 0) {
                var newM = Math.min(5, rd.chargeMultiplier + Math.floor(rRatio * 4));
                if (newM > rd.chargeMultiplier) rd.multiBurstTime = Date.now();
                rd.chargeMultiplier = newM;
              }
              rd.vy = rVel;
              if (rk === 'A') Sound.stopCharge(rRatio); else Sound.stopCharge2(rRatio);
              rd.isCharging = false; rd.chargeRatio = 0;
              // 跳跃唤醒对方
              var otherBd2 = rk === 'A' ? birdB : birdA;
              if (otherBd2 && otherBd2.alive && otherBd2.stunned) { otherBd2.stunned = false; otherBd2.invincibleTimer = 0.2; }
            }
          }
        }
        _activeTouchMap = newMap;
        return;
      } else {
        if (gameJustStarted) { gameJustStarted = false; return; }
        for (var id2 in _activeTouchMap) {
          var ek = _activeTouchMap[id2];
          var ed = ek === 'A' ? birdA : birdB;
          if (ed.isCharging) {
            var eRatio = ed.chargeRatio < 0.4 ? 0 : ed.chargeRatio;
            var eVel = C.CHARGE_MIN_VELOCITY + (C.CHARGE_MAX_VELOCITY - C.CHARGE_MIN_VELOCITY) * eRatio;
            if (eRatio > 0) {
              var eM = Math.min(5, ed.chargeMultiplier + Math.floor(eRatio * 4));
              if (eM > ed.chargeMultiplier) ed.multiBurstTime = Date.now();
              ed.chargeMultiplier = eM;
            }
            ed.vy = eVel;
            if (ek === 'A') Sound.stopCharge(eRatio); else Sound.stopCharge2(eRatio);
            ed.isCharging = false; ed.chargeRatio = 0;
            var otherBd3 = ek === 'A' ? birdB : birdA;
            if (otherBd3 && otherBd3.alive && otherBd3.stunned) { otherBd3.stunned = false; otherBd3.invincibleTimer = 0.2; }
          }
        }
        _activeTouchMap = {};
        return;
      }
    }

    if (e.touches && e.touches.length > 0) {
      // 按下：立即开始蓄力（gameJustStarted 不阻止）
      if (gameJustStarted) gameJustStarted = false;
      if (!isCharging) { chargeStartTime = Date.now(); isCharging = true; chargeWasFull = false; Sound.startCharge(); }
      return;
    }
    // 松手：释放（gameJustStarted 时忽略，防止开始按钮误触）
    if (gameJustStarted) { gameJustStarted = false; return; }
    if (isCharging) {
      var ratio = chargeRatio < 0.4 ? 0 : chargeRatio;
      var vel = C.CHARGE_MIN_VELOCITY + (C.CHARGE_MAX_VELOCITY - C.CHARGE_MIN_VELOCITY) * ratio;
      if (ratio > 0) {
        var newMulti = Math.min(5, chargeMultiplier + Math.floor(ratio * 4));
        if (newMulti > chargeMultiplier) multiBurstTime = Date.now();
        chargeMultiplier = newMulti;
      }
      flap(vel);
      Sound.stopCharge(ratio);
      isCharging = false;
      chargeRatio = 0;
    }
    return;
  }
}

function destroy() {
  destroyUserInfoButton();
  petals = [];
  scoreFlyTexts = []; scoreFlash = 0;
  Memorial.destroyMemorialCanvas();
  Sound.destroy();
}

module.exports = {
  init: init,
  update: update,
  draw: draw,
  onTouch: onTouch,
  destroy: destroy
};
