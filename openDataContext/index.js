// openDataContext/index.js — 好友排行榜（开放数据域）
// 排序规则：总分降序 → 平均分降序

var sharedCanvas = wx.getSharedCanvas();
var ctx = sharedCanvas.getContext('2d');

var W = 375;
var H = 667;
var dpr = 1;
var visible = false;
var lbMode = 0; // 0=单人榜 1=双人榜
var accentColor = '#FFB3B3';
var accentDarkColor = '#FF9F8F';
var scrollOffset = 0;
var maxScroll = 0;
var touchStartY = 0;
var touchLastY = 0;
var isTouching = false;

// 双数据集：打开时一次性拉取，切换 tab 纯本地切换
var dataSolo = { friends: [], myData: null, displayList: [], selfRank: -1, showSelfBelow: false, loaded: false };
var dataDuo = { friends: [], myData: null, displayList: [], selfRank: -1, showSelfBelow: false, loaded: false };

function _activeData() { return lbMode === 1 ? dataDuo : dataSolo; }

// 头像图片缓存 { openId: Image }
var avatarCache = {};
var avatarLoaded = {};

// ==================== 消息处理 ====================

wx.onMessage(function(msg) {
  if (msg.type === 'show') {
    dpr = msg.dpr || 1;
    W = sharedCanvas.width / dpr || msg.W || 375;
    H = sharedCanvas.height / dpr || msg.H || 667;
    lbMode = msg.mode || 0;
    accentColor = msg.accent || '#FFB3B3';
    accentDarkColor = msg.accentDark || '#FF9F8F';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    visible = true;
    scrollOffset = 0;
    // 一次性拉取两个榜单数据
    dataSolo.loaded = false; dataDuo.loaded = false;
    dataSolo.friends = []; dataDuo.friends = [];
    fetchBothAndRender();
  } else if (msg.type === 'switchMode') {
    // 纯本地切换，无网络请求
    lbMode = msg.mode || 0;
    accentColor = msg.accent || accentColor;
    accentDarkColor = msg.accentDark || accentDarkColor;
    scrollOffset = 0;
    render();
  } else if (msg.type === 'hide') {
    visible = false;
    ctx.clearRect(0, 0, W, H);
  } else if (msg.type === 'refresh' && visible) {
    if (msg.accent) accentColor = msg.accent;
    if (msg.accentDark) accentDarkColor = msg.accentDark;
    // 刷新当前榜（新分数上传后）
    var cur = _activeData();
    cur.loaded = false; cur.friends = [];
    fetchOne(lbMode === 1 ? 'bestScore2P' : 'bestScore', cur, function() { render(); });
  } else if (msg.type === 'touch' && visible) {
    handleTouch(msg);
  }
});

// ==================== 触摸滚动 ====================

function handleTouch(msg) {
  if (msg.phase === 'start') {
    isTouching = true;
    touchStartY = msg.y;
    touchLastY = msg.y;
  } else if (msg.phase === 'move' && isTouching) {
    var dy = touchLastY - msg.y;
    scrollOffset = Math.max(0, Math.min(maxScroll, scrollOffset + dy));
    touchLastY = msg.y;
    render();
  } else if (msg.phase === 'end') {
    isTouching = false;
    // 惯性滚动
    // 简单实现：无惯性，之后可加
  }
}

// ==================== 数据获取与排序 ====================

// ==================== 数据获取 — 双榜并行 ====================

function fetchBothAndRender() {
  // 并行拉单人+双人数据
  fetchOne('bestScore', dataSolo, function() {
    fetchOne('bestScore2P', dataDuo, function() {
      render();
    });
  });
  render(); // 先显示加载态
}

function fetchOne(key, dataset, cb) {
  var fetchedFriends = null;
  var fetchedMyData = null;
  var done = 0;

  function check() {
    done++;
    if (done < 2) return;
    processData(fetchedFriends, fetchedMyData, key, dataset);
    dataset.loaded = true;
    if (cb) cb();
  }

  wx.getFriendCloudStorage({
    keyList: [key],
    success: function(res) { fetchedFriends = res.data || []; check(); },
    fail: function() { fetchedFriends = []; check(); }
  });

  wx.getUserCloudStorage({
    keyList: [key],
    success: function(res) { fetchedMyData = parseMy(res, key); check(); },
    fail: function() { fetchedMyData = null; check(); }
  });
}

function parseMy(res, key) {
  try {
    var kv = res.KVDataList || [];
    for (var i = 0; i < kv.length; i++) {
      try {
        if (kv[i].key === key) {
          var v = JSON.parse(kv[i].value);
          return { bestScore: v.wxgame ? v.wxgame.score : 0 };
        }
      } catch(e) {}
    }
  } catch(e) {}
  return { bestScore: 0 };
}

function processData(rawFriends, my, key, dataset) {
  dataset.myData = my;
  dataset.friends = [];
  var selfInFriends = false;

  for (var i = 0; i < rawFriends.length; i++) {
    var f = rawFriends[i];
    var kv = f.KVDataList || [];
    var bestScore = 0;
    for (var j = 0; j < kv.length; j++) {
      try {
        if (kv[j].key === key) {
          var v = JSON.parse(kv[j].value);
          bestScore = v.wxgame ? v.wxgame.score : 0;
        }
      } catch(e) {}
    }
    if (bestScore > 0) {
      var isMe = my && bestScore === my.bestScore;
      if (isMe) selfInFriends = true;
      dataset.friends.push({
        cacheKey: f.openId || f.avatarUrl || 'unknown',
        nickname: f.nickname || '微信用户',
        avatarUrl: f.avatarUrl || '',
        bestScore: bestScore,
        isMe: isMe
      });
    }
  }

  // 排序
  dataset.friends.sort(function(a, b) { return b.bestScore - a.bestScore; });
  dataset.selfRank = -1;
  for (var k = 0; k < dataset.friends.length; k++) {
    if (dataset.friends[k].isMe) { dataset.selfRank = k + 1; break; }
  }
  dataset.displayList = dataset.friends.slice(0, 10);
  dataset.showSelfBelow = dataset.selfRank > 10;

  preloadAvatars(dataset);
}

// ==================== 头像加载 ====================

function preloadAvatars(dataset) {
  var list = dataset.displayList.slice();
  if (dataset.showSelfBelow && dataset.selfRank > 0) {
    for (var i = 0; i < dataset.friends.length; i++) {
      if (dataset.friends[i].isMe) { list.push(dataset.friends[i]); break; }
    }
  }
  for (var i = 0; i < list.length; i++) {
    var f = list[i];
    var key = f.cacheKey || f.avatarUrl || '';
    if (f.avatarUrl && !avatarCache[key] && !avatarLoaded[key]) {
      avatarLoaded[key] = true;
      loadAvatar(key, f.avatarUrl);
    }
  }
}

function loadAvatar(cacheKey, url) {
  try {
    var img = wx.createImage();
    img.onload = function() {
      avatarCache[cacheKey] = img;
      if (visible) render();
    };
    img.onerror = function() {
      avatarCache[cacheKey] = null;
      if (visible) render();
    };
    img.src = url;
  } catch(e) {
    avatarCache[cacheKey] = null;
  }
}

// ==================== 渲染 ====================

function render() {
  console.log('[OpenData] render, visible:', visible, 'mode:', lbMode);
  ctx.clearRect(0, 0, W, H);

  if (!visible) return;

  // 半透明遮罩背景
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, W, H);

  // 面板尺寸（与主题/配饰面板统一）
  var pw = W * 0.82;
  var ph = H * 0.55;
  var px = (W - pw) / 2;
  var py = (H - ph) / 2;
  var borderRadius = 18;

  // 面板阴影
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  roundRect(px + 2, py + 3, pw, ph, borderRadius);
  ctx.fill();

  // 面板背景
  ctx.fillStyle = '#FFFFFF';
  roundRect(px, py, pw, ph, borderRadius);
  ctx.fill();

  // 顶部栏
  ctx.fillStyle = '#F5F5F5';
  roundRectTop(px, py, pw, 50, borderRadius);
  ctx.fill();

  // 标题栏 — 双 tab 切换（单人 | 双人）
  var tabW2 = 60, tabH2 = 24, tabGap2 = 6;
  var tabTotalW = tabW2 * 2 + tabGap2;
  var tabX2 = px + (pw - tabTotalW) / 2;
  var tabY2 = py + 13;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (var ti = 0; ti < 2; ti++) {
    var isActive = (ti === lbMode);
    var tabX = tabX2 + ti * (tabW2 + tabGap2);
    if (isActive) {
      ctx.fillStyle = accentColor;
      roundRect(tabX, tabY2, tabW2, tabH2, 12);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px sans-serif';
    } else {
      ctx.fillStyle = '#AAAAAA';
      ctx.font = '12px sans-serif';
    }
    ctx.fillText(ti === 0 ? '单人' : '双人', tabX + tabW2 / 2, tabY2 + tabH2 / 2);
  }

  // 关闭按钮 ✕（与主题面板位置一致）
  var closeCX = px + pw - 22, closeCY = py + 18;
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath(); ctx.arc(closeCX, closeCY, 12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#999999';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✕', closeCX, closeCY);

  var d = _activeData();
  var displayList = d.displayList;
  var showSelfBelow = d.showSelfBelow;
  var selfRank = d.selfRank;
  var friends = d.friends;

  // debug: 打印榜单数据
  console.log('[Rank] mode:', lbMode, 'loaded:', d.loaded, 'total:', friends.length, 'top10:', displayList.length, 'selfRank:', selfRank);
  for (var di = 0; di < displayList.length; di++) {
    var fr = displayList[di];
    console.log('  #' + (di + 1), fr.nickname, 'raw:', fr.bestScore, 'display:', (fr.bestScore / 100).toFixed(2), fr.isMe ? '(我)' : '');
  }
  if (showSelfBelow && selfRank > 0) {
    for (var fi = 0; fi < friends.length; fi++) {
      if (friends[fi].isMe) {
        console.log('  #' + selfRank, friends[fi].nickname, 'raw:', friends[fi].bestScore, 'display:', (friends[fi].bestScore / 100).toFixed(2), '(我)');
        break;
      }
    }
  }

  // 无数据
  if (displayList.length === 0 && !showSelfBelow) {
    ctx.fillStyle = '#AAAAAA';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.loaded ? '暂无数据' : '加载中…', W / 2, py + ph / 2);
    return;
  }

  var rowH = 52;
  var footerH = 40;
  var selfGapH = showSelfBelow ? rowH + 12 : 0;
  var bottomH = selfGapH + footerH;
  var listTop = py + 56;
  var listBottom = py + ph - bottomH;

  // 裁剪区域（Top 10 列表区）
  ctx.save();
  ctx.beginPath();
  roundRect(px + 2, listTop - 2, pw - 4, listBottom - listTop + 4, 8);
  ctx.clip();

  var totalH = displayList.length * rowH;
  maxScroll = Math.max(0, totalH - (listBottom - listTop));

  for (var i = 0; i < displayList.length; i++) {
    var rowY = listTop + i * rowH - scrollOffset;
    if (rowY + rowH < listTop || rowY > listBottom) continue;
    // displayList = friends.slice(0,10)，同引用同顺序，直接用 i 做排名
    drawFriendRow(displayList[i], i, px + 8, rowY, pw - 16, rowH);
  }

  ctx.restore();

  // 底部分隔线 + 自己行
  if (showSelfBelow && selfRank > 0) {
    var sepY = listBottom + 4;
    ctx.strokeStyle = '#E8E8E8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 20, sepY);
    ctx.lineTo(px + pw - 20, sepY);
    ctx.stroke();

    // 找到自己那行数据
    var selfRow = null;
    for (var k = 0; k < friends.length; k++) {
      if (friends[k].isMe) { selfRow = friends[k]; break; }
    }
    if (selfRow) {
      drawFriendRow(selfRow, selfRank - 1, px + 8, sepY + 6, pw - 16, rowH);
    }
  }

  // 排名提示 — 底部艺术条
  var footerBarY = py + ph - footerH;
  var footerBarH = 32;
  // 渐变背景条
  var fGrad = ctx.createLinearGradient(px + 8, footerBarY, px + 8, footerBarY + footerBarH);
  fGrad.addColorStop(0, 'rgba(255,170,80,0.18)');
  fGrad.addColorStop(1, 'rgba(255,120,60,0.12)');
  ctx.fillStyle = fGrad;
  roundRect(px + 8, footerBarY, pw - 16, footerBarH, 10);
  ctx.fill();
  // 细边框
  ctx.strokeStyle = 'rgba(255,150,80,0.3)';
  ctx.lineWidth = 1;
  roundRect(px + 8, footerBarY, pw - 16, footerBarH, 10);
  ctx.stroke();

  if (selfRank > 0) {
    // "你的排名"
    ctx.fillStyle = '#CC8844';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏅 你的排名', px + 24, footerBarY + footerBarH / 2);

    // 排名数字（右侧高亮badge）
    var rankStr = '第' + selfRank + '名';
    var badgeW = ctx.measureText(rankStr).width + 20;
    var badgeX = px + pw - 24 - badgeW;
    var badgeY = footerBarY + 4;
    var badgeH = footerBarH - 8;

    ctx.fillStyle = 'rgba(255,140,60,0.2)';
    roundRect(badgeX, badgeY, badgeW, badgeH, badgeH / 2);
    ctx.fill();

    ctx.fillStyle = '#E07030';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(rankStr, badgeX + badgeW / 2, footerBarY + footerBarH / 2);
  } else {
    ctx.fillStyle = '#AAAAAA';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('暂无排名，快去玩一局吧~', W / 2, footerBarY + footerBarH / 2);
  }
}

function drawFriendRow(friend, index, x, y, w, h) {
  // 自己高亮
  if (friend.isMe) {
    ctx.fillStyle = 'rgba(255,200,100,0.2)';
    roundRect(x, y + 2, w, h - 4, 8);
    ctx.fill();
  }

  // 排名
  var rankX = x + 16;
  var rankY = y + h / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (index < 3) {
    var medals = ['🥇', '🥈', '🥉'];
    ctx.font = '20px sans-serif';
    ctx.fillText(medals[index], rankX, rankY);
  } else {
    ctx.fillStyle = '#999999';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('' + (index + 1), rankX, rankY);
  }

  // 头像
  var avatarX = x + 36;
  var avatarY = y + (h - 36) / 2;
  var avatarR = 18;
  var img = avatarCache[friend.cacheKey];

  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarR, avatarY + avatarR, avatarR, 0, Math.PI * 2);
  ctx.clip();
  if (img) {
    ctx.drawImage(img, avatarX, avatarY, avatarR * 2, avatarR * 2);
  } else {
    // 默认灰色头像
    ctx.fillStyle = '#DDDDDD';
    ctx.fillRect(avatarX, avatarY, avatarR * 2, avatarR * 2);
  }
  ctx.restore();

  // 昵称
  var nameX = avatarX + avatarR * 2 + 10;
  ctx.fillStyle = '#333333';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  // 截断过长昵称
  var nickname = friend.nickname;
  var maxWidth = x + w - 70; // 给右侧分数留够空间
  if (ctx.measureText(nickname).width > maxWidth) {
    while (nickname.length > 2 && ctx.measureText(nickname + '…').width > maxWidth) {
      nickname = nickname.substring(0, nickname.length - 1);
    }
    nickname += '…';
  }
  ctx.fillText(nickname, nameX, y + h / 2);

  // 复合分（右对齐，两位小数）
  var displayScore = (friend.bestScore / 100).toFixed(2);
  ctx.fillStyle = '#FF6B6B';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(displayScore, x + w - 8, y + h / 2);
}

// ==================== Canvas 辅助函数 ====================

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function roundRectTop(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
