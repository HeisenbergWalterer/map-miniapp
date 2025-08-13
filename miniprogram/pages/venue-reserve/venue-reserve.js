Page({
  data: {
    venue: null,
    dates: [],
    selectedDate: '',
    selectedTimeSlots: [], // 当前日期选中的时段
    selectedTimeSlotsMap: {}, // 每个日期选中的时段映射
    totalSelectedSlots: 0, // 所有日期选中时段的总数
    timeSlots: [
      { period: '9:00-11:00', slots: ['9:00', '9:30', '10:00', '10:30'] },
      { period: '13:00-16:00', slots: ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30'] },
      { period: '17:00-19:30', slots: ['17:00', '17:30', '18:00', '18:30', '19:00'] }
    ],
    // 硬编码的可用性矩阵（全1表示都可选）
    availabilityMatrix: {},
    isLoggedIn: false,
    submitting: false
  },

  onLoad: function(options) {
    this.initDates();
    this.initAvailabilityMatrix();
    this.checkLoginStatus();
    
    // 模拟场馆数据
    this.setData({
      venue: {
        name: options.venueName || '温暖驿站',
        location: options.location || '示例地点'
      }
    });
  },

  // 初始化日期数据（今天往后7天）
  initDates() {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = this.formatDate(date);
      dates.push({
        date: dateStr,
        display: i === 0 ? '今天' : this.getWeekDay(date.getDay()),
        fullDate: date
      });
    }
    
    this.setData({
      dates: dates,
      selectedDate: dates[0].date
    });
  },

  // 初始化可用性矩阵（硬编码为全1）
  initAvailabilityMatrix() {
    const matrix = {};
    this.data.dates.forEach(dateItem => {
      matrix[dateItem.date] = {};
      this.data.timeSlots.forEach(period => {
        period.slots.forEach(slot => {
          matrix[dateItem.date][slot] = 1; // 1表示可选
        });
      });
    });
    this.setData({
      availabilityMatrix: matrix
    });
  },

  // 格式化日期
  formatDate(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}/${day}`;
  },

  // 获取星期
  getWeekDay(day) {
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekDays[day];
  },

  // 选择日期
  selectDate(e) {
    const date = e.currentTarget.dataset.date;
    const { selectedTimeSlotsMap } = this.data;
    
    // 获取该日期已选中的时段，如果没有则为空数组
    const selectedTimeSlots = selectedTimeSlotsMap[date] || [];
    
    this.setData({
      selectedDate: date,
      selectedTimeSlots: selectedTimeSlots
    });
  },

  // 选择时段
  selectTimeSlot(e) {
    const slot = e.currentTarget.dataset.slot;
    const { selectedDate, availabilityMatrix, selectedTimeSlots, selectedTimeSlotsMap } = this.data;
    
    // 检查该时段是否可选
    if (availabilityMatrix[selectedDate][slot] !== 1) {
      return;
    }
    
    const index = selectedTimeSlots.indexOf(slot);
    let newSelectedSlots = [...selectedTimeSlots];
    let newSelectedTimeSlotsMap = { ...selectedTimeSlotsMap };
    
    if (index > -1) {
      // 取消选择
      newSelectedSlots.splice(index, 1);
    } else {
      // 选择
      newSelectedSlots.push(slot);
    }
    
    // 更新该日期的选中时段映射
    newSelectedTimeSlotsMap[selectedDate] = newSelectedSlots;
    
    // 计算所有日期的选中时段总数
    const totalSelectedSlots = Object.values(newSelectedTimeSlotsMap).reduce((total, slots) => {
      return total + (slots ? slots.length : 0);
    }, 0);
    
    this.setData({
      selectedTimeSlots: newSelectedSlots,
      selectedTimeSlotsMap: newSelectedTimeSlotsMap,
      totalSelectedSlots: totalSelectedSlots
    });
  },

  // 检查登录状态
  checkLoginStatus() {
    // 这里应该检查实际的登录状态
    // 暂时模拟为已登录
    this.setData({
      isLoggedIn: true
    });
  },

  // 立即预约
  reserve() {
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    const { selectedTimeSlotsMap } = this.data;
    
    // 计算所有日期的选中时段总数
    const totalSelectedSlots = Object.values(selectedTimeSlotsMap).reduce((total, slots) => {
      return total + (slots ? slots.length : 0);
    }, 0);
    
    if (totalSelectedSlots === 0) {
      wx.showToast({
        title: '请选择预约时段',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ submitting: true });
    
    // 构建预约详情
    const reservationDetails = [];
    Object.keys(selectedTimeSlotsMap).forEach(date => {
      const slots = selectedTimeSlotsMap[date];
      if (slots && slots.length > 0) {
        reservationDetails.push(`${date}: ${slots.join(', ')}`);
      }
    });
    
    // 模拟预约请求
    setTimeout(() => {
      wx.showModal({
        title: '预约成功',
        content: `您已成功预约以下时段：\n${reservationDetails.join('\n')}`,
        showCancel: false,
        confirmText: '确定',
        success: () => {
          this.setData({ submitting: false });
          // 可以跳转到预约确认页面或返回
          setTimeout(() => {
            wx.navigateBack();
          }, 500);
        }
      });
    }, 1000);
  },

  // 去登录
  goToLogin() {
    wx.navigateTo({
      url: '/pages/profile/profile'
    });
  }
});
