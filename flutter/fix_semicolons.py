import re

with open(r'C:\workspace\dashboard_single_file\temiz-dunya\flutter\analyze_output.txt', 'r', encoding='utf-16') as f:
    analyze_output = f.read()

with open(r'C:\workspace\dashboard_single_file\temiz-dunya\flutter\lib\admin_scoring_screen.dart', 'r', encoding='utf-8') as f:
    lines = f.read().split('\n')

errors = re.findall(r"Expected to find ';' - .*?admin_scoring_screen\.dart:(\d+):(\d+)", analyze_output)

for line_str, col_str in errors:
    line_idx = int(line_str) - 1
    col_idx = int(col_str) - 1
    
    target_idx = line_idx
    line_content = lines[line_idx]
    indent = len(line_content) - len(line_content.lstrip())
    
    if col_idx <= indent + 2:
        target_idx = line_idx - 1
        while target_idx >= 0 and not lines[target_idx].strip():
            target_idx -= 1
            
    if target_idx >= 0:
        if not lines[target_idx].rstrip().endswith(';'):
            lines[target_idx] = lines[target_idx].rstrip() + ';'

for i in range(len(lines)):
    if lines[i].strip() == '}' and i == 52:
        lines[i] = lines[i].replace('}', '};')

with open(r'C:\workspace\dashboard_single_file\temiz-dunya\flutter\lib\admin_scoring_screen.dart', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
