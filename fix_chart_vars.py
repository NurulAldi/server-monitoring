import os
import re

chart_dir = r'd:\Tugas_Kuliah\Semester-5\PJ\fix_final_project\frontend\komponen\bagan'
# Add ChartMemory explicitly
files_to_fix = [os.path.join(chart_dir, f) for f in os.listdir(chart_dir) if f.endswith('.tsx')]

replacements = [
    (r'var\(--bg-secondary\)', '#171a20'),
    (r'var\(--bg-border\)', '#393c41'),
    (r'var\(--bg-tertiary\)', '#222222'),
    (r'var\(--text-primary\)', '#eeeeee'),
    (r'var\(--text-secondary\)', '#8a8d91'),
    (r'var\(--text-muted\)', '#5c5e62'),
    (r'var\(--accent-primary\)', '#3e6ae1'),
    (r'var\(--accent-secondary\)', '#f7c948'),
    (r'var\(--accent-tertiary\)', '#3e6ae1'),
    (r'var\(--data-grid\)', '#393c41'),
    (r'var\(--status-warning\)', '#f7c948'),
    (r'var\(--status-critical\)', '#e31937'),
    (r'var\(--status-online\)', '#00d448'),
]

updated = 0
for filepath in files_to_fix:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        original = content
        for pattern, replacement in replacements:
            content = re.sub(pattern, replacement, content)
        if content != original:
            with open(filepath, 'w', encoding='utf-8', newline='') as f:
                f.write(content)
            print(f'✓ {filename}')
            updated += 1
os.path.basename(filepath)
print(f'\nUpdated {updated} chart files')
