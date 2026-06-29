// leaderboard.js — 微信好友排行榜
// 排行键：score * 1000 + efficiency * 10（分数优先，均分破平局）

var C = require('./config.js');

// 计算排行值
function calcRankValue(score, pipesPassed) {
  var eff = pipesPassed > 0 ? score / pipesPassed : 0;
  return Math.floor(score * 1000 + eff * 10);
}

// 上传最佳成绩
function uploadBest(score, pipesPassed) {
  if (!wx.setUserCloudStorage) return;
  var val = calcRankValue(score, pipesPassed);
  wx.setUserCloudStorage({
    KVDataList: [
      { key: 'rank_val', value: String(val) },
      { key: 'score', value: String(score) },
      { key: 'pipes', value: String(pipesPassed) },
      { key: 'eff', value: pipesPassed > 0 ? (score / pipesPassed).toFixed(1) : '0' },
      { key: 'update_time', value: String(Date.now()) }
    ],
    success: function() { console.log('leaderboard updated:', val); },
    fail: function(e) { console.log('leaderboard update fail:', e); }
  });
}

module.exports = {
  calcRankValue: calcRankValue,
  uploadBest: uploadBest
};
