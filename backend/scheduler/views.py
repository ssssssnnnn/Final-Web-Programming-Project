from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q
from datetime import datetime, timedelta
from .models import Room, Participant, Meeting
from .serializers import RoomSerializer, ParticipantSerializer, MeetingSerializer


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer

    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get available rooms for a specific time slot"""
        date_str = request.query_params.get('date')
        start_str = request.query_params.get('start_time')
        end_str = request.query_params.get('end_time')

        if not (date_str and start_str and end_str):
            return Response(
                {"error": "Missing required parameters: date, start_time, end_time"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            datetime.strptime(date_str, '%Y-%m-%d')
        except ValueError:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD"},
                status=status.HTTP_400_BAD_REQUEST
            )


        booked_room_ids = Meeting.objects.filter(
            date=date_str,
            start_time__lt=end_str,
            end_time__gt=start_str
        ).exclude(status='Cancelled').values_list('room_id', flat=True)

        available_rooms = Room.objects.exclude(id__in=booked_room_ids)
        serializer = self.get_serializer(available_rooms, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def schedule(self, request, pk=None):
        """Get room schedule for a date range"""
        room = self.get_object()
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        meetings = room.meetings.all()
        
        if start_date:
            try:
                datetime.strptime(start_date, '%Y-%m-%d')
                meetings = meetings.filter(date__gte=start_date)
            except ValueError:
                return Response(
                    {"error": "Invalid start_date format. Use YYYY-MM-DD"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        if end_date:
            try:
                datetime.strptime(end_date, '%Y-%m-%d')
                meetings = meetings.filter(date__lte=end_date)
            except ValueError:
                return Response(
                    {"error": "Invalid end_date format. Use YYYY-MM-DD"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        serializer = MeetingSerializer(meetings, many=True)
        return Response(serializer.data)


class MeetingViewSet(viewsets.ModelViewSet):
    queryset = Meeting.objects.all()
    serializer_class = MeetingSerializer

    def get_queryset(self):
        """Filter meetings based on query parameters"""
        queryset = Meeting.objects.all()
        

        title = self.request.query_params.get('search')
        if title:
            queryset = queryset.filter(title__icontains=title)
        

        date = self.request.query_params.get('date')
        if date:
            queryset = queryset.filter(date=date)
        

        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        

        room = self.request.query_params.get('room')
        if room:
            queryset = queryset.filter(room_id=room)
        

        return queryset.order_by('-date', '-start_time')

    def partial_update(self, request, *args, **kwargs):
        """Allow partial updates (mainly for status changes)"""
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)


class DashboardViewSet(viewsets.ViewSet):
    def list(self, request):
        """Get dashboard statistics"""
        total_meetings = Meeting.objects.count()
        total_rooms = Room.objects.count()
        total_participants = Participant.objects.count()
        cancelled = Meeting.objects.filter(status='Cancelled').count()
        active = Meeting.objects.filter(status='Scheduled').count()
        completed = Meeting.objects.filter(status='Completed').count()

        return Response({
            "total_meetings": total_meetings,
            "total_rooms": total_rooms,
            "total_participants": total_participants,
            "cancelled_meetings": cancelled,
            "active_reservations": active,
            "completed_meetings": completed
        })

    @action(detail=False, methods=['get'])
    def reports(self, request):
        """Get detailed room utilization reports"""
        rooms = Room.objects.all()
        report_data = []

        for room in rooms:

            total_meetings = room.meetings.count()
            active_meetings = room.meetings.filter(status='Scheduled').count()
            completed_meetings = room.meetings.filter(status='Completed').count()
            cancelled_meetings = room.meetings.filter(status='Cancelled').count()
            

            total_booked_hours = 0
            active_meetings_list = room.meetings.exclude(status='Cancelled')
            
            for meeting in active_meetings_list:

                delta = datetime.combine(meeting.date, meeting.end_time) - \
                        datetime.combine(meeting.date, meeting.start_time)
                total_booked_hours += delta.total_seconds() / 3600




            max_weekly_hours = 40
            utilization_rate = min(
                round((total_booked_hours / max_weekly_hours) * 100, 2),
                100.0
            ) if total_booked_hours > 0 else 0.0

            report_data.append({
                "room_id": room.id,
                "room_name": room.name,
                "room_number": room.room_number,
                "building": room.building,
                "capacity": room.capacity,
                "total_meetings": total_meetings,
                "active_reservations": active_meetings,
                "completed_meetings": completed_meetings,
                "cancelled_meetings": cancelled_meetings,
                "total_booked_hours": round(total_booked_hours, 2),
                "utilization_rate_pct": utilization_rate
            })


        today = datetime.now().date()
        next_week = today + timedelta(days=7)
        
        upcoming = Meeting.objects.filter(
            date__gte=today,
            date__lte=next_week,
            status='Scheduled'
        ).order_by('date', 'start_time')[:10]

        return Response({
            "room_utilization": report_data,
            "upcoming_meetings": MeetingSerializer(upcoming, many=True).data
        })


class ParticipantViewSet(viewsets.ModelViewSet):
    queryset = Participant.objects.all()
    serializer_class = ParticipantSerializer
    
    def get_queryset(self):
        """Filter participants by search"""
        queryset = Participant.objects.all()
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(email__icontains=search) |
                Q(phone__icontains=search)
            )
        return queryset
