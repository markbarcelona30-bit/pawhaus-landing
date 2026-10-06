param([string]$ProjectRoot)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$videoNarration = Get-Content -LiteralPath (Join-Path $ProjectRoot 'docs/video/narration.json') -Raw | ConvertFrom-Json
$videoAudioFolder = Join-Path $ProjectRoot '.data/video-audio'
New-Item -ItemType Directory -Force -Path $videoAudioFolder | Out-Null
$videoVoice = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
    $videoVoice.SelectVoice('Microsoft Zira Desktop')
    $videoVoice.Rate = 1
    $videoVoice.Volume = 100
    for ($videoScene = 0; $videoScene -lt $videoNarration.Count; $videoScene++) {
        $videoVoice.SetOutputToWaveFile((Join-Path $videoAudioFolder ('voice-{0:00}.wav' -f $videoScene)))
        $videoVoice.Speak($videoNarration[$videoScene])
        $videoVoice.SetOutputToNull()
    }
} finally {
    $videoVoice.Dispose()
}
