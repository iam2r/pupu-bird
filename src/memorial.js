function saveToAlbum() {
  if (!memorialCanvas) {
    wx.showToast({ title: '生成失败', icon: 'none' });
    return;
  }
  memorialCanvas.toTempFilePath({
    success: function(res) {
      _shareImagePath = res.tempFilePath;
      wx.saveImageToPhotosAlbum({
        filePath: res.tempFilePath,
        success: function() { wx.showToast({ title: '已保存到相册', icon: 'none' }); },
        fail: function(err) {
          console.log('save fail:', JSON.stringify(err));
          if (err.errMsg && err.errMsg.indexOf('auth') >= 0) {
            wx.showModal({
              title: '需要相册权限',
              content: '请在设置中允许相册权限',
              success: function(mr) { if (mr.confirm) wx.openSetting({}); }
            });
          } else {
            wx.showToast({ title: '保存失败', icon: 'none' });
          }
        }
      });
    },
    fail: function() { wx.showToast({ title: '生成图片失败', icon: 'none' }); }
  });
}