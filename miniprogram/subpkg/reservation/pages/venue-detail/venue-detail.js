// pages/venue-detail/venue-detail.js
Page({
  data: {
    venue: null,
    dateOptions: [],       // 可选日期（未来7天）
    selectedDate: '',      // 选择的日期（YYYY-MM-DD）
    timeSlots: [],         // 可选时间段
    selectedTimeSlot: ''   // 选择的时间段
  },

  onLoad(options) {
    if (options && options.data) {
      try {
        const venue = JSON.parse(decodeURIComponent(options.data));
        this.setData({ venue });
        // 初始化日期与时段
        this.initDateOptions();
        this.initTimeSlots(venue && venue.time);
      } catch (e) {
        console.error('解析场馆数据失败', e);
      }
    }
  },

  // 生成未来7天日期
  initDateOptions() {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
      const yyyy = d.getFullYear();
      const mm = (d.getMonth() + 1).toString().padStart(2, '0');
      const dd = d.getDate().toString().padStart(2, '0');
      const value = `${yyyy}-${mm}-${dd}`;
      const label = `${mm}-${dd}` + (i === 0 ? ' 今天' : '');
      options.push({ value, label });
    }
    this.setData({ dateOptions: options, selectedDate: options[0].value });
  },

  // 从文案解析时段，或使用默认时段
  initTimeSlots(raw) {
    let slots = [];
    if (typeof raw === 'string' && raw.length > 0) {
      // 提取类似 9:00-10:00、10:00-11:00
      const matched = raw.match(/\d{1,2}:\d{2}-\d{1,2}:\d{2}/g);
      if (matched && matched.length) {
        slots = matched;
      }
    }
    if (slots.length === 0) {
      slots = ['09:00-10:00', '10:00-11:00', '13:00-14:00', '14:00-15:00'];
    }
    this.setData({ timeSlots: slots, selectedTimeSlot: '' });
  },

  // 日期选择（picker）
  selectDate(e) {
    const { value } = e.currentTarget.dataset;
    this.setData({ selectedDate: value });
  },

  // 选择时间段
  selectTimeSlot(e) {
    const { slot } = e.currentTarget.dataset;
    this.setData({ selectedTimeSlot: slot });
  },

  reserve() {
    const { venue, selectedDate, selectedTimeSlot } = this.data;
    if (!venue) return;
    if (!selectedDate || !selectedTimeSlot) {
      wx.showToast({ title: '请选择日期与时段', icon: 'none' });
      return;
    }
    wx.showToast({
      title: `已预约：${selectedDate} ${selectedTimeSlot}`,
      icon: 'success'
    });
  }
});


