/**
 * QimenDatePicker - 奇门遁甲专业日期选择组件
 * 支持公历/农历双模式，精确到时辰（小时+分钟）
 * 日历网格视图：显示公历日期 + 农历日期 + 节气
 */
class QimenDatePicker {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.options = {
      mode: 'solar',
      style: 'ink',
      value: null,
      minDate: new Date(1900, 0, 1),
      maxDate: new Date(2100, 11, 31),
      onChange: null,
      onConfirm: null,
      ...options
    };
    this.currentDate = this.options.value || new Date();
    this.viewYear = this.currentDate.getFullYear();
    this.viewMonth = this.currentDate.getMonth();
    const initLunar = this._solarToLunar(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, this.currentDate.getDate());
    this.viewLunarYear = initLunar.year;
    this.viewLunarMonth = initLunar.month;
    this.viewIsLeap = initLunar.isLeap;
    this.currentMode = this.options.mode;
    this._pickerType = null;
    this._pickerPageStart = 1900;
    this._pickerTriggerEl = null;
    this._savedCalendarHTML = null;
    this.currentStyle = this.options.style;
    this.lunarInfo = this._getLunarDate(this.currentDate);
    this.init();
  }

  static LUNAR_INFO = [
    0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
    0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
    0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
    0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
    0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
    0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,
    0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
    0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,
    0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
    0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x05ac0,0x0ab60,0x096d5,0x092e0,
    0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
    0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
    0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
    0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0xd520,0xdd45,
    0xb5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,
    0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0,
  0x092e0,0x0d2e3,0x0c960,0xd557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,
    0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,
    0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,
    0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a4d0,0x0d150,0x0f252,0x0d520
];

  static TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  static DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  static SHENG_XIAO = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
  static LUNAR_MONTHS = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
  static LUNAR_DAYS = ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十',
                       '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
                       '廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];
  static JIE_QI = [
    '小寒','大寒','立春','雨水','惊蛰','春分','清明','谷雨',
    '立夏','小满','芒种','夏至','小暑','大暑','立秋','处暑',
    '白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至'
  ];
  static WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六'];

  _getLunarYearDays(year) {
    let sum = 348;
    for (let i = 0x8000; i > 0x8; i >>= 1) {
      sum += (QimenDatePicker.LUNAR_INFO[year - 1900] & i) ? 1 : 0;
    }
    return sum + this._getLeapMonthDays(year);
  }

  _getLeapMonthDays(year) {
    if (this._getLeapMonth(year)) {
      return (QimenDatePicker.LUNAR_INFO[year - 1900] & 0x10000) ? 30 : 29;
    }
    return 0;
  }

  _getLeapMonth(year) {
    return QimenDatePicker.LUNAR_INFO[year - 1900] & 0xf;
  }

  _getLunarMonthDays(year, month) {
    return (QimenDatePicker.LUNAR_INFO[year - 1900] & (0x10000 >> month)) ? 30 : 29;
  }

  _solarToLunar(year, month, day) {
    const targetDate = new Date(year, month - 1, day);
    // 使用UTC计算偏移量，避免历史时区/夏令时导致的日期偏差
    let offset = (Date.UTC(year, month - 1, day) - Date.UTC(1900, 0, 31)) / 86400000;
    let lunarYear = 1900;
    let yearDays = 0;
    while (lunarYear < 2101 && offset > 0) {
      yearDays = this._getLunarYearDays(lunarYear);
      offset -= yearDays;
      lunarYear++;
    }
    if (offset < 0) { offset += yearDays; lunarYear--; }
    let i = 1;
    let leapMonth = this._getLeapMonth(lunarYear);
    let isLeap = false;
    let temp = 0;
    while (i < 13 && offset > 0) {
      if (leapMonth > 0 && i === leapMonth + 1 && !isLeap) { --i; isLeap = true; temp = this._getLeapMonthDays(lunarYear); }
      else { temp = this._getLunarMonthDays(lunarYear, i); }
      if (isLeap && i === leapMonth + 1) { isLeap = false; }
      offset -= temp;
      i++;
    }
    // 闰月边界修正：当offset恰好为0且位于闰月分界处时，正确判断是月末还是闰月初
    if (offset === 0 && leapMonth > 0 && i === leapMonth + 1) {
      if (isLeap) { isLeap = false; }
      else { isLeap = true; --i; }
    }
    if (offset < 0) { offset += temp; --i; }
    return { year: lunarYear, month: i, day: offset + 1, isLeap: isLeap && i === leapMonth, leapMonth: leapMonth };
  }

  _lunarToSolarApprox(lunarYear, lunarMonth, lunarDay, isLeap = false) {
    // 使用与solarlunar一致的算法：基准日期1900年1月30日（农历正月初一的前一天）
    let offset = 0;
    for (let y = 1900; y < lunarYear; y++) offset += this._getLunarYearDays(y);
    const leapM = this._getLeapMonth(lunarYear);
    let isAdd = false;
    for (let m = 1; m < lunarMonth; m++) {
      const lm = this._getLeapMonth(lunarYear);
      if (!isAdd) {
        if (lm <= m && lm > 0) {
          offset += this._getLeapMonthDays(lunarYear);
          isAdd = true;
        }
      }
      offset += this._getLunarMonthDays(lunarYear, m);
    }
    // 如果目标是闰月，需要额外加上该月正常月份的天数
    if (isLeap) {
      offset += this._getLunarMonthDays(lunarYear, lunarMonth);
    }
    // 基准：1900年1月30日（农历系统起始点）
    const stmap = Date.UTC(1900, 1, 30, 0, 0, 0);
    const approx = new Date((offset + lunarDay - 31) * 86400000 + stmap);

    return approx;
  }

  _getJieQiForDate(date) {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();

    const jieQiMap = [
      [1,6,'小寒'],[1,21,'大寒'],
      [2,4,'立春'],[2,19,'雨水'],
      [3,6,'惊蛰'],[3,21,'春分'],
      [4,5,'清明'],[4,20,'谷雨'],
      [5,6,'立夏'],[5,22,'小满'],
      [6,6,'芒种'],[6,22,'夏至'],
      [7,8,'小暑'],[7,23,'大暑'],
      [8,8,'立秋'],[8,24,'处暑'],
      [9,8,'白露'],[9,23,'秋分'],
      [10,9,'寒露'],[10,24,'霜降'],
      [11,8,'立冬'],[11,23,'小雪'],
      [12,8,'大雪'],[12,22,'冬至']
    ];

    for (const [jm, jd, name] of jieQiMap) {
      if (m === jm && d === jd) return name;
      if (m === jm && Math.abs(d - jd) <= 1 && this._isJieQiDay(y, m, d, name)) return name;
    }
    return null;
  }

  _isJieQiDay(y, m, d, name) {
    const offset = ((y - 2000) * 0.24) | 0;
    const idx = QimenDatePicker.JIE_QI.indexOf(name);
    if (idx < 0) return false;

    const baseDates = [6,21,4,19,6,21,5,20,6,22,6,22,8,23,8,24,8,23,9,24,8,23,8,22];
    const baseDay = baseDates[idx];
    const adjustedDay = baseDay + (idx % 2 === 0 ? offset : offset + 1);

    return d === adjustedDay || d === baseDay;
  }

  _getFestival(solarY, solarM, solarD, lunarM, lunarD, lunarYear) {
    const solarFestivals = { '1-1': '元旦', '2-14': '情人节', '3-8': '妇女节', '5-1': '劳动节',
      '6-1': '儿童节', '10-1': '国庆节', '12-25': '圣诞节' };

    const lunarFestivals = { '1-1': '春节', '1-15': '元宵', '5-5': '端午', '7-7': '七夕',
      '7-15': '中元', '8-15': '中秋', '9-9': '重阳', '12-30': '除夕' };

    const sKey = `${solarM}-${solarD}`;
    const lKey = `${lunarM}-${lunarD}`;

    if (solarFestivals[sKey]) return solarFestivals[sKey];
    if (lunarFestivals[lKey]) return lunarFestivals[lKey];

    if (lunarM === 12 && lunarYear !== undefined) {
      const daysInMonth = this._getLunarMonthDays(lunarYear, 12);
      if (lunarD === daysInMonth) return '除夕';
    }

    return null;
  }

  _getYearGanZhi(year) {
    const ganIndex = (year - 4) % 10;
    const zhiIndex = (year - 4) % 12;
    const gan = QimenDatePicker.TIAN_GAN[(ganIndex + 10) % 10];
    const zhi = QimenDatePicker.DI_ZHI[(zhiIndex + 12) % 12];
    return { gan, zhi, full: gan + zhi };
  }

  _getMonthGanZhi(year, month) {
    const yearGan = (year - 4) % 10;
    const ganIndex = (yearGan * 2 + month) % 10;
    const zhiIndex = (month + 1) % 12;
    const gan = QimenDatePicker.TIAN_GAN[ganIndex];
    const zhi = QimenDatePicker.DI_ZHI[zhiIndex];
    return { gan, zhi, full: gan + zhi };
  }

  _getDayGanZhi(date) {
    const diff = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(1900, 0, 1)) / 86400000);
    const gan = QimenDatePicker.TIAN_GAN[(diff + 10) % 10];
    const zhi = QimenDatePicker.DI_ZHI[(diff + 1) % 12];
    return { gan, zhi, full: gan + zhi };
  }

  _getHourGanZhi(date, hour) {
    const dayGan = this._getDayGanZhi(date).gan;
    const dayGanIndex = QimenDatePicker.TIAN_GAN.indexOf(dayGan);
    const zhiIndex = Math.floor((hour + 1) / 2) % 12;
    const hourGanMap = {
      '甲':['甲','乙','丙','丁','戊','己','庚','辛','壬','癸','甲','乙'],
      '己':['甲','乙','丙','丁','戊','己','庚','辛','壬','癸','甲','乙'],
      '乙':['丙','丁','戊','己','庚','辛','壬','癸','甲','乙','丙','丁'],
      '庚':['丙','丁','戊','己','庚','辛','壬','癸','甲','乙','丙','丁'],
      '丙':['戊','己','庚','辛','壬','癸','甲','乙','丙','丁','戊','己'],
      '辛':['戊','己','庚','辛','壬','癸','甲','乙','丙','丁','戊','己'],
      '丁':['庚','辛','壬','癸','甲','乙','丙','丁','戊','己','庚','辛'],
      '壬':['庚','辛','壬','癸','甲','乙','丙','丁','戊','己','庚','辛'],
      '戊':['壬','癸','甲','乙','丙','丁','戊','己','庚','辛','壬','癸'],
      '癸':['壬','癸','甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
    };
    const ganList = hourGanMap[dayGan] || hourGanMap['甲'];
    const gan = ganList[zhiIndex];
    const zhi = QimenDatePicker.DI_ZHI[zhiIndex];
    return { gan, zhi, full: gan + zhi };
  }

  _getLunarDate(date) {
    const year = date.getFullYear(), month = date.getMonth() + 1, day = date.getDate();
    const hour = date.getHours(), minute = date.getMinutes();
    const lunar = this._solarToLunar(year, month, day);

    return {
      solar: { year, month, day, hour, minute },
      lunar: {
        year: lunar.year, month: lunar.month, day: lunar.day,
        isLeap: lunar.isLeap, leapMonth: lunar.leapMonth,
        display: `${this._getYearGanZhi(lunar.year).full}年${lunar.isLeap ? '闰' : ''}${QimenDatePicker.LUNAR_MONTHS[lunar.month - 1]}月${QimenDatePicker.LUNAR_DAYS[lunar.day - 1]}`
      },
      ganZhi: {
        year: this._getYearGanZhi(year),
        month: this._getMonthGanZhi(year, month),
        day: this._getDayGanZhi(date),
        hour: this._getHourGanZhi(date, hour)
      },
      shengXiao: QimenDatePicker.SHENG_XIAO[(lunar.year - 4) % 12]
    };
  }

  init() {
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="qimen-datepicker">
        <div class="qdp-header">
          <div class="qdp-tabs">
            <button class="qdp-tab ${this.currentMode === 'solar' ? 'active' : ''}" data-mode="solar">公历</button>
            <button class="qdp-tab ${this.currentMode === 'lunar' ? 'active' : ''}" data-mode="lunar">农历</button>
          </div>
        </div>

        <div class="qdp-calendar">
          ${this._renderCalendarGrid()}
        </div>

        <div class="qdp-time-section">
          ${this._renderTimePicker()}
        </div>

        <div class="qdp-footer">
          <button class="qdp-btn qdp-btn-today">今天</button>
          <button class="qdp-btn qdp-btn-confirm">确认</button>
        </div>
      </div>
      ${this._renderStyles()}
    `;
    this.updateInfoPanel();
    this.bindEvents();
  }

  _renderCalendarGrid() {
    if (this.currentMode === 'solar') {
      return this._renderSolarGrid();
    } else {
      return this._renderLunarGrid();
    }
  }

  _renderSolarGrid() {
    const y = this.viewYear;
    const m = this.viewMonth;

    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const daysInPrevMonth = new Date(y, m, 0).getDate();

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === y && today.getMonth() === m;

    const selY = this.currentDate.getFullYear();
    const selM = this.currentDate.getMonth();
    const selD = this.currentDate.getDate();

    const cells = [];

    const startOffset = firstDay;
    for (let i = startOffset - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const prevM = m === 0 ? 11 : m - 1;
      const prevY = m === 0 ? y - 1 : y;
      cells.push(this._buildSolarCell(prevY, prevM, day, true));
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const isSelected = y === selY && m === selM && d === selD;
      const isToday = isCurrentMonth && d === today.getDate();
      cells.push(this._buildSolarCell(y, m, d, false, isSelected, isToday));
    }

    const totalCells = 42;
    const nextCount = totalCells - cells.length;
    const nextM = m === 11 ? 0 : m + 1;
    const nextY = m === 11 ? y + 1 : y;
    for (let d = 1; d <= nextCount; d++) {
      cells.push(this._buildSolarCell(nextY, nextM, d, true));
    }

    return `
      <div class="qdp-month-nav">
        <button class="qdp-nav-btn qdp-nav-prev" data-action="prev-year" title="上一年">«</button>
        <button class="qdp-nav-btn qdp-nav-prev-month" data-action="prev-month" title="上一月">‹</button>
        <div class="qdp-picker-wrap">
          <span class="qdp-pickable" data-picker="year">${y}年</span>
          <span class="qdp-pickable" data-picker="month">${m + 1}月</span>
        </div>
        <button class="qdp-nav-btn qdp-nav-next-month" data-action="next-month" title="下一月">›</button>
        <button class="qdp-nav-btn qdp-nav-next" data-action="next-year" title="下一年">»</button>
      </div>
      <div class="qdp-weekdays">
        ${QimenDatePicker.WEEK_DAYS.map(d => `<span class="qdp-weekday">${d}</span>`).join('')}
      </div>
      <div class="qdp-grid">
        ${cells.map(c => c.html).join('')}
      </div>
    `;
  }

  _renderLunarGrid() {
    const ly = this.viewLunarYear;
    const lm = this.viewLunarMonth;
    const isLeapView = this.viewIsLeap;

    const leapMonth = this._getLeapMonth(ly);
    let daysInLunarMonth;
    if (isLeapView && lm === leapMonth) {
      daysInLunarMonth = this._getLeapMonthDays(ly);
    } else {
      daysInLunarMonth = this._getLunarMonthDays(ly, lm);
    }

    const firstSolarDate = this._lunarToSolarApprox(ly, lm, 1, isLeapView);
    const firstDayOfWeek = firstSolarDate.getDay();

    const today = new Date();
    const selSolar = this.currentDate;

    const cells = [];
    const startOffset = firstDayOfWeek;

    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(firstSolarDate);
      d.setDate(d.getDate() - (i + 1));
      const l = this._solarToLunar(d.getFullYear(), d.getMonth() + 1, d.getDate());
      cells.push(this._buildLunarCell(d.getFullYear(), d.getMonth(), d.getDate(), l, true));
    }

    for (let ld = 1; ld <= daysInLunarMonth; ld++) {
      const solarDate = this._lunarToSolarApprox(ly, lm, ld, isLeapView);
      const sd = solarDate.getDate();
      const sm = solarDate.getMonth();
      const sy = solarDate.getFullYear();

      const isSelected = selSolar.getFullYear() === sy && selSolar.getMonth() === sm && selSolar.getDate() === sd;
      const isToday = today.getFullYear() === sy && today.getMonth() === sm && today.getDate() === sd;

      cells.push(this._buildLunarCell(sy, sm, sd, { year: ly, month: lm, day: ld, isLeap: isLeapView }, false, isSelected, isToday));
    }

    const totalCells = 42;
    const nextCount = totalCells - cells.length;
    if (nextCount > 0) {
      const lastDaySolar = this._lunarToSolarApprox(ly, lm, daysInLunarMonth, isLeapView);
      for (let i = 1; i <= nextCount; i++) {
        const d = new Date(lastDaySolar);
        d.setDate(d.getDate() + i);
        const l = this._solarToLunar(d.getFullYear(), d.getMonth() + 1, d.getDate());
        cells.push(this._buildLunarCell(d.getFullYear(), d.getMonth(), d.getDate(), l, true));
      }
    }

    const gzYear = this._getYearGanZhi(ly);
    const leapStr = isLeapView ? '闰' : '';
    const monthName = leapStr + QimenDatePicker.LUNAR_MONTHS[lm - 1] + '月';

    return `
      <div class="qdp-month-nav">
        <button class="qdp-nav-btn qdp-nav-prev" data-action="prev-year" title="上一年">«</button>
        <button class="qdp-nav-btn qdp-nav-prev-month" data-action="prev-month" title="上一月">‹</button>
        <div class="qdp-picker-wrap">
          <span class="qdp-pickable" data-picker="year">${gzYear.full}年</span>
          <span class="qdp-pickable" data-picker="month" data-leap="${isLeapView}">${monthName}</span>
        </div>
        <button class="qdp-nav-btn qdp-nav-next-month" data-action="next-month" title="下一月">›</button>
        <button class="qdp-nav-btn qdp-nav-next" data-action="next-year" title="下一年">»</button>
      </div>
      <div class="qdp-weekdays">
        ${QimenDatePicker.WEEK_DAYS.map(d => `<span class="qdp-weekday">${d}</span>`).join('')}
      </div>
      <div class="qdp-grid">
        ${cells.map(c => c.html).join('')}
      </div>
    `;
  }

  _buildSolarCell(year, month, day, isOtherMonth, isSelected = false, isToday = false) {
    const date = new Date(year, month, day);
    const lunar = this._solarToLunar(year, month + 1, day);
    const jieqi = this._getJieQiForDate(date);
    const festival = this._getFestival(year, month + 1, day, lunar.month, lunar.day, lunar.year);

    let subText = '';
    if (jieqi) {
      subText = `<span class="qdp-cell-jieqi">${jieqi}</span>`;
    } else if (festival) {
      subText = `<span class="qdp-cell-festival">${festival}</span>`;
    } else {
      subText = QimenDatePicker.LUNAR_DAYS[lunar.day - 1];
    }

    const classes = ['qdp-cell'];
    if (isOtherMonth) classes.push('qdp-other-month');
    if (isSelected) classes.push('qdp-selected');
    if (isToday) classes.push('qdp-today');

    return {
      html: `
        <div class="${classes.join(' ')}" data-date="${year}-${month + 1}-${day}" data-other="${isOtherMonth}">
          <span class="qdp-solar-day">${day}</span>
          <span class="qdp-lunar-day">${subText}</span>
        </div>`,
      year, month, day, isOtherMonth
    };
  }

  _buildLunarCell(solarY, solarM, solarD, lunarInfo, isOtherMonth, isSelected = false, isToday = false) {
    const date = new Date(solarY, solarM, solarD);
    const jieqi = this._getJieQiForDate(date);
    const festival = this._getFestival(solarY, solarM + 1, solarD, lunarInfo.month, lunarInfo.day, lunarInfo.year);

    let subText = '';
    if (jieqi) {
      subText = `<span class="qdp-cell-jieqi">${jieqi}</span>`;
    } else if (festival) {
      subText = `<span class="qdp-cell-festival">${festival}</span>`;
    } else {
      subText = `${solarM + 1}/${solarD}`;
    }

    const classes = ['qdp-cell'];
    if (isOtherMonth) classes.push('qdp-other-month');
    if (isSelected) classes.push('qdp-selected');
    if (isToday) classes.push('qdp-today');

    const mainText = QimenDatePicker.LUNAR_DAYS[lunarInfo.day - 1];

    return {
      html: `
        <div class="${classes.join(' ')}" data-date="${solarY}-${solarM + 1}-${solarD}" data-lunar="${lunarInfo.year}-${lunarInfo.month}-${lunarInfo.day}" data-leap="${lunarInfo.isLeap || false}" data-other="${isOtherMonth}">
          <span class="qdp-solar-day">${mainText}</span>
          <span class="qdp-lunar-day">${subText}</span>
        </div>`,
      year: solarY, month: solarM, day: solarD, isOtherMonth
    };
  }

  _renderTimePicker() {
    const h = String(this.currentDate.getHours()).padStart(2, '0');
    const mi = String(this.currentDate.getMinutes()).padStart(2, '0');

    return `
      <div class="qdp-time-row">
        <div class="qdp-time-display" id="qdpTimeDisplay" title="点击选择时间">
          <svg style="margin-right:4px;" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span class="qdp-time-h" id="qdpTimeH">${h}</span>
          <span class="qdp-time-sep">:</span>
          <span class="qdp-time-m" id="qdpTimeM">${mi}</span>
          <span class="qdp-festival-countdown" id="qdpFestivalCountdown"></span>
        </div>
        <div class="qdp-time-selects" id="qdpTimeSelects" style="display:none;">
          <select class="qdp-select qdp-hour" id="qdpHour"></select>
          <span class="qdp-time-sep">:</span>
          <select class="qdp-select qdp-minute" id="qdpMinute"></select>
        </div>
      </div>
    `;
  }

  _generateHourOptions(selected) {
    let html = '';
    for (let h = 0; h < 24; h++) {
      const zhiIdx = Math.floor((h + 1) / 2) % 12;
      const zhiName = QimenDatePicker.DI_ZHI[zhiIdx];
      html += `<option value="${h}" ${h === selected ? 'selected' : ''}>${String(h).padStart(2, '0')}时 (${zhiName})</option>`;
    }
    return html;
  }

  _generateMinuteOptions(selected) {
    let html = '';
    for (let m = 0; m < 60; m++) {
      html += `<option value="${m}" ${m === selected ? 'selected' : ''}>${String(m).padStart(2, '0')}分</option>`;
    }
    return html;
  }

  static STYLE_PRESETS = {
    ink: {
      name: '水墨丹青',
      bg: '#fafafa',
      headerBg: '#f5f5f5',
      footerBg: '#f5f5f5',
      text: '#2c2c2c',
      textLight: '#1a1a1a',
      textMuted: '#666',
      textFaded: '#999',
      border: '#e0e0e0',
      primary: '#2c2c2c',
      primaryHover: '#444',
      cellHover: '#eee',
      selectedBg: '#2c2c2c',
      jieqi: '#1e90ff',
      festival: '#cd5c5c',
      inputBg: '#fff',
      inputBorder: '#ddd',
      todayBorder: '#2c2c2c',
      navHover: '#ddd',
      btnTodayBg: '#f0f0f0',
      btnTodayHover: '#e0e0e0',
      btnConfirm: '#2c2c2c',
      btnConfirmShadow: 'rgba(44,44,44,0.3)',
      accent: '#c9a227'
    }
  };

  _renderStyles() {
    const s = QimenDatePicker.STYLE_PRESETS[this.currentStyle] || QimenDatePicker.STYLE_PRESETS.ink;
    
    return `<style>
      .qimen-datepicker {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        font-size: 12px;
        color: ${s.text};
        background: ${s.bg};
        border-radius: 8px;
        box-shadow: 0 3px 16px rgba(0,0,0,0.2);
        width: 290px;
        overflow: hidden;
        user-select: none;
      }

      .qdp-header {
        background: ${s.headerBg};
        padding: 8px 12px;
      }

      .qdp-tabs {
        display: flex;
        gap: 5px;
      }

      .qdp-tab {
        flex: 1;
        padding: 7px 10px;
        border: none;
        background: transparent !important;
        color: ${s.textMuted};
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.2s;
      }

      .qdp-tab:hover {
        color: ${s.textLight};
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        background: transparent !important;
      }

      .qdp-tab.active {
        background: ${s.primary} !important;
        color: #fff;
      }

      .qdp-calendar {
        padding: 0 8px;
      }

      .qdp-month-nav {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 3px;
        padding: 10px 0 8px;
        position: relative;
      }

      .qdp-picker-wrap {
        display: flex;
        align-items: baseline;
        gap: 2px;
        min-width: 120px;
        justify-content: center;
      }

      .qdp-pickable {
        font-size: 14px;
        font-weight: 600;
        color: ${s.textLight};
        cursor: pointer;
        padding: 2px 4px;
        border-radius: 4px;
        transition: all 0.15s ease;
      }

      .qdp-pickable:hover {
        background: ${s.navHover};
        color: ${s.primary};
      }

      /* 内嵌选择面板 */
      .qdp-picker-panel {
        display: flex;
        flex-direction: column;
        padding: 0 8px;
        min-height: 310px;
      }

      .qdp-picker-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 10px 0 7px;
        border-bottom: 1px solid ${s.border};
      }

      .qdp-header-no-nav {
        gap: 0;
      }

      .qdp-picker-header-btn {
        width: 26px; height: 26px;
        border: 1px solid #e8e8e8; background: transparent;
        color: ${s.text}; cursor: pointer;
        font-size: 14px; border-radius: 6px; font-weight: bold;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.2s ease; letter-spacing: -1px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.04);
      }
      .qdp-picker-header-btn:hover { background: ${s.navHover}; color: ${s.primary}; border-color: ${s.primary}; transform: scale(1.08); }
      .qdp-picker-header-btn:active { transform: scale(0.9); }

      .qdp-picker-range {
        font-size: 14px;
        font-weight: 600;
        color: ${s.textLight};
        min-width: 110px;
        text-align: center;
      }

      .qdp-picker-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 2px;
        padding: 7px 0 10px;
        flex: 1;
        align-content: start;
      }

      .qdp-picker-grid.month-grid {
        grid-template-columns: repeat(4, 1fr);
      }

      /* 选择器单元格 — 复用日历单元格样式 */
      .qdp-picker-cell {
        padding: 6px 0;
        text-align: center;
        font-size: 12px;
        color: ${s.text};
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.12s ease;
        user-select: none;
      }

      .qdp-picker-cell:hover {
        background: ${s.cellHover};
      }

      .qdp-picker-cell.selected {
        background: ${s.selectedBg};
        color: #fff;
        font-weight: 600;
      }

      .qdp-nav-btn {
        width: 28px;
        height: 28px;
        border: 1px solid #e8e8e8;
        background: transparent;
        color: ${s.text};
        cursor: pointer;
        border-radius: 6px;
        font-size: 14px;
        font-weight: bold;
        letter-spacing: -1px;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.2s ease;
        user-select: none;
        box-shadow: 0 1px 2px rgba(0,0,0,0.04);
      }

      /* 悬停状态 */
      .qdp-nav-btn:hover {
        background: ${s.navHover};
        color: ${s.primary}; border-color: ${s.primary};
        transform: scale(1.08);
      }

      /* 点击状态 */
      .qdp-nav-btn:active {
        background: ${s.cellHover};
        transform: scale(0.92);
      }

      .qdp-weekdays {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        padding: 5px 0 2px;
        border-bottom: 1px solid ${s.border};
      }

      .qdp-weekday {
        text-align: center;
        font-size: 10px;
        color: ${s.textFaded};
        padding: 2px 0;
      }

      .qdp-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 1px;
        padding: 4px 0;
      }

      .qdp-cell {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 40px;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.15s;
        position: relative;
      }

      .qdp-cell:hover {
        background: ${s.cellHover};
      }

      .qdp-cell.qdp-selected {
        background: ${s.selectedBg};
      }

      .qdp-cell.qdp-selected:hover {
        background: ${s.primaryHover};
      }

      .qdp-cell.qdp-today:not(.qdp-selected) {
        border: 1.5px solid ${s.todayBorder};
      }

      .qdp-cell.qdp-other-month {
        opacity: 0.35;
      }

      .qdp-cell.qdp-other-month:hover {
        opacity: 0.6;
      }

      .qdp-solar-day {
        font-size: 13px;
        font-weight: 500;
        color: ${s.textLight};
        line-height: 1.3;
      }

      .qdp-lunar-day {
        font-size: 9px;
        color: ${s.textFaded};
        line-height: 1.2;
        margin-top: 0;
      }

      .qdp-cell.qdp-selected .qdp-solar-day { color: #fff; }
      .qdp-cell.qdp-selected .qdp-lunar-day { color: rgba(255,255,255,0.75); }

      .qdp-cell-jieqi {
        color: ${s.jieqi} !important;
        font-size: 9px;
      }

      .qdp-cell-festival {
        color: ${s.festival} !important;
        font-size: 9px;
      }

      .qdp-cell.qdp-selected .qdp-cell-jieqi,
      .qdp-cell.qdp-selected .qdp-cell-festival {
        color: rgba(255,255,255,0.9) !important;
      }

      .qdp-time-section {
        padding: 8px 12px;
        border-top: 1px solid ${s.border};
      }

      .qdp-time-row {
        display: flex;
        align-items: center;
        gap: 5px;
        justify-content: center;
      }

      .qdp-time-display {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 0;
        font-size: 14px;
        letter-spacing: 2px;
        color: ${s.textMuted};
        cursor: pointer;
        transition: color 0.2s;
        user-select: none;
        white-space: nowrap;
        justify-content: center;
      }

      .qdp-time-display:hover {
        color: ${s.primary};
      }

      .qdp-time-display.manual {
        color: ${s.accent};
      }

      .qdp-time-h, .qdp-time-m {
        font-weight: 600;
      }

      .qdp-time-sep {
        color: ${s.text};
        font-weight: 700;
        font-size: 15px;
        margin: 0 -2px;
      }

      .qdp-festival-countdown {
        margin-left: 6px;
        color: ${s.textMuted};
        white-space: nowrap;
      }

      .qdp-festival-countdown:hover {
        color: ${s.text};
      }

      .qdp-festival-countdown b {
        font-weight: 600;
      }

      .qdp-time-sep {
        color: ${s.textFaded};
        font-weight: 600;
      }

      .qdp-time-selects {
        display: flex;
        align-items: center;
        gap: 5px;
        flex: 1;
        justify-content: center;
      }

      .qdp-select {
        flex: 1;
        padding: 6px 7px;
        border: 1px solid ${s.inputBorder};
        border-radius: 5px;
        font-size: 12px;
        background: ${s.inputBg};
        color: ${s.text};
        cursor: pointer;
        appearance: none;
        -webkit-appearance: none;
        transition: border-color 0.2s;
      }

      .qdp-select:focus {
        outline: none;
        border-color: ${s.primary};
      }

      .qdp-footer {
        display: flex;
        gap: 8px;
        padding: 8px 12px;
        border-top: 1px solid ${s.border};
        background: ${s.footerBg};
      }

      .qdp-btn {
        flex: 1;
        padding: 7px;
        border: none;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .qdp-btn-today {
        background: ${s.btnTodayBg};
        color: ${s.textMuted};
      }

      .qdp-btn-today:hover {
        background: ${s.btnTodayHover};
        color: ${s.textLight};
      }

      .qdp-btn-confirm {
        background: ${s.btnConfirm} !important;
        color: #fff !important;
      }

      .qdp-btn-confirm:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px ${s.btnConfirmShadow};
        background: ${s.btnConfirm} !important;
      }

      @media (max-width: 480px) {
        .qimen-datepicker {
          width: 100%;
          border-radius: 0;
        }
        .qdp-cell { min-height: 36px; }
        .qdp-solar-day { font-size: 13px; }
      }
    </style>`;
  }

  updateInfoPanel() {
    this.lunarInfo = this._getLunarDate(this.currentDate);
    if (this.options.onChange) {
      this.options.onChange(this.getValue());
    }
  }

  bindEvents() {
    this.container.querySelectorAll('.qdp-tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchMode(tab.dataset.mode));
    });

    this.bindCalendarEvents();

    // 时间显示区域点击 → 展开为下拉选择
    const timeDisplay = document.getElementById('qdpTimeDisplay');
    if (timeDisplay) {
      timeDisplay.addEventListener('click', (e) => {
        e.stopPropagation();
        this._expandTimeSelects();
      });
    }

    // 下拉选择变化
    this._bindSelectChange('qdpHour', (v) => { this._onHourChange(+v); this._markManualTime(); });
    this._bindSelectChange('qdpMinute', (v) => { this._onMinuteChange(+v); this._markManualTime(); });

    this.container.querySelector('.qdp-btn-today')?.addEventListener('click', () => this.setToday());
    this.container.querySelector('.qdp-btn-confirm')?.addEventListener('click', () => this.confirm());
  }

  bindCalendarEvents() {
    this.container.querySelectorAll('.qdp-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => this._navigate(btn.dataset.action));
    });

    // 年份/月份快速选择器
    this.container.querySelectorAll('.qdp-pickable').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = el.dataset.picker;
        if (el.classList.contains('active')) { this._closePicker(); return; }
        this._showPicker(el, type);
      });
    });

    this.container.querySelectorAll('.qdp-cell').forEach(cell => {
      cell.addEventListener('click', (e) => {
        const [y, m, d] = cell.dataset.date.split('-').map(Number);
        const isOther = cell.dataset.other === 'true';

        if (this.currentMode === 'lunar' && cell.dataset.lunar) {
          const [ly, lm, ld] = cell.dataset.lunar.split('-').map(Number);
          const isLeap = cell.dataset.leap === 'true';
          this.selectLunarDate(ly, lm, ld, isLeap);
          return;
        }

        if (isOther && this.currentMode === 'solar') {
          if (m < this.viewMonth + 1 || (m === 12 && y < this.viewYear)) {
            this.navigatePrev();
          } else {
            this.navigateNext();
          }
        }

        this.selectDate(y, m - 1, d);
      });
    });
  }

  _bindSelectChange(id, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', (e) => handler(e.target.value));
  }

  _showPicker(el, type) {
    this._closePicker();
    el.classList.add('active');
    this._pickerType = type;
    this._pickerTriggerEl = el;

    const calendar = this.container.querySelector('.qdp-calendar');
    if (!calendar) return;
    this._savedCalendarHTML = calendar.innerHTML;

    const isLunar = this.currentMode === 'lunar';
    const currentY = isLunar ? this.viewLunarYear : this.viewYear;
    const currentM = isLunar ? this.viewLunarMonth : this.viewMonth + 1;

    // 计算起始页
    if (type === 'year') {
      this._pickerPageStart = Math.floor((currentY - 1900) / 15) * 15 + 1900;
    }

    calendar.innerHTML = this._buildPickerPanel(type);
    this._bindPickerEvents();
  }

  _buildPickerPanel(type) {
    const s = QimenDatePicker.STYLE_PRESETS[this.currentStyle];
    const isLunar = this.currentMode === 'lunar';
    const currentY = isLunar ? this.viewLunarYear : this.viewYear;
    const currentM = isLunar ? this.viewLunarMonth : this.viewMonth + 1;

    let headerLabel, gridClass, cellsHTML;

    if (type === 'year') {
      const ps = this._pickerPageStart;
      const pe = ps + 14;
      headerLabel = `${ps}年 - ${pe}年`;
      gridClass = '';

      let cells = '';
      for (let y = ps; y <= pe; y++) {
        const sel = y === currentY ? ' selected' : '';
        cells += `<div class="qdp-picker-cell${sel}" data-val="${y}">${y}年</div>`;
      }
      cellsHTML = cells;
    } else {
      headerLabel = isLunar
        ? this._getYearGanZhi(this.viewLunarYear).full + '年'
        : currentY + '年';
      gridClass = ' month-grid';

      const leapMonth = isLunar ? this._getLeapMonth(this.viewLunarYear) : 0;
      let cells = '';
      for (let m = 1; m <= 12; m++) {
        let label, sel;
        if (isLunar) {
          label = QimenDatePicker.LUNAR_MONTHS[m - 1] + '月';
          sel = m === currentM && !this.viewIsLeap ? ' selected' : '';
          if (m === leapMonth) {
            const leapSel = this.viewIsLeap ? ' selected' : '';
            cells += `<div class="qdp-picker-cell${leapSel}" data-val="${m}" data-leap="1">闰${label}</div>`;
          }
        } else {
          label = m + '月';
          sel = m === currentM ? ' selected' : '';
        }
        cells += `<div class="qdp-picker-cell${sel}" data-val="${m}">${label}</div>`;
      }
      cellsHTML = cells;
    }

    return `
      <div class="qdp-picker-panel">
        <div class="qdp-picker-header${type === 'month' ? ' qdp-header-no-nav' : ''}">
          ${type === 'year' ? '<button class="qdp-picker-header-btn" data-pick-nav="prev">«</button>' : ''}
          <span class="qdp-picker-range">${headerLabel}</span>
          ${type === 'year' ? '<button class="qdp-picker-header-btn" data-pick-nav="next">»</button>' : ''}
        </div>
        <div class="qdp-picker-grid${gridClass}">${cellsHTML}</div>
      </div>`;
  }

  _bindPickerEvents() {
    const panel = this.container.querySelector('.qdp-picker-panel');
    if (!panel) return;

    // 单元格点击
    panel.querySelectorAll('.qdp-picker-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const val = parseInt(cell.dataset.val);
        const isLeap = cell.dataset.leap === '1';
        if (this._pickerType === 'year') { this._pickYear(val); }
        else { this._pickMonth(val, isLeap); }
      });
    });

    // 导航按钮 — 直接更新面板内容，不重新走_showPicker流程
    panel.querySelectorAll('[data-pick-nav]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this._pickerType !== 'year') return;
        const dir = btn.dataset.pickNav;
        if (dir === 'prev') { this._pickerPageStart -= 15; }
        else { this._pickerPageStart += 15; }

        // 边界保护
        if (this._pickerPageStart < 1900) this._pickerPageStart = 1900;
        if (this._pickerPageStart > 2086) this._pickerPageStart = 2086;

        // 直接替换面板内容，保留DOM结构
        const newPanel = document.createElement('div');
        newPanel.innerHTML = this._buildPickerPanel('year');
        panel.outerHTML = newPanel.innerHTML;
        this._bindPickerEvents();

        // 恢复active状态（因为outerHTML重建了DOM）
        if (this._pickerTriggerEl) {
          this._pickerTriggerEl.classList.add('active');
        }
      });
    });
  }

  _closePicker() {
    this.container.querySelectorAll('.qdp-pickable.active').forEach(el => el.classList.remove('active'));
    if (this._savedCalendarHTML) {
      const cal = this.container.querySelector('.qdp-calendar');
      if (cal) { cal.innerHTML = this._savedCalendarHTML; this.bindCalendarEvents(); }
      this._savedCalendarHTML = null;
    }
    this._pickerType = null;
    this._pickerTriggerEl = null;
  }

  _pickYear(year) {
    if (this.currentMode === 'solar') { this.viewYear = year; }
    else { this.viewLunarYear = year; }
    this._closePicker();
    this.refreshCalendar();
  }

  _pickMonth(month, isLeap) {
    if (this.currentMode === 'solar') { this.viewMonth = month - 1; }
    else { this.viewLunarMonth = month; this.viewIsLeap = isLeap; }
    this._closePicker();
    this.refreshCalendar();
  }

  _navigate(action) {
    if (this.currentMode === 'solar') {
      switch (action) {
        case 'prev-year': this.viewYear--; break;
        case 'next-year': this.viewYear++; break;
        case 'prev-month': this.navigatePrev(); return;
        case 'next-month': this.navigateNext(); return;
      }
    } else {
      switch (action) {
        case 'prev-year': this.viewLunarYear--; break;
        case 'next-year': this.viewLunarYear++; break;
        case 'prev-month': this.navigatePrev(); return;
        case 'next-month': this.navigateNext(); return;
      }
    }
    this.refreshCalendar();
  }

  navigatePrev() {
    if (this.currentMode === 'solar') {
      if (this.viewMonth === 0) { this.viewMonth = 11; this.viewYear--; }
      else { this.viewMonth--; }
    } else {
      const leapM = this._getLeapMonth(this.viewLunarYear);
      if (this.viewIsLeap) {
        this.viewIsLeap = false;
      } else {
        const prevHasLeap = (this.viewLunarMonth - 1 === leapM && leapM > 0);
        if (prevHasLeap) {
          this.viewIsLeap = true;
        } else {
          if (this.viewLunarMonth === 1) { this.viewLunarMonth = 12; this.viewLunarYear--; }
          else { this.viewLunarMonth--; }
          const newLeapM = this._getLeapMonth(this.viewLunarYear);
          this.viewIsLeap = (this.viewLunarMonth === newLeapM && newLeapM > 0);
        }
      }
    }
    this.refreshCalendar();
  }

  navigateNext() {
    if (this.currentMode === 'solar') {
      if (this.viewMonth === 11) { this.viewMonth = 0; this.viewYear++; }
      else { this.viewMonth++; }
    } else {
      const leapM = this._getLeapMonth(this.viewLunarYear);
      if (!this.viewIsLeap && this.viewLunarMonth === leapM && leapM > 0) {
        this.viewIsLeap = true;
      } else {
        this.viewIsLeap = false;
        if (this.viewLunarMonth === 12) { this.viewLunarMonth = 1; this.viewLunarYear++; }
        else { this.viewLunarMonth++; }
      }
    }
    this.refreshCalendar();
  }

  refreshCalendar() {
    const calendar = this.container.querySelector('.qdp-calendar');
    if (calendar) {
      calendar.innerHTML = this._renderCalendarGrid();
      this.bindCalendarEvents();
    }
  }

  selectDate(year, month, day) {
    const date = new Date(year, month, day, this.currentDate.getHours(), this.currentDate.getMinutes());
    if (date < this.options.minDate || date > this.options.maxDate) return;
    
    this.currentDate = date;
    this.updateInfoPanel();
    this.refreshCalendar();
  }

  selectLunarDate(lunarYear, lunarMonth, lunarDay, isLeap = false) {
    const solarDate = this._lunarToSolarApprox(lunarYear, lunarMonth, lunarDay, isLeap);
    this.selectDate(solarDate.getFullYear(), solarDate.getMonth(), solarDate.getDate());
  }

  _onHourChange(hour) {
    this.currentDate.setHours(hour);
    this._updateTimeDisplay();
    this.updateInfoPanel();
  }

  _onMinuteChange(minute) {
    this.currentDate.setMinutes(minute);
    this._updateTimeDisplay();
    this.updateInfoPanel();
  }

  // 点击时间显示 → 展开为下拉选择
  _expandTimeSelects() {
    const display = document.getElementById('qdpTimeDisplay');
    const selects = document.getElementById('qdpTimeSelects');
    if (!display || !selects) return;

    display.style.display = 'none';
    selects.style.display = 'flex';

    // 填充当前值
    const hourSelect = document.getElementById('qdpHour');
    const minuteSelect = document.getElementById('qdpMinute');
    if (hourSelect && !hourSelect.options.length) {
      hourSelect.innerHTML = this._generateHourOptions(this.currentDate.getHours());
      minuteSelect.innerHTML = this._generateMinuteOptions(this.currentDate.getMinutes());
    }
    hourSelect.value = this.currentDate.getHours();
    minuteSelect.value = this.currentDate.getMinutes();

    display.classList.add('manual');
    this._markManualTime();
  }

  // 收起下拉，回到实时显示
  _collapseTimeSelects() {
    const display = document.getElementById('qdpTimeDisplay');
    const selects = document.getElementById('qdpTimeSelects');
    if (!display || !selects) return;
    selects.style.display = 'none';
    display.style.display = 'flex';
    this._updateTimeDisplay();
  }

  _markManualTime() {
    this._timeManuallyChanged = true;
    document.getElementById('qdpTimeDisplay')?.classList.add('manual');
  }

  _updateTimeDisplay() {
    const hEl = document.getElementById('qdpTimeH');
    const mEl = document.getElementById('qdpTimeM');
    if (hEl) hEl.textContent = String(this.currentDate.getHours()).padStart(2, '0');
    if (mEl) mEl.textContent = String(this.currentDate.getMinutes()).padStart(2, '0');
    this._updateFestivalCountdown();
  }

  _updateFestivalCountdown() {
    const el = document.getElementById('qdpFestivalCountdown');
    if (!el) return;
    const info = this._getNextFestival();
    if (info) {
      el.innerHTML = ` &nbsp;|&nbsp; 距「${info.name}」还有<b>${info.days}</b>天`;
      el.title = `${info.date} ${info.name}`;
    } else {
      el.textContent = '';
    }
  }

  _getNextFestival() {
    const today = new Date();
    const y = today.getFullYear(), m = today.getMonth() + 1, d = today.getDate();
    const lunar = this._solarToLunar(y, m, d);

    // 收集未来一年的所有节日
    const candidates = [];

    // 公历节日
    const solarFestivals = { '1-1':'元旦','2-14':'情人节','3-8':'妇女节','4-4':'清明节',
      '5-1':'劳动节','6-1':'儿童节','8-1':'建军节','10-1':'国庆节','12-25':'圣诞节' };
    for (const [key, name] of Object.entries(solarFestivals)) {
      const [fm, fd] = key.split('-').map(Number);
      let fy = y;
      if (fm < m || (fm === m && fd < d)) fy++;
      candidates.push({ name, date: new Date(fy, fm - 1, fd), type: 'solar' });
    }

    // 农历节日
    const lunarFestivals = { '1-1':'春节','1-15':'元宵','2-2':'龙抬头','5-5':'端午',
      '7-7':'七夕','7-15':'中元','8-15':'中秋','9-9':'重阳','12-8':'腊八','12-30':'除夕' };
    for (const [key, name] of Object.entries(lunarFestivals)) {
      const [lm, ld] = key.split('-').map(Number);
      let ly = lunar.year;
      if (lm < lunar.month || (lm === lunar.month && ld < lunar.day)) ly++;
      const solarDate = this._lunarToSolarApprox(ly, lm, ld);
      candidates.push({ name, date: solarDate, type: 'lunar' });
    }

    // 找最近的（排除今天已过的）
    candidates.sort((a, b) => a.date - b.date);
    for (const c of candidates) {
      const diffDays = Math.ceil((c.date - today) / 86400000);
      if (diffDays > 0) {
        return { name: c.name, days: diffDays,
          date: `${c.date.getFullYear()}-${String(c.date.getMonth()+1).padStart(2,'0')}-${String(c.date.getDate()).padStart(2,'0')}` };
      }
    }
    return null;
  }

  // 实时同步当前时间（弹窗打开期间每秒更新显示）
  startAutoSync() {
    this._timeManuallyChanged = false;
    document.getElementById('qdpTimeDisplay')?.classList.remove('manual');
    this._collapseTimeSelects();

    // 立即更新一次
    this._syncToNow();

    // 每秒同步
    this._autoSyncTimer = setInterval(() => this._syncToNow(), 1000);
  }

  stopAutoSync() {
    if (this._autoSyncTimer) {
      clearInterval(this._autoSyncTimer);
      this._autoSyncTimer = null;
    }
  }

  _syncToNow() {
    // 用户手动选过时间则不同步
    if (this._timeManuallyChanged) return;

    const now = new Date();
    this.currentDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
    this._updateTimeDisplay();
  }

  switchMode(mode) {
    if (mode === this.currentMode) return;
    this.currentMode = mode;

    // 更新 tab 选中状态
    this.container.querySelectorAll('.qdp-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.mode === mode);
    });

    // 更新视图参数
    if (mode === 'solar') {
      const date = this.currentDate;
      this.viewYear = date.getFullYear();
      this.viewMonth = date.getMonth();
    } else {
      const lunar = this._solarToLunar(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, this.currentDate.getDate());
      this.viewLunarYear = lunar.year;
      this.viewLunarMonth = lunar.month;
      this.viewIsLeap = lunar.isLeap;
    }

    // 只刷新日历网格，不重建整个 DOM（避免时间行闪烁）
    const calendarEl = this.container.querySelector('.qdp-calendar');
    if (calendarEl) {
      calendarEl.innerHTML = this._renderCalendarGrid();
      this.bindCalendarEvents();
      this.updateInfoPanel();
    }
  }

  setToday() {
    const today = new Date();
    this.viewYear = today.getFullYear();
    this.viewMonth = today.getMonth();

    const lunar = this._solarToLunar(today.getFullYear(), today.getMonth() + 1, today.getDate());
    this.viewLunarYear = lunar.year;
    this.viewLunarMonth = lunar.month;
    this.viewIsLeap = lunar.isLeap;
    
    this.selectDate(today.getFullYear(), today.getMonth(), today.getDate());
  }

  confirm() {
    // 如果下拉选择处于展开状态，从 select 读取值
    const selects = document.getElementById('qdpTimeSelects');
    if (selects && selects.style.display !== 'none') {
      const hourSelect = document.getElementById('qdpHour');
      const minuteSelect = document.getElementById('qdpMinute');
      if (hourSelect) this.currentDate.setHours(parseInt(hourSelect.value));
      if (minuteSelect) this.currentDate.setMinutes(parseInt(minuteSelect.value));
    }
    // 实时模式下，currentDate 已由 _syncToNow 保持最新
    if (this.options.onConfirm) {
      this.options.onConfirm(this.getValue());
    }
  }

  getValue() {
    return {
      date: this.currentDate,
      lunar: this.lunarInfo
    };
  }

  setValue(date) {
    this.currentDate = new Date(date);
    this.viewYear = this.currentDate.getFullYear();
    this.viewMonth = this.currentDate.getMonth();
    
    const lunar = this._solarToLunar(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, this.currentDate.getDate());
    this.viewLunarYear = lunar.year;
    this.viewLunarMonth = lunar.month;
    this.viewIsLeap = lunar.isLeap;

    this.render();
  }
}