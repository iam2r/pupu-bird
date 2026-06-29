// storage.js — 微信存储封装
// 依赖: config.js（读取 THEMES 取默认值）、wx API

var C = require('./config.js');

function loadData() {
  var best, currentTheme, currentAccessory, unlockedThemes, unlockedAccessories, dailyDate, dailyBest, points, avatarEnabled, rankingBest;
  try {
    var raw = wx.getStorageSync('pupu_bird_data');
    if (raw) {
      var d = JSON.parse(raw);
      best = d.best || 0;
      currentTheme = d.theme || 'sakura';
      currentAccessory = d.accessory || 'none';
      unlockedThemes = d.unlockedThemes || { sakura: true, starry: false, ocean: false, forest: false, sunset: false, lavender: false, mint: false, coral: false, midnight: false, rose: false };
      unlockedAccessories = d.unlockedAccessories || { none: true };
      dailyDate = d.dailyDate || '';
      dailyBest = d.dailyBest || 0;
      avatarEnabled = d.avatarEnabled || false;
      rankingBest = d.rankingBest || 0;
    } else {
      best = 0;
      currentTheme = 'sakura';
      currentAccessory = 'none';
      unlockedThemes = { sakura: true, starry: false, ocean: false, forest: false, sunset: false, lavender: false, mint: false, coral: false, midnight: false, rose: false };
      unlockedAccessories = { none: true };
      dailyDate = '';
      dailyBest = 0;
      avatarEnabled = false;
      rankingBest = 0;
    }
  } catch(e) {
    best = 0; currentTheme = 'sakura'; currentAccessory = 'none';
    unlockedThemes = { sakura: true, starry: false, ocean: false, forest: false, sunset: false, lavender: false, mint: false, coral: false, midnight: false, rose: false };
    unlockedAccessories = { none: true };
    dailyDate = ''; dailyBest = 0; avatarEnabled = false;
    rankingBest = 0;
  }
  points = wx.getStorageSync('pupu_bird_points') || 0;

  // 检查每日挑战日期
  var today = C.getTodayStr();
  if (dailyDate !== today) { dailyDate = today; dailyBest = 0; }

  return {
    best: best,
    currentTheme: currentTheme,
    currentAccessory: currentAccessory,
    unlockedThemes: unlockedThemes,
    unlockedAccessories: unlockedAccessories,
    dailyDate: dailyDate,
    dailyBest: dailyBest,
    points: points,
    avatarEnabled: avatarEnabled,
    rankingBest: rankingBest
  };
}

function saveData(data) {
  try {
    wx.setStorageSync('pupu_bird_data', JSON.stringify({
      best: data.best,
      theme: data.currentTheme,
      accessory: data.currentAccessory,
      unlockedThemes: data.unlockedThemes,
      unlockedAccessories: data.unlockedAccessories,
      dailyDate: data.dailyDate,
      dailyBest: data.dailyBest,
      avatarEnabled: data.avatarEnabled,
      rankingBest: data.rankingBest
    }));
  } catch(e) {}
}

function savePoints(points) {
  try {
    wx.setStorageSync('pupu_bird_points', points);
  } catch(e) {}
}

module.exports = { loadData: loadData, saveData: saveData, savePoints: savePoints };
