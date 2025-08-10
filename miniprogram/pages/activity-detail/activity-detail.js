// pages/activity-detail/activity-detail.js
Page({
  data: {
    activity: null,
    selectedDate: '',
    selectedTimeSlot: ''
  },

  onLoad(options) {
    if (options && options.data) {
      try {
        const activity = JSON.parse(decodeURIComponent(options.data));
        this.setData({
          activity,
          selectedDate: (activity.dates && activity.dates[0]) || '',
          selectedTimeSlot: (activity.timeSlots && activity.timeSlots[0]) || ''
        });
      } catch (e) {
        console.error('解析活动数据失败', e);
      }
    }
  },

  selectDate(e) {
    const { date } = e.currentTarget.dataset;
    this.setData({ selectedDate: date });
  },

  selectTimeSlot(e) {
    const { slot } = e.currentTarget.dataset;
    this.setData({ selectedTimeSlot: slot });
  },

  reserve() {
    const { activity, selectedDate, selectedTimeSlot } = this.data;
    if (!activity) return;
    const finalDate = (activity.dates && activity.dates.length === 1) ? activity.dates[0] : selectedDate;
    if (activity.dates && activity.dates.length && !finalDate) {
      wx.showToast({ title: '请选择日期', icon: 'none' });
      return;
    }
    // 如果有多个时间段，需选择时间段
    const needSlot = activity.timeSlots && activity.timeSlots.length > 0;
    const finalSlot = (activity.timeSlots && activity.timeSlots.length === 1) ? activity.timeSlots[0] : selectedTimeSlot;
    if (needSlot && !finalSlot) {
      wx.showToast({ title: '请选择时间段', icon: 'none' });
      return;
    }
    const tip = `${finalDate ? ' ' + finalDate : ''}${finalSlot ? ' ' + finalSlot : ''}`;
    wx.showToast({ title: `已报名：${activity.title}${tip}`, icon: 'success' });
  }
});


