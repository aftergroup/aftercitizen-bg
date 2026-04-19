from pypdf import PdfReader

def fix(s):
    try:
        return s.encode('latin-1').decode('cp1251')
    except Exception:
        return s

with open('scripts/ut_dump.txt', 'w', encoding='utf-8') as out:
    for f in ['UT-020', 'UT-025', 'UT-026', 'UT-036', 'UT-037', 'UT-039', 'UT-040', 'UT-041', 'UT-042']:
        out.write(f'\n===== {f} =====\n')
        for i, p in enumerate(PdfReader(f'pdf/{f}.pdf').pages):
            out.write(f'--- page {i+1} ---\n')
            out.write(fix(p.extract_text()))
            out.write('\n')
