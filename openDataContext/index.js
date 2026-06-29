// openDataContext/index.js — 好友排行榜（开放数据域）
// 排序规则：总分降序 → 平均分降序

var sharedCanvas = wx.getSharedCanvas();
var ctx = sharedCanvas.getContext('2d');

var W = 375;
var H = 667;
var dpr = 1;
var visible = false;
var friends = [];
var myData = null;
var scrollOffset = 0;
var maxScroll = 0;
var touchStartY = 0;
var touchLastY = 0;
var isTouching = false;

// 头像图片缓存 { openId: Image }
var avatarCache = {};
var avatarLoaded = {};

// ==================== 消息处理 ====================

wx.onMessage(function(msg) {
  if (msg.type === 'show') {
    console.log('[OpenData] 收到show消息:', JSON.stringify(msg));
    dpr = msg.dpr || 1;
    W = sharedCanvas.width / dpr || msg.W || 375;
    H = sharedCanvas.height / dpr || msg.H || 667;
    // 保存主域传入的本地数据作为兜底
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    visible = true;
    scrollOffset = 0;
    fetchAndRender();
  } else if (msg.type === 'hide') {
    visible = false;
    ctx.clearRect(0, 0, W, H);
  } else if (msg.type === 'refresh' && visible) {
    fetchAndRender();
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

function fetchAndRender() {
  // 并行获取好友数据和自己数据
  var fetchedFriends = null;
  var fetchedMyData = null;
  var doneCount = 0;

  function checkDone() {
    doneCount++;
    if (doneCount === 2) {
      processAndRender(fetchedFriends, fetchedMyData);
    }
  }

  wx.getFriendCloudStorage({
    keyList: ['bestScore'],
    success: function(res) {
      fetchedFriends = res.data || [];
      console.log('[OpenData] getFriendCloudStorage 成功, 好友数:', fetchedFriends.length, JSON.stringify(fetchedFriends));
      checkDone();
    },
    fail: function(err) {
      console.log('[OpenData] getFriendCloudStorage 失败:', JSON.stringify(err));
      fetchedFriends = [];
      checkDone();
    }
  });

  wx.getUserCloudStorage({
    keyList: ['bestScore'],
    success: function(res) {
      fetchedMyData = parseMyData(res);
      console.log('[OpenData] getUserCloudStorage 成功, 我的数据:', JSON.stringify(fetchedMyData), '原始:', JSON.stringify(res));
      checkDone();
    },
    fail: function(err) {
      console.log('[OpenData] getUserCloudStorage 失败:', JSON.stringify(err));
      fetchedMyData = null;
      checkDone();
    }
  });
}

function parseMyData(res) {
  try {
    // getUserCloudStorage 返回 res.KVDataList（不是 res.data.KVDataList）
    var kv = res.KVDataList || [];
    var bs = 0;
    for (var i = 0; i < kv.length; i++) {
      try {
        var v = JSON.parse(kv[i].value);
        if (kv[i].key === 'bestScore') bs = v.wxgame ? v.wxgame.score : 0;
      } catch(e) {}
    }
    return { bestScore: bs };
  } catch(e) {
    return null;
  }
}

function processAndRender(rawFriends, my) {
  console.log('[OpenData] processAndRender, 好友原始数据:', rawFriends.length, '条, 我的数据:', JSON.stringify(my));
  myData = my;
  friends = [];
  var selfInFriends = false;

  for (var i = 0; i < rawFriends.length; i++) {
    var f = rawFriends[i];
    var kv = f.KVDataList || [];
    var bestScore = 0;

    for (var j = 0; j < kv.length; j++) {
      try {
        var v = JSON.parse(kv[j].value);
        if (kv[j].key === 'bestScore') bestScore = v.wxgame ? v.wxgame.score : 0;
      } catch(e) {}
    }

    if (bestScore > 0) {
      var isMe = my && bestScore === my.bestScore;
      if (isMe) selfInFriends = true;
      friends.push({
        openId: f.openId || '',
        nickname: f.nickname || '微信用户',
        avatarUrl: f.avatarUrl || '',
        bestScore: bestScore,
        isMe: isMe
      });
    }
  }

  console.log('[OpenData] selfInFriends:', selfInFriends, 'friends:', friends.length);

  sortAndRender();
}

// Top 10 显示列表 + 自排名信息
var displayList = [];
var selfRank = -1;      // 自己的排名（1-based）
var showSelfBelow = false; // 自己不在 top 10 时底部追加

function sortAndRender() {
  // 排序：复合分降序
  friends.sort(function(a, b) {
    return b.bestScore - a.bestScore;
  });

  // 找到自己的排名
  selfRank = -1;
  for (var i = 0; i < friends.length; i++) {
    if (friends[i].isMe) { selfRank = i + 1; break; }
  }

  // Top 10
  displayList = friends.slice(0, 10);

  // 自己不在 top 10 则底部单独显示
  showSelfBelow = selfRank > 10;

  console.log('[OpenData] 总排行:', friends.length, '人, Top10:', displayList.length, '自己排名:', selfRank, '底部显示:', showSelfBelow);

  // 预加载头像
  preloadAvatars();
  render();
}

// ==================== 头像加载 ====================

function preloadAvatars() {
  var list = displayList.slice();
  if (showSelfBelow && selfRank > 0) {
    // 找到自己那行
    for (var i = 0; i < friends.length; i++) {
      if (friends[i].isMe) { list.push(friends[i]); break; }
    }
  }
  for (var i = 0; i < list.length; i++) {
    var f = list[i];
    if (f.avatarUrl && !avatarCache[f.openId] && !avatarLoaded[f.openId]) {
      avatarLoaded[f.openId] = true;
      loadAvatar(f.openId, f.avatarUrl);
    }
  }
}

function loadAvatar(openId, url) {
  try {
    var img = wx.createImage();
    img.onload = function() {
      avatarCache[openId] = img;
      if (visible) render();
    };
    img.onerror = function() {
      avatarCache[openId] = null;
      if (visible) render();
    };
    img.src = url;
  } catch(e) {
    avatarCache[openId] = null;
  }
}

// ==================== 渲染 ====================

function render() {
  console.log('[OpenData] render, visible:', visible, 'W:', W, 'H:', H, 'friends:', friends.length);
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

  // 标题
  ctx.fillStyle = '#333333';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('好友排行榜', W / 2, py + 27);

  // 关闭按钮 ✕（与主题面板位置一致）
  var closeCX = px + pw - 22, closeCY = py + 18;
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath(); ctx.arc(closeCX, closeCY, 12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#999999';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✕', closeCX, closeCY);

  // 无数据
  if (displayList.length === 0 && !showSelfBelow) {
    ctx.fillStyle = '#AAAAAA';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('暂无好友数据', W / 2, py + ph / 2);
    ctx.fillText('多玩几局吧~', W / 2, py + ph / 2 + 28);
    return;
  }

  var rowH = 52;
  var footerH = 40; // 底部排名条高度
  var selfGapH = showSelfBelow ? rowH + 12 : 0; // 自己行 + 分隔间距
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
  var img = avatarCache[friend.openId];

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
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  // 截断过长昵称
  var nickname = friend.nickname;
  if (nickname.length > 6) nickname = nickname.substring(0, 5) + '…';
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
