"""
URLs for Construction app
"""
from django.urls import path
from rest_framework.routers import DefaultRouter
from .api import ConstructionMilestoneViewSet, ConstructionShowcaseView

router = DefaultRouter()
router.register(r'', ConstructionMilestoneViewSet, basename='construction')
urlpatterns = [
    path('showcase/', ConstructionShowcaseView.as_view(), name='construction-showcase'),
    *router.urls,
]
