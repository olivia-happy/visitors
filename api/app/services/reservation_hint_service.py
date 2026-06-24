import re

from app.schemas.plan import ReservationHint


SENTENCE_SPLIT_RE = re.compile(r"[。！？!?；;\n]+")
RESERVATION_RE = re.compile(
    r"(?P<poi>[\u4e00-\u9fa5A-Za-z0-9·]{2,30}?)(?:虽然免费但是要提前很久预约|免费但是要预约|需要提前预约|要提前预约|需提前预约|记得实名预约|实名预约|提前很久预约|公众号预约|小程序预约|放票|抢票)"
)


def extract_reservation_hints(
    notes: str | None, source_url: str | None
) -> list[ReservationHint]:
    if not notes or not source_url:
        return []

    hints: list[ReservationHint] = []
    for raw_sentence in SENTENCE_SPLIT_RE.split(notes):
        sentence = raw_sentence.strip(" ，,")
        if not sentence or "预约" not in sentence and "放票" not in sentence and "抢票" not in sentence:
            continue

        match = RESERVATION_RE.search(sentence)
        if not match:
            continue

        poi_name = match.group("poi").strip()
        reservation_channel = _extract_channel(sentence)
        price_note = _extract_price(sentence)
        reminder_text = _build_reminder_text(
            poi_name=poi_name,
            reservation_channel=reservation_channel,
            price_note=price_note,
        )

        hints.append(
            ReservationHint(
                poi_name=poi_name,
                reminder_text=reminder_text,
                reservation_channel=reservation_channel,
                price_note=price_note,
                source_url=source_url,
                evidence_excerpt=sentence,
            )
        )

    return hints


def _extract_channel(sentence: str) -> str | None:
    if "公众号预约" in sentence:
        return "公众号"
    if "小程序预约" in sentence:
        return "小程序"
    if "官网预约" in sentence:
        return "官网"
    return None


def _extract_price(sentence: str) -> str | None:
    if "免费" in sentence:
        return "free"

    amount_match = re.search(r"(¥\s?\d+|\d+\s?元)", sentence)
    if amount_match:
        return amount_match.group(1).replace(" ", "")

    return None


def _build_reminder_text(
    poi_name: str, reservation_channel: str | None, price_note: str | None
) -> str:
    segments = [f"{poi_name} needs advance reservation based on Xiaohongshu evidence."]
    if reservation_channel:
        segments.append(f"Channel: {reservation_channel}.")
    if price_note:
        segments.append(f"Price: {price_note}.")
    return " ".join(segments)

