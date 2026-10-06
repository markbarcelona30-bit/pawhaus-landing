"""Render the public demo script using the Microsoft Edge neural TTS service."""
from pathlib import Path
import asyncio,json,sys,subprocess,wave
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'.data/neural-voice-tools'))
sys.path.insert(0,str(ROOT/'.data/video-tools'))
import edge_tts,imageio_ffmpeg
TMP=ROOT/'.data/video-audio'
TMP.mkdir(parents=True,exist_ok=True)
VOICE='en-US-JennyNeural'
async def main():
    lines=json.loads((ROOT/'docs/video/narration.json').read_text())
    for i,line in enumerate(lines):
        if len(sys.argv)>1 and i!=int(sys.argv[1])-1:continue
        mp3=TMP/f'neural-{i:02}.mp3'
        raw=TMP/f'neural-{i:02}.wav'
        await edge_tts.Communicate(line,VOICE,rate='+0%',pitch='+0Hz').save(str(mp3))
        ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
        subprocess.run([ffmpeg,'-y','-i',str(mp3),'-ac','1','-ar','44100',str(raw)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        with wave.open(str(raw)) as wav:duration=wav.getnframes()/wav.getframerate()
        # Preserve voice pitch when fitting a longer sentence into its scene.
        tempo=max(1,duration/4.4)
        subprocess.run([ffmpeg,'-y','-i',str(raw),'-af',f'atempo={tempo:.5f}',str(TMP/f'voice-{i:02}.wav')],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        print(f'Neural narration {i+1}/{len(lines)}: {VOICE}',flush=True)
if __name__=='__main__':asyncio.run(main())
