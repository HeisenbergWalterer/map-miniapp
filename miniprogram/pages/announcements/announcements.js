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
    
    if (!announcement || !announcement.link) {
      wx.showToast({
        title: '公告链接无效',
        icon: 'error'
      });
      return;
    }
    
    // 根据类型进行不同处理
    if (announcement.type === 'article') {
      this.openArticle(announcement.link);
    } else if (announcement.type === 'pdf') {
      this.openPdf(announcement.link);
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

  // 打开PDF文件
  async openPdf(filePath) {
    try {
      wx.showLoading({
        title: '正在准备文档...',
        mask: true
      });

      const fileId = this.extractFileIdFromPath(filePath);
      
      if (!fileId) {
        wx.hideLoading();
        wx.showToast({
          title: 'PDF文件路径无效',
          icon: 'error'
        });
        return;
      }

      const result = await wx.cloud.getTempFileURL({
        fileList: [fileId]
      });

      if (result.fileList && result.fileList[0] && result.fileList[0].tempFileURL) {
        const tempUrl = result.fileList[0].tempFileURL;
        wx.hideLoading();
        
        // 直接下载PDF文件，因为网络文件无法直接用openDocument打开
        this.downloadPdf(tempUrl);
      } else {
        wx.hideLoading();
        wx.showToast({
          title: '获取PDF文件失败',
          icon: 'error'
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('处理PDF文件出错:', error);
      wx.showToast({
        title: '处理PDF文件出错',
        icon: 'error'
      });
    }
  },

  // 从云存储路径中提取文件ID
  extractFileIdFromPath(filePath) {
    if (filePath && filePath.includes('cloud://')) {
      const cloudPrefix = 'cloud://';
      const startIndex = filePath.indexOf(cloudPrefix) + cloudPrefix.length;
      const endIndex = filePath.indexOf('/', startIndex);
      
      if (endIndex !== -1) {
        const envId = filePath.substring(startIndex, endIndex);
        const filePathPart = filePath.substring(endIndex + 1);
        return `${envId}/${filePathPart}`;
      }
    }
    return filePath;
  },

  // 下载PDF文件
  downloadPdf(url) {
    wx.showLoading({
      title: '正在下载文档...',
      mask: true
    });

    wx.downloadFile({
      url: url,
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          // 下载成功，尝试打开文件
          wx.openDocument({
            filePath: res.tempFilePath,
            success: (openRes) => {
              console.log('打开下载的PDF成功:', openRes);
              wx.showToast({
                title: '文档已打开',
                icon: 'success'
              });
            },
            fail: (openErr) => {
              console.error('打开下载的PDF失败:', openErr);
              wx.showModal({
                title: '提示',
                content: '文档下载成功，但无法直接打开。请检查文件格式是否正确。',
                showCancel: false,
                confirmText: '确定'
              });
            }
          });
        } else {
          wx.showModal({
            title: '下载失败',
            content: `文档下载失败，状态码: ${res.statusCode}。请检查网络连接或稍后重试。`,
            showCancel: false,
            confirmText: '确定'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('下载PDF失败:', err);
        wx.showModal({
          title: '下载失败',
          content: '文档下载失败，请检查网络连接或稍后重试。',
          showCancel: false,
          confirmText: '确定'
        });
      }
    });
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
  }
});
