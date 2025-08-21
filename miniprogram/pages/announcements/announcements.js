// announcements.js
Page({
  data: {
    announcements: [], // 所有公告数据
    page: 1, // 当前页码
    pageSize: 20, // 每页数量
    hasMore: true, // 是否还有更多数据
    loading: false, // 是否正在加载
    showBackToTop: false, // 是否显示返回顶部按钮
    statusBarHeight: 0, // 状态栏高度
  },

  onLoad() {
    // 获取系统信息，设置状态栏高度
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight
    });
    
    // 获取公告数据
    this.getAnnouncements();
  },

  onShow() {
    // 页面显示时刷新数据
    this.refreshData();
  },

  // 获取公告数据
  async getAnnouncements(refresh = false) {
    if (this.data.loading) return;
    
    try {
      this.setData({ loading: true });
      
      const page = refresh ? 1 : this.data.page;
      const result = await wx.cloud.callFunction({
        name: 'getAnnouncements',
        data: {
          status: 'active',
          limit: this.data.pageSize * page
        }
      });
      
      if (result.result.success) {
        const newAnnouncements = result.result.data;
        
        // 格式化日期
        const formattedAnnouncements = newAnnouncements.map(item => ({
          ...item,
          created_at: this.formatDate(item.created_at)
        }));
        
        if (refresh) {
          // 刷新数据
          this.setData({
            announcements: formattedAnnouncements,
            page: 1,
            hasMore: newAnnouncements.length >= this.data.pageSize
          });
        } else {
          // 加载更多
          this.setData({
            announcements: formattedAnnouncements,
            page: page + 1,
            hasMore: newAnnouncements.length >= this.data.pageSize
          });
        }
      } else {
        wx.showToast({
          title: '获取数据失败',
          icon: 'error'
        });
      }
    } catch (error) {
      console.error('获取公告数据失败:', error);
      wx.showToast({
        title: '网络错误',
        icon: 'error'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 刷新数据
  refreshData() {
    this.getAnnouncements(true);
  },

  // 加载更多
  loadMore() {
    if (!this.data.hasMore || this.data.loading) return;
    this.getAnnouncements();
  },

  // 处理公告点击
  onAnnouncementTap(e) {
    const announcement = e.currentTarget.dataset.announcement;
    
    // 根据类型进行不同处理
    if (announcement.type === 'article') {
      if (!announcement.link) {
        wx.showToast({
          title: '公告链接无效',
          icon: 'error'
        });
        return;
      }
      this.openArticle(announcement.link);
    } else if (announcement.type === 'text') {
      this.openTextAnnouncement(announcement);
    } else {
      wx.showToast({
        title: '未知的公告类型',
        icon: 'error'
      });
    }
  },

  // 打开公众号文章
  openArticle(link) {
    try {
      wx.openOfficialAccountArticle({
        url: link,
        success: (res) => {
          console.log('打开公众号文章成功:', res);
        },
        fail: (err) => {
          console.error('打开公众号文章失败:', err);
          this.copyLinkToClipboard(link);
        }
      });
    } catch (error) {
      console.error('打开公众号文章出错:', error);
      this.copyLinkToClipboard(link);
    }
  },

  

  // 复制链接到剪贴板
  copyLinkToClipboard(link) {
    wx.setClipboardData({
      data: link,
      success: () => {
        wx.showModal({
          title: '链接已复制',
          content: '由于无法直接打开链接，已将链接复制到剪贴板。请手动打开浏览器访问。',
          showCancel: false,
          confirmText: '知道了'
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制链接失败',
          icon: 'error'
        });
      }
    });
  },

  // 格式化日期
  formatDate(dateString) {
    if (!dateString) return '刚刚';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return '今天';
      } else if (diffDays === 1) {
        return '昨天';
      } else if (diffDays < 7) {
        return `${diffDays}天前`;
      } else {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}-${day}`;
      }
    } catch (error) {
      console.error('日期格式化失败:', error);
      return '刚刚';
    }
  },

  // 返回顶部
  backToTop() {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    });
  },

  // 页面滚动
  onPageScroll(e) {
    const showBackToTop = e.scrollTop > 300;
    if (this.data.showBackToTop !== showBackToTop) {
      this.setData({ showBackToTop });
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshData();
    wx.stopPullDownRefresh();
  },

  // 上拉加载更多
  onReachBottom() {
    this.loadMore();
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({
      delta: 1
    });
  },

  // 打开文本公告详情
  openTextAnnouncement(announcement) {
    wx.navigateTo({
      url: `/pages/announcement-detail/announcement-detail?id=${announcement._id}&title=${encodeURIComponent(announcement.title)}&content=${encodeURIComponent(this.processContent(announcement.content))}&type=${announcement.type}`,
      success: function(res) {
        console.log('跳转到公告详情页面成功');
      },
      fail: function(err) {
        console.error('跳转失败:', err);
      }
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
  }
});
