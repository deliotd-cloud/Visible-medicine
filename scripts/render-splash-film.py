"""Render Visible Medicine's original short film from CC0 radiology sources.

The geometry animates real scan planes; it is a motion-design composition, not
a clinical volume reconstruction. Pillow/NumPy composite the film frames and
FFmpeg encodes the resulting video. No patient data is fetched from the app.
"""
from pathlib import Path
import argparse
import math
import subprocess
import sys
import wave

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont, ImageOps

PROJECT = Path(__file__).resolve().parents[1]
WORK = PROJECT.parent / 'work' / 'cinematic-splash'
SOURCES = WORK / 'sources'
OUTPUT = PROJECT / 'public' / 'media' / 'splash'
sys.path.insert(0, str(WORK / 'python'))
import imageio_ffmpeg

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
WIDTH, HEIGHT, FPS, DURATION = 1920, 1080, 30, 6.6
TEAL = (47, 215, 196)
PALE = (234, 246, 243)
RESAMPLE = Image.Resampling.BICUBIC


def smooth(value):
    p = float(np.clip(value, 0, 1))
    return p * p * (3 - 2 * p)


def window(t, start, end, fade=.3):
    return smooth((t-start)/fade) * (1-smooth((t-end+fade)/fade))


def multiply(image, strength):
    return image.point([int(i * max(0, min(1, strength))) for i in range(256)] * 3)


def over(frame, layer, alpha=1):
    return ImageChops.screen(frame, multiply(layer, alpha))


def graded(image, color=PALE, gamma=1.2):
    gray = ImageOps.autocontrast(image.convert('L'), cutoff=.3)
    gray = gray.point([int((i/255)**gamma * 255) for i in range(256)])
    return ImageOps.colorize(gray, (0,0,0), color)


def image_plane(image, corners):
    """Project an actual scan into a quadrilateral using inverse homography."""
    iw, ih = image.size
    source = ((0, 0), (iw, 0), (iw, ih), (0, ih))
    rows, values = [], []
    for (x,y), (u,v) in zip(corners, source):
        rows.extend([[x,y,1,0,0,0,-u*x,-u*y], [0,0,0,x,y,1,-v*x,-v*y]])
        values.extend([u,v])
    coeff = np.linalg.solve(np.array(rows, dtype=float), np.array(values, dtype=float))
    return image.transform((WIDTH,HEIGHT), Image.Transform.PERSPECTIVE, coeff, RESAMPLE)


def camera_image(image, cx, cy, width, yaw=0, roll=0):
    height = width * image.height/image.width
    points = np.array([[-width/2,-height/2],[width/2,-height/2],[width/2,height/2],[-width/2,height/2]])
    angle = math.radians(roll)
    points = points @ np.array([[math.cos(angle),math.sin(angle)],[-math.sin(angle),math.cos(angle)]])
    corners = []
    for x,y in points:
        z = x * math.sin(math.radians(yaw))
        focal = 1900 / (1900 + z)
        corners.append((cx+x*math.cos(math.radians(yaw))*focal, cy+y*focal))
    return image_plane(image, corners)


def tracked(draw, text, pos, size=22, spacing=5, fill=PALE, center=False):
    font = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', size)
    widths = [draw.textlength(char, font=font) for char in text]
    x,y = pos
    if center:
        x -= (sum(widths) + max(0,len(text)-1)*spacing)/2
    for char,width in zip(text,widths):
        draw.text((x,y), char, font=font, fill=fill)
        x += width+spacing


def label(frame, number, title, caption, strength):
    layer = Image.new('RGB',(WIDTH,HEIGHT))
    draw = ImageDraw.Draw(layer)
    draw.line((128,832,180,832),fill=TEAL,width=2)
    tracked(draw, f'{number}   /   {title}', (202,814),22,5,TEAL)
    tracked(draw, caption, (128,865),18,3,(132,156,166))
    return over(frame,layer,strength)


def beam(t, center, intensity=.4):
    x = np.arange(WIDTH, dtype=np.float32)[None,:]
    y = np.arange(HEIGHT, dtype=np.float32)[:,None]
    streak = np.exp(-((y-center)/2.1)**2) * np.exp(-((x-WIDTH*.52)/(WIDTH*.47))**2)
    glow = np.exp(-((y-center)/28)**2) * np.exp(-((x-WIDTH*.52)/(WIDTH*.36))**2)*.14
    signal = (streak+glow)[:,:,None]*np.array(TEAL)[None,None,:]*intensity
    return Image.fromarray(np.uint8(np.clip(signal,0,255)))


def make_sound():
    rate=48000
    time=np.arange(int(rate*DURATION))/rate
    rng=np.random.default_rng(812)
    signal=np.zeros_like(time)
    bed=np.sin(2*np.pi*55*time)*.026 + np.sin(2*np.pi*82.4069*time)*.014
    bed*=np.sin(np.pi*np.clip(time/DURATION,0,1))**1.2
    signal+=bed
    noise=rng.normal(0,1,len(time))
    soft=np.convolve(noise,np.ones(25)/25,mode='same')
    for at in [.3,1.75,3.25,4.8]:
        env=np.exp(-((time-at)/.24)**2)
        signal+=soft*env*.09
        signal+=np.sin(2*np.pi*(120*time+30*(time-at)**2))*env*.015
    for hz,at,amp in [(523.25,5.02,.035),(783.99,5.12,.025),(1046.5,5.22,.012)]:
        dt=np.maximum(time-at,0)
        env=(1-np.exp(-dt*35))*np.exp(-dt*2.6)*(time>=at)
        signal+=np.sin(2*np.pi*hz*dt)*env*amp
    fade=np.minimum(np.clip(time/.08,0,1),np.clip((DURATION-time)/.45,0,1))
    stereo=np.column_stack((signal, np.roll(signal,130)))*fade[:,None]
    with wave.open(str(WORK/'sound.wav'),'wb') as audio:
        audio.setnchannels(2); audio.setsampwidth(2); audio.setframerate(rate)
        audio.writeframes((np.clip(stereo,-.65,.65)*32767).astype('<i2').tobytes())


def prepare():
    WORK.mkdir(parents=True,exist_ok=True)
    OUTPUT.mkdir(parents=True,exist_ok=True)
    mri_dir=WORK/'mri-frames'
    mri_dir.mkdir(exist_ok=True)
    if len(list(mri_dir.glob('*.png'))) < 65:
        subprocess.run([FFMPEG,'-hide_banner','-loglevel','error','-ss','28','-i',str(SOURCES/'mri-sagittal.webm'),
                        '-t','28','-vf','fps=2.5,scale=1120:-1','-frames:v','70',str(mri_dir/'%03d.png'),'-y'],check=True)
    xr=Image.open(SOURCES/'chest.png').crop((80,140,2300,1880))
    xr=graded(xr,(171,226,232),1.75)
    xr.thumbnail((1500,1500))
    # Feather the photographic plate edges so the anatomy occupies the scene.
    xx=np.linspace(0,1,xr.width)[None,:]
    yy=np.linspace(0,1,xr.height)[:,None]
    edge=np.minimum(np.clip(xx/.13,0,1),np.clip((1-xx)/.13,0,1))
    edge=edge*np.minimum(np.clip(yy/.09,0,1),np.clip((1-yy)/.09,0,1))
    xr=Image.fromarray(np.uint8(np.array(xr)*edge[:,:,None]))
    cts=[graded(Image.open(path).resize((646,468),RESAMPLE).crop((10,28,351,461)),(171,239,228),1.24) for path in sorted(SOURCES.glob('ct-*.png'))]
    if len(cts)<8:
        raise RuntimeError('At least eight real CT source slices are required.')
    mris=[graded(Image.open(path),(205,216,242),.87) for path in sorted(mri_dir.glob('*.png'))]
    logo=Image.open(PROJECT/'public/brand/approved/visible-medicine-lockup-dark.png').convert('RGBA')
    logo.thumbnail((1160,240))
    rng=np.random.default_rng(42)
    dust=rng.uniform(size=(125,4))
    # The cloud is sampled from real brain image pixels, then separated into depth.
    sample=np.array(mris[len(mris)//2].resize((360,262)).convert('L'))
    yy,xx=np.where(sample>75)
    selected=rng.choice(len(xx),min(10500,len(xx)),replace=False)
    cloud=np.column_stack(((xx[selected]/360-.5)*1160,(yy[selected]/262-.5)*820,rng.normal(0,110,len(selected))))
    levels=sample[yy[selected],xx[selected]]/255
    y,x=np.mgrid[0:HEIGHT,0:WIDTH].astype(np.float32)
    oval=((x-WIDTH*.55)/(WIDTH*.7))**2+((y-HEIGHT*.48)/(HEIGHT*.85))**2
    vignette=np.clip(1-oval*.64,.08,1)
    bg=np.zeros((HEIGHT,WIDTH,3),np.float32)
    glow=np.exp(-(((x-WIDTH*.62)/570)**2+((y-HEIGHT*.5)/430)**2))
    for k,(base,peak) in enumerate([(2,3),(7,15),(13,21)]):
        bg[:,:,k]=base+glow*peak
    return xr,cts,mris,logo,dust,cloud,levels,Image.fromarray(bg.astype(np.uint8)),vignette


def render_frame(t, assets):
    xr,cts,mris,logo,dust,cloud,levels,background,vignette=assets
    frame=background.copy()
    ambience=Image.new('RGB',(WIDTH,HEIGHT)); draw=ImageDraw.Draw(ambience)
    for x,y,z,r in dust:
        depth=(z+t*.05)%1
        px=WIDTH/2+(x-.5)*WIDTH*(.65+depth)
        py=HEIGHT/2+(y-.5)*HEIGHT*(.65+depth)
        alpha=int((15+depth*35)*(1-smooth((t-4.65)/.7)))
        if 0<px<WIDTH and 0<py<HEIGHT:
            radius=.5+r*1.1
            draw.ellipse((px-radius,py-radius,px+radius,py+radius),fill=(alpha//2,alpha,int(alpha*1.2)))
    frame=over(frame,ambience)

    # SHOT 1: A full-screen radiograph appears through a travelling light plane.
    if t<2.12:
        p=smooth(t/1.8)
        study=camera_image(xr,WIDTH*.63-p*95,HEIGHT*.49,1520-p*215,-9+p*6,-3+p*2)
        pixels=np.array(study,dtype=np.float32)
        rows=np.arange(HEIGHT)[:,None]
        reveal=np.clip((t*900-rows+130)/170,0,1)
        pixels*=reveal[:,:,None]
        study=Image.fromarray(np.uint8(pixels))
        strength=window(t,-.05,2.12,.4)
        frame=over(frame,study,strength*.88)
        frame=over(frame,beam(t,min(HEIGHT+80,t*890),.65),strength)
        text=Image.new('RGB',(WIDTH,HEIGHT)); dr=ImageDraw.Draw(text)
        tracked(dr,'LOOK CLOSER.',(129,313),44,9)
        frame=over(frame,text,window(t,.35,1.8,.34))
        frame=label(frame,'01','X-RAY','BEYOND THE SURFACE',window(t,.3,1.9,.25))

    # SHOT 2: Several CT planes spread in physical depth while slices advance.
    if 1.6<t<3.72:
        p=np.clip((t-1.6)/2.12,0,1)
        strength=window(t,1.6,3.72,.33)
        scene=Image.new('RGB',(WIDTH,HEIGHT))
        # Rear planes lead the eye diagonally towards the sharply focused front slice.
        for j in range(6,-1,-1):
            index=int(np.clip(p*(len(cts)-8)+j,0,len(cts)-1))
            width=490-j*39+85*p
            cx=1160-j*91+130*p
            cy=505-j*32+35*p
            plate=camera_image(cts[index],cx,cy,width,30-12*p,-4+5*p)
            if j>1:
                plate=plate.filter(ImageFilter.GaussianBlur(j*.28))
            scene=over(scene,plate,.93 if j==0 else .1+.25/(j+1))
        # A very large ghosted cross-section travels past the virtual camera.
        ghost=camera_image(cts[min(len(cts)-1,int(p*(len(cts)-1)))],WIDTH*.08,HEIGHT*.53,1100+p*450,54,-8)
        scene=over(scene,ghost.filter(ImageFilter.GaussianBlur(3)),.16)
        frame=over(frame,scene,strength)
        frame=over(frame,beam(t,170+p*670,.32),strength)
        frame=label(frame,'02','COMPUTED TOMOGRAPHY','THROUGH EVERY LAYER',window(t,1.92,3.5,.24))

    # SHOT 3: Actual ultra-high-resolution MRI cine with a controlled camera pull.
    if 3.13<t<5.3:
        p=np.clip((t-3.13)/1.9,0,1)
        index=min(len(mris)-1,int(p*(len(mris)-1)))
        study=camera_image(mris[index],WIDTH*.59,HEIGHT*.46,1550-240*p,-5+7*p,1-p)
        strength=window(t,3.13,5.3,.4)
        frame=over(frame,study,strength*.97)
        # Ghosted adjacent real slices create optical depth without invented anatomy.
        side=camera_image(mris[max(0,index-6)],WIDTH*.69,HEIGHT*.46,1580-240*p,8,0)
        frame=over(frame,side.filter(ImageFilter.GaussianBlur(7)),strength*.06)
        frame=label(frame,'03','MAGNETIC RESONANCE','INTO THE DETAIL',window(t,3.52,4.9,.25))

    # The MR texture disperses into a restrained point field, then resolves to brand.
    if 4.4<t<5.62:
        p=smooth((t-4.4)/1.1)
        angle=-p*.44
        rotation=np.array([[math.cos(angle),0,math.sin(angle)],[0,1,0],[-math.sin(angle),0,math.cos(angle)]])
        pts=cloud@rotation.T
        pts*=1-p*.68
        pts[:,2]+=p*200
        focal=1500/(1500+pts[:,2])
        px=(WIDTH*.53+pts[:,0]*focal).astype(int)
        py=(HEIGHT*.46+pts[:,1]*focal).astype(int)
        array=np.zeros((HEIGHT,WIDTH,3),dtype=np.uint8)
        mask=(px>0)&(px<WIDTH-1)&(py>0)&(py<HEIGHT-1)
        brightness=levels[mask]*window(t,4.4,5.62,.4)
        for channel,value in enumerate((75,205,205)):
            array[py[mask],px[mask],channel]=np.uint8(brightness*value)
        field=Image.fromarray(array)
        frame=over(frame,field)
        frame=over(frame,field.filter(ImageFilter.GaussianBlur(5)),.45)

    # Grade the photography before placing the undistorted, approved identity.
    pixels=np.array(frame,dtype=np.float32)*vignette[:,:,None]
    frame=Image.fromarray(np.uint8(np.clip(pixels,0,255)))
    if t>4.92:
        p=smooth((t-4.92)/.85)
        brand=Image.new('RGBA',(WIDTH,HEIGHT))
        y=int(HEIGHT*.445-logo.height/2+(1-p)*12)
        brand.alpha_composite(logo,(int((WIDTH-logo.width)/2),y))
        plate=Image.new('RGB',(WIDTH,HEIGHT))
        plate.paste(brand,mask=brand.getchannel('A'))
        soft=plate.filter(ImageFilter.GaussianBlur(16))
        frame=over(frame,soft,.18*p)
        frame=over(frame,plate,p)
        tagline=Image.new('RGB',(WIDTH,HEIGHT)); dr=ImageDraw.Draw(tagline)
        tracked(dr,'Where medicine becomes visible.',(WIDTH/2,HEIGHT*.6),27,1.6,(169,194,194),True)
        frame=over(frame,tagline,smooth((t-5.28)/.65))
        brandline=Image.new('RGB',(WIDTH,HEIGHT)); dr=ImageDraw.Draw(brandline)
        extent=160*smooth((t-5.3)/.75)
        dr.line((WIDTH/2-extent,HEIGHT*.69,WIDTH/2+extent,HEIGHT*.69),fill=(25,106,103),width=1)
        frame=over(frame,brandline)
    # One low, broad transition bloom; no repeated strobes or flashing cuts.
    for at in (1.73,3.27,5.02):
        pulse=math.exp(-((t-at)/.10)**2)*.085
        if pulse>.001:
            frame=over(frame,beam(t,HEIGHT*.48,pulse*2.2))
    return frame


def main():
    parser=argparse.ArgumentParser(); parser.add_argument('--stills',action='store_true')
    args=parser.parse_args()
    assets=prepare()
    times=[.82,2.55,3.94,4.73,5.3,6.1]
    for i,t in enumerate(times):
        frame=render_frame(t,assets)
        frame.save(WORK/f'frame-{t:.2f}.jpg',quality=93)
    # Six frames with the full frame proportions preserved.
    storyboard=Image.new('RGB',(1440,1215),(2,7,13))
    for i,t in enumerate(times):
        image=Image.open(WORK/f'frame-{t:.2f}.jpg').resize((720,405),Image.Resampling.LANCZOS)
        storyboard.paste(image,((i%2)*720,(i//2)*405))
    storyboard.save(WORK/'storyboard.jpg',quality=92)
    if args.stills:
        print('Storyboard rendered:',WORK/'storyboard.jpg',flush=True); return
    make_sound()
    movie=OUTPUT/'visible-medicine-cinematic-v1.mp4'
    process=subprocess.Popen([FFMPEG,'-hide_banner','-loglevel','error','-y',
        '-f','rawvideo','-pix_fmt','rgb24','-s',f'{WIDTH}x{HEIGHT}','-r',str(FPS),'-i','-',
        '-i',str(WORK/'sound.wav'),'-c:v','libx264','-preset','slow','-crf','21',
        '-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-movflags','+faststart',
        '-t',str(DURATION),str(movie)],stdin=subprocess.PIPE)
    for i in range(round(DURATION*FPS)):
        frame=render_frame(i/FPS,assets)
        process.stdin.write(frame.tobytes())
        if i%30==0: print(f'Rendered {i}/{round(DURATION*FPS)} frames',flush=True)
    process.stdin.close()
    if process.wait()!=0: raise RuntimeError('Film encoding failed')
    # The homepage copy contains no audio stream; the review master has optional audio.
    subprocess.run([FFMPEG,'-hide_banner','-loglevel','error','-y','-i',str(movie),
        '-vf','scale=1280:720','-an','-c:v','libx264','-crf','23','-preset','slow',
        '-pix_fmt','yuv420p','-movflags','+faststart',str(OUTPUT/'visible-medicine-splash-v1.mp4')],check=True)
    render_frame(6.1,assets).save(OUTPUT/'cinematic-logo-poster.webp',quality=88)
    render_frame(3.94,assets).save(OUTPUT/'cinematic-film-poster.webp',quality=88)
    print('Finished:',movie,flush=True)


if __name__=='__main__': main()
