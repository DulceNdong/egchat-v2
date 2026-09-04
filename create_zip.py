import os
import zipfile
from pathlib import Path

root = Path(r"c:\Users\User\Desktop\EGCHAT NATIVA")
dst = Path(r"c:\Users\User\Desktop\EGCHAT_NATIVA_WORK.zip")

if dst.exists():
    dst.unlink()

print('Creating ZIP:', dst)
with zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED, allowZip64=True) as zf:
    for folder, _, files in os.walk(root):
        folder_path = Path(folder)
        for f in files:
            fp = folder_path / f
            if fp == dst:
                continue
            zf.write(fp, fp.relative_to(root))

print('Done, size:', dst.stat().st_size)
