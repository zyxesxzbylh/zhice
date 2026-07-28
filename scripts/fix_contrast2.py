#!/usr/bin/env python3
"""Smart contrast fixer - preserves color character while fixing contrast."""
import colorsys

def linearize(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

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
    return f'#{max(0,min(255,int(r*255))):02x}{max(0,min(255,int(g*255))):02x}{max(0,min(255,int(b*255))):02x}'

def adjust_lightness_for_contrast(fg_hex, bg_hex, target_ratio, preserve_saturation=True):
    """Adjust fg lightness to meet target contrast ratio with bg. Preserves hue.
    For darkening: step negative. For lightening: step positive."""
    h, s, l = hex_to_hsl(fg_hex)
    bg_lum = luminance(bg_hex)
    fg_lum = luminance(fg_hex)
    
    # Determine direction: if fg is lighter than bg, darken fg
    direction = -1 if fg_lum > bg_lum else 1
    step = direction * 0.005
    sat = s if preserve_saturation else s
    
    best_hex = fg_hex
    for _ in range(200):
        l += step
        if l < 0.02 or l > 0.98:
            break
        new_hex = hsl_to_hex(h, sat, l)
        if contrast(new_hex, bg_hex) >= target_ratio:
            best_hex = new_hex
            # Continue slightly to find the minimum change needed
            for __ in range(10):
                l -= step * 0.3
                if l < 0.02 or l > 0.98:
                    break
                fine_hex = hsl_to_hex(h, sat, l)
                if contrast(fine_hex, bg_hex) >= target_ratio:
                    best_hex = fine_hex
                else:
                    break
            return best_hex
    
    return hsl_to_hex(h, sat, max(0.02, min(0.98, l)))

# All themes data
themes_data = {
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

# Apply fixes
print('=' * 80)
print('{"minimal","industrial",...}')
print('=' * 80)

for name, t in themes_data.items():
    surf = t['bg-surface']
    muted = t['bg-muted']
    
    # 1. Fix text-muted: need 3.5:1 on surface AND 3.0:1 on muted
    new_tm = adjust_lightness_for_contrast(t['text-muted'], surf, 3.5)
    if contrast(new_tm, muted) < 3.0:
        new_tm = adjust_lightness_for_contrast(new_tm, muted, 3.0)
    if new_tm != t['text-muted']:
        ratio_s = contrast(new_tm, surf)
        ratio_m = contrast(new_tm, muted)
        print(f"  {name}.text-muted: {t['text-muted']} -> {new_tm} ({ratio_s:.1f}:1 surf, {ratio_m:.1f}:1 muted)")
        t['text-muted'] = new_tm
    
    # 2. Fix border-default: need 2.0:1 on surface
    new_bd = adjust_lightness_for_contrast(t['border-default'], surf, 2.0)
    if new_bd != t['border-default']:
        ratio = contrast(new_bd, surf)
        print(f"  {name}.border-default: {t['border-default']} -> {new_bd} ({ratio:.1f}:1)")
        t['border-default'] = new_bd
    
    # 3. Fix color-warning: need 3.0:1 on surface  
    new_warn = adjust_lightness_for_contrast(t['color-warning'], surf, 3.0)
    if new_warn != t['color-warning']:
        ratio = contrast(new_warn, surf)
        print(f"  {name}.color-warning: {t['color-warning']} -> {new_warn} ({ratio:.1f}:1)")
        t['color-warning'] = new_warn
    
    # 4. Fix accent-text on accent: need 4.5:1
    new_acc = adjust_lightness_for_contrast(t['accent'], t['accent-text'], 4.5)
    if new_acc != t['accent']:
        ratio = contrast(t['accent-text'], new_acc)
        print(f"  {name}.accent: {t['accent']} -> {new_acc} ({ratio:.1f}:1)")
        t['accent'] = new_acc
        # Also adjust accent-hover if needed
        new_acc_h = adjust_lightness_for_contrast(t['accent-hover'], t['accent-text'], 4.5)
        if new_acc_h != t['accent-hover']:
            print(f"  {name}.accent-hover: {t['accent-hover']} -> {new_acc_h}")
            t['accent-hover'] = new_acc_h

# Final verification
print('\n=== 最终验证 ===')
total = 0
for name, t in themes_data.items():
    surf = t['bg-surface']
    checks = [
        ('text-muted/surf', contrast(t['text-muted'], surf), 3.5),
        ('text-muted/muted', contrast(t['text-muted'], t['bg-muted']), 3.0),
        ('border/surf', contrast(t['border-default'], surf), 2.0),
        ('warning/surf', contrast(t['color-warning'], surf), 3.0),
        ('accent-text/accent', contrast(t['accent-text'], t['accent']), 4.5),
    ]
    fails = [(d, r, th) for d, r, th in checks if r < th]
    if fails:
        print(f'  [{name}] {len(fails)} fails:', ', '.join(f'{d}={r:.1f}<{th}' for d,r,th in fails))
        total += len(fails)

if total == 0:
    print('  全部通过！')
else:
    print(f'  剩余 {total} 个问题')
