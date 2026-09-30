/* 卡片小细节 · 日程 companion.html 与资料 index.html 共用
   1. 地铁线路色标：文中写到「日比谷线」「副都心线」这类线名，前面加站牌同款的字母圆标（官方线色）。
      到站里跟着颜色和字母走，不用认汉字。
   2. 要点图示：要点里写到电梯、洗手间、长椅/座位，圆点换成对应的小图示，带妈妈时扫一眼就找到。
   用法：TripDetails.decorate(容器)。同一个容器重复调用不会重复加。 */
(function () {
  'use strict';

  // [匹配, 字母, 线色]。长的写前面；「都营」「JR」前缀一起吃进去，圆标放在最前面
  var LINES = [
    [/(?:都营|都営)?(?:大江户线|大江戸線)/g, 'E', '#b6007a'],
    [/(?:都营|都営)?浅草线/g, 'A', '#e85298'],
    [/日比谷线/g, 'H', '#9c9c94'],
    [/千代田线/g, 'C', '#00a377'],
    [/副都心线/g, 'F', '#9c5e31'],
    [/银座线/g, 'G', '#f39700'],
    [/丸之内线/g, 'M', '#e60012'],
    [/(?:半藏门线|半蔵門線)/g, 'Z', '#8f76d6'],
    [/南北线/g, 'N', '#00ac9b'],
    [/(?:JR ?)?山手线/g, 'JY', '#80c241'],
    [/(?:JR ?)?中央线/g, 'JC', '#f15a22'],
    [/(?:JR ?)?横须贺线/g, 'JO', '#0067c0'],
    [/(?:JR ?)?京叶线/g, 'JE', '#c9252f'],
    [/江之电/g, 'EN', '#00874a']
  ];

  // 要点图示：先到先得
  var ICONS = [
    ['lift', /电梯/],
    ['wc', /洗手间|厕所/],
    ['seat', /长椅|有座位|坐着|坐下/]
  ];

  var SVG = {
    lift: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect x="2" y="1.5" width="12" height="13" rx="2.5" fill="none" stroke="#000" stroke-width="1.7"/><path d="M8 3.9 10.7 7.1H5.3ZM8 12.1 5.3 8.9h5.4Z"/></svg>',
    seat: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="#000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 2v7h7l.5 5M4.5 9v5"/></svg>'
  };
  function uri(s) { return 'url("data:image/svg+xml,' + encodeURIComponent(s) + '")'; }

  var CSS =
    '.ln{display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;min-width:1.6em;height:1.6em;padding:0 .22em;margin:0 .25em 0 .1em;' +
    'border:.18em solid var(--ln);border-radius:50%;background:#fff;color:#1a1a1a;font:800 .74em/1 system-ui,-apple-system,sans-serif;letter-spacing:-.02em;' +
    'vertical-align:.08em;font-variant-numeric:normal;text-decoration:none;white-space:nowrap;}' +
    '.ln.jr{border-radius:.32em;}' +
    /* 要点图示：替换原来的小圆点，位置和圆点一样 */
    '.di-lift,.di-seat{padding-left:19px !important;}.di-wc{padding-left:22px !important;}' +
    '.di-lift::before,.di-seat::before{width:13px !important;height:13px !important;border-radius:0 !important;left:0 !important;top:.36em !important;' +
    'background:var(--di, currentColor) !important;-webkit-mask:var(--di-m) center/contain no-repeat;mask:var(--di-m) center/contain no-repeat;opacity:.8;}' +
    '.di-lift::before{--di-m:' + uri(SVG.lift) + ';}' +
    '.di-seat::before{--di-m:' + uri(SVG.seat) + ';}' +
    '.di-wc::before{content:"WC" !important;width:auto !important;height:auto !important;left:-1px !important;top:.42em !important;border-radius:3px !important;' +
    'padding:1px 2px;background:none !important;border:1.3px solid currentColor;font:800 7.5px/1 system-ui,-apple-system,sans-serif;letter-spacing:-.02em;opacity:.8;}' +
    /* 注意事项（金色要点）里的图示也用金色 */
    'li.kw[class*="di-"]::before,.f:has(.kw)[class*="di-"]::before{--di:var(--kin);color:var(--kin);opacity:1;}';

  function injectCss() {
    if (document.getElementById('trip-details-css')) return;
    var st = document.createElement('style');
    st.id = 'trip-details-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  var SKIP = /^(SCRIPT|STYLE|TEXTAREA|INPUT|BUTTON|SUMMARY|H1|H2)$/;
  function badgeLines(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode;
        if (!p || SKIP.test(p.nodeName) || p.closest('.ln, .en, .tl-time, .time-badge')) return NodeFilter.FILTER_REJECT;
        return /线|線|江之电/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var text = node.nodeValue, hits = [];
      LINES.forEach(function (l) {
        l[0].lastIndex = 0;
        var m;
        while ((m = l[0].exec(text))) {
          if (!hits.some(function (h) { return m.index < h.end && m.index + m[0].length > h.start; })) {
            hits.push({ start: m.index, end: m.index + m[0].length, code: l[1], color: l[2] });
          }
        }
      });
      if (!hits.length) return;
      hits.sort(function (a, b) { return a.start - b.start; });
      var frag = document.createDocumentFragment(), pos = 0;
      hits.forEach(function (h) {
        if (h.start > pos) frag.appendChild(document.createTextNode(text.slice(pos, h.start)));
        var b = document.createElement('span');
        b.className = 'ln' + (h.code.length > 1 ? ' jr' : '');
        b.style.setProperty('--ln', h.color);
        b.setAttribute('aria-hidden', 'true');
        b.textContent = h.code;
        frag.appendChild(b);
        frag.appendChild(document.createTextNode(text.slice(h.start, h.end)));
        pos = h.end;
      });
      if (pos < text.length) frag.appendChild(document.createTextNode(text.slice(pos)));
      node.parentNode.replaceChild(frag, node);
    });
  }

  function iconBullets(root) {
    root.querySelectorAll('.node-key li, .tl-key .f').forEach(function (li) {
      if (li.dataset.di) return;
      var t = li.textContent;
      for (var i = 0; i < ICONS.length; i++) {
        if (ICONS[i][1].test(t)) { li.classList.add('di-' + ICONS[i][0]); break; }
      }
      li.dataset.di = '1';
    });
  }

  function decorate(root) {
    if (!root) return;
    injectCss();
    badgeLines(root);
    iconBullets(root);
  }

  window.TripDetails = { decorate: decorate };
})();
