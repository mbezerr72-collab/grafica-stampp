# Marca a versão nos links de JS e CSS (ex.: ui.js?v=9) para o navegador baixar sempre a versão nova.
# Rode depois de cada mudança:  python tools/versao.py
import re, glob, time
v = time.strftime('%y%m%d%H%M')
files = glob.glob('*.html') + glob.glob('js/*.js')
pat = re.compile(r"""((?:from |import\(|src=|href=)['"](?:\.{0,2}/)?(?:js|css|data|\.\.?)/?[^'"?]*\.(?:js|css))(?:\?v=\d+)?(['"])""")
for f in files:
    s = open(f, encoding='utf-8').read()
    n = pat.sub(rf"\1?v={v}\2", s)
    if n != s:
        open(f, 'w', encoding='utf-8').write(n)
print('versão', v)
