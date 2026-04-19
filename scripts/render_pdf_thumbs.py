"""Render PDFs in pdf/ and pdf_compare/ as PNG thumbnails for side-by-side compare."""
import fitz
import os
import sys

CODES = sys.argv[1:] or [
    'TD-001','TD-002','TD-003','TD-004','TD-005','TD-006',
    'TD-007-1','TD-007-2','TD-008-1','TD-008-2',
]

for code in CODES:
    for label, folder in [('official', 'pdf'), ('rendered', 'pdf_compare')]:
        src = f'{folder}/{code}.pdf'
        if not os.path.exists(src):
            continue
        out_dir = f'scripts/thumbs/{code}'
        os.makedirs(out_dir, exist_ok=True)
        doc = fitz.open(src)
        for i, page in enumerate(doc):
            pix = page.get_pixmap(dpi=110)
            pix.save(f'{out_dir}/{label}_p{i+1}.png')
        doc.close()
print('done')
