// announcement-detail.js
Page({
  data: {
    statusBarHeight: 0,
    announcementTitle: '',
    announcementContent: '',
    announcementType: '',
    publishTime: ''
  },

  onLoad(options) {
    // 获取系统信息，设置状态栏高度
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight
    });

    // 获取传递的参数
    const { title, content, type } = options;
    
    this.setData({
      announcementTitle: title ? decodeURIComponent(title) : '公告详情',
      announcementContent: content ? this.processContent(decodeURIComponent(content)) : '暂无内容',
      announcementType: type || 'text',
      publishTime: this.getCurrentTime()
    });
  },

  // 处理内容中的转义字符
  processContent(content) {
    if (!content) return '';
    
    // 处理常见的转义字符
    return content
      .replace(/\\n/g, '\n')        // 将 \\n 转换为 \n
      .replace(/\\t/g, '\t')        // 将 \\t 转换为 \t
      .replace(/\\r/g, '\r')        // 将 \\r 转换为 \r
      .replace(/\\\\/g, '\\');      // 将 \\ 转换为 \
  },

  // 获取当前时间
  getCurrentTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({
      delta: 1
    });
  }
});
