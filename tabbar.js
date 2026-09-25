/* 底栏 · 手册 index.html 与随身 companion.html 共用
   页面用 <body data-tab="…"> 声明当前页，手册的路由切换时调用 TabBar.setActive(key)。
   key：handbook | days | map | todo | more */
(function () {
  'use strict';

  var TRIP_START = new Date(2026, 9, 3); // 10 月 3 日（本地时间）
  var TRIP_DAYS = 10;

  // 日程键：旅行中→当天；出发前→第 1 天；结束后→速览
  function daysTarget() {
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var n = Math.round((today - TRIP_START) / 86400000) + 1;
    if (n < 1) return 'index.html#day-1';
    if (n > TRIP_DAYS) return 'index.html#overview';
    return 'index.html#day-' + n;
  }

  // Phosphor Icons (phosphoricons.com, MIT) · Regular 为默认，当前页换 Fill
  var ICONS = {
    handbook: ['M232,48H160a40,40,0,0,0-32,16A40,40,0,0,0,96,48H24a8,8,0,0,0-8,8V200a8,8,0,0,0,8,8H96a24,24,0,0,1,24,24,8,8,0,0,0,16,0,24,24,0,0,1,24-24h72a8,8,0,0,0,8-8V56A8,8,0,0,0,232,48ZM96,192H32V64H96a24,24,0,0,1,24,24V200A39.81,39.81,0,0,0,96,192Zm128,0H160a39.81,39.81,0,0,0-24,8V88a24,24,0,0,1,24-24h64Z',
      'M240,56V200a8,8,0,0,1-8,8H160a24,24,0,0,0-24,23.94,7.9,7.9,0,0,1-5.12,7.55A8,8,0,0,1,120,232a24,24,0,0,0-24-24H24a8,8,0,0,1-8-8V56a8,8,0,0,1,8-8H88a32,32,0,0,1,32,32v87.73a8.17,8.17,0,0,0,7.47,8.25,8,8,0,0,0,8.53-8V80a32,32,0,0,1,32-32h64A8,8,0,0,1,240,56Z'],
    days: ['M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z',
      'M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm0,48H48V48H72v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24Z'],
    map: ['M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128Zm0-112a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z',
      'M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132.17,83.41,134.55a8,8,0,0,0,9.18,0C136,236.17,216,179.3,216,104A88.1,88.1,0,0,0,128,16Zm0,56a32,32,0,1,1-32,32A32,32,0,0,1,128,72Z'],
    todo: ['M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM224,48V208a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V48A16,16,0,0,1,48,32H208A16,16,0,0,1,224,48ZM208,208V48H48V208H208Z',
      'M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm-34.34,77.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z'],
    more: ['M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm12-88a12,12,0,1,1-12-12A12,12,0,0,1,140,128Zm44,0a12,12,0,1,1-12-12A12,12,0,0,1,184,128Zm-88,0a12,12,0,1,1-12-12A12,12,0,0,1,96,128Z',
      'M128,24A104,104,0,1,0,232,128,104.13,104.13,0,0,0,128,24ZM84,140a12,12,0,1,1,12-12A12,12,0,0,1,84,140Zm44,0a12,12,0,1,1,12-12A12,12,0,0,1,128,140Zm44,0a12,12,0,1,1,12-12A12,12,0,0,1,172,140Z']
  };

  var TABS = [
    { key: 'handbook', zh: '手册', en: 'Guide', href: 'index.html#overview' },
    { key: 'days', zh: '日程', en: 'Days', href: null },
    { key: 'map', zh: '地图', en: 'Map', href: 'companion.html' },
    { key: 'todo', zh: '待办', en: 'To-do', href: 'index.html#booking' },
    { key: 'more', zh: '更多', en: 'More', href: null }
  ];

  var MORE_LINKS = [
    { href: 'index.html#flights', zh: '航班', en: 'Flights', subZh: '去程 · 返程', subEn: 'Out & back' },
    { href: 'index.html#hotels', zh: '住宿', en: 'Stays', subZh: '竜泉 · 河口湖', subEn: 'Ryusen · Kawaguchiko' },
    { href: 'index.html#transit', zh: '交通', en: 'Transit', subZh: '车票与线路', subEn: 'Passes & lines' },
    { href: 'index.html#budget', zh: '预算', en: 'Budget', subZh: '两人合计', subEn: 'Total for two' },
    { href: 'index.html#tips', zh: '提醒', en: 'Tips', subZh: '出发前必看', subEn: 'Before you go' },
    { href: 'charts/index.html', zh: '图表', en: 'Charts', subZh: '四张决策图', subEn: 'Decision charts' }
  ];

  function isEn() { return !!document.querySelector('span.en.on:not(.tabbar *):not(.tb-sheet *)'); }
  function label(zh, en) {
    var e = isEn();
    return '<span class="zh' + (e ? '' : ' on') + '">' + zh + '</span><span class="en' + (e ? ' on' : '') + '">' + en + '</span>';
  }
  function svg(key) {
    return '<svg class="tb-ico" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">' +
      '<path class="ph-regular" d="' + ICONS[key][0] + '"/><path class="ph-fill" d="' + ICONS[key][1] + '"/></svg>';
  }

  var bar, sheet, backdrop, moreBtn, lastFocus;

  function build() {
    var body = document.body;
    if (!body.dataset.tabbar) body.dataset.tabbar = 'mobile';

    bar = document.createElement('nav');
    bar.className = 'tabbar';
    bar.setAttribute('aria-label', '底部导航');
    bar.innerHTML = TABS.map(function (t) {
      var inner = svg(t.key) + '<span class="tb-lbl">' + label(t.zh, t.en) + '</span>';
      if (t.key === 'more') {
        return '<button type="button" class="tb-item" data-key="more" aria-haspopup="dialog" aria-expanded="false">' + inner + '</button>';
      }
      var href = t.key === 'days' ? daysTarget() : t.href;
      return '<a class="tb-item" data-key="' + t.key + '" href="' + href + '">' + inner + '</a>';
    }).join('');
    body.appendChild(bar);
    moreBtn = bar.querySelector('[data-key="more"]');

    backdrop = document.createElement('div');
    backdrop.className = 'tb-backdrop';
    backdrop.hidden = true;
    body.appendChild(backdrop);

    sheet = document.createElement('div');
    sheet.className = 'tb-sheet';
    sheet.hidden = true;
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-labelledby', 'tb-sheet-title');
    sheet.tabIndex = -1;
    renderSheet();
    body.appendChild(sheet);

    moreBtn.addEventListener('click', openSheet);
    backdrop.addEventListener('click', closeSheet);
    sheet.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (a) closeSheet(true);
      var b = e.target.closest('button[data-act]');
      if (!b) return;
      var act = b.dataset.act;
      if (act === 'theme' && window.toggleTheme) window.toggleTheme();
      if (act === 'lang' && window.setLang) window.setLang(isEn() ? 'zh' : 'en');
      if (act === 'size' && window.toggleTextSize) window.toggleTextSize();
      renderSheet(b.dataset.act);
    });
    document.addEventListener('keydown', onKey);

    setActive(body.dataset.tab || '');
  }

  function renderSheet(focusAct) {
    var dark = document.documentElement.dataset.theme === 'dark';
    var large = document.documentElement.dataset.textSize === 'large';
    var btns = '<button type="button" data-act="theme" aria-pressed="' + dark + '">' + label(dark ? '浅色' : '深色', dark ? 'Light' : 'Dark') + '</button>';
    if (window.setLang) btns += '<button type="button" data-act="lang">' + label('English', '中文') + '</button>';
    if (window.toggleTextSize) btns += '<button type="button" data-act="size" aria-pressed="' + large + '">' + label('大字', 'Large text') + '</button>';
    sheet.innerHTML =
      '<div class="tb-grab" aria-hidden="true"></div>' +
      '<h2 id="tb-sheet-title">' + label('更多', 'More') + '</h2>' +
      '<div class="tb-links">' + MORE_LINKS.map(function (l) {
        return '<a href="' + l.href + '">' + label(l.zh, l.en) + '<small>' + label(l.subZh, l.subEn) + '</small></a>';
      }).join('') + '</div>' +
      '<h2>' + label('显示', 'Display') + '</h2>' +
      '<div class="tb-settings">' + btns + '</div>';
    if (focusAct) {
      var f = sheet.querySelector('[data-act="' + focusAct + '"]');
      if (f) f.focus();
    }
  }

  function siblings() {
    return Array.prototype.filter.call(document.body.children, function (el) {
      return el !== sheet && el !== backdrop && el.tagName !== 'SCRIPT';
    });
  }

  function openSheet(e) {
    // 指点打开：焦点给抽屉本身（不出焦点框）；键盘打开：焦点给第一个链接
    var byPointer = !!(e && e.detail > 0);
    lastFocus = document.activeElement;
    renderSheet();
    backdrop.hidden = false;
    sheet.hidden = false;
    sheet.classList.remove('closing');
    siblings().forEach(function (el) { el.inert = true; });
    moreBtn.setAttribute('aria-expanded', 'true');
    // 先强制一次排版，让起始位置生效，再加 open 触发过渡（不依赖 rAF，后台标签也不卡）
    void sheet.offsetHeight;
    backdrop.classList.add('open');
    sheet.classList.add('open');
    var first = byPointer ? sheet : sheet.querySelector('a, button');
    if (first) first.focus({ preventScroll: true });
  }

  function closeSheet(navigating) {
    if (sheet.hidden) return;
    siblings().forEach(function (el) { el.inert = false; });
    moreBtn.setAttribute('aria-expanded', 'false');
    backdrop.classList.remove('open');
    sheet.classList.add('closing');
    sheet.classList.remove('open');
    setTimeout(function () {
      sheet.hidden = true;
      backdrop.hidden = true;
      sheet.classList.remove('closing');
    }, 200);
    if (navigating !== true && lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  function onKey(e) {
    if (sheet.hidden) return;
    if (e.key === 'Escape') { closeSheet(); return; }
    if (e.key !== 'Tab') return;
    var f = sheet.querySelectorAll('a, button');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function setActive(key) {
    if (!bar) return;
    document.body.dataset.tab = key;
    var items = bar.querySelectorAll('.tb-item');
    for (var i = 0; i < items.length; i++) {
      if (items[i].dataset.key === key) items[i].setAttribute('aria-current', 'page');
      else items[i].removeAttribute('aria-current');
    }
    // 日程键永远指向"今天"
    var d = bar.querySelector('[data-key="days"]');
    if (d) d.setAttribute('href', daysTarget());
  }

  window.TabBar = { setActive: setActive, open: function () { openSheet(); }, close: function () { closeSheet(); } };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
