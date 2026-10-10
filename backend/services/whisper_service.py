import logging
import os
import tempfile
import time
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
import requests
from requests.auth import HTTPBasicAuth
from faster_whisper import WhisperModel

load_dotenv()
logger = logging.getLogger(__name__)


class WhisperService:
    def __init__(
        self,
        model_size: str = "base",
        device: str = "cpu",
        compute_type: str = "int8",
    ):
        self.model_size = model_size
        self.device = device
        self.compute_type = compute_type
        self.model = WhisperModel(
            model_size_or_path=self.model_size,
            device=self.device,
            compute_type=self.compute_type,
        )
        logger.info(
            "WhisperService initialized | model=%s | device=%s | compute_type=%s",
            self.model_size,
            self.device,
            self.compute_type,
        )

    def transcribe_url(self, recording_url: str) -> tuple[str, float]:
        audio_path = self._download_audio(recording_url)
        print(f"[WHISPER DEBUG] Whisper transcription started | url={recording_url} | path={audio_path}")
        try:
            transcript, elapsed = self.transcribe_file(audio_path)
            logger.info(
                "Whisper transcription finished | url=%s | elapsed=%.2fs | transcript=%r",
                recording_url,
                elapsed,
                transcript,
            )
            print("WHISPER RESULT:", transcript)
            print(f"WHISPER LATENCY: {elapsed:.2f} sec")
            print("WHISPER TEMP FILE PATH:", audio_path)
            return transcript, elapsed
        finally:
            print("WHISPER TEMP FILE PRESERVED:", audio_path)
            # Temp file deletion temporarily disabled for debugging
            # try:
            #     audio_path.unlink()
            # except Exception:
            #     pass

    def transcribe_file(self, audio_path: Path) -> tuple[str, float]:
        start = time.perf_counter()
        segments, _ = self.model.transcribe(
            str(audio_path),
            language="en",
            task="transcribe",
            beam_size=3,
            vad_filter=True,
        )
        elapsed = time.perf_counter() - start
        text = " ".join(segment.text.strip() for segment in segments if segment.text).strip()
        return text, elapsed

    def _download_audio(self, url: str) -> Path:
        twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
        twilio_token = os.getenv("TWILIO_AUTH_TOKEN")
        requires_auth = "twilio.com" in url.lower()
        auth = None

        if requires_auth:
            if twilio_sid and twilio_token:
                auth = HTTPBasicAuth(twilio_sid, twilio_token)
                logger.debug(
                    "Using Twilio auth for recording download | account_sid=%s",
                    twilio_sid,
                )
            else:
                logger.warning(
                    "Twilio credentials missing while downloading Twilio recording URL | url=%s",
                    url,
                )
        else:
            if twilio_sid and twilio_token:
                logger.debug(
                    "Skipping Twilio auth because URL is not a Twilio recording URL | url=%s",
                    url,
                )
            else:
                logger.debug(
                    "No Twilio credentials available and URL is not Twilio | url=%s",
                    url,
                )

        logger.info("Downloading Twilio recording | url=%s", url)

        response = requests.get(url, auth=auth, stream=True, timeout=30)
        try:
            response.raise_for_status()
        except requests.exceptions.HTTPError as exc:
            logger.error(
                "Failed to download Twilio recording | url=%s | status=%s | reason=%s",
                url,
                response.status_code,
                exc,
            )
            raise

        suffix = Path(url.split("?")[0]).suffix or ".wav"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
            size_bytes = 0
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    temp.write(chunk)
                    size_bytes += len(chunk)
            temp_path = Path(temp.name)

        logger.info(
            "Downloaded audio to %s | source=%s | size=%d bytes",
            temp_path,
            url,
            size_bytes,
        )
        print(f"[WHISPER DEBUG] Recording download success | source={url} | path={temp_path} | size_bytes={size_bytes}")
        return temp_path
