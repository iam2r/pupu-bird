// openDataContext/index.js — 排行榜开放数据域
// 独立作用域，可调用 wx.getFriendCloudStorage

var sharedCanvas = wx.getSharedCanvas();
var ctx = sharedCanvas.getContext('2d');

var W = 0, H = 0;
var rankData = [];
var loading = true;

function initSize() {
  var si = wx.getSystemInfoSync();
  W = si.windowWidth;
  H = si.windowHeight;
  sharedCanvas.width = W;
  sharedCanvas.height = H;
}

// 绘制排行榜完整面板
function drawPanel() {
  ctx.clearRect(0, 0, W, H);

  // 半透明遮罩
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, W, H);

  var pw = W * 0.88, ph = H * 0.6;
  var px = (W - pw) / 2, py = (H - ph) / 2;

  // 面板背景
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  roundRect(px + 2, py + 3, pw, ph, 18);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  roundRect(px, py, pw, ph, 18);
  ctx.fill();

  // 标题
  ctx.fillStyle = '#4A2C4A';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('好友排行', px + pw / 2, py + 28);
  ctx.textAlign = 'left';

  // 关闭按钮
  ctx.fillStyle = 'rgba(0,0,0,0.07)';
  ctx.beginPath();
  ctx.arc(px + pw - 22, py + 18, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#999';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✕', px + pw - 22, py + 20);
  ctx.textAlign = 'left';

  // 内容区
  var listTop = py + 52, listBottom = py + ph - 16;
  ctx.save();
  ctx.beginPath();
  ctx.rect(px + 4, listTop, pw - 8, listBottom - listTop);
  ctx.clip();

  if (loading) {
    ctx.fillStyle = '#AAA';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('加载中...', px + pw / 2, py + ph / 2);
    ctx.textAlign = 'left';
  } else if (rankData.length === 0) {
    ctx.fillStyle = '#AAA';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('暂无排行', px + pw / 2, py + ph / 2 - 10);
    ctx.fillText('游玩一局后上传成绩', px + pw / 2, py + ph / 2 + 18);
    ctx.textAlign = 'left';
  } else {
    var rowH = 34;
    for (var i = 0; i < Math.min(rankData.length, 12); i++) {
      var item = rankData[i];
      var rowY = listTop + i * rowH;

      // 排名
      ctx.fillStyle = item.rank <= 3 ? '#FFB347' : '#999';
      ctx.font = (item.rank <= 3 ? 'bold ' : '') + '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('#' + item.rank, px + 24, rowY + rowH / 2 + 4);

      // 昵称
      ctx.fillStyle = '#555';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      var nick = item.nickname || '微信用户';
      if (nick.length > 7) nick = nick.substring(0, 6) + '..';
      ctx.fillText(nick, px + pw * 0.4, rowY + rowH / 2 + 4);

      // 分数
      ctx.fillStyle = '#333';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(String(item.score), px + pw * 0.63, rowY + rowH / 2 + 4);

      // 均分
      ctx.fillStyle = '#AAA';
      ctx.font = '10px sans-serif';
      ctx.fillText(item.eff || '-', px + pw * 0.82, rowY + rowH / 2 + 4);

      // 分隔线
      if (i < Math.min(rankData.length, 12) - 1) {
        ctx.strokeStyle = 'rgba(0,0,0,0.04)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(px + 20, rowY + rowH);
        ctx.lineTo(px + pw - 20, rowY + rowH);
        ctx.stroke();
      }
    }
  }

  ctx.restore();
  ctx.textAlign = 'left';
}

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

function fetchAndDraw() {
  if (!wx.getFriendCloudStorage) {
    loading = false;
    drawPanel();
    return;
  }
  loading = true;
  drawPanel();

  wx.getFriendCloudStorage({
    keyList: ['rank_val', 'score', 'pipes', 'eff'],
    success: function(res) {
      loading = false;
      var list = (res.data || []).map(function(item) {
        var kv = {};
        (item.KVDataList || []).forEach(function(d) { kv[d.key] = d.value; });
        return {
          nickname: item.nickname || '微信用户',
          avatarUrl: item.avatarUrl || '',
          rankVal: parseInt(kv.rank_val) || 0,
          score: parseInt(kv.score) || 0,
          pipes: parseInt(kv.pipes) || 0,
          eff: kv.eff || '0'
        };
      });
      list.sort(function(a, b) { return b.rankVal - a.rankVal; });
      for (var i = 0; i < list.length; i++) list[i].rank = i + 1;
      rankData = list;
      drawPanel();
    },
    fail: function() {
      loading = false;
      rankData = [];
      drawPanel();
    }
  });
}

wx.onMessage(function(data) {
  if (data.action === 'refresh') {
    initSize();
    fetchAndDraw();
  } else if (data.action === 'hide') {
    ctx.clearRect(0, 0, W, H);
  }
});

initSize();
ctx.clearRect(0, 0, W, H);
