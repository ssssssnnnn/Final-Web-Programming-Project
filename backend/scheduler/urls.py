from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RoomViewSet, MeetingViewSet, ParticipantViewSet, DashboardViewSet 

router = DefaultRouter()
router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'meetings', MeetingViewSet, basename='meeting')
router.register(r'participants', ParticipantViewSet, basename='participant')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/stats/', DashboardViewSet.as_view({'get': 'list'}), name='dashboard-stats'),
    path('dashboard/reports/', DashboardViewSet.as_view({'get': 'reports'}), name='dashboard-reports'),
]