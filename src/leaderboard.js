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

// 获取排行榜数据（含自己的排名）
function fetchRankList(callback) {
  wx.getFriendCloudStorage({
    keyList: ['rank_val', 'score', 'pipes', 'eff', 'update_time'],
    success: function(res) {
      var list = (res.data || []).map(function(item) {
        var kv = {};
        (item.KVDataList || []).forEach(function(d) { kv[d.key] = d.value; });
        return {
          openid: item.openid || '',
          nickname: item.nickname || '微信用户',
          avatarUrl: item.avatarUrl || '',
          rankVal: parseInt(kv.rank_val) || 0,
          score: parseInt(kv.score) || 0,
          pipes: parseInt(kv.pipes) || 0,
          eff: kv.eff || '0',
          time: parseInt(kv.update_time) || 0
        };
      });
      // 按 rank_val 降序
      list.sort(function(a, b) { return b.rankVal - a.rankVal; });
      // 标记自己的排名
      var selfOpenId = (res.data && res.data.length > 0) ? '' : '';
      // getFriendCloudStorage 不直接返回自己的 openid，用 userGameData 判断
      for (var i = 0; i < list.length; i++) {
        list[i].rank = i + 1;
      }
      callback(list);
    },
    fail: function(e) {
      console.log('fetch rank fail:', e);
      callback([]);
    }
  });
}

module.exports = {
  calcRankValue: calcRankValue,
  uploadBest: uploadBest,
  fetchRankList: fetchRankList
};
