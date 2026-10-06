"""Render the Pawhaus captioned mockup from browser-captured demo scenes.
Requires Pillow and imageio-ffmpeg (pip install Pillow imageio-ffmpeg).
"""
from pathlib import Path
import sys, subprocess
from PIL import Image, ImageDraw, ImageFont, ImageOps
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.data/video-tools'))
import imageio_ffmpeg
OUT = ROOT / 'docs/video'
W,H,FPS = 1280,720,24
INK='#273f49'; CREAM='#f8f6ee'; BLUE='#d7e9ef'; GOLD='#f5df8e'
def font(size,bold=False):
    return ImageFont.truetype('C:/Windows/Fonts/'+('arialbd.ttf' if bold else 'arial.ttf'),size)
scenes=[
('01-home','Your time away. Their little holiday.','A warm welcome to Pawhaus.','WEBSITE'),
('02-dates','01 / Choose a stay','Select check-in, check-out and the number of dogs.','BOOKING'),
('03-room','02 / Find their room','See available rooms and the price for the whole stay.','BOOKING'),
('04-details','03 / Make it personal','Add guest details, contact information and care notes.','BOOKING'),
('05-review','04 / Review the plan','Check the dates, room and total before submitting.','BOOKING'),
('06-request','05 / Request received','The booking is saved, pending staff confirmation.','BOOKING'),
('07-login','A calm workspace for the team','Staff sign in to manage bookings and care.','STAFF PORTAL'),
('08-overview','06 / A clear daily overview','See pending requests, arrivals and reserved rooms.','STAFF PORTAL'),
('09-pending','07 / Review every detail','Open the request and read the guest care notes.','STAFF PORTAL'),
('10-confirmed','08 / Confirm the stay','Staff approval moves the request to confirmed.','STAFF PORTAL'),
('11-checked-in','09 / Welcome them in','Check in the guest and keep the activity history.','STAFF PORTAL'),
('12-calendar','10 / Plan the month','See reserved nights in the stay calendar.','STAFF PORTAL'),
('13-rooms','11 / Keep track of rooms','Review room reservations by stay date.','STAFF PORTAL'),
]
def layout(index,t):
    name,title,caption,chapter=scenes[index]
    canvas=Image.new('RGB',(W,H),CREAM);d=ImageDraw.Draw(canvas)
    d.text((44,24),'PAWHAUS',font=font(20,True),fill=INK)
    d.text((950,27),chapter,font=font(15,True),fill=INK)
    d.text((44,65),title,font=font(31,True),fill=INK)
    d.text((44,109),caption,font=font(19),fill=INK)
    image=Image.open(OUT/'scenes'/f'{name}.png').convert('RGB')
    image=ImageOps.contain(image,(1176,488),Image.Resampling.LANCZOS)
    x=(W-image.width)//2;y=161+(488-image.height)//2
    d.rounded_rectangle((x-9,y-9,x+image.width+9,y+image.height+9),radius=18,fill=BLUE)
    canvas.paste(image,(x,y))
    d.text((44,670),'BOOKING + STAFF SYSTEM  /  FICTIONAL DEMO',font=font(13),fill=INK)
    d.text((936,670),'pawhaus-hotel.vercel.app',font=font(14),fill=INK)
    d.rectangle((0,710,int(W*(index+t)/len(scenes)),720),fill=GOLD)
    return canvas
def main():
    duration=5
    cmd=[imageio_ffmpeg.get_ffmpeg_exe(),'-y','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-preset','fast','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart',str(OUT/'pawhaus-walkthrough.mp4')]
    (ROOT/'.data').mkdir(exist_ok=True)
    p=subprocess.Popen(cmd,stdin=subprocess.PIPE,stderr=open(ROOT/'.data/video-render.log','w'))
    for i in range(len(scenes)):
        base=layout(i,0);prev=layout(i-1,1) if i else None
        for n in range(FPS*duration):
            t=n/(FPS*duration-1)
            # Gentle push-in on the captured interface; captions stay legible.
            frame=base.copy()
            panel=base.crop((35,152,1245,658))
            zoom=1+0.012*t
            panel=ImageOps.fit(panel.resize((int(1210*zoom),int(506*zoom)),Image.Resampling.BICUBIC),(1210,506))
            frame.paste(panel,(35,152));d=ImageDraw.Draw(frame)
            d.rectangle((0,710,int(W*(i+t)/len(scenes)),720),fill=GOLD)
            if prev is not None and n<12:frame=Image.blend(prev,frame,n/12)
            if i==0 and n<12:frame=Image.blend(Image.new('RGB',(W,H),CREAM),frame,n/12)
            if i==len(scenes)-1 and n>FPS*duration-13:frame=Image.blend(frame,Image.new('RGB',(W,H),CREAM),(n-(FPS*duration-13))/12)
            p.stdin.write(frame.tobytes())
        print(f'Rendered {i+1}/{len(scenes)}: {scenes[i][0]}',flush=True)
    p.stdin.close()
    if p.wait():raise RuntimeError('Video encoding failed; inspect render.log')
    poster=layout(0,0);poster.save(OUT/'poster.jpg',quality=92)
    # Decode three output frames to verify that the MP4 is readable.
    for sec in (2,32,61):
        subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-y','-ss',str(sec),'-i',str(OUT/'pawhaus-walkthrough.mp4'),'-frames:v','1',str(ROOT/'.data'/f'video-check-{sec}.jpg')],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,check=True)
    print('Verified 65-second, 1280x720, H.264 MP4.')
if __name__=='__main__':main()
