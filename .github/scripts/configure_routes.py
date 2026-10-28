"""Configure clean URLs for the existing relaxpic.cn OpenResty virtual host."""
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

MARKER = '# VitePress clean URLs'
RULES = r'''
    # VitePress clean URLs
    if ($request_uri ~ "^/index\.html(?:\?.*)?$") {
        return 301 /$is_args$args;
    }
    if ($request_uri ~ "^(/[^?]+)\.html(?:\?.*)?$") {
        return 301 $1$is_args$args;
    }
    location / {
        try_files $uri $uri.html $uri/ =404;
    }
'''


def add_routes(text):
    if not re.search(r'server_name\s+relaxpic\.cn\s*;', text):
        raise ValueError('Unexpected virtual host; refusing to change it')
    if MARKER in text:
        return text
    if re.search(r'location\s+(?:=\s+)?/\s*\{', text):
        raise ValueError('An existing root location needs review')
    updated, count = re.subn(r'(?m)^([ \t]*root /www/sites/relaxpic\.cn/index;[ \t]*)$', lambda m: m[0] + '\n' + RULES, text)
    if count != 1:
        raise ValueError('Expected exactly one website root')
    return updated


def main():
    config = Path('/opt/1panel/apps/openresty/openresty/conf/conf.d/relaxpic.cn.conf')
    original = config.read_text()
    updated = add_routes(original)
    if updated == original:
        print('Clean URL rules are already configured')
        return
    command = ['docker', 'exec', 'openresty', 'sh', '-c', 'exec "$(command -v openresty || command -v nginx)" "$@"', 'sh']
    subprocess.run(command + ['-t'], check=True)
    backup = Path('/opt/1panel/apps/openresty/openresty/www/sites/relaxpic.cn/backups')
    backup.mkdir(exist_ok=True)
    destination = backup / f'openresty-before-clean-urls-{time.time_ns()}.conf'
    shutil.copy2(config, destination)
    print(f'Configuration backup: {destination}', flush=True)
    try:
        config.write_text(updated)
        subprocess.run(command + ['-t'], check=True)
        subprocess.run(command + ['-s', 'reload'], check=True)
    except Exception:
        shutil.copy2(destination, config)
        subprocess.run(command + ['-t'], check=True)
        subprocess.run(command + ['-s', 'reload'], check=True)
        raise
    print('relaxpic.cn clean URL rules applied and OpenResty reloaded')


if __name__ == '__main__':
    if sys.argv[1:] == ['--test']:
        source = 'server {\n    server_name relaxpic.cn;\n    root /www/sites/relaxpic.cn/index; \n    error_page 404 /404.html;\n}\n'
        updated = add_routes(source)
        assert updated.count(MARKER) == 1
        assert 'try_files $uri $uri.html $uri/ =404;' in updated
        assert '$request_uri' in updated and 'error_page 404 /404.html;' in updated
        assert add_routes(updated) == updated
        for invalid in [source.replace('server_name relaxpic.cn;', 'server_name another.example;'), source.replace('error_page', 'location / { }\n    error_page')]:
            try:
                add_routes(invalid)
            except ValueError:
                pass
            else:
                raise AssertionError('Unexpected configuration must be rejected')
        print('Clean URL configuration checks passed')
    else:
        main()
