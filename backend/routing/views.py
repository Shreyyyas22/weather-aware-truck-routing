from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import os

from routing.services.routing_provider import RoutingProviderError, TomTomRoutingService
from routing.services.trip_planner import TripValidationError, plan_trip
from routing.services.weather_provider import OpenMeteoWeatherService


@api_view(["GET"])
def health_check(request):
    return Response({
        "status": "success",
        "message": "Weather-Aware Truck Routing API is running"
    })


@api_view(["POST"])
def plan_routes(request):
    try:
        result = plan_trip(
            request.data,
            TomTomRoutingService(os.getenv("TOMTOM_API_KEY")),
            OpenMeteoWeatherService(),
        )
        return Response(result)
    except TripValidationError as error:
        return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)
    except (RuntimeError, RoutingProviderError) as error:
        return Response({"detail": str(error)}, status=status.HTTP_502_BAD_GATEWAY)
