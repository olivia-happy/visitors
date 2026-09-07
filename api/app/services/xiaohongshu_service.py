from dataclasses import dataclass
from functools import lru_cache
from html import unescape
import re
from urllib.parse import urlparse, urlunparse

import httpx

from app.core.config import get_settings


URL_RE = re.compile(r"https?://[^\s]+")
TITLE_RE = re.compile(r"(?is)<title>(.*?)</title>")
META_PATTERNS = [
    re.compile(
        r'(?is)<meta[^>]+(?:name|property)=["\']description["\'][^>]+content=["\'](.*?)["\']'
    ),
    re.compile(
        r'(?is)<meta[^>]+content=["\'](.*?)["\'][^>]+(?:name|property)=["\']description["\']'
    ),
    re.compile(
        r'(?is)<meta[^>]+property=["\']og:description["\'][^>]+content=["\'](.*?)["\']'
    ),
    re.compile(
        r'(?is)<meta[^>]+content=["\'](.*?)["\'][^>]+property=["\']og:description["\']'
    ),
    re.compile(
        r'(?is)<meta[^>]+property=["\']og:title["\'][^>]+content=["\'](.*?)["\']'
    ),
    re.compile(
        r'(?is)<meta[^>]+content=["\'](.*?)["\'][^>]+property=["\']og:title["\']'
    ),
]
NOISE_PHRASES = (
    "打开小红书查看",
    "打开小红书",
    "来小红书看看",
    "复制这条信息",
    "长按识别二维码",
    "本条分享来自",
)
SUPPORTED_HOSTS = ("xiaohongshu.com", "xhslink.com", "xhs.cn")


@dataclass(frozen=True)
class XiaohongshuEvidence:
    source_url: str | None
    notes: str | None


class XiaohongshuService:
    def __init__(
        self,
        parser_mode: str,
        client: httpx.Client | None = None,
    ) -> None:
        self.parser_mode = parser_mode
        self._client = client or httpx.Client(
            timeout=4.0,
            follow_redirects=True,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/126.0 Safari/537.36"
                )
            },
        )

    def resolve_evidence(
        self,
        link: str | None,
        notes: str | None,
    ) -> XiaohongshuEvidence:
        normalized_url = normalize_xiaohongshu_url(link or notes)
        cleaned_notes = clean_xiaohongshu_notes(notes)

        if cleaned_notes:
            return XiaohongshuEvidence(
                source_url=normalized_url,
                notes=cleaned_notes,
            )

        if (
            normalized_url
            and self.parser_mode in {"best_effort", "fetch"}
        ):
            fetched = self._fetch_note_text(normalized_url)
            if fetched:
                return XiaohongshuEvidence(
                    source_url=fetched[0],
                    notes=fetched[1],
                )

        return XiaohongshuEvidence(
            source_url=normalized_url,
            notes=cleaned_notes,
        )

    def _fetch_note_text(self, url: str) -> tuple[str, str] | None:
        try:
            response = self._client.get(url)
            response.raise_for_status()
        except Exception:
            return None

        extracted_text = _extract_text_from_html(response.text)
        if not extracted_text:
            return None

        return (str(response.url), extracted_text)


def normalize_xiaohongshu_url(raw_value: str | None) -> str | None:
    if not raw_value:
        return None

    candidate = _extract_first_url(raw_value) or raw_value.strip()
    if not candidate:
        return None

    if candidate.startswith("www."):
        candidate = f"https://{candidate}"

    parsed = urlparse(candidate)
    if not parsed.scheme or not parsed.netloc:
        return None

    host = parsed.netloc.lower()
    if not any(domain in host for domain in SUPPORTED_HOSTS):
        return None

    parsed = parsed._replace(fragment="")
    if "xiaohongshu.com" in host:
        parsed = parsed._replace(query="")

    return urlunparse(parsed)


def clean_xiaohongshu_notes(notes: str | None) -> str | None:
    if not notes:
        return None

    cleaned_lines: list[str] = []
    for raw_line in notes.splitlines():
        line = URL_RE.sub("", raw_line).strip()
        line = re.sub(r"^\d+\s+", "", line)
        for phrase in NOISE_PHRASES:
            line = line.replace(phrase, "")
        line = re.sub(r"\s+", " ", line).strip(" ，,;；")
        if line:
            cleaned_lines.append(line)

    if not cleaned_lines:
        return None

    return "\n".join(cleaned_lines)


def _extract_first_url(text: str) -> str | None:
    match = URL_RE.search(text)
    if not match:
        return None
    return match.group(0).strip()


def _extract_text_from_html(html_text: str) -> str | None:
    parts: list[str] = []

    title_match = TITLE_RE.search(html_text)
    if title_match:
        title = _clean_html_text(title_match.group(1))
        if title and title not in parts:
            parts.append(title)

    for pattern in META_PATTERNS:
        match = pattern.search(html_text)
        if not match:
            continue
        content = _clean_html_text(match.group(1))
        if content and content not in parts:
            parts.append(content)

    if not parts:
        return None

    return "。".join(parts)


def _clean_html_text(value: str) -> str:
    text = unescape(value)
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip(" ，,;；")


@lru_cache
def get_xiaohongshu_service() -> XiaohongshuService:
    settings = get_settings()
    return XiaohongshuService(parser_mode=settings.xiaohongshu_parser_mode)
