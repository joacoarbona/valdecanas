"""Before/after images (stacked, labelled) and the comparison video."""
import os, sys, subprocess
from PIL import Image, ImageDraw, ImageFont
R = os.path.dirname(os.path.abspath(__file__)); OUT = R + '/out'; os.makedirs(OUT, exist_ok=True)
FB = '/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf'
FR = '/usr/share/fonts/truetype/google-fonts/Poppins-Regular.ttf'
if not os.path.exists(FR): FR = FB

def label(im, title, sub, scale=1.0):
    d = ImageDraw.Draw(im, 'RGBA'); f1 = ImageFont.truetype(FB, int(30 * scale)); f2 = ImageFont.truetype(FR, int(19 * scale))
    pad = int(14 * scale); x = y = int(18 * scale)
    w = max(d.textlength(title, font=f1), d.textlength(sub, font=f2)) + 2 * pad; h = int(30 * scale) + int(19 * scale) + 3 * pad
    d.rounded_rectangle([x, y, x + w, y + h], radius=int(12 * scale), fill=(16, 24, 20, 190))
    d.text((x + pad, y + pad - int(4 * scale)), title, font=f1, fill=(255, 255, 255, 255))
    d.text((x + pad, y + pad + int(34 * scale)), sub, font=f2, fill=(220, 230, 222, 255))
    return im

def stack(a, b, gap=8):
    W = Image.new('RGB', (a.width, a.height + b.height + gap), (245, 247, 241)); W.paste(a, (0, 0)); W.paste(b, (0, a.height + gap)); return W

T_BEFORE, S_BEFORE = 'HOY', 'motor actual (three.js r128, WebGL)'
T_AFTER, S_AFTER = 'MOTOR NUEVO', 'prototipo con WebGPU (three.js r187)'

if 'stills' in sys.argv:
    for k in 'ABC':
        a = Image.open(f'{R}/before/still_{k}.png').convert('RGB').resize((1280, 720), Image.LANCZOS)
        b = Image.open(f'{R}/after/still_{k}.png').convert('RGB').resize((1280, 720), Image.LANCZOS)
        im = stack(label(a, T_BEFORE, S_BEFORE), label(b, T_AFTER, S_AFTER))
        im.save(f'{OUT}/comparacion_{k}.jpg', quality=90); print('saved', k)

if 'video' in sys.argv:
    fr = R + '/frames'; os.makedirs(fr, exist_ok=True)
    n = len([f for f in os.listdir(R + '/after') if f.startswith('v_')])
    seq = list(range(n)) + list(range(n - 1, -1, -1))
    for j, i in enumerate(seq):
        p = f'{fr}/f_{j:04d}.png'
        if os.path.exists(p): continue
        a = Image.open(f'{R}/before/v_{i:03d}.png').convert('RGB').resize((960, 540), Image.LANCZOS)
        b = Image.open(f'{R}/after/v_{i:03d}.png').convert('RGB').resize((960, 540), Image.LANCZOS)
        stack(label(a, T_BEFORE, S_BEFORE, 0.78), label(b, T_AFTER, S_AFTER, 0.78)).save(p)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '24', '-i', f'{fr}/f_%04d.png', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20',
                    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', f'{OUT}/comparacion_video.mp4'], check=True)
    print('video', os.path.getsize(f'{OUT}/comparacion_video.mp4') // 1024, 'KB', len(seq), 'frames')
