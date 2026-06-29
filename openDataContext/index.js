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
var localFallback = null;  // 主域传入的本地数据兜底
var selfAvatarUrl = '';    // 自己的头像URL
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
    if (msg.localBestScore !== undefined) {
      localFallback = { bestScore: msg.localBestScore || 0 };
    }
    selfAvatarUrl = msg.selfAvatarUrl || '';
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
    var kv = res.data && res.data.KVDataList ? res.data.KVDataList : [];
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

  // 如果自己不在好友列表中，用云存储数据或本地兜底数据追加
  var selfData = (my && my.bestScore > 0) ? my : localFallback;
  console.log('[OpenData] selfInFriends:', selfInFriends, 'my:', JSON.stringify(my), 'localFallback:', JSON.stringify(localFallback), 'selfData:', JSON.stringify(selfData));
  if (!selfInFriends && selfData && selfData.bestScore > 0) {
    friends.push({
      openId: 'self',
      nickname: '我',
      avatarUrl: selfAvatarUrl,
      bestScore: selfData.bestScore,
      isMe: true
    });
  }

  sortAndRender();
}

function sortAndRender() {
  console.log('[OpenData] sortAndRender, friends列表:', friends.length, '条, 内容:', JSON.stringify(friends.map(function(f) { return { n: f.nickname, bs: f.bestScore, me: f.isMe }; })));
  // 排序：复合分降序
  friends.sort(function(a, b) {
    return b.bestScore - a.bestScore;
  });

  // 预加载头像
  preloadAvatars();
  render();
}

// ==================== 头像加载 ====================

function preloadAvatars() {
  for (var i = 0; i < friends.length; i++) {
    var f = friends[i];
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

  // 面板尺寸
  var pw = W * 0.88;
  var ph = H * 0.75;
  var px = (W - pw) / 2;
  var py = (H - ph) / 2;
  var borderRadius = 16;

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
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('好友排行榜', W / 2, py + 25);

  // 列标题
  ctx.fillStyle = '#999999';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('最高分', px + pw - 16, py + 25);

  // 无数据
  if (friends.length === 0) {
    ctx.fillStyle = '#AAAAAA';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('暂无好友数据', W / 2, py + ph / 2);
    ctx.fillText('多玩几局吧~', W / 2, py + ph / 2 + 28);
    return;
  }

  // 裁剪区域（列表区）
  ctx.save();
  var listTop = py + 56;
  var listBottom = py + ph - 8;
  ctx.beginPath();
  roundRect(px + 2, listTop - 2, pw - 4, listBottom - listTop + 4, 8);
  ctx.clip();

  var rowH = 62;
  var totalH = friends.length * rowH;
  maxScroll = Math.max(0, totalH - (listBottom - listTop));

  for (var i = 0; i < friends.length; i++) {
    var rowY = listTop + i * rowH - scrollOffset;
    if (rowY + rowH < listTop || rowY > listBottom) continue;

    drawFriendRow(friends[i], i, px + 8, rowY, pw - 16, rowH);
  }

  ctx.restore();
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

  // 复合分（右对齐）
  ctx.fillStyle = '#FF6B6B';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('' + friend.bestScore, x + w - 8, y + h / 2);
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
