import httpx

from app.services.amap_service import AmapService, ResolvedStop


def test_amap_service_geocodes_landmark_and_extracts_citycode() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/v3/geocode/geo"
        assert request.url.params["address"] == "苏州博物馆"
        assert request.url.params["city"] == "苏州"
        return httpx.Response(
            status_code=200,
            json={
                "status": "1",
                "info": "OK",
                "geocodes": [
                    {
                        "location": "120.6171,31.3246",
                        "citycode": "0512",
                        "adcode": "320500",
                    }
                ],
            },
        )

    service = AmapService(
        api_key="test-key",
        client=httpx.Client(
            base_url="https://restapi.amap.com",
            transport=httpx.MockTransport(handler),
        ),
    )

    stop = service.resolve_stop(
        city_query="苏州",
        stop_name="苏州博物馆",
        kind="museum",
        fallback_lat=31.0,
        fallback_lng=120.0,
    )

    assert stop == ResolvedStop(
        name="苏州博物馆",
        kind="museum",
        lat=31.3246,
        lng=120.6171,
        citycode="0512",
        adcode="320500",
    )


def test_amap_service_reads_transit_duration_minutes() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/v5/direction/transit/integrated"
        assert request.url.params["city1"] == "0512"
        assert request.url.params["city2"] == "0512"
        return httpx.Response(
            status_code=200,
            json={
                "status": "1",
                "info": "ok",
                "route": {
                    "transits": [
                        {
                            "cost": {
                                "duration": "1560",
                            }
                        }
                    ]
                },
            },
        )

    service = AmapService(
        api_key="test-key",
        client=httpx.Client(
            base_url="https://restapi.amap.com",
            transport=httpx.MockTransport(handler),
        ),
    )

    duration = service.estimate_segment_duration_minutes(
        origin=ResolvedStop(
            name="苏州博物馆",
            kind="museum",
            lat=31.3246,
            lng=120.6171,
            citycode="0512",
        ),
        destination=ResolvedStop(
            name="平江路",
            kind="citywalk",
            lat=31.3197,
            lng=120.6288,
            citycode="0512",
        ),
        transport_mode="metro",
    )

    assert duration == 26
