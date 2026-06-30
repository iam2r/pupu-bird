// config.js — 常量、布局、辅助函数
// 被所有模块引用，不依赖其他模块

// ==================== 三套主题皮肤 ====================
// 调试开关：发版时改 false 隐藏 调试 按钮
var DEBUG = false;

var THEMES = {
  sakura: {
    name: '樱花粉',
    sky:      ['#FDE4EC','#FEF0EB','#F2E4F6','#D8E8F4'],
    ground:   '#FEF5E7', grass: '#B8DDC8',
    bird:     '#FFB3B3', birdWing: '#F09898', birdBeak: '#FFB347', birdBlush: '#FFD4D4',
    pipe:     '#FFB8B8', pipeDark: '#F09898',
    accent:   '#FFB3B3', accentDark: '#FF9F8F',
    textPri:  '#4A2C4A', textSec: 'rgba(155,120,155,0.7)',
    btnText:  '#4A2C4A',
    bgCard:   '#FEFAF7', bgOverlay: 'rgba(255,240,240,0.3)',
    surfaceBg: '#FFFFFF', surfaceOverlay: 'rgba(0,0,0,0.45)', surfaceShadow: 'rgba(0,0,0,0.12)', surfaceDivider: 'rgba(0,0,0,0.05)', surfaceClose: 'rgba(0,0,0,0.07)',
    scoreBg: 'rgba(255,255,255,0.65)', scoreBorder: 'rgba(200,170,180,0.25)',
    overBg: 'rgba(255,252,250,0.85)', overBorder: 'rgba(220,200,210,0.35)', overDivider: 'rgba(220,200,210,0.3)',
    cardBg: 'rgba(255,255,255,0.95)', cardShadow: 'rgba(180,160,170,0.18)', cardAvatarRing: 'rgba(255,255,255,0.5)',
    deathDim: 'rgba(0,0,0,0.18)', startShadow: 'rgba(0,0,0,0.08)',
    petal:    ['#FFC0CB','#FFB3B3','#FFD4D4','#FFE4E1','#FFB7C5'],
    acc:      { hat: ['#FFB3B3','#F09898'], bow: ['#FF88A8','#FF6088'], glasses: ['#3A2A3A','#555555'],
               crown: ['#FFB3B3','#FFD700'], flower: ['#FF88A8','#FFC0CB'], ribbon: ['#FFD4E0','#FFB3C8'],
               headphones: ['#555555','#FFB3B3'], star: ['#FFD700','#FFA500'], halo: ['#FFEEDD','#FFD700'] },
    unlock:   0
  },
  starry: {
    name: '星空紫',
    sky:      ['#E8E0F0','#EDE8F5','#D8D0E8','#C0C8E8'],
    ground:   '#F5F0FA', grass: '#C8C0D8',
    bird:     '#C8B8E8', birdWing: '#A898C8', birdBeak: '#E8C878', birdBlush: '#E0D0F0',
    pipe:     '#C8B8E8', pipeDark: '#A898C8',
    accent:   '#C8B8E8', accentDark: '#B0A0D0',
    textPri:  '#3A2C4A', textSec: 'rgba(120,100,155,0.7)',
    btnText:  '#3A2C4A',
    bgCard:   '#FAF8FE', bgOverlay: 'rgba(240,235,250,0.3)',
    surfaceBg: '#FFFFFF', surfaceOverlay: 'rgba(0,0,0,0.45)', surfaceShadow: 'rgba(0,0,0,0.12)', surfaceDivider: 'rgba(0,0,0,0.05)', surfaceClose: 'rgba(0,0,0,0.07)',
    scoreBg: 'rgba(255,255,255,0.65)', scoreBorder: 'rgba(200,170,180,0.25)',
    overBg: 'rgba(255,252,250,0.85)', overBorder: 'rgba(220,200,210,0.35)', overDivider: 'rgba(220,200,210,0.3)',
    cardBg: 'rgba(255,255,255,0.95)', cardShadow: 'rgba(180,160,170,0.18)', cardAvatarRing: 'rgba(255,255,255,0.5)',
    deathDim: 'rgba(0,0,0,0.18)', startShadow: 'rgba(0,0,0,0.08)',
    petal:    ['#D8C8F0','#C0B0E0','#E8D8F8','#D0C0F0','#C8B8E8'],
    acc:      { hat: ['#C8B8E8','#A898C8'], bow: ['#C090D0','#A080B8'], glasses: ['#3A2C4A','#555'],
               crown: ['#C8B8E8','#FFD700'], flower: ['#D8A0C8','#E8C0D8'], ribbon: ['#E0D0F0','#D0C0E8'],
               headphones: ['#555555','#C8B8E8'], star: ['#FFD700','#FFC040'], halo: ['#FFEEDD','#FFD700'] },
    unlock:   50
  },
  ocean: {
    name: '海洋蓝',
    sky:      ['#D8ECF4','#E0F0F8','#C8E0F0','#B8D8F0'],
    ground:   '#F0F8FC', grass: '#B8D8D8',
    bird:     '#88C8D8', birdWing: '#68A8B8', birdBeak: '#F0C878', birdBlush: '#B0E0E8',
    pipe:     '#88C8D8', pipeDark: '#68A8B8',
    accent:   '#88C8D8', accentDark: '#70B8C8',
    textPri:  '#2C3A4A', textSec: 'rgba(100,140,160,0.7)',
    btnText:  '#2C3A4A',
    bgCard:   '#F8FCFE', bgOverlay: 'rgba(235,245,250,0.3)',
    surfaceBg: '#FFFFFF', surfaceOverlay: 'rgba(0,0,0,0.45)', surfaceShadow: 'rgba(0,0,0,0.12)', surfaceDivider: 'rgba(0,0,0,0.05)', surfaceClose: 'rgba(0,0,0,0.07)',
    scoreBg: 'rgba(255,255,255,0.65)', scoreBorder: 'rgba(200,170,180,0.25)',
    overBg: 'rgba(255,252,250,0.85)', overBorder: 'rgba(220,200,210,0.35)', overDivider: 'rgba(220,200,210,0.3)',
    cardBg: 'rgba(255,255,255,0.95)', cardShadow: 'rgba(180,160,170,0.18)', cardAvatarRing: 'rgba(255,255,255,0.5)',
    deathDim: 'rgba(0,0,0,0.18)', startShadow: 'rgba(0,0,0,0.08)',
    petal:    ['#B8D8F0','#A8C8E8','#C8E0F8','#B0D0F0','#A0C8E0'],
    acc:      { hat: ['#88C8D8','#68A8B8'], bow: ['#70B0C8','#5898B0'], glasses: ['#2C3A4A','#555'],
               crown: ['#88C8D8','#FFD700'], flower: ['#F0A0B8','#F8C0D0'], ribbon: ['#C8E0F0','#B0D0E8'],
               headphones: ['#555555','#88C8D8'], star: ['#FFD700','#FFC040'], halo: ['#FFEEDD','#FFD700'] },
    unlock:   80
  },
  forest: {
    name: '森林绿',
    sky:      ['#E8F5E0','#D8EDD0','#E0F0D8','#D0E4C8'],
    ground:   '#F5FAF0', grass: '#A0C890',
    bird:     '#78B868', birdWing: '#58A048', birdBeak: '#F0C878', birdBlush: '#B0D8A0',
    pipe:     '#78B868', pipeDark: '#58A048',
    accent:   '#78B868', accentDark: '#60A850',
    textPri:  '#2C4A28', textSec: 'rgba(100,150,100,0.7)',
    btnText:  '#2C4A28',
    bgCard:   '#F8FCF6', bgOverlay: 'rgba(235,245,235,0.3)',
    surfaceBg: '#FFFFFF', surfaceOverlay: 'rgba(0,0,0,0.45)', surfaceShadow: 'rgba(0,0,0,0.12)', surfaceDivider: 'rgba(0,0,0,0.05)', surfaceClose: 'rgba(0,0,0,0.07)',
    scoreBg: 'rgba(255,255,255,0.65)', scoreBorder: 'rgba(200,170,180,0.25)',
    overBg: 'rgba(255,252,250,0.85)', overBorder: 'rgba(220,200,210,0.35)', overDivider: 'rgba(220,200,210,0.3)',
    cardBg: 'rgba(255,255,255,0.95)', cardShadow: 'rgba(180,160,170,0.18)', cardAvatarRing: 'rgba(255,255,255,0.5)',
    deathDim: 'rgba(0,0,0,0.18)', startShadow: 'rgba(0,0,0,0.08)',
    petal:    ['#A8D8A0','#88C880','#B8E0B0','#98D090','#80C078'],
    acc:      { hat: ['#78B868','#58A048'], bow: ['#60A850','#489040'], glasses: ['#2C4A28','#555'],
               crown: ['#78B868','#FFD700'], flower: ['#F0A0B8','#F8C0D0'], ribbon: ['#B8E0B0','#A0D098'],
               headphones: ['#555555','#78B868'], star: ['#FFD700','#FFC040'], halo: ['#FFEEDD','#FFD700'] },
    unlock:   100
  },
  sunset: {
    name: '日落橙',
    sky:      ['#FEF0E8','#FDE4D4','#F8D8C4','#F2CCB8'],
    ground:   '#FEF8F0', grass: '#D8C0A0',
    bird:     '#F0A878', birdWing: '#E09060', birdBeak: '#F0C878', birdBlush: '#F8C8B0',
    pipe:     '#F0A878', pipeDark: '#E09060',
    accent:   '#F0A878', accentDark: '#E89868',
    textPri:  '#4A3020', textSec: 'rgba(160,120,100,0.7)',
    btnText:  '#4A3020',
    bgCard:   '#FEFAF8', bgOverlay: 'rgba(250,240,235,0.3)',
    surfaceBg: '#FFFFFF', surfaceOverlay: 'rgba(0,0,0,0.45)', surfaceShadow: 'rgba(0,0,0,0.12)', surfaceDivider: 'rgba(0,0,0,0.05)', surfaceClose: 'rgba(0,0,0,0.07)',
    scoreBg: 'rgba(255,255,255,0.65)', scoreBorder: 'rgba(200,170,180,0.25)',
    overBg: 'rgba(255,252,250,0.85)', overBorder: 'rgba(220,200,210,0.35)', overDivider: 'rgba(220,200,210,0.3)',
    cardBg: 'rgba(255,255,255,0.95)', cardShadow: 'rgba(180,160,170,0.18)', cardAvatarRing: 'rgba(255,255,255,0.5)',
    deathDim: 'rgba(0,0,0,0.18)', startShadow: 'rgba(0,0,0,0.08)',
    petal:    ['#F8C8B0','#F0B898','#F8D0B8','#E8A888','#F0C0A8'],
    acc:      { hat: ['#F0A878','#E09060'], bow: ['#E89868','#D08050'], glasses: ['#4A3020','#555'],
               crown: ['#F0A878','#FFD700'], flower: ['#F8A090','#F8B8A8'], ribbon: ['#F8D0C0','#F0C0B0'],
               headphones: ['#555555','#F0A878'], star: ['#FFD700','#FFA040'], halo: ['#FFEEDD','#FFD700'] },
    unlock:   130
  },
  lavender: {
    name: '薰衣草紫',
    sky:      ['#F4ECFA','#EDE0F6','#E4D4F0','#D8C8E8'],
    ground:   '#F8F4FC', grass: '#C8B8D8',
    bird:     '#C4A8E0', birdWing: '#A888C8', birdBeak: '#F0C878', birdBlush: '#DCC8F0',
    pipe:     '#C4A8E0', pipeDark: '#A888C8',
    accent:   '#C4A8E0', accentDark: '#B498D8',
    textPri:  '#3A2848', textSec: 'rgba(130,110,160,0.7)',
    btnText:  '#3A2848',
    bgCard:   '#FBF8FE', bgOverlay: 'rgba(245,238,252,0.3)',
    surfaceBg: '#FFFFFF', surfaceOverlay: 'rgba(0,0,0,0.45)', surfaceShadow: 'rgba(0,0,0,0.12)', surfaceDivider: 'rgba(0,0,0,0.05)', surfaceClose: 'rgba(0,0,0,0.07)',
    scoreBg: 'rgba(255,255,255,0.65)', scoreBorder: 'rgba(200,170,180,0.25)',
    overBg: 'rgba(255,252,250,0.85)', overBorder: 'rgba(220,200,210,0.35)', overDivider: 'rgba(220,200,210,0.3)',
    cardBg: 'rgba(255,255,255,0.95)', cardShadow: 'rgba(180,160,170,0.18)', cardAvatarRing: 'rgba(255,255,255,0.5)',
    deathDim: 'rgba(0,0,0,0.18)', startShadow: 'rgba(0,0,0,0.08)',
    petal:    ['#D0B8F0','#C0A8E8','#D8C4F8','#C8B0F0','#B8A0E0'],
    acc:      { hat: ['#C4A8E0','#A888C8'], bow: ['#B890D8','#A078C0'], glasses: ['#3A2848','#555'],
               crown: ['#C4A8E0','#FFD700'], flower: ['#D8A0C8','#E8C0D8'], ribbon: ['#E0D0F4','#D0C0E8'],
               headphones: ['#555555','#C4A8E0'], star: ['#FFD700','#FFC040'], halo: ['#FFEEDD','#FFD700'] },
    unlock:   160
  },
  mint: {
    name: '薄荷绿',
    sky:      ['#EAF8F2','#DEF4E8','#D2F0E0','#C2E8D6'],
    ground:   '#F4FCF8', grass: '#A0D4B8',
    bird:     '#68C8A0', birdWing: '#48B088', birdBeak: '#F0C878', birdBlush: '#A0E8C8',
    pipe:     '#68C8A0', pipeDark: '#48B088',
    accent:   '#68C8A0', accentDark: '#50B890',
    textPri:  '#284838', textSec: 'rgba(100,150,120,0.7)',
    btnText:  '#284838',
    bgCard:   '#F6FCF8', bgOverlay: 'rgba(235,248,240,0.3)',
    surfaceBg: '#FFFFFF', surfaceOverlay: 'rgba(0,0,0,0.45)', surfaceShadow: 'rgba(0,0,0,0.12)', surfaceDivider: 'rgba(0,0,0,0.05)', surfaceClose: 'rgba(0,0,0,0.07)',
    scoreBg: 'rgba(255,255,255,0.65)', scoreBorder: 'rgba(200,170,180,0.25)',
    overBg: 'rgba(255,252,250,0.85)', overBorder: 'rgba(220,200,210,0.35)', overDivider: 'rgba(220,200,210,0.3)',
    cardBg: 'rgba(255,255,255,0.95)', cardShadow: 'rgba(180,160,170,0.18)', cardAvatarRing: 'rgba(255,255,255,0.5)',
    deathDim: 'rgba(0,0,0,0.18)', startShadow: 'rgba(0,0,0,0.08)',
    petal:    ['#90D8B8','#78C8A0','#A0E0C8','#88D0B0','#70C098'],
    acc:      { hat: ['#68C8A0','#48B088'], bow: ['#50B890','#389878'], glasses: ['#284838','#555'],
               crown: ['#68C8A0','#FFD700'], flower: ['#F0A0B8','#F8C0D0'], ribbon: ['#A8E0C8','#90D8B0'],
               headphones: ['#555555','#68C8A0'], star: ['#FFD700','#FFC040'], halo: ['#FFEEDD','#FFD700'] },
    unlock:   200
  },
  coral: {
    name: '珊瑚色',
    sky:      ['#FEF0EC','#FDE4DE','#F8D8D0','#F2CCC4'],
    ground:   '#FEF6F4', grass: '#D8B8A8',
    bird:     '#F08878', birdWing: '#E07058', birdBeak: '#F0C878', birdBlush: '#F8B8A8',
    pipe:     '#F08878', pipeDark: '#E07058',
    accent:   '#F08878', accentDark: '#E87868',
    textPri:  '#482820', textSec: 'rgba(160,100,90,0.7)',
    btnText:  '#482820',
    bgCard:   '#FEF8F6', bgOverlay: 'rgba(252,240,238,0.3)',
    surfaceBg: '#FFFFFF', surfaceOverlay: 'rgba(0,0,0,0.45)', surfaceShadow: 'rgba(0,0,0,0.12)', surfaceDivider: 'rgba(0,0,0,0.05)', surfaceClose: 'rgba(0,0,0,0.07)',
    scoreBg: 'rgba(255,255,255,0.65)', scoreBorder: 'rgba(200,170,180,0.25)',
    overBg: 'rgba(255,252,250,0.85)', overBorder: 'rgba(220,200,210,0.35)', overDivider: 'rgba(220,200,210,0.3)',
    cardBg: 'rgba(255,255,255,0.95)', cardShadow: 'rgba(180,160,170,0.18)', cardAvatarRing: 'rgba(255,255,255,0.5)',
    deathDim: 'rgba(0,0,0,0.18)', startShadow: 'rgba(0,0,0,0.08)',
    petal:    ['#F0B0A0','#E89888','#F8B8A8','#E8A090','#F0A898'],
    acc:      { hat: ['#F08878','#E07058'], bow: ['#E87868','#D06050'], glasses: ['#482820','#555'],
               crown: ['#F08878','#FFD700'], flower: ['#F8A090','#F8B8A8'], ribbon: ['#F8C0B0','#F0B0A0'],
               headphones: ['#555555','#F08878'], star: ['#FFD700','#FFA040'], halo: ['#FFEEDD','#FFD700'] },
    unlock:   230
  },
  midnight: {
    name: '午夜蓝',
    sky:      ['#1A1A2E','#162138','#0F2C50','#1A1A3E'],
    ground:   '#1E1E32', grass: '#2A2A48',
    bird:     '#5B8BD4', birdWing: '#4A7AB8', birdBeak: '#E8C878', birdBlush: '#7AA0E0',
    pipe:     '#4A6FA5', pipeDark: '#385888',
    accent:   '#5B8BD4', accentDark: '#4A7AC4',
    textPri:  '#2A3040', textSec: 'rgba(70,85,110,0.65)',
    btnText:  '#FFFFFF',
    bgCard:   '#1E1E38', bgOverlay: 'rgba(20,20,40,0.5)',
    surfaceBg: '#FFFFFF', surfaceOverlay: 'rgba(0,0,0,0.45)', surfaceShadow: 'rgba(0,0,0,0.12)', surfaceDivider: 'rgba(0,0,0,0.05)', surfaceClose: 'rgba(0,0,0,0.07)',
    scoreBg: 'rgba(255,255,255,0.65)', scoreBorder: 'rgba(200,170,180,0.25)',
    overBg: 'rgba(255,252,250,0.85)', overBorder: 'rgba(220,200,210,0.35)', overDivider: 'rgba(220,200,210,0.3)',
    cardBg: 'rgba(255,255,255,0.95)', cardShadow: 'rgba(180,160,170,0.18)', cardAvatarRing: 'rgba(255,255,255,0.5)',
    deathDim: 'rgba(0,0,0,0.18)', startShadow: 'rgba(0,0,0,0.08)',
    petal:    ['#3A5A8A','#4A6FA5','#5B8BD4','#6A9FE0','#4A6A9A'],
    acc:      { hat: ['#4A6FA5','#385888'], bow: ['#5B8BD4','#4A7AB8'], glasses: ['#D0D8E8','#888'],
               crown: ['#5B8BD4','#FFD700'], flower: ['#E0C8F0','#D0B8E8'], ribbon: ['#6A8FC0','#5B7DB0'],
               headphones: ['#A0B0C8','#5B8BD4'], star: ['#FFD700','#FFC040'], halo: ['#FFEEDD','#FFD700'] },
    unlock:   260
  },
  rose: {
    name: '玫瑰金',
    sky:      ['#FEF0F0','#FDE8E4','#F8DCD4','#F2D0C8'],
    ground:   '#FEF8F4', grass: '#D8C0B0',
    bird:     '#E8A898', birdWing: '#D08878', birdBeak: '#F0C878', birdBlush: '#F0C8B8',
    pipe:     '#E8A898', pipeDark: '#D08878',
    accent:   '#D4A090', accentDark: '#C09080',
    textPri:  '#482820', textSec: 'rgba(160,110,100,0.7)',
    btnText:  '#482820',
    bgCard:   '#FEFAF8', bgOverlay: 'rgba(252,240,235,0.3)',
    surfaceBg: '#FFFFFF', surfaceOverlay: 'rgba(0,0,0,0.45)', surfaceShadow: 'rgba(0,0,0,0.12)', surfaceDivider: 'rgba(0,0,0,0.05)', surfaceClose: 'rgba(0,0,0,0.07)',
    scoreBg: 'rgba(255,255,255,0.65)', scoreBorder: 'rgba(200,170,180,0.25)',
    overBg: 'rgba(255,252,250,0.85)', overBorder: 'rgba(220,200,210,0.35)', overDivider: 'rgba(220,200,210,0.3)',
    cardBg: 'rgba(255,255,255,0.95)', cardShadow: 'rgba(180,160,170,0.18)', cardAvatarRing: 'rgba(255,255,255,0.5)',
    deathDim: 'rgba(0,0,0,0.18)', startShadow: 'rgba(0,0,0,0.08)',
    petal:    ['#E8B8A8','#D8A898','#F0C0B0','#E0B0A0','#D8A090'],
    acc:      { hat: ['#E8A898','#D08878'], bow: ['#D89880','#C08068'], glasses: ['#482820','#555'],
               crown: ['#E8A898','#FFD700'], flower: ['#F0A898','#F0B8A8'], ribbon: ['#F0C8B8','#E0B8A8'],
               headphones: ['#555555','#E8A898'], star: ['#FFD700','#FFC040'], halo: ['#FFEEDD','#FFD700'] },
    unlock:   300
  }
};

// ==================== 配饰系统 ====================
var ACCESSORIES = {
  none:       { name: '素颜', cost: 0 },
  hat:        { name: '小帽子', color1: '#FFB3B3', color2: '#F09898', cost: 15 },
  bow:        { name: '蝴蝶结', color1: '#FF88A8', color2: '#FF6088', cost: 15 },
  glasses:    { name: '小墨镜', color1: '#3A2A3A', color2: '#555555', cost: 15 },
  crown:      { name: '皇冠', color1: '#FFB3B3', color2: '#FFD700', cost: 60 },
  flower:     { name: '小花', color1: '#FF88A8', color2: '#FFC0CB', cost: 30 },
  ribbon:     { name: '发带', color1: '#FFD4E0', color2: '#FFB3C8', cost: 30 },
  headphones: { name: '耳机', color1: '#555555', color2: '#FFB3B3', cost: 50 },
  star:       { name: '星星头饰', color1: '#FFD700', color2: '#FFA500', cost: 60 },
  halo:       { name: '天使光环', color1: '#FFEEDD', color2: '#FFD700', cost: 80 }
};
var ACC_KEYS = ['none', 'hat', 'bow', 'glasses', 'ribbon', 'flower', 'headphones', 'crown', 'star', 'halo'];

// ==================== 纪念卡文案 ====================
var MEMORIAL_MSGS = [
  '每一次飞翔\n都是勇气的绽放 ',
  '即使坠落\n也曾在天空留下轨迹 ',
  '小小的翅膀\n承载着大大的梦想 ',
  '飞过的路\n开满了花 ',
  '下一段旅程\n会更美好 ',
  '跌倒也没关系\n温柔地抱抱自己 ',
  '天空记得\n你来过的痕迹 ',
  '翅膀虽小\n心向远方 '
];

// ==================== 游戏状态枚举 ====================
var STATE = { MENU: 0, PLAYING: 1, DEAD: 2, MEMORIAL: 3 };

// ==================== 物理常量 ====================
var GRAVITY_PX = 980;
var CHARGE_MIN_VELOCITY = -350;  // 轻点最小跳
var CHARGE_MAX_VELOCITY = -580;  // 满蓄全力跳
var CHARGE_MAX_TIME = 0.25;       // 满蓄所需秒数
var TERMINAL_V = 550;
var SCROLL_SPEED = 120;

// ==================== 布局（setLayout 后可用） ====================
var backBtn = { x: 0, y: 0, w: 66, h: 28 };

function setLayout(si) {
  var exp = module.exports;
  exp.W = si.windowWidth;
  exp.H = si.windowHeight;
  exp.dpr = si.pixelRatio;
  exp.SAFE_TOP = si.safeArea ? si.safeArea.top : (si.statusBarHeight || 44);

  exp.GAME_TOP = exp.SAFE_TOP + 30;
  exp.GROUND_Y = exp.H * 0.85;
  exp.GAME_BOTTOM = exp.GROUND_Y - 4;
  exp.GAME_H = exp.GAME_BOTTOM - exp.GAME_TOP;
  exp.PIPE_WIDTH = exp.W * 0.075;
  exp.PIPE_GAP = exp.H * 0.17;
  exp.PIPE_SPACING = exp.W * 0.58;
  exp.BIRD_SIZE = exp.W * 0.064;
  exp.BIRD_X = exp.W * 0.28;

  // 双人模式常量
  exp.BIRD_X_A = exp.W * 0.20;
  exp.BIRD_X_B = exp.W * 0.38;
  exp.ROPE_MAX_LENGTH = exp.W * 0.25;
  exp.ROPE_STIFFNESS = 12;
  exp.TOUCH_SPLIT_X = exp.W * 0.5;

  backBtn.x = 10;
  backBtn.y = exp.SAFE_TOP + 4;
  backBtn.w = 68;
  backBtn.h = 28;
}

// ==================== 辅助函数 ====================

function getT(currentTheme) {
  return THEMES[currentTheme];
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawText(ctx, text, x, y, fontSize, color, bold) {
  ctx.fillStyle = color;
  ctx.font = (bold ? 'bold ' : '') + fontSize + 'px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y + fontSize * 0.35);
}

function drawTextLeft(ctx, text, x, y, fontSize, color, bold) {
  ctx.fillStyle = color;
  ctx.font = (bold ? 'bold ' : '') + fontSize + 'px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y + fontSize * 0.35);
}

function hexToRgba(hex, alpha) {
  var r = parseInt(hex.slice(1, 3), 16);
  var g = parseInt(hex.slice(3, 5), 16);
  var b = parseInt(hex.slice(5, 7), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

function getTodayStr() {
  var d = new Date();
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}

function seededRandom(s) {
  var hash = 0, i;
  for (i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  hash = ((hash * 1103515245) + 12345) & 0x7fffffff;
  return (hash % 10000) / 10000;
}

module.exports = {
  DEBUG: DEBUG,
  THEMES: THEMES,
  ACCESSORIES: ACCESSORIES,
  ACC_KEYS: ACC_KEYS,
  MEMORIAL_MSGS: MEMORIAL_MSGS,
  STATE: STATE,
  GRAVITY_PX: GRAVITY_PX,
  CHARGE_MIN_VELOCITY: CHARGE_MIN_VELOCITY,
  CHARGE_MAX_VELOCITY: CHARGE_MAX_VELOCITY,
  CHARGE_MAX_TIME: CHARGE_MAX_TIME,
  TERMINAL_V: TERMINAL_V,
  SCROLL_SPEED: SCROLL_SPEED,
  setLayout: setLayout,
  W: 0, H: 0, dpr: 0, SAFE_TOP: 0,
  GAME_TOP: 0, GAME_BOTTOM: 0, GAME_H: 0, GROUND_Y: 0,
  PIPE_WIDTH: 0, PIPE_GAP: 0, PIPE_SPACING: 0,
  BIRD_SIZE: 0, BIRD_X: 0,
  BIRD_X_A: 0, BIRD_X_B: 0, ROPE_MAX_LENGTH: 0, ROPE_STIFFNESS: 0, TOUCH_SPLIT_X: 0,
  backBtn: backBtn,
  getT: getT,
  roundRect: roundRect,
  drawText: drawText,
  drawTextLeft: drawTextLeft,
  hexToRgba: hexToRgba,
  getTodayStr: getTodayStr,
  seededRandom: seededRandom
};
