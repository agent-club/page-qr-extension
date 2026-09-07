"""Create a Chrome Web Store upload ZIP from an explicit runtime allowlist."""
from pathlib import Path
import hashlib
import json
import re
import struct
import zipfile

ROOT = Path(__file__).resolve().parents[1]
FILES = [
    'manifest.json', 'popup.html', 'popup.css', 'popup.mjs', 'qr.mjs',
    'vendor/qrcode.mjs', 'vendor/LICENSE.qrcode-generator.txt',
    'icons/icon-16.png', 'icons/icon-32.png', 'icons/icon-48.png', 'icons/icon-128.png',
]

manifest = json.loads((ROOT / 'manifest.json').read_text())
package = json.loads((ROOT / 'package.json').read_text())
assert manifest['manifest_version'] == 3
assert manifest['version'] == package['version'], 'Manifest/package versions differ'
assert set(manifest['permissions']) == {'activeTab', 'storage'}
assert not manifest.get('host_permissions')
assert not manifest.get('content_scripts')
assert manifest['homepage_url'].startswith('https://')
assert "connect-src 'none'" in manifest['content_security_policy']['extension_pages']
assert manifest['action']['default_popup'] in FILES

for name in FILES:
    content = (ROOT / name).read_bytes()
    assert content, f'Empty runtime file: {name}'
    if name.endswith('.png'):
        assert content[:8] == b'\x89PNG\r\n\x1a\n'
        expected = int(name.split('-')[-1].split('.')[0])
        assert struct.unpack('>II', content[16:24]) == (expected, expected)
    else:
        source = content.decode('utf-8')
        assert not re.search(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}', source), f'Sensitive pattern: {name}'
        assert '/Users/' not in source, f'Machine-specific path: {name}'

output = ROOT / 'dist'
output.mkdir(exist_ok=True)
archive = output / f"page-qr-extension-{manifest['version']}.zip"
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED) as bundle:
    for name in FILES:
        info = zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        bundle.writestr(info, (ROOT / name).read_bytes())
with zipfile.ZipFile(archive) as bundle:
    assert bundle.testzip() is None
    assert bundle.namelist() == FILES
    assert 'manifest.json' in bundle.namelist()
digest = hashlib.sha256(archive.read_bytes()).hexdigest()
archive.with_suffix('.zip.sha256').write_text(f'{digest}  {archive.name}\n')
print(f'Chrome Web Store ZIP: {archive.name}')
print(f'Files: {len(FILES)}; bytes: {archive.stat().st_size}; SHA-256: {digest}')
