import httpx

from app.services.xiaohongshu_service import XiaohongshuService


def test_resolve_evidence_extracts_url_and_cleans_share_text() -> None:
    service = XiaohongshuService(parser_mode="manual")

    evidence = service.resolve_evidence(
        link=None,
        notes=(
            "78 苏州博物馆虽然免费但是要提前很久预约，公众号预约。 "
            "https://www.xiaohongshu.com/explore/abc123 打开小红书查看。"
        ),
    )

    assert evidence.source_url == "https://www.xiaohongshu.com/explore/abc123"
    assert evidence.notes is not None
    assert "苏州博物馆虽然免费但是要提前很久预约" in evidence.notes
    assert "打开小红书查看" not in evidence.notes


def test_resolve_evidence_fetches_page_description_when_enabled() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/explore/abc123"
        return httpx.Response(
            status_code=200,
            text=(
                '<html><head>'
                '<meta property="og:title" content="苏州周末路线" />'
                '<meta name="description" content="苏州博物馆虽然免费但是要提前很久预约，公众号预约。" />'
                "</head><body></body></html>"
            ),
        )

    service = XiaohongshuService(
        parser_mode="best_effort",
        client=httpx.Client(
            base_url="https://www.xiaohongshu.com",
            transport=httpx.MockTransport(handler),
        ),
    )

    evidence = service.resolve_evidence(
        link="https://www.xiaohongshu.com/explore/abc123",
        notes=None,
    )

    assert evidence.source_url == "https://www.xiaohongshu.com/explore/abc123"
    assert evidence.notes is not None
    assert "苏州周末路线" in evidence.notes
    assert "苏州博物馆虽然免费但是要提前很久预约" in evidence.notes
