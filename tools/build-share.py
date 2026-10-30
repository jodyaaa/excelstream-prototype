#!/usr/bin/env python3
"""Build a single-page, hostable copy of the prototype for external sharing (Artifact / any static host).

    python3 tools/build-share.py <out_dir>

- bundles js/*.js into one inline script (esbuild via npx), inlines css/*.css
- swaps the Pretendard CDN stylesheet for Google Fonts (Noto Sans KR) — hosted viewers only allow that font host
- writes <out_dir>/index.html as a *fragment* (no doctype/html/head/body: the host adds the skeleton) + copies assets/
"""
import re, shutil, subprocess, sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
out = Path(sys.argv[1]).resolve()
out.mkdir(parents=True, exist_ok=True)

js = subprocess.run(['npx', '--yes', 'esbuild@0.21.5', str(root / 'js/main.js'), '--bundle', '--minify', '--format=iife', '--target=es2020'],
                    check=True, capture_output=True, text=True).stdout
js = js.replace('</script', '<\\/script')
css = ''.join((root / 'css' / f).read_text() for f in ('tokens.css', 'styles.css')).replace('url(../assets/', 'url(assets/')

html = (root / 'index.html').read_text()
title = 'ExcelStream 프로토타입'
desc = re.search(r'<meta name="description" content="(.*?)"', html).group(1)
theme_boot = re.search(r'<script>(try \{ var t.*?)</script>', html).group(1)
body = re.search(r'<body[^>]*>(.*)</body>', html, re.S).group(1)
body = re.sub(r'\s*<script type="module" src="js/main.js"></script>', '', body)

fragment = f'''<title>{title}</title>
<meta name="description" content="{desc}" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800;900&display=swap" />
<style>
{css}
</style>
<script>{theme_boot}</script>
{body}
<script>{js}</script>
'''
(out / 'index.html').write_text(fragment)
dst = out / 'assets'
if dst.exists():
    shutil.rmtree(dst)
shutil.copytree(root / 'assets', dst)
print(f'{out}/index.html  {len(fragment)//1024} KB  +  assets/')
