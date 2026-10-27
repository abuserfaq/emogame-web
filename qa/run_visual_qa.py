#!/usr/bin/env python3
"""Visual QA: metrics + requires human/Read review of screenshots. Fails on truncation, bad avatars, sparse chat, tiny pins."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, sys
BASE='http://127.0.0.1:8765'
OUT=Path('/workspace/emogame/www/qa/final')
defects=[]
def add(vp,screen,msg):
  defects.append(f'{vp}/{screen}: {msg}')
def run():
  with sync_playwright() as p:
    b=p.chromium.launch(headless=True, channel='chrome')
    for vp,w,h in [('360x780',360,780),('412x915',412,915),('1366x768',1366,768)]:
      ctx=b.new_context(viewport={'width':w,'height':h}); page=ctx.new_page()
      page.goto(f'{BASE}/index.html?scr=1&go=home', wait_until='networkidle'); page.wait_for_timeout(400)
      body=page.inner_text('.hud-stats')
      for need in ['Энергия','Настрой','Голод','Жажда']:
        if need not in body: add(vp,'home', f"missing full HUD label '{need}'")
      for el in page.query_selector_all('.hud-stat .lab'):
        if el.evaluate('e=>e.scrollWidth>e.clientWidth+1'): add(vp,'home','HUD lab overflow')
      page.screenshot(path=str(OUT/vp/'home.png'))
      page.goto(f'{BASE}/index.html?scr=1&go=map', wait_until='networkidle'); page.wait_for_timeout(300)
      for lab in page.query_selector_all('.pin-lab'):
        fs=lab.evaluate('e=>parseFloat(getComputedStyle(e).fontSize)')
        if fs<14: add(vp,'map', f'pin font {fs}px too small')
      page.screenshot(path=str(OUT/vp/'map.png'))
      page.goto(f'{BASE}/index.html', wait_until='networkidle')
      page.evaluate("""()=>{localStorage.setItem('eg_created','1');localStorage.setItem('eg_care_onboard','1');
        const s=JSON.parse(localStorage.getItem('eg_save')||'{}');s.consent=1;s.style='emo';s.gender='guy';
        s.chat=[{me:true,t:'Привет'}];localStorage.setItem('eg_save',JSON.stringify(s));}""")
      page.goto(f'{BASE}/index.html?scr=1&go=chat', wait_until='networkidle'); page.wait_for_timeout(400)
      n=page.eval_on_selector_all('.chat-v2 .msg','els=>els.length')
      if n<4: add(vp,'chat', f'only {n} msgs — empty middle')
      for src in page.eval_on_selector_all('.chat-v2 .msg .av','els=>els.map(i=>i.src)'):
        if '/chars/' in src and '/avatars/' not in src: add(vp,'chat', f'full-body avatar {src}')
        if '/avatars/' not in src: add(vp,'chat', f'non-avatar src {src}')
      if page.evaluate("()=>/qr_[a-z0-9_]+/i.test(document.body.innerText)"): add(vp,'chat','qr_ token')
      page.screenshot(path=str(OUT/vp/'chat.png'))
      ctx.close()
    b.close()
  Path(OUT/'defects.json').write_text(json.dumps(defects,ensure_ascii=False,indent=2))
  print('DEFECTS', len(defects))
  for d in defects: print(' -', d)
  return 1 if defects else 0
if __name__=='__main__': sys.exit(run())
