#!/usr/bin/env python3
"""Auto-fix contrast ratios across all 17 themes to meet WCAG AA."""
import colorsys

def linearize(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def unlinearize(l):
    return 12.92 * l if l <= 0.0031308 else (1.055 * (l ** (1/2.4)) - 0.055)

def luminance(hex_color):
    hex_color = hex_color.lstrip('#')
    r, g, b = int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16)
    return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)

def contrast(fg, bg):
    l1, l2 = luminance(fg), luminance(bg)
    if l1 < l2: l1, l2 = l2, l1
    return (l1 + 0.05) / (l2 + 0.05)

def hex_to_hsl(hex_color):
    hex_color = hex_color.lstrip('#')
    r, g, b = int(hex_color[0:2], 16)/255, int(hex_color[2:4], 16)/255, int(hex_color[4:6], 16)/255
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    return h, s, l

def hsl_to_hex(h, s, l):
    r, g, b = colorsys.hls_to_rgb(h, l, s)
    return f'#{int(r*255):02x}{int(g*255):02x}{int(b*255):02x}'

def darken_until_contrast(fg_hex, bg_hex, target_contrast, step=0.02, max_iter=30):
    """Darken fg until contrast with bg meets target. Returns new hex."""
    h, s, l = hex_to_hsl(fg_hex)
    bg_lum = luminance(bg_hex)
    
    # If fg is lighter than bg, we need to darken it
    if luminance(fg_hex) > bg_lum:
        for _ in range(max_iter):
            l -= step
            if l < 0.01: break
            new_hex = hsl_to_hex(h, s, l)
            if contrast(new_hex, bg_hex) >= target_contrast:
                return new_hex
        return hsl_to_hex(h, s, max(0.01, l))
    else:
        # fg is darker than bg, need to lighten
        for _ in range(max_iter):
            l += step
            if l > 0.99: break
            new_hex = hsl_to_hex(h, s, l)
            if contrast(new_hex, bg_hex) >= target_contrast:
                return new_hex
        return hsl_to_hex(h, s, min(0.99, l))

def fix_accent(accent_hex, accent_text_hex, target=4.5):
    """Ensure accent_text has enough contrast on accent."""
    if contrast(accent_text_hex, accent_hex) >= target:
        return accent_hex, accent_text_hex
    
    h, s, l = hex_to_hsl(accent_hex)
    # If text is light (white), darken the accent
    if luminance(accent_text_hex) > 0.5:
        for _ in range(40):
            l -= 0.015
            if l < 0.05: break
            new_hex = hsl_to_hex(h, s, l)
            if contrast(accent_text_hex, new_hex) >= target:
                return new_hex, accent_text_hex
        return hsl_to_hex(h, s, max(0.05, l)), accent_text_hex
    else:
        for _ in range(40):
            l += 0.015
            if l > 0.95: break
            new_hex = hsl_to_hex(h, s, l)
            if contrast(accent_text_hex, new_hex) >= target:
                return new_hex, accent_text_hex
        return hsl_to_hex(h, s, min(0.95, l)), accent_text_hex

# Apply fixes to each theme
themes = {
    'minimal': {'bg-surface':'#ffffff','bg-root':'#fafaf8','bg-muted':'#f0f0ed','text-primary':'#1a1a1a','text-secondary':'#6b6b65','text-muted':'#a0a09a','text-inverse':'#fafaf8','accent':'#3d3d3a','accent-hover':'#1a1a1a','accent-muted':'#f0f0ed','accent-text':'#ffffff','border-default':'#e8e8e4','border-strong':'#d4d4ce','border-subtle':'#f0f0ed','color-success':'#4a9e7b','color-warning':'#d4a24e','color-danger':'#d15b4c','color-info':'#5b8db8'},
    'industrial': {'bg-surface':'#f4f4f3','bg-root':'#eceded','bg-muted':'#e2e2df','text-primary':'#1c1c1e','text-secondary':'#5c5c5e','text-muted':'#8e8e90','text-inverse':'#eceded','accent':'#4a4a4c','accent-hover':'#2a2a2c','accent-muted':'#e2e2df','accent-text':'#f4f4f3','border-default':'#d1d1ce','border-strong':'#b0b0ac','border-subtle':'#e2e2df','color-success':'#5c8a6e','color-warning':'#c49a4a','color-danger':'#c45a4a','color-info':'#5a7a9a'},
    'smart': {'bg-surface':'#ffffff','bg-root':'#f5f7fa','bg-muted':'#ebeff5','text-primary':'#0f172a','text-secondary':'#475569','text-muted':'#94a3b8','text-inverse':'#f8fafc','accent':'#4f6ef7','accent-hover':'#3b54d4','accent-muted':'#eef2ff','accent-text':'#ffffff','border-default':'#e2e8f0','border-strong':'#cbd5e1','border-subtle':'#f1f5f9','color-success':'#10b981','color-warning':'#f59e0b','color-danger':'#ef4444','color-info':'#6366f1'},
    'cyber': {'bg-surface':'#131a24','bg-root':'#0b0f16','bg-muted':'#1a2230','text-primary':'#e2e8f0','text-secondary':'#94a3b8','text-muted':'#64748b','text-inverse':'#0b0f16','accent':'#22d3ee','accent-hover':'#67e8f9','accent-muted':'#0f2838','accent-text':'#0b0f16','border-default':'#1e293b','border-strong':'#334155','border-subtle':'#1a2230','color-success':'#34d399','color-warning':'#fbbf24','color-danger':'#f87171','color-info':'#818cf8'},
    'mist': {'bg-surface':'#fdfcfd','bg-root':'#f7f5f9','bg-muted':'#edeaf2','text-primary':'#2d2640','text-secondary':'#6b6380','text-muted':'#9e96b0','text-inverse':'#f7f5f9','accent':'#7c6baa','accent-hover':'#5e4f8a','accent-muted':'#edeaf2','accent-text':'#ffffff','border-default':'#e4dff0','border-strong':'#cdc4de','border-subtle':'#edeaf2','color-success':'#5ea888','color-warning':'#c8a356','color-danger':'#d46e60','color-info':'#6b8fbf'},
    'ink': {'bg-surface':'#faf7f0','bg-root':'#f5f0e8','bg-muted':'#ebe4d4','text-primary':'#2c2416','text-secondary':'#6b5e4a','text-muted':'#9e9078','text-inverse':'#f5f0e8','accent':'#5c3d2e','accent-hover':'#3d2518','accent-muted':'#ebe4d4','accent-text':'#faf7f0','border-default':'#e2d9c4','border-strong':'#c4b898','border-subtle':'#ebe4d4','color-success':'#5c8a6e','color-warning':'#c4944a','color-danger':'#c45a4a','color-info':'#5a7a9a'},
    'ocean': {'bg-surface':'#131d2e','bg-root':'#0c1420','bg-muted':'#1a2740','text-primary':'#dce4f0','text-secondary':'#8ea4c0','text-muted':'#5a7090','text-inverse':'#0c1420','accent':'#5b9cf5','accent-hover':'#80b8f8','accent-muted':'#152338','accent-text':'#0c1420','border-default':'#1e3050','border-strong':'#304868','border-subtle':'#1a2740','color-success':'#3ecf8e','color-warning':'#f0b840','color-danger':'#f06060','color-info':'#8098f8'},
    'forest': {'bg-surface':'#fafbf8','bg-root':'#f4f7f2','bg-muted':'#e7ece2','text-primary':'#1c2618','text-secondary':'#546348','text-muted':'#8a9a7e','text-inverse':'#f4f7f2','accent':'#4a7c3f','accent-hover':'#365c2e','accent-muted':'#e7ece2','accent-text':'#fafbf8','border-default':'#dce4d4','border-strong':'#bcc8ae','border-subtle':'#e7ece2','color-success':'#4a8c3f','color-warning':'#c4943a','color-danger':'#c45a4a','color-info':'#4a7a9c'},
    'dawn': {'bg-surface':'#fffdfa','bg-root':'#fdf8f2','bg-muted':'#f5ead4','text-primary':'#3d2e1a','text-secondary':'#7a6544','text-muted':'#b09a70','text-inverse':'#fdf8f2','accent':'#b87333','accent-hover':'#8c5622','accent-muted':'#f5ead4','accent-text':'#fffdfa','border-default':'#f0e0c0','border-strong':'#dcc898','border-subtle':'#f5ead4','color-success':'#5c8a5e','color-warning':'#d4a24e','color-danger':'#d15b4c','color-info':'#5b8db8'},
    'zen': {'bg-surface':'#fdfdfb','bg-root':'#fafaf7','bg-muted':'#eeede6','text-primary':'#2a2820','text-secondary':'#6e6b5e','text-muted':'#a09d90','text-inverse':'#fafaf7','accent':'#6b8a6e','accent-hover':'#4d6650','accent-muted':'#e6f0e2','accent-text':'#ffffff','border-default':'#e6e4da','border-strong':'#cecbb8','border-subtle':'#eeede6','color-success':'#6b8a6e','color-warning':'#c4a04a','color-danger':'#c45a4a','color-info':'#6b8098'},
    'amber': {'bg-surface':'#fffcf8','bg-root':'#fdf7f0','bg-muted':'#f5e8d0','text-primary':'#3a2010','text-secondary':'#7a5030','text-muted':'#b08060','text-inverse':'#fdf7f0','accent':'#c07030','accent-hover':'#905020','accent-muted':'#f5e8d0','accent-text':'#fffcf8','border-default':'#f0dcb8','border-strong':'#d8b890','border-subtle':'#f5e8d0','color-success':'#5c8a5e','color-warning':'#d4a040','color-danger':'#d05a4a','color-info':'#5b8ab0'},
    'starry': {'bg-surface':'#141829','bg-root':'#0d0f1a','bg-muted':'#1c2240','text-primary':'#d8d6f0','text-secondary':'#8e8ab0','text-muted':'#5a5680','text-inverse':'#0d0f1a','accent':'#8b7cf0','accent-hover':'#a89ef8','accent-muted':'#1a1840','accent-text':'#0d0f1a','border-default':'#252340','border-strong':'#3d3870','border-subtle':'#1c2040','color-success':'#4adea0','color-warning':'#f0c040','color-danger':'#f06070','color-info':'#8098f8'},
    'mint': {'bg-surface':'#fdfefd','bg-root':'#f5faf8','bg-muted':'#e6f2ec','text-primary':'#1a2a22','text-secondary':'#4a6a5a','text-muted':'#809a8a','text-inverse':'#f5faf8','accent':'#3db88b','accent-hover':'#2a9068','accent-muted':'#e6f2ec','accent-text':'#ffffff','border-default':'#d8ece2','border-strong':'#b0d0ba','border-subtle':'#e6f2ec','color-success':'#3db88b','color-warning':'#d4a040','color-danger':'#d05a50','color-info':'#5b8ab8'},
    'moonlit': {'bg-surface':'#222528','bg-root':'#1a1c1e','bg-muted':'#2a2e32','text-primary':'#e0e0dc','text-secondary':'#909090','text-muted':'#606060','text-inverse':'#1a1c1e','accent':'#c0c0b8','accent-hover':'#d8d8d0','accent-muted':'#2a2a28','accent-text':'#1a1c1e','border-default':'#353a40','border-strong':'#505860','border-subtle':'#2a2e32','color-success':'#5ab890','color-warning':'#d4a850','color-danger':'#d46860','color-info':'#7098c0'},
    'lavender': {'bg-surface':'#fefdfe','bg-root':'#faf7fc','bg-muted':'#efe6f5','text-primary':'#382840','text-secondary':'#706080','text-muted':'#a090b0','text-inverse':'#faf7fc','accent':'#9b6ec0','accent-hover':'#7a4ea0','accent-muted':'#efe6f5','accent-text':'#ffffff','border-default':'#e6daf0','border-strong':'#ceb8e0','border-subtle':'#efe6f5','color-success':'#5ea888','color-warning':'#c8a050','color-danger':'#d46a60','color-info':'#6b8cc0'},
    'arctic': {'bg-surface':'#ffffff','bg-root':'#f8fafd','bg-muted':'#edf2f8','text-primary':'#1e2a3a','text-secondary':'#506070','text-muted':'#90a0b0','text-inverse':'#f8fafd','accent':'#5090d0','accent-hover':'#3870b0','accent-muted':'#e8f0f8','accent-text':'#ffffff','border-default':'#e2eaf4','border-strong':'#c0d0e0','border-subtle':'#edf2f8','color-success':'#5ab880','color-warning':'#d0a848','color-danger':'#d46060','color-info':'#6088c0'},
    'rosegold': {'bg-surface':'#fffdfc','bg-root':'#fdf8f6','bg-muted':'#f5eae4','text-primary':'#3a2220','text-secondary':'#7a5048','text-muted':'#b08070','text-inverse':'#fdf8f6','accent':'#c87860','accent-hover':'#a05840','accent-muted':'#f5eae4','accent-text':'#ffffff','border-default':'#f0ded4','border-strong':'#d8b8a8','border-subtle':'#f5eae4','color-success':'#5ea870','color-warning':'#d0a048','color-danger':'#d46058','color-info':'#6b88b8'},
}

changes = {}
for name, vars_data in themes.items():
    t = dict(vars_data)
    surf = t['bg-surface']
    muted = t['bg-muted']
    
    # 1. Fix text-muted on bg-surface: need >= 3.5:1
    old_tm = t['text-muted']
    new_tm = darken_until_contrast(old_tm, surf, 3.5)
    t['text-muted'] = new_tm
    
    # 2. Fix text-muted on bg-muted: need >= 3.0:1
    new_tm2 = darken_until_contrast(t['text-muted'], muted, 3.0)
    t['text-muted'] = new_tm2
    
    # 3. Fix border-default on bg-surface: need >= 2.0:1
    old_bd = t['border-default']
    new_bd = darken_until_contrast(old_bd, surf, 2.0)
    t['border-default'] = new_bd
    
    # 4. Fix color-warning on bg-surface: need >= 3.0:1
    old_warn = t['color-warning']
    new_warn = darken_until_contrast(old_warn, surf, 3.0)
    t['color-warning'] = new_warn
    
    # 5. Fix accent-text on accent: need >= 4.5:1
    new_accent, new_accent_text = fix_accent(t['accent'], t['accent-text'], 4.5)
    t['accent'] = new_accent
    t['accent-text'] = new_accent_text
    
    # Also fix accent-hover similarly
    new_accent_h, _ = fix_accent(t['accent-hover'], t['accent-text'], 4.5)
    t['accent-hover'] = new_accent_h
    
    changes[name] = {
        'text-muted': (vars_data['text-muted'], t['text-muted']),
        'border-default': (vars_data['border-default'], t['border-default']),
        'color-warning': (vars_data['color-warning'], t['color-warning']),
        'accent': (vars_data['accent'], t['accent']),
        'accent-hover': (vars_data['accent-hover'], t['accent-hover']),
        'accent-text': (vars_data['accent-text'], t['accent-text']),
    }

print('=' * 80)
print('对比度自动修复结果')
print('=' * 80)
for name, ch in changes.items():
    print(f'\n{name}:')
    for key, (old, new) in ch.items():
        if old != new:
            print(f'  {key}: {old} → {new}')
        else:
            print(f'  {key}: {old} (无需修改)')
