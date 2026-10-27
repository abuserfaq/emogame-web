#!/usr/bin/env python3
"""Playwright QA: 3 viewports × screens + sheets. Saves www/qa/final/<vp>/<screen>.png"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, re, sys

BASE = 'http://127.0.0.1:8765'
OUT = Path('/workspace/emogame/www/qa/final')
VIEWPORTS = [
  ('360x780', 360, 780),
  ('412x915', 412, 915),
  ('1366x768', 1366, 768),
]
# go= targets via ?scr=1&go=
SCREENS = [
  ('home', 'home'),
  ('food', 'feed'),
  ('wardrobe', 'wardrobe'),
  ('map', 'map'),
  ('metro', 'metro'),
  ('chat', 'chat'),
  ('gifts', 'gifts'),
  ('more', 'more'),
  ('create', 'create'),
  ('account', 'account'),
]
# Sheets opened from home via eval
SHEETS = ['quests', 'shop']

issues = []

def seed_chat_with_bad_tokens(page):
  page.evaluate("""() => {
    try {
      const raw = localStorage.getItem('eg_save');
      const s = raw ? JSON.parse(raw) : {};
      s.chat = [
        {me:true,t:'Привет'},
        {me:false,t:'Как дела,qr_broken'},
        {me:true,t:'Как дела'},
        {me:false,t:'Привет,**qr_heart**'},
        {me:false,t:'Идём гулять,qr_bat'}
      ];
      localStorage.setItem('eg_save', JSON.stringify(s));
    } catch(e){}
  }""")

def check_page(page, vp, name):
  # qr tokens
  body = page.inner_text('body')
  if re.search(r'qr_[a-z0-9_]+', body, re.I):
    issues.append(f'{vp}/{name}: raw qr_ token visible')
  # nav fully in viewport
  nav = page.query_selector('.nav-dock')
  if nav:
    box = nav.bounding_box()
    vw = page.viewport_size['width']
    vh = page.viewport_size['height']
    if box:
      bottom = box['y'] + box['height']
      if bottom > vh + 1:
        issues.append(f'{vp}/{name}: nav clipped bottom={bottom:.0f} vh={vh}')
      if box['y'] < -1:
        issues.append(f'{vp}/{name}: nav clipped top')
  # banner must be inside #app
  ban = page.query_selector('#bannerStrip.on')
  app = page.query_selector('#app')
  if ban and app:
    bb = ban.bounding_box(); ab = app.bounding_box()
    if bb and ab:
      if bb['y'] + bb['height'] > ab['y'] + ab['height'] + 2:
        issues.append(f'{vp}/{name}: banner extends past #app')
      if bb['x'] + 2 < ab['x'] or bb['x'] + bb['width'] > ab['x'] + ab['width'] + 2:
        # on desktop banner should not span full browser
        if vw >= 500:
          issues.append(f'{vp}/{name}: banner wider than #app (desktop leak)')
  # sheet fit
  sheet = page.query_selector('.eg-sheet')
  if sheet and app:
    sb = sheet.bounding_box(); ab = app.bounding_box()
    if sb and ab:
      if sb['y'] + sb['height'] > ab['y'] + ab['height'] + 2:
        issues.append(f'{vp}/{name}: sheet overflows #app bottom')
      # internal scroll exists if content tall
      overflow = page.evaluate("""() => {
        const b=document.querySelector('.eg-sheet-body');
        return b ? (b.scrollHeight - b.clientHeight) : 0;
      }""")
      # just info
  # sheet-art present when sheet open
  if name in ('quests','shop'):
    arts = page.query_selector_all('.sheet-art')
    if len(arts) < 2:
      issues.append(f'{vp}/{name}: expected sheet-art images, got {len(arts)}')
    cards = page.query_selector_all('.sheet-card')
    if cards:
      heights = []
      for c in cards:
        b = c.bounding_box()
        if b: heights.append(round(b['height']))
      if heights and max(heights) - min(heights) > 40:
        issues.append(f'{vp}/{name}: ragged card heights {heights}')

def shot(page, vp, name):
  dest = OUT / vp / f'{name}.png'
  dest.parent.mkdir(parents=True, exist_ok=True)
  page.screenshot(path=str(dest), full_page=False)
  return dest

def run():
  with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel='chrome')
    for vp, w, h in VIEWPORTS:
      print(f'=== {vp} ===')
      ctx = browser.new_context(viewport={'width':w,'height':h}, device_scale_factor=1)
      page = ctx.new_page()
      # seed bad chat then load chat screen
      for sname, go in SCREENS:
        url = f'{BASE}/index.html?scr=1&go={go}'
        page.goto(url, wait_until='networkidle', timeout=60000)
        page.wait_for_timeout(600)
        if go == 'chat':
          seed_chat_with_bad_tokens(page)
          page.goto(url, wait_until='networkidle', timeout=60000)
          page.wait_for_timeout(500)
        check_page(page, vp, sname)
        shot(page, vp, sname)
        print(' ', sname)
      # sheets from home
      page.goto(f'{BASE}/index.html?scr=1&go=home', wait_until='networkidle', timeout=60000)
      page.wait_for_timeout(500)
      # enable banner for ad-overlap test on one non-shot reload
      page.goto(f'{BASE}/index.html?go=home', wait_until='networkidle', timeout=60000)
      page.evaluate("""() => {
        localStorage.setItem('eg_created','1');
        localStorage.setItem('eg_care_onboard','1');
        const s=JSON.parse(localStorage.getItem('eg_save')||'{}');
        s.consent=Date.now(); s.name=s.name||'xShadow_666';
        s.style='emo'; s.gender='guy';
        localStorage.setItem('eg_save', JSON.stringify(s));
      }""")
      page.goto(f'{BASE}/index.html?go=home', wait_until='networkidle', timeout=60000)
      page.wait_for_timeout(700)
      # open quests
      page.evaluate("""() => { if (typeof openQuests==='function') openQuests(); }""")
      page.wait_for_timeout(400)
      check_page(page, vp, 'quests')
      shot(page, vp, 'quests')
      print('  quests sheet')
      page.evaluate("""() => { const r=document.querySelector('.eg-sheet-root'); if(r&&r._close) r._close(); else if(r) r.remove(); }""")
      page.wait_for_timeout(200)
      page.evaluate("""() => { if (typeof openShop==='function') openShop(); }""")
      page.wait_for_timeout(400)
      check_page(page, vp, 'shop')
      shot(page, vp, 'shop')
      print('  shop sheet')
      # banner+nav check on home without sheet
      page.evaluate("""() => { const r=document.querySelector('.eg-sheet-root'); if(r&&r._close) r._close(); else if(r) r.remove(); }""")
      page.wait_for_timeout(200)
      check_page(page, vp, 'home_ads')
      shot(page, vp, 'home_ads')
      ctx.close()
    browser.close()
  print('\\nISSUES:', len(issues))
  for i in issues:
    print(' -', i)
  Path('/workspace/emogame/www/qa/final/issues.json').write_text(json.dumps(issues, ensure_ascii=False, indent=2))
  return 0 if not issues else 1

if __name__ == '__main__':
  sys.exit(run())
