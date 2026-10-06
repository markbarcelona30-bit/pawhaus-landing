# Pawhaus walkthrough

`pawhaus-walkthrough.mp4` is a 65-second landscape mockup, 1280 × 720 at 24 fps, encoded as H.264 with web-friendly fast start. It has captions, gentle image motion and crossfade transitions, without audio.

The browser-captured scenes demonstrate Milo, a fictional Corgi belonging to Alex Demo, booking a two-night Cozy Nook stay. Staff review and confirm the request, check in the guest, and review the calendar and room inventory. Captures use the isolated local verification database. Any additional booking visible in the calendar is also a fictional browser test fixture.

These are edited screenshots of the actual interface, rather than a continuous screen recording. Confirmation approves a stay without collecting payment. The video does not imply payment processing, emails or a production booking.

To render again on Windows, install `Pillow` and `imageio-ffmpeg`, then run `python scripts/render-walkthrough.py` from the repository. The source scenes are stored in `scenes/`.
