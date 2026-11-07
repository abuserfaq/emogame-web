# Build /tmp/emogame-tg-build for Telegram Mini App from emogame-web sources.
# Adds telegram-web-app.js + platform_tg.js; cache-busts assets; dark TG shell CSS.
import os, re, shutil, time
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.environ.get('TG_OUT') or '/tmp/emogame-tg-build'
SKIP = {'.git', 'docs', 'www', 'tg', 'PROGRESS_0.8.4.md', 'VERSION.txt', 'qa'}

shutil.rmtree(OUT, True)
os.makedirs(OUT)

# Copy web root (needed runtime files only)
for name in os.listdir(R):
  if name in SKIP or name.startswith('.'): continue
  src = os.path.join(R, name)
  dst = os.path.join(OUT, name)
  if os.path.isdir(src):
    shutil.copytree(src, dst, ignore=shutil.ignore_patterns('.git', '__pycache__', '*.md'))
  else:
    shutil.copy2(src, dst)

# Ensure platform_tg.js is present (from js/)
src_tg = os.path.join(R, 'js', 'platform_tg.js')
assert os.path.isfile(src_tg), 'missing js/platform_tg.js'
shutil.copy2(src_tg, os.path.join(OUT, 'js', 'platform_tg.js'))

h = open(os.path.join(OUT, 'index.html'), encoding='utf-8').read()
assert 'js/platform.js' in h
# Inject Telegram SDK + platform_tg after platform.js
h = h.replace(
  '<script src="js/platform.js?v=0.8.4.1"></script>',
  '<script src="https://telegram.org/js/telegram-web-app.js"></script>\n'
  '<script src="js/platform.js?v=0.8.4.1"></script>\n'
  '<script src="js/platform_tg.js?v=0.8.4.1"></script>'
)
# Also match unversioned form
if 'telegram-web-app.js' not in h:
  h = h.replace(
    '<script src="js/platform.js"></script>',
    '<script src="https://telegram.org/js/telegram-web-app.js"></script>'
    '<script src="js/platform.js"></script><script src="js/platform_tg.js"></script>'
  )
assert 'platform_tg.js' in h and 'telegram-web-app.js' in h

stamp = f'tg-{int(time.time())}'
h = re.sub(
  r'((?:src|href)="(?:js|css|vendor|fonts|img|content|assets)/[^"?]+(?:\.(?:js|css|png|webp|jpg|ttf|json|svg)))(?:\?[^"]*)?"',
  lambda m: m.group(1) + f'?v={stamp}"',
  h,
)
h = h.replace(f'telegram-web-app.js?v={stamp}', 'telegram-web-app.js')
# theme-color already dark
if 'theme-color' not in h:
  h = h.replace('</head>', '<meta name="theme-color" content="#0a0a0c"></head>')
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(h)

# Append TG shell CSS
for css_name in ('css/style.css', 'css/v084.css'):
  path = os.path.join(OUT, css_name)
  if not os.path.isfile(path): continue
  css = open(path, encoding='utf-8').read()
  if 'tg-viewport' not in css and css_name.endswith('style.css'):
    css += (
      '\n/* Telegram Mini App shell (tg-viewport) */\n'
      'html,body{overscroll-behavior:none;background:#0a0a0c!important;background-color:#0a0a0c!important;}\n'
      '#root{background:#0a0a0c!important;}\n'
      '#bannerStrip{display:none!important;}\n'
    )
    open(path, 'w', encoding='utf-8').write(css)

# Never ship secrets
for root, dirs, files in os.walk(OUT):
  for f in files:
    low = f.lower()
    if any(x in low for x in ('.env', 'secret', 'token', '.pem')):
      os.remove(os.path.join(root, f))

open(os.path.join(OUT, '.nojekyll'), 'w').write('')
print(OUT)
