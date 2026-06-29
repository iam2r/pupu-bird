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

// ---- 花瓣粒子 ----
var petals = [];

// ---- 纪念卡 ----
var memorialMsg;

// ---- 积分 ----
var points;
var gameJustStarted = false;
var gameCanvas = null;
var userAvatarUrl = '';
var avatarEnabled = false;
var avatarImg = null;

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

function gotoMenu() {
  birdY = C.GAME_TOP + C.GAME_H / 2;
  birdVY = 0;
  pipes = [];
  petals = [];
  stars = [];
  score = 0;
  pipesPassed = 0;
  combo = 0;
  chargeMultiplier = 1;
  multiBurstTime = 0;
  invincibleTimer = 0;
  medalLevel = 0;
  shakeTimer = 0;
  memorialMsg = C.MEMORIAL_MSGS[Math.floor(Math.random() * C.MEMORIAL_MSGS.length)];
  state = C.STATE.MENU;
}

function startGame() {
  birdY = C.GAME_TOP + C.GAME_H / 2;
  birdVY = 0;
  pipes = [];
  petals = [];
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
  memorialMsg = C.MEMORIAL_MSGS[Math.floor(Math.random() * C.MEMORIAL_MSGS.length)];
  destroyUserInfoButton();
  gameJustStarted = true;
  state = C.STATE.PLAYING;
}

function flap(velocity) {
  birdVY = velocity || C.CHARGE_MIN_VELOCITY;
  Sound.playFlap();
}

function die() {
  state = C.STATE.DEAD;
  shakeTimer = 0;
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

  // 检查解锁新主题（基于累计积分，完全由配置驱动）
  var newUnlocks = [];
  var keys = Object.keys(C.THEMES);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (!unlockedThemes[k] && points >= C.THEMES[k].unlock) {
      unlockedThemes[k] = true;
      newUnlocks.push(C.THEMES[k].name);
    }
  }
  if (newUnlocks.length > 0) {
    Storage.saveData(buildSaveData());
    wx.showToast({ title: '解锁：' + newUnlocks.join('、'), icon: 'none', duration: 2500 });
  }

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

  // 预渲染纪念卡
  Memorial.renderMemorialCard(score, pipesPassed, currentTheme, currentAccessory, memorialMsg, Bird.drawAccessoryOnCtx, userAvatarUrl, avatarEnabled ? avatarImg : null);
}

function restartGame() {
  if (score > best) { best = score; Storage.saveData(buildSaveData()); }
  birdY = C.GAME_TOP + C.GAME_H / 2;
  birdVY = 0;
  pipes = [];
  petals = [];
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
  memorialMsg = C.MEMORIAL_MSGS[Math.floor(Math.random() * C.MEMORIAL_MSGS.length)];
  destroyUserInfoButton();
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
  var btnRowY = logoY + 200;
  var circleR = 15;
  var spacing = 12;
  var totalW = circleR * 2 * 3 + spacing * 2;
  var startX = (C.W - totalW) / 2;
  var btnCX = startX + circleR * 3 + spacing; // 中间按钮（头像）
  var btnCY = btnRowY;

  var btnSize = 40;
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
    _userInfoButton.destroy();
    _userInfoButton = null;
    if (res.userInfo) {
      setUserAvatar(res.userInfo.avatarUrl);
      wx.showToast({ title: '头像纹理已开启', icon: 'none', duration: 1500 });
    } else {
      wx.showToast({ title: '需要授权才能使用头像', icon: 'none' });
    }
  });

  wx.showToast({ title: '点击中间按钮授权', icon: 'none', duration: 2000 });
}

function destroyUserInfoButton() {
  if (_userInfoButton) { _userInfoButton.destroy(); _userInfoButton = null; }
}

function toggleAvatar() {
  if (userAvatarUrl) {
    // 已有头像：切换开关
    avatarEnabled = !avatarEnabled;
    Storage.saveData(buildSaveData());
    wx.showToast({ title: avatarEnabled ? '头像纹理已开启' : '头像纹理已关闭', icon: 'none', duration: 1500 });
    return;
  }

  // 未授权：先检查
  wx.getSetting({
    success: function(s) {
      if (s.authSetting['scope.userInfo']) {
        // 已授权：静默获取
        wx.getUserInfo({
          success: function(u) {
            setUserAvatar(u.userInfo.avatarUrl);
            wx.showToast({ title: '头像纹理已开启', icon: 'none', duration: 1500 });
          },
          fail: function() {
            // getUserInfo 失败，用原生按钮
            showUserInfoButton();
          }
        });
      } else {
        // 未授权：弹出原生授权按钮
        showUserInfoButton();
      }
    }
  });
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

  isDailyChallenge = false;
  Memorial.ensureMemorialCanvas();
  // 如果之前开启了头像模式，静默拉取头像（已授权则成功，未授权则无声失败）
  if (avatarEnabled) fetchUserAvatar();
  gotoMenu();
}

function update(dt) {
  Particles.updatePetals(petals, dt, state);

  if (state !== C.STATE.PLAYING) return;

  // 防护：如果死了还在跑，强制停止
  if (birdY > C.H + 50 || birdY < -200) { die(); return; }

  var s = Math.min(dt, 0.1);

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

  // 无敌衰减
  if (invincibleTimer > 0) invincibleTimer = Math.max(0, invincibleTimer - s);

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
  }

  // 管道移动 & 计分（无敌时加速）
  var scrollSpeed = invincibleTimer > 0 ? C.SCROLL_SPEED * 1.5 : C.SCROLL_SPEED;
  var scroll = scrollSpeed * s;
  var t = C.getT(currentTheme);
  for (var i = 0; i < pipes.length; i++) {
    var p = pipes[i];
    p.x -= scroll;
    if (Pipe.hasPassedPipe(p, C.BIRD_X)) {
      p.passed = true;
      pipesPassed++;
      score += 1 * chargeMultiplier;
      chargeMultiplier = 1;
      chargeBoostTimer = 0;
      Sound.playScore();
      Particles.spawnPetals(petals, C.BIRD_X, birdY, 8, t, 60, 50);
    }
  }
  while (pipes.length > 0 && pipes[0].x + C.PIPE_WIDTH < -10) pipes.shift();

  // 星星拾取检测
  var birdR = C.BIRD_SIZE / 2;
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
      score += starScore;
      combo++;
      Sound.playCombo(combo);
      // 里程碑奖励
      if (combo % 3 === 0) { invincibleTimer = Math.min(3.5, 2 + Math.floor(combo / 3) * 0.5); Sound.playInvincible(); }
      else if (combo === 5) { score += 15; }
      else if (combo === 7) { score += 30; }
      Sound.playStarPickup();
    }
  }

  // 碰撞检测（无敌时不检测）
  if (invincibleTimer <= 0) {
    if (birdY < C.GAME_TOP || birdY > C.GAME_BOTTOM) { die(); return; }
    for (i = 0; i < pipes.length; i++) {
      if (Pipe.checkCollision(pipes[i], C.BIRD_X, birdY, birdR)) { die(); return; }
    }
  }
  // 二次防护：die 后不走后续逻辑
  if (state !== C.STATE.PLAYING) return;

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

  UI.drawGround(ctx, t);

  // 星星在 ground 之后画，避免被遮挡
  if (state === C.STATE.PLAYING || state === C.STATE.DEAD) {
    for (var si = 0; si < stars.length; si++) {
      if (!stars[si].collected) Star.drawStar(ctx, stars[si]);
    }
  }

  if (state === C.STATE.MENU) {
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
      userAvatarUrl: userAvatarUrl
    });
    if (paneling === 'theme') UI.drawThemePanel(ctx, t, { points: points, unlockedThemes: unlockedThemes, currentTheme: currentTheme });
    if (paneling === 'accessory') UI.drawAccessoryPanel(ctx, t, { currentAccessory: currentAccessory, unlockedAccessories: unlockedAccessories });
    if (paneling === 'debug') UI.drawDebugPanel(ctx);
    UI.drawDebugButton(ctx);
  } else if (state === C.STATE.PLAYING) {
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
    Bird.drawBird(ctx, birdY, birdVY, state, shakeTimer, t, currentAccessory, chargeRatio, avatarEnabled ? avatarImg : null);
    // 倍率标在鸟上方
    if (chargeMultiplier > 1) {
      ctx.save();
      // 持续呼吸脉动（和能量涟漪同风格）
      var pulse = 1 + 0.1 * Math.sin(Date.now() * 0.008);
      // 升级爆发（0.5秒内叠加额外膨胀）
      var burst = 0;
      if (multiBurstTime) {
        var elapsed = (Date.now() - multiBurstTime) / 1000;
        if (elapsed < 0.5) {
          burst = (1 - elapsed / 0.5) * 0.5 * Math.sin(elapsed * Math.PI * 4);
        }
      }
      var scale = pulse + burst;
      ctx.translate(C.BIRD_X, birdY - C.BIRD_SIZE * 0.8);
      ctx.scale(scale, scale);
      // 爆发时变金色
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = burst > 0.1 ? '#FFD700' : '#FF6600';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('x' + chargeMultiplier, 0, 0);
      ctx.restore();
    }
    if (petals.length > 0) Particles.drawPetals(ctx, petals);
    UI.drawScorePanel(ctx, score, t);
    // 无敌倒计时（跟连击一起）
    if (invincibleTimer > 0) {
      var pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.02);
      ctx.save();
      ctx.globalAlpha = 0.7 + 0.3 * pulse;
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('无敌 ' + invincibleTimer.toFixed(1) + 's', C.W / 2, C.GAME_TOP + 105 + 14 * 0.35);
      ctx.restore();
    }
    // 连击大字（消消乐风格）
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
      var cx = C.W / 2, cy = C.GAME_TOP + 135;
      // 柔和光晕
      ctx.shadowColor = comboColor;
      ctx.shadowBlur = 12;
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = comboColor;
      ctx.font = 'bold ' + cSize + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(comboText, cx, cy);
      ctx.shadowBlur = 0;
      // 小字 xN
      ctx.globalAlpha = 0.6;
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('x' + combo, cx, C.GAME_TOP + 155);
      ctx.restore();
    }
  } else if (state === C.STATE.DEAD) {
    ctx.fillStyle = t.bgCard;
    ctx.fillRect(0, 0, C.W, C.H);
    Bird.drawBird(ctx, birdY, birdVY, state, shakeTimer, t, currentAccessory, chargeRatio, avatarEnabled ? avatarImg : null);
    if (petals.length > 0) Particles.drawPetals(ctx, petals);
    UI.drawGameOverPanel(ctx, t, {
      score: score,
      medalLevel: medalLevel,
      best: best,
      unlockedThemes: unlockedThemes
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
      Memorial.renderMemorialCard(score, pipesPassed, currentTheme, currentAccessory, memorialMsg, Bird.drawAccessoryOnCtx, userAvatarUrl, avatarEnabled ? avatarImg : null);
      Memorial.shareMemorialCard();
    } else if (mAct.action === 'saveToAlbum') {
      Memorial.renderMemorialCard(score, pipesPassed, currentTheme, currentAccessory, memorialMsg, Bird.drawAccessoryOnCtx, userAvatarUrl, avatarEnabled ? avatarImg : null);
      Memorial.saveToAlbum();
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
        wx.clearStorageSync();
        var data = Storage.loadData();
        best = data.best; currentTheme = data.currentTheme; currentAccessory = data.currentAccessory;
        unlockedThemes = data.unlockedThemes; unlockedAccessories = data.unlockedAccessories;
        points = data.points;
        return;
      }
      if (dbg.action === 'unlockAll') {
        var tk = Object.keys(C.THEMES);
        for (var ti = 0; ti < tk.length; ti++) unlockedThemes[tk[ti]] = true;
        for (var ai = 0; ai < C.ACC_KEYS.length; ai++) unlockedAccessories[C.ACC_KEYS[ai]] = true;
        Storage.saveData(buildSaveData());
        return;
      }
    }
  }

  // 面板内交互委托给 UI 模块
  if (paneling && state === C.STATE.MENU) {
    if (e.touches && e.touches.length === 0) {
      if (panelJustOpened) { panelJustOpened = false; return; }
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
      userAvatarUrl: userAvatarUrl
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
    } else if (mAct.action === 'startGame') {
      startGame();
    }
    return;
  }

  // PLAYING：长按蓄力 / 点击飞行
  if (state === C.STATE.PLAYING) {
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
