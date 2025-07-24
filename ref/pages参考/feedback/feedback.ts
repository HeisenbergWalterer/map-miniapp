// feedback.ts
Page({
  data: {
    feedbackType: 'point', // 'point' | 'suggestion'
    selectedPoint: '',
    feedbackContent: ''
  },

  onLoad() {
    // 页面加载时的初始化
  },

  onShow() {
    // 从地点选择页面返回时，获取选中的地点
    const selectedPoint = wx.getStorageSync('selectedPoint');
    if (selectedPoint) {
      this.setData({
        selectedPoint: selectedPoint
      });
      // 清除临时存储
      wx.removeStorageSync('selectedPoint');
    }
  },

  // 选择反馈类型
  selectFeedbackType(e: any) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      feedbackType: type,
      selectedPoint: type === 'suggestion' ? '' : this.data.selectedPoint
    });
  },

  // 前往地点选择页面
  goToPointSelect() {
    wx.navigateTo({
      url: '/pages/point-select/point-select'
    });
  },

  // 反馈内容输入
  onContentInput(e: any) {
    this.setData({
      feedbackContent: e.detail.value
    });
  },

  // 提交反馈
  submitFeedback() {
    const { feedbackType, selectedPoint, feedbackContent } = this.data;

    // 验证输入
    if (!feedbackContent.trim()) {
      wx.showToast({
        title: '请输入反馈内容',
        icon: 'none'
      });
      return;
    }

    if (feedbackType === 'point' && !selectedPoint) {
      wx.showToast({
        title: '请选择反馈地点',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '提交中...'
    });

    // 模拟提交过程
    setTimeout(() => {
      wx.hideLoading();
      
      // 构造反馈数据
      const feedbackData = {
        type: feedbackType,
        point: feedbackType === 'point' ? selectedPoint : '',
        content: feedbackContent,
        timestamp: Date.now()
      };

      // 这里可以调用API提交到服务器
      console.log('提交的反馈数据:', feedbackData);

      wx.showToast({
        title: '提交成功',
        icon: 'success',
        success: () => {
          setTimeout(() => {
            // 清空表单
            this.setData({
              feedbackType: 'point',
              selectedPoint: '',
              feedbackContent: ''
            });
            
            // 返回上一页
            wx.navigateBack();
          }, 1500);
        }
      });
    }, 1000);
  }
}) 