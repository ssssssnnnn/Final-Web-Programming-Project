from django.contrib import admin
from .models import Room, Participant, Meeting, MeetingParticipant

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('name', 'room_number', 'building', 'capacity')

@admin.register(Participant)
class ParticipantAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone')

@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    list_display = ('title', 'date', 'start_time', 'end_time', 'room', 'status')
    list_filter = ('status', 'date', 'room')

@admin.register(MeetingParticipant)
class MeetingParticipantAdmin(admin.ModelAdmin):
    list_display = ('meeting', 'participant')
