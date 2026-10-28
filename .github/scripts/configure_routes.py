"""Configure clean URLs for the existing relaxpic.cn OpenResty virtual host."""
import argparse
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


def add_routes(text, site_root):
    if not re.search(r'server_name\s+relaxpic\.cn\s*;', text):
        raise ValueError('Unexpected virtual host; refusing to change it')
    if MARKER in text:
        return text
    if re.search(r'location\s+(?:=\s+)?/\s*\{', text):
        raise ValueError('An existing root location needs review')
    root_directive = rf'(?m)^([ \t]*root {re.escape(site_root)};[ \t]*)$'
    updated, count = re.subn(root_directive, lambda m: m[0] + '\n' + RULES, text)
    if count != 1:
        raise ValueError('Expected exactly one website root')
    return updated


def configure(config, backup, container, site_root):
    original = config.read_text()
    updated = add_routes(original, site_root)
    if updated == original:
        print('Clean URL rules are already configured')
        return
    command = ['docker', 'exec', container, 'sh', '-c', 'exec "$(command -v openresty || command -v nginx)" "$@"', 'sh']
    subprocess.run(command + ['-t'], check=True)
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


def test_routes():
    site_root = '/srv/relaxpic/site'
    source = f'server {{\n    server_name relaxpic.cn;\n    root {site_root}; \n    error_page 404 /404.html;\n}}\n'
    updated = add_routes(source, site_root)
    assert updated.count(MARKER) == 1
    assert 'try_files $uri $uri.html $uri/ =404;' in updated
    assert '$request_uri' in updated and 'error_page 404 /404.html;' in updated
    assert add_routes(updated, site_root) == updated
    invalid_sources = [
        source.replace('server_name relaxpic.cn;', 'server_name another.example;'),
        source.replace('error_page', 'location / { }\n    error_page'),
    ]
    for invalid in invalid_sources:
        try:
            add_routes(invalid, site_root)
        except ValueError:
            pass
        else:
            raise AssertionError('Unexpected configuration must be rejected')
    print('Clean URL configuration checks passed')


def main():
    if sys.argv[1:] == ['--test']:
        test_routes()
        return
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config', type=Path, required=True)
    parser.add_argument('--backup', type=Path, required=True)
    parser.add_argument('--container', required=True)
    parser.add_argument('--site-root', required=True)
    args = parser.parse_args()
    configure(args.config, args.backup, args.container, args.site_root)


if __name__ == '__main__':
    main()
