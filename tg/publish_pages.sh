#!/bin/bash
# Publish Emogame Telegram Mini App under /emogame-tg/ on abuserfaq/raccoons-fs Pages.
# Preserves existing FS root, /tg/ (Raccoons) and /sklepy-tg/. Never commits secrets.
set -euo pipefail
R=$(cd "$(dirname "$0")/.." && pwd); REPO=abuserfaq/raccoons-fs; W=/tmp/raccoons-fs-pages-emogame
python3 "$R/tg/build_tg.py"
rm -rf "$W" && mkdir -p "$W" && cd "$W"
# Fresh clone of current Pages
git clone -q --depth 1 "https://github.com/$REPO.git" .
# Keep other folders; only replace emogame-tg
rm -rf emogame-tg && mkdir -p emogame-tg
cp -a /tmp/emogame-tg-build/. emogame-tg/
# never commit secrets
find . \( -name '*.env' -o -name '*secret*' -o -name '*token*' -o -name '*.pem' \) ! -path './.git/*' -print -delete | head || true
git add -A
if git diff --cached --quiet; then
  echo "no changes"
else
  git -c user.name=abuserfaq -c user.email=abuserfaq@users.noreply.github.com commit -qm "publish emogame-tg $(date -Iseconds)"
  # pull --rebase in case sklepy worker pushed
  git pull --rebase --autostash -q origin main || {
    echo "rebase conflict — retrying with fresh clone merge"
    git rebase --abort 2>/dev/null || true
    cd /tmp && rm -rf raccoons-fs-pages-emogame2
    git clone -q --depth 1 "https://github.com/$REPO.git" raccoons-fs-pages-emogame2
    cd raccoons-fs-pages-emogame2
    rm -rf emogame-tg && mkdir -p emogame-tg
    cp -a /tmp/emogame-tg-build/. emogame-tg/
    git add -A
    git -c user.name=abuserfaq -c user.email=abuserfaq@users.noreply.github.com commit -qm "publish emogame-tg $(date -Iseconds)" || true
    git push -qf "https://github.com/$REPO.git" HEAD:main
    echo "https://abuserfaq.github.io/raccoons-fs/emogame-tg/"
    exit 0
  }
  git push -qf "https://github.com/$REPO.git" HEAD:main
fi
echo "https://abuserfaq.github.io/raccoons-fs/emogame-tg/"
