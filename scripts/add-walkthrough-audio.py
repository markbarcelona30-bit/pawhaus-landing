"""Create original quiet instrumental music, align neural TTS, and mux to MP4.
Run after render-walkthrough.py. Requires imageio-ffmpeg and edge-tts.
"""
from pathlib import Path
import sys, subprocess, wave, math, array, json, shutil
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'.data/video-tools'))
import imageio_ffmpeg
RATE=44100
SECONDS=65
OUT=ROOT/'docs/video'
TMP=ROOT/'.data/video-audio'
TMP.mkdir(parents=True,exist_ok=True)
if '--reuse-narration' not in sys.argv:
    subprocess.run([sys.executable,str(ROOT/'scripts/narrate-neural.py')],check=True)
voice=array.array('f',[0])*(RATE*SECONDS)
activity=bytearray(RATE*SECONDS)
timing=[]
lines=json.loads((OUT/'narration.json').read_text())
for i,line in enumerate(lines):
    with wave.open(str(TMP/f'voice-{i:02}.wav')) as wav:
        assert wav.getsampwidth()==2 and wav.getnchannels()==1,'Expected mono PCM narration'
        samples=array.array('h',wav.readframes(wav.getnframes()))
        source_rate=wav.getframerate()
    original=len(samples)/source_rate
    # Fit within the scene without clipping words; keep a small transition gap.
    duration=min(original,4.45)
    count=int(duration*RATE)
    offset=int((i*5+0.3)*RATE)
    peak=max(1,max(abs(x) for x in samples))
    for n in range(count):
        position=n*len(samples)/count
        lo=int(position);hi=min(len(samples)-1,lo+1)
        value=(samples[lo]*(1-(position-lo))+samples[hi]*(position-lo))/peak
        # Short edge fades prevent clicks; voice target stays above the music.
        edge=min(1,n/(RATE*0.012),(count-1-n)/(RATE*0.012))
        voice[offset+n]=value*0.68*edge
        activity[offset+n]=1
    timing.append({'scene':i+1,'start':i*5+0.3,'duration':round(duration,2),'text':line})
    print(f'Narration {i+1}: {duration:.2f}s',flush=True)

# Original C / Am / F / G instrumental: soft pad, bass and plucked arpeggios.
beat=60/92
chords=[(48,60,64,67),(45,57,60,64),(41,53,57,60),(43,55,59,62)]
def hz(midi):return 440*2**((midi-69)/12)
music=array.array('f',[0])*(RATE*SECONDS)
for n in range(len(music)):
    t=n/RATE
    bar=int(t/(beat*4));local=t%(beat*4);chord=chords[bar%4]
    pad_edge=min(1,local/0.18,(beat*4-local)/0.18)
    pad=sum(math.sin(2*math.pi*hz(note)*t) for note in chord[1:])/3*0.028*pad_edge
    tick=int(t/(beat/2));p=t%(beat/2)
    note=chord[1+(tick%3)]+12
    pluck=(math.sin(2*math.pi*hz(note)*p)+0.22*math.sin(4*math.pi*hz(note)*p))*math.exp(-p*9)*min(1,p/0.008)*0.055
    bass=math.sin(2*math.pi*hz(chord[0])*t)*0.022*pad_edge
    fade=min(1,t/1.5,(SECONDS-t)/2.2)
    music[n]=(pad+pluck+bass)*fade

# Smooth ducking keeps the backing track low during the spoken scenes.
mixed=array.array('h')
duck=1.0
max_peak=0
for n in range(len(music)):
    target=0.42 if activity[n] else 1.0
    duck+=(target-duck)*0.00025
    value=voice[n]+music[n]*duck
    max_peak=max(max_peak,abs(value))
    mixed.append(int(max(-0.95,min(0.95,value))*32767))
with wave.open(str(TMP/'mixed.wav'),'wb') as wav:
    wav.setnchannels(1);wav.setsampwidth(2);wav.setframerate(RATE);wav.writeframes(mixed.tobytes())
ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
video=OUT/'pawhaus-walkthrough.mp4'
result=TMP/'pawhaus-with-audio.mp4'
subprocess.run([ffmpeg,'-y','-i',str(video),'-i',str(TMP/'mixed.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t',str(SECONDS),'-movflags','+faststart',str(result)],check=True,stdout=subprocess.DEVNULL,stderr=open(TMP/'mux.log','w'))
check=subprocess.run([ffmpeg,'-i',str(result),'-map','0:a:0','-af','volumedetect','-f','null','-'],stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,text=True,check=True)
assert 'Audio: aac' in check.stderr and 'max_volume' in check.stderr,'Exported audio verification failed'
assert max_peak<0.95,'Audio clipping detected'
shutil.copyfile(result,video)
(OUT/'narration-timing.json').write_text(json.dumps(timing,indent=2)+'\n')
print(f'Verified AAC narration + original music; peak {max_peak:.3f}; 65 seconds.')
print('\n'.join(line for line in check.stderr.splitlines() if 'volume:' in line))
