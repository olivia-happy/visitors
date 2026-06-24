import httpx

from app.services.weather_service import AmapWeatherService, WeatherForecast


def test_weather_service_reads_today_forecast() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/v3/weather/weatherInfo"
        assert request.url.params["city"] == "320500"
        assert request.url.params["extensions"] == "all"
        return httpx.Response(
            status_code=200,
            json={
                "status": "1",
                "info": "OK",
                "forecasts": [
                    {
                        "city": "苏州",
                        "adcode": "320500",
                        "reporttime": "2026-06-24 08:00:00",
                        "casts": [
                            {
                                "dayweather": "小雨",
                                "nightweather": "多云",
                                "daytemp": "31",
                                "nighttemp": "19",
                            }
                        ],
                    }
                ],
            },
        )

    service = AmapWeatherService(
        api_key="test-key",
        client=httpx.Client(
            base_url="https://restapi.amap.com",
            transport=httpx.MockTransport(handler),
        ),
    )

    forecast = service.get_city_weather("320500")

    assert forecast == WeatherForecast(
        city_name="苏州",
        adcode="320500",
        day_weather="小雨",
        night_weather="多云",
        temperature_low_c=19,
        temperature_high_c=31,
        report_time="2026-06-24 08:00:00",
    )
