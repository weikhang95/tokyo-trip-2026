# 手册插画生成器：木版画风格，每天一张（img/illo/day-N.svg）+ 首页（img/illo/home.svg）。
# 用法：python3 scripts/illo.py   （在仓库根目录跑，直接覆盖 img/illo/ 里的 SVG）
# 改完插画要把 sw.js 的 VERSION 加一，离线缓存才会换新图。
# Woodblock-print (shin-hanga) day illustrations. viewBox 800x200, focal area x150-650, y25-175.
import random, json, sys

W, H = 800, 200

def grad(id_, stops, x2=0, y2=1):
    s = ''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in stops)
    return f'<linearGradient id="{id_}" x1="0" y1="0" x2="{x2}" y2="{y2}">{s}</linearGradient>'

def rgrad(id_, stops, cx=.5, cy=.5, r=.5):
    s = ''.join(f'<stop offset="{o}" stop-color="{c}" stop-opacity="{a}"/>' for o, c, a in stops)
    return f'<radialGradient id="{id_}" cx="{cx}" cy="{cy}" r="{r}">{s}</radialGradient>'

def mist(bands, color='#fff', op=.55):
    # suyari-gasumi: long rounded mist bars
    return ''.join(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h/2}" fill="{color}" opacity="{op}"/>' for x, y, w, h in bands)

def skyline(seed, x0, x1, base, hmin, hmax, fill, win=None, wmin=18, wmax=46, gap=(0, 4)):
    r = random.Random(seed); out = []; x = x0
    while x < x1:
        w = r.randint(wmin, wmax); h = r.randint(hmin, hmax)
        out.append(f'<rect x="{x}" y="{base-h}" width="{w}" height="{h+2}" fill="{fill}"/>')
        if win:
            for wy in range(base - h + 6, base - 4, 7):
                for wx in range(x + 4, x + w - 4, 6):
                    if r.random() < .22:
                        out.append(f'<rect x="{wx}" y="{wy}" width="2.2" height="3" fill="{win}" opacity="{r.choice([.6,.8,1])}"/>')
        x += w + r.randint(*gap)
    return ''.join(out)

def waves(y0, y1, color, step=7, op=.5, seed=1, xr=(0, 800)):
    r = random.Random(seed); out = []
    for y in range(y0, y1, step):
        x = xr[0] + r.randint(-40, 40)
        while x < xr[1]:
            w = r.randint(30, 110)
            out.append(f'<rect x="{x}" y="{y}" width="{w}" height="1.6" rx=".8" fill="{color}" opacity="{op}"/>')
            x += w + r.randint(20, 70)
    return ''.join(out)

def pine(x, y, s, fill):
    # flat umbrella pine silhouette
    return (f'<g transform="translate({x} {y}) scale({s})" fill="{fill}">'
            '<path d="M-2 0 L2 0 L3 -40 Q6 -52 1 -60 L-1 -60 Q-6 -50 -3 -40 Z"/>'
            '<ellipse cx="-14" cy="-44" rx="20" ry="5"/><ellipse cx="12" cy="-54" rx="18" ry="5"/>'
            '<ellipse cx="-6" cy="-64" rx="14" ry="4.5"/><ellipse cx="16" cy="-38" rx="12" ry="4"/></g>')

def fuji(x, base, w, h, body, snow, snow_h=.38, seed=3):
    # concave sides, flat crater top; snow cap with jagged lower edge
    l, r_ = x - w/2, x + w/2; top = base - h; tw = w * .085
    body_d = (f'M{l} {base} Q{x - w*.18} {base - h*.18} {x - tw} {top+2} L{x - tw*.35} {top-1} '
              f'L{x+tw*.2} {top+1} L{x + tw} {top+2} Q{x + w*.18} {base - h*.18} {r_} {base} Z')
    rr = random.Random(seed)
    sy = top + h * snow_h
    # snow: follow the slopes down to sy, then jagged teeth back
    def sx(y, side):
        # approximate slope x at height y (linear between top and base is fine for the cap)
        t = (y - top) / h
        return x + side * (tw + (w/2 - tw) * t ** 1.6)
    pts = [f'M{x - tw} {top+2}', f'L{x - tw*.35} {top-1}', f'L{x+tw*.2} {top+1}', f'L{x + tw} {top+2}']
    n = 9; yy = sy
    right = sx(yy, 1); left = sx(yy, -1)
    pts.append(f'Q{sx(top + (yy-top)*.5, 1)+2} {top + (yy-top)*.5} {right} {yy}')
    xs = [right - (right-left) * i / n for i in range(1, n)]
    for i, xx in enumerate(xs):
        dip = rr.uniform(.35, 1) * h * .16
        pts.append(f'L{xx + (right-left)/n*.5} {yy - dip*.2} L{xx} {yy + (dip if i % 2 == 0 else dip*.4)}')
    pts.append(f'L{left} {yy}')
    pts.append(f'Q{sx(top + (yy-top)*.5, -1)-2} {top + (yy-top)*.5} {x - tw} {top+2} Z')
    return f'<path d="{body_d}" fill="{body}"/><path d="{" ".join(pts)}" fill="{snow}"/>'

def pagoda(x, base, s, roof, body, trim):
    g = [f'<g transform="translate({x} {base}) scale({s})">']
    # 5 tiers, bottom widest
    y = 0
    for i in range(5):
        tw = 62 - i * 8; th = 16
        g.append(f'<rect x="{-tw/2 + 12}" y="{y - th}" width="{tw - 24}" height="{th}" fill="{body}"/>')
        rw = tw + 10
        g.append(f'<path d="M{-rw/2} {y - th + 1} Q{-rw/2 + 8} {y - th - 3} {-rw/2 + 14} {y - th - 5} L{rw/2 - 14} {y - th - 5} Q{rw/2 - 8} {y - th - 3} {rw/2} {y - th + 1} Z" fill="{roof}"/>')
        g.append(f'<rect x="{-tw/2 + 16}" y="{y - th + 3}" width="{tw - 32}" height="2" fill="{trim}" opacity=".9"/>')
        y -= th + 5
    g.append(f'<rect x="-1.5" y="{y - 30}" width="3" height="32" fill="{roof}"/>')
    for k in range(6):
        g.append(f'<rect x="-4" y="{y - 26 + k*4}" width="8" height="1.6" fill="{roof}"/>')
    g.append('</g>')
    return ''.join(g)

def torii(x, base, s, c):
    return (f'<g transform="translate({x} {base}) scale({s})" fill="{c}">'
            '<rect x="-22" y="-44" width="5" height="44"/><rect x="17" y="-44" width="5" height="44"/>'
            '<path d="M-34 -50 Q0 -46 34 -50 L32 -44 Q0 -41 -32 -44 Z"/><rect x="-26" y="-38" width="52" height="4"/>'
            '<rect x="-2" y="-44" width="4" height="7"/></g>')

def lantern(x, y, s, body, band):
    return (f'<g transform="translate({x} {y}) scale({s})">'
            f'<rect x="-9" y="-3" width="18" height="3" fill="{band}"/>'
            f'<rect x="-11" y="0" width="22" height="26" rx="9" fill="{body}"/>'
            f'<rect x="-9" y="26" width="18" height="3" fill="{band}"/></g>')

def cat(x, y, s, c, flip=1):
    return (f'<g transform="translate({x} {y}) scale({s*flip} {s})" fill="{c}">'
            '<path d="M0 0 Q-2 -12 4 -16 L3 -22 L7 -18 L10 -18 L13 -22 L13 -15 Q17 -10 14 0 Z"/>'
            '<path d="M13 -2 Q24 -2 22 -12 Q21 -16 18 -14 Q20 -8 13 -6 Z"/></g>')

def plane(x, y, s, c, rot=-8):
    return (f'<g transform="translate({x} {y}) rotate({rot}) scale({s})" fill="{c}">'
            '<path d="M-30 0 Q-30 -3 -24 -3 L24 -3 Q32 -3 34 0 Q32 3 24 3 L-24 3 Q-30 3 -30 0 Z"/>'
            '<path d="M-2 -2 L-14 -20 L-8 -20 L10 -2 Z"/><path d="M-2 2 L-14 20 L-8 20 L10 2 Z"/>'
            '<path d="M-24 -2 L-30 -12 L-26 -12 L-18 -2 Z"/></g>')

def trail(id_, d, c='#fff'):
    return (f'<linearGradient id="{id_}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{c}" stop-opacity="0"/><stop offset="1" stop-color="{c}" stop-opacity=".7"/></linearGradient>'
            f'<path d="{d}" stroke="url(#{id_})" stroke-width="2" fill="none" stroke-linecap="round"/>')

def grain(uid):
    return f'<rect y="-60" width="{W}" height="{H+60}" filter="url(#il-grain)" opacity=".5" style="mix-blend-mode:multiply"/>'

def svg(uid, defs, body, label, vb=(W, H)):
    body = body.replace('<rect width="800" height="200" fill="url(#', '<rect y="-60" width="800" height="260" fill="url(#', 1)
    return (f'<svg class="day-illo" viewBox="0 -60 {vb[0]} {vb[1]+60}" preserveAspectRatio="xMidYMax slice" role="img" aria-label="{label}">'
            f'<defs>{defs}</defs>{body.replace("<!--TOP-->", '<g transform="translate(0 30)">' + TOP.get(uid, "") + '</g>', 1)}{grain(uid)}</svg>')


def stars(pts):
    return ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#fff" opacity="{o}"/>' for x, y, r, o in pts)
def birds(pts, c):
    return ''.join(f'<path d="M{x-6} {y} Q{x-3} {y-4} {x} {y} Q{x+3} {y-4} {x+6} {y}" stroke="{c}" stroke-width="1.4" fill="none"/>' for x, y in pts)
TOP = {
 'd1': mist([(180, -70, 300, 7), (520, -40, 220, 6)], '#c9c3d9', .3) + stars([(90, -80, 1.2, .8), (300, -60, 1, .6), (640, -86, 1.3, .8), (720, -50, 1, .5), (420, -90, 1, .6)]),
 'd2': mist([(120, -60, 320, 8), (480, -30, 260, 7)], '#fff', .5) + birds([(520, -40), (538, -48), (552, -38)], '#6a7f99'),
 'd3': mist([(160, -70, 300, 7), (500, -36, 240, 6)], '#fff', .5) + birds([(360, -50), (378, -58)], '#5a6f87'),
 'd4': mist([(100, -66, 300, 7), (460, -34, 280, 6)], '#e6b9c4', .35),
 'd5': mist([(80, -72, 220, 5), (340, -50, 200, 5), (560, -80, 200, 5), (620, -30, 160, 4)], '#fff', .7),
 'd6': mist([(140, -64, 300, 6), (520, -30, 220, 6)], '#c7a8c9', .3) + stars([(90, -86, 1.1, .7), (700, -80, 1.2, .7), (360, -92, 1, .5)]),
 'd7': stars([(60, -80, 1.2, .8), (140, -40, 1, .6), (240, -70, 1.4, .9), (360, -20, 1, .6), (420, -88, 1.2, .8), (560, -60, 1, .6), (640, -30, 1.3, .8), (740, -76, 1.1, .7), (520, -10, .9, .5), (300, -50, .9, .5)]),
 'd8': mist([(120, -60, 300, 6), (500, -34, 260, 6)], '#e9c3c8', .35) + birds([(640, -30), (656, -38)], '#3d4a6e'),
 'd9': mist([(100, -60, 300, 6), (480, -30, 260, 5)], '#e8b8a8', .35) + birds([(420, -44), (436, -52), (452, -42)], '#4a3a55'),
 'd10': stars([(80, -80, 1.2, .8), (200, -50, 1, .6), (320, -86, 1.3, .8), (520, -60, 1, .6), (660, -84, 1.2, .8), (740, -40, 1, .5)]) + '<circle cx="700" cy="-56" r="11" fill="#f3e6c4"/><circle cx="706" cy="-60" r="10" fill="#1d2f55"/>',
}

S = {}
INK = '#1c3553'

# D1 arrival: dusk, plane descending, Skytree, Skyliner streak
S['day-1'] = svg('d1',
    grad('d1s', [(0, '#24365a'), (.45, '#5d5f86'), (.78, '#e39a7a'), (1, '#f4c98f')]),
    '<rect width="800" height="200" fill="url(#d1s)"/>' + '<!--TOP-->'
    + mist([(90, 58, 260, 7), (470, 44, 300, 6), (560, 96, 180, 5)], '#f6d7b8', .35)
    + '<circle cx="610" cy="150" r="26" fill="#f7d9a2" opacity=".9"/>'
    + skyline(11, 0, 800, 172, 10, 34, '#3a3f63', None, 14, 40)
    + '<g fill="#2a2f50"><path d="M455 172 L459 60 L461 40 L463 60 L467 172 Z"/><rect x="455.5" y="96" width="11" height="5" rx="2"/><rect x="456.5" y="118" width="9" height="4" rx="2"/></g>'
    + skyline(12, 0, 800, 178, 6, 20, '#20264a', '#f6c77f', 20, 52)
    + '<rect y="176" width="800" height="24" fill="#171c38"/>'
    + '<g transform="translate(470 178)"><rect width="190" height="11" rx="5.5" fill="#e8ecf2"/><rect y="7" width="190" height="2" fill="#1c3553"/>'
    + ''.join(f'<rect x="{10 + i*14}" y="2.5" width="8" height="3" fill="#f6c77f"/>' for i in range(13)) + '</g>'
    + trail('d1t', 'M300 44 Q420 62 516 86')
    + plane(540, 90, .7, '#f3efe7', 14),
    '傍晚抵达东京：飞机下降、晴空塔与 Skyliner')

# D2 Asakusa dawn: pale dawn, pagoda, Skytree, big red lantern
S['day-2'] = svg('d2',
    grad('d2s', [(0, '#9fc1dc'), (.55, '#f1e1c6'), (1, '#f7cf9c')]),
    '<rect width="800" height="200" fill="url(#d2s)"/>' + '<!--TOP-->'
    + '<circle cx="330" cy="104" r="34" fill="#fbe3b6"/>'
    + mist([(60, 70, 280, 8), (420, 52, 320, 7), (140, 104, 200, 6)], '#fff', .6)
    + '<g fill="#b8c7d6"><path d="M660 170 L664 64 L666 46 L668 64 L672 170 Z"/><rect x="660.5" y="92" width="11" height="5" rx="2"/></g>'
    + skyline(21, 0, 800, 172, 8, 24, '#aebdcc', None, 20, 50)
    + pagoda(600, 176, 1.05, '#2d3a55', '#c2412d', '#e7b25a')
    + '<g transform="translate(470 0)">'
    + '<rect x="-64" y="118" width="10" height="58" fill="#a8321f"/><rect x="54" y="118" width="10" height="58" fill="#a8321f"/>'
    + '<rect x="-54" y="120" width="108" height="56" fill="#2d3a55" opacity=".25"/>'
    + '<path d="M-92 118 Q-70 110 -56 98 L56 98 Q70 110 92 118 L88 122 Q0 114 -88 122 Z" fill="#2d3a55"/>'
    + '<path d="M-60 98 Q-44 88 -36 80 L36 80 Q44 88 60 98 Z" fill="#2d3a55"/>'
    + '<rect x="-70" y="114" width="140" height="6" fill="#a8321f"/>'
    + '<rect x="-1" y="120" width="2" height="6" fill="#2d3a55"/>'
    + '<rect x="-14" y="126" width="28" height="3" fill="#2d3a55"/><rect x="-17" y="129" width="34" height="34" rx="12" fill="#c2412d"/>'
    + '<rect x="-14" y="163" width="28" height="3" fill="#2d3a55"/><rect x="-6" y="136" width="12" height="18" fill="#2d1b16" opacity=".35"/>'
    + '</g>'
    + '<rect y="176" width="800" height="24" fill="#3a4663"/>'
    + waves(180, 200, '#9fb3c9', 6, .6, 5),
    '浅草清晨：五重塔、雷门大灯笼与远处的晴空塔')

# D3 Ueno Toshogu: golden karamon, stone lanterns, ginkgo
def stone_lantern(x, base, s, c):
    return (f'<g transform="translate({x} {base}) scale({s})" fill="{c}">'
            '<rect x="-7" y="-8" width="14" height="8"/><rect x="-3" y="-30" width="6" height="22"/>'
            '<rect x="-9" y="-36" width="18" height="6"/><rect x="-7" y="-46" width="14" height="10"/>'
            '<path d="M-14 -46 Q0 -60 14 -46 Z"/><rect x="-1.5" y="-62" width="3" height="6"/></g>')
S['day-3'] = svg('d3',
    grad('d3s', [(0, '#7fa6c9'), (.6, '#d9e4e6'), (1, '#efe6cf')]) + grad('d3g', [(0, '#f3d27a'), (1, '#b8862b')]),
    '<rect width="800" height="200" fill="url(#d3s)"/>' + '<!--TOP-->'
    + mist([(80, 40, 300, 7), (500, 62, 260, 6)], '#fff', .55)
    + ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#e2b63e" opacity=".95"/>' for x, y, r in [(250, 104, 44), (300, 84, 36), (216, 76, 28), (760, 96, 40), (800, 76, 32)])
    + '<rect x="258" y="116" width="6" height="60" fill="#5a4630"/><rect x="764" y="110" width="6" height="66" fill="#5a4630"/>'
    # shrine
    + '<g transform="translate(120 0)">'
    + '<rect x="330" y="120" width="140" height="56" fill="url(#d3g)"/>'
    + ''.join(f'<rect x="{338 + i*16}" y="124" width="8" height="48" fill="#8a5a1c" opacity=".55"/>' for i in range(9))
    + '<path d="M300 124 Q330 112 352 96 Q400 60 448 96 Q470 112 500 124 L500 128 L300 128 Z" fill="#23354e"/>'
    + '<path d="M352 96 Q400 60 448 96 Q424 84 400 84 Q376 84 352 96 Z" fill="#e0b44a"/>'
    + '<rect x="318" y="126" width="164" height="4" fill="#e0b44a"/>'
    + '<path d="M384 86 Q400 76 416 86 L416 90 L384 90 Z" fill="#c2412d"/>'
    + '</g>'
    + ''.join(stone_lantern(x, 178, s, '#8b8f93') for x, s in [(440, 1), (402, .88), (364, .76), (648, 1), (686, .88), (724, .76)])
    + '<rect y="176" width="800" height="24" fill="#cdbf9f"/><rect y="176" width="800" height="3" fill="#b7a883"/>',
    '上野东照宫：金色唐门、石灯笼和银杏')

# D4 Kawaguchiko sunset: Fuji purple, orange sky, lake reflection
S['day-4'] = svg('d4',
    grad('d4s', [(0, '#3b3f72'), (.45, '#b86a7a'), (.8, '#f2a25c'), (1, '#f7cf86')]) + grad('d4w', [(0, '#e79a64'), (1, '#39406b')]),
    '<rect width="800" height="200" fill="url(#d4s)"/>' + '<!--TOP-->'
    + '<circle cx="610" cy="118" r="22" fill="#ffe0a3"/>'
    + mist([(60, 50, 240, 6), (480, 36, 280, 6), (540, 88, 220, 5)], '#ffd9b0', .45)
    + fuji(420, 140, 520, 108, '#4a4674', '#e9d3de', .30, 7)
    + '<path d="M0 140 Q120 118 220 132 Q300 142 360 140 L360 142 L0 142 Z" fill="#2d2f55"/>'
    + '<path d="M520 140 Q620 120 800 128 L800 142 L520 142 Z" fill="#2d2f55"/>'
    + '<rect y="140" width="800" height="60" fill="url(#d4w)"/>'
    + '<g opacity=".35" transform="translate(0 280) scale(1 -1)">' + fuji(420, 140, 520, 108, '#4a4674', '#e9d3de', .30, 7) + '</g>'
    + '<rect x="596" y="146" width="28" height="2" rx="1" fill="#ffe0a3" opacity=".8"/><rect x="590" y="154" width="40" height="2" rx="1" fill="#ffe0a3" opacity=".6"/><rect x="600" y="162" width="20" height="2" rx="1" fill="#ffe0a3" opacity=".5"/>'
    + waves(146, 200, '#fbe2c0', 7, .35, 9)
    + '',
    '河口湖日落：紫色富士山倒映湖面')

# D5 Red Fuji (Hokusai homage)
S['day-5'] = svg('d5',
    grad('d5s', [(0, '#2f5d8a'), (.6, '#8fb6cf'), (1, '#dfe7df')]) + grad('d5f', [(0, '#7e2b1f'), (.55, '#c2412d'), (1, '#d8703d')]),
    '<rect width="800" height="200" fill="url(#d5s)"/>' + '<!--TOP-->'
    + mist([(60, 30, 200, 5), (300, 44, 160, 5), (540, 28, 210, 5), (620, 58, 140, 4), (120, 70, 120, 4)], '#fff', .75)
    + fuji(430, 176, 600, 150, 'url(#d5f)', '#f4efe6', .24, 5)
    + ''.join(f'<path d="M{x} 176 Q{x+6} {176-h*.6} {x+2} {176-h}" stroke="#7e2b1f" stroke-width="2" fill="none" opacity=".45"/>' for x, h in [(410, 70), (446, 84), (482, 60), (372, 50), (518, 40)])
    + '<path d="M0 176 Q80 150 170 158 Q250 166 330 176 Z" fill="#2d5a3f"/>'
    + '<path d="M540 176 Q640 150 800 160 L800 176 Z" fill="#2d5a3f"/>'
    + ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#23452f"/>' for x, y, r in [(40, 164, 8), (70, 160, 7), (110, 158, 7), (150, 162, 8), (600, 162, 7), (640, 158, 8), (690, 160, 7), (740, 162, 8)])
    + '<rect y="176" width="800" height="24" fill="#1e3a2b"/>',
    '赤富士：清晨被朝阳染红的富士山')

# D6 Shibuya SKY sunset: skyline, Scramble Square tallest, tiny Fuji on horizon
S['day-6'] = svg('d6',
    grad('d6s', [(0, '#2a3566'), (.4, '#7b5d8f'), (.72, '#ec8f6a'), (1, '#f8c77d')]),
    '<rect width="800" height="200" fill="url(#d6s)"/>' + '<!--TOP-->'
    + '<circle cx="250" cy="120" r="24" fill="#ffd79a"/>'
    + fuji(180, 132, 150, 34, '#8c6a8f', '#e6c9d6', .32, 2)
    + mist([(40, 60, 260, 6), (430, 46, 300, 6)], '#ffd1b3', .35)
    + skyline(61, 0, 800, 150, 16, 44, '#4e4a78', None, 16, 40)
    + '<g><rect x="470" y="30" width="62" height="146" fill="#2a2a52"/><path d="M470 30 L532 30 L532 38 L470 44 Z" fill="#35355f"/>'
    + '<rect x="466" y="26" width="70" height="5" fill="#f6c77f"/>'
    + ''.join(f'<rect x="{476 + (i%6)*9}" y="{50 + (i//6)*10}" width="4" height="4" fill="#f6c77f" opacity="{.5 + (i*7%5)/10}"/>' for i in range(60))
    + '</g>'
    + skyline(62, 0, 800, 176, 20, 62, '#262549', '#f6c77f', 18, 44, (1, 3))
    + '<rect y="174" width="800" height="26" fill="#1a1a38"/>'
    + ''.join(f'<rect x="{x}" y="186" width="{w}" height="3" fill="#fff" opacity=".8"/>' for x, w in [(120, 22), (150, 22), (180, 22), (210, 22), (240, 22)])
    + '<rect x="560" y="178" width="96" height="16" rx="3" fill="#c2412d"/><rect x="566" y="181" width="84" height="4" fill="#f6c77f" opacity=".8"/><circle cx="574" cy="195" r="4" fill="#111"/><circle cx="642" cy="195" r="4" fill="#111"/>',
    '涩谷 SKY 日落：天际线、远处的富士山和开顶巴士')

# D7 Tokyo Tower at night, Zojoji roof in front
def tower(x, base, s, c, light):
    g = [f'<g transform="translate({x} {base}) scale({s})">']
    g.append(f'<path d="M-40 0 Q-14 -60 -5 -150 L-3 -175 L3 -175 L5 -150 Q14 -60 40 0 L28 0 Q10 -52 0 -60 Q-10 -52 -28 0 Z" fill="{c}"/>')
    for y, w in [(-58, 34), (-100, 20), (-138, 12)]:
        g.append(f'<rect x="{-w/2}" y="{y}" width="{w}" height="6" fill="{light}"/>')
    for y in range(-170, -8, 12):
        t = -y / 175; hw = 40 * (1 - t) ** 1.8 + 5 * t
        g.append(f'<path d="M{-hw} {y} L{hw*.8} {y+10} M{hw} {y} L{-hw*.8} {y+10}" stroke="{light}" stroke-width="1.2" opacity=".6"/>')
    g.append(f'<rect x="-1" y="-200" width="2" height="26" fill="{c}"/>')
    g.append('</g>')
    return ''.join(g)
S['day-7'] = svg('d7',
    grad('d7s', [(0, '#0f1a33'), (.7, '#243a63'), (1, '#4b5b83')]) + rgrad('d7g', [(0, '#ff9a4a', .55), (1, '#ff9a4a', 0)]),
    '<rect width="800" height="200" fill="url(#d7s)"/>' + '<!--TOP-->'
    + ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#fff" opacity="{o}"/>' for x, y, r, o in [(80, 30, 1.2, .8), (160, 60, 1, .6), (260, 24, 1.4, .9), (330, 70, .9, .5), (620, 30, 1.2, .8), (700, 64, 1, .6), (760, 22, 1.3, .7), (560, 50, .9, .5)])
    + '<circle cx="690" cy="44" r="12" fill="#f3e6c4"/><circle cx="696" cy="40" r="11" fill="#0f1a33"/>'
    + '<ellipse cx="500" cy="100" rx="120" ry="90" fill="url(#d7g)"/>'
    + skyline(71, 0, 800, 170, 14, 50, '#1b2747', '#f6c77f', 18, 44)
    + tower(500, 176, .95, '#f07a3a', '#ffd9a0')
    + '<path d="M140 176 L170 142 L350 142 L380 176 Z" fill="#0c1428"/>'
    + '<path d="M120 146 Q160 136 190 124 L330 124 Q360 136 400 146 L396 150 L124 150 Z" fill="#0c1428"/>'
    + '<path d="M170 128 Q260 104 350 128 Z" fill="#0c1428"/>'
    + ''.join(lantern(x, 150, .55, '#f6c77f', '#0c1428') for x in [196, 232, 288, 324])
    + '<rect y="174" width="800" height="26" fill="#0a1122"/>',
    '夜晚的东京铁塔，前面是增上寺屋顶')

# D8 Enoshima sunset: island + Sea Candle, sea, Enoden
S['day-8'] = svg('d8',
    grad('d8s', [(0, '#3d5a8a'), (.5, '#c98a8c'), (.8, '#f4b16c'), (1, '#f9d69a')]) + grad('d8w', [(0, '#f0a868'), (1, '#28406b')]),
    '<rect width="800" height="200" fill="url(#d8s)"/>' + '<!--TOP-->'
    + '<circle cx="330" cy="128" r="26" fill="#ffe2a8"/>'
    + fuji(140, 130, 170, 40, '#8a7ba0', '#e8d8e4', .3, 4)
    + mist([(20, 70, 240, 5), (420, 50, 300, 6), (520, 90, 180, 4)], '#ffd9b8', .4)
    + '<path d="M470 132 Q500 104 540 100 Q580 96 610 108 Q650 118 690 132 Z" fill="#2b3052"/>'
    + '<rect x="566" y="62" width="8" height="42" fill="#2b3052"/><rect x="560" y="56" width="20" height="8" rx="2" fill="#2b3052"/><rect x="564" y="58" width="12" height="4" fill="#ffe2a8"/><rect x="568" y="48" width="4" height="8" fill="#2b3052"/>'
    + '<path d="M392 132 L470 124" stroke="#2b3052" stroke-width="2"/>'
    + '<rect y="130" width="800" height="70" fill="url(#d8w)"/>'
    + ''.join(f'<rect x="{330-w/2}" y="{y}" width="{w}" height="2" rx="1" fill="#ffe2a8" opacity="{o}"/>' for y, w, o in [(136, 40, .9), (144, 56, .7), (152, 34, .6), (160, 50, .5)])
    + waves(138, 200, '#fde6c6', 7, .3, 12)
    + '<path d="M380 176 Q600 164 800 170 L800 200 L380 200 Z" fill="#23304f"/>'
    + '<g transform="translate(520 156)"><rect width="120" height="18" rx="4" fill="#e9dfc2"/><rect y="11" width="120" height="7" fill="#3f7a4e"/>'
    + ''.join(f'<rect x="{8 + i*18}" y="3" width="12" height="6" fill="#23304f"/>' for i in range(6)) + '</g>',
    '江之岛日落：灯塔、相模湾与江之电')

# D9 Yanaka: yuyake dandan stairs, cats, old roofs, lanterns at dusk
S['day-9'] = svg('d9',
    grad('d9s', [(0, '#4a5a8a'), (.5, '#d58a6e'), (1, '#f6c98a')]),
    '<rect width="800" height="200" fill="url(#d9s)"/>' + '<!--TOP-->'
    + '<circle cx="560" cy="96" r="22" fill="#ffe0a3"/>'
    + mist([(60, 46, 260, 6), (460, 60, 280, 5)], '#ffd9b8', .4)
    + ''.join(f'<path d="M{x} 150 L{x+10} {150-h} L{x+w-10} {150-h} L{x+w} 150 Z" fill="#3b2f3f"/><rect x="{x+6}" y="150" width="{w-12}" height="30" fill="#4a3a45"/><rect x="{x+12}" y="156" width="{w-24}" height="10" fill="#f6c77f" opacity=".75"/>' for x, w, h in [(0, 110, 20), (104, 96, 26), (600, 110, 22), (704, 100, 18)])
    + ''.join(f'<path d="M{430 - 70 - i*14} {104 + i*8} L{470 + 70 + i*14} {104 + i*8} L{470 + 70 + (i+1)*14} {112 + i*8} L{430 - 70 - (i+1)*14} {112 + i*8} Z" fill="{"#43323d" if i%2 else "#8a6d78"}"/>' for i in range(9))
    + '<rect x="330" y="98" width="240" height="6" fill="#7a5f6c"/>'
    + '<rect x="296" y="70" width="3" height="110" fill="#2b2230"/><rect x="640" y="70" width="3" height="110" fill="#2b2230"/>'
    + lantern(297, 86, .7, '#f6c77f', '#2b2230') + lantern(641, 86, .7, '#f6c77f', '#2b2230')
    + cat(520, 128, 1, '#1f1822') + cat(600, 160, 1.1, '#1f1822', -1) + cat(446, 104, .8, '#1f1822')
    + '<rect y="176" width="800" height="24" fill="#2b2230"/>',
    '谷中「夕阳阶梯」：黄昏、老屋和猫')

# D10 home: dawn above a sea of clouds, plane heading home
S['day-10'] = svg('d10',
    grad('d10s', [(0, '#1d2f55'), (.55, '#6e7fa8'), (.85, '#f0b98a'), (1, '#f7d8a8')]),
    '<rect width="800" height="200" fill="url(#d10s)"/>' + '<!--TOP-->'
    + '<circle cx="620" cy="150" r="30" fill="#ffe1a8"/>'
    + ''.join(f'<circle cx="{x}" cy="{y}" r="1.1" fill="#fff" opacity=".7"/>' for x, y in [(60, 24), (140, 40), (220, 18), (300, 36), (380, 20), (460, 34)])
    + ''.join(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{c}"/>' for x, y, rx, ry, c in [
        (80, 176, 140, 34, '#e9d9d4'), (260, 170, 120, 30, '#f1e3d8'), (430, 180, 150, 34, '#e9d9d4'), (640, 176, 170, 30, '#f5e6d6'), (780, 170, 90, 26, '#e9d9d4'),
        (150, 196, 200, 26, '#fbf1e6'), (480, 198, 240, 28, '#fbf1e6'), (740, 198, 150, 24, '#fbf1e6')])
    + trail('d10t', 'M200 104 Q330 94 432 86')
    + plane(460, 82, .85, '#f3efe7', -8),
    '回家：清晨飞越云海')

# Home hero: Fuji over Lake Kawaguchi at dawn, 800x260
S['hero'] = (f'<svg class="hero-illo" viewBox="0 0 800 260" preserveAspectRatio="xMidYMax slice" role="img" aria-label="河口湖远眺富士山（插画）">'
    '<defs>' + grad('hs', [(0, '#22385f'), (.5, '#7d8fb5'), (.8, '#e9b38e'), (1, '#f6d3a2')]) + grad('hw', [(0, '#c8a7a4'), (1, '#1f3050')]) + '</defs>'
    '<rect width="800" height="260" fill="url(#hs)"/>'
    + mist([(40, 50, 280, 7), (470, 36, 300, 7), (560, 80, 200, 5)], '#fff', .35)
    + '<g transform="translate(0 24)">' + fuji(470, 150, 640, 132, '#3d4f7a', '#eef0f4', .28, 11) + '</g>'
    + '<path d="M0 176 Q140 150 280 166 Q340 172 380 174 L0 176 Z" fill="#26375a"/>'
    + '<path d="M600 174 Q700 152 800 158 L800 176 Z" fill="#26375a"/>'
    + '<rect y="174" width="800" height="86" fill="url(#hw)"/>'
    + '<g opacity=".3" transform="translate(0 372) scale(1 -1)"><g transform="translate(0 24)">' + fuji(470, 150, 640, 132, '#3d4f7a', '#eef0f4', .28, 11) + '</g></g>'
    + waves(180, 260, '#f2dccd', 8, .3, 21)
    + ''.join(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="#1c2a47"/>' for x, y, rx, ry in [(20,170,26,12),(60,166,22,14),(98,170,24,11),(640,168,22,12),(676,164,26,14),(716,168,22,11),(760,164,28,14),(800,168,24,12)])
    + '<rect width="800" height="260" filter="url(#il-grain)" opacity=".5" style="mix-blend-mode:multiply"/></svg>')

DEFS = ('<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>'
        '<filter id="il-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/>'
        '<feColorMatrix type="matrix" values="0 0 0 0 .45  0 0 0 0 .38  0 0 0 0 .3  0 0 0 .55 0"/></filter></defs></svg>')

if __name__ == '__main__':
    import re, os
    defs = re.search(r'<defs>(.*)</defs>', DEFS).group(1)
    os.makedirs('img/illo', exist_ok=True)
    for k, v in S.items():
        h = 260
        v = re.sub(r'<svg class="[^"]*" ', f'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="{h}" ', v, count=1)
        v = re.sub(r' role="img" aria-label="[^"]*"', '', v, count=1).replace('<defs>', '<defs>' + defs, 1)
        open(f"img/illo/{'home' if k == 'hero' else k}.svg", 'w', encoding='utf-8').write(v)
    print('wrote', len(S), 'files')
