from pypdf import PdfReader
import os

def fix(s):
    # Try CP1251 re-decode; fall back to as-is for pages with proper Unicode fonts.
    try:
        return s.encode('latin-1').decode('cp1251')
    except Exception:
        return s

CODES = ['TD-001','TD-002','TD-003','TD-004','TD-005','TD-006','TD-007-1','TD-007-2','TD-008-1','TD-008-2']

for code in CODES:
    for label, folder in [('OFFICIAL', 'pdf'), ('RENDERED', 'pdf_compare')]:
        path = f'{folder}/{code}.pdf'
        if not os.path.exists(path):
            continue
        out_path = f'scripts/td_dump/{code}_{label}.txt'
        os.makedirs('scripts/td_dump', exist_ok=True)
        with open(out_path, 'w', encoding='utf-8') as out:
            out.write(f'===== {code} {label} =====\n')
            reader = PdfReader(path)
            for i, p in enumerate(reader.pages):
                out.write(f'--- page {i+1} ---\n')
                txt = p.extract_text() or ''
                # Only apply CP1251 fix if result contains mostly garbage latin-1
                fixed = fix(txt)
                # Prefer fixed if it contains Cyrillic, else keep original
                if any('\u0400' <= c <= '\u04FF' for c in fixed):
                    out.write(fixed)
                else:
                    out.write(txt)
                out.write('\n')
print('done')
