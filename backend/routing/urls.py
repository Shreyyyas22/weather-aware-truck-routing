from django.urls import path
from .views import health_check, plan_routes

urlpatterns = [
    path("health/", health_check),
    path("routes/plan/", plan_routes),
]
