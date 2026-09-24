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

  // 同一套图标：默认描边，当前页把 .tb-fill 填实
  var ICONS = {
    handbook: '<path class="tb-fill" d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5z"/><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5z"/><path class="tb-fill" d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5z"/>',
    days: '<rect class="tb-fill" x="3.5" y="5" width="17" height="15.5" rx="2.5"/><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M8 3v4M16 3v4"/><path class="tb-cut" d="M3.5 10h17"/>',
    map: '<path class="tb-fill" d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle class="tb-cut" cx="12" cy="10" r="2.3"/>',
    todo: '<rect class="tb-fill" x="4" y="3.5" width="16" height="17" rx="2.5"/><rect x="4" y="3.5" width="16" height="17" rx="2.5"/><path class="tb-cut" d="M8 9l1.5 1.5L12 8M8 15l1.5 1.5L12 14M14.5 9.5H17M14.5 15.5H17"/>',
    more: '<circle class="tb-fill" cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="8.5"/><path class="tb-cut" d="M8.5 12h.01M12 12h.01M15.5 12h.01" stroke-width="2.2"/>'
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
    return '<svg class="tb-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[key] + '</svg>';
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

  function openSheet() {
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
    var first = sheet.querySelector('a, button');
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
