from rest_framework import serializers
from .models import Room, Participant, Meeting, MeetingParticipant


class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = '__all__'


class ParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Participant
        fields = '__all__'


class MeetingSerializer(serializers.ModelSerializer):

    room_details = RoomSerializer(source='room', read_only=True)
    participants = ParticipantSerializer(many=True, read_only=True)
    

    participant_ids = serializers.PrimaryKeyRelatedField(
        queryset=Participant.objects.all(),
        many=True,
        write_only=True,
        required=False,
        source='participants'  
    )

    class Meta:
        model = Meeting
        fields = [
            'id',
            'title',
            'description',
            'date',
            'start_time',
            'end_time',
            'status',
            'room',           
            'room_details',   
            'participants',   
            'participant_ids' 
        ]
        read_only_fields = ['status']  

    def validate(self, data):
        """Validate meeting time and room conflicts"""
        instance = self.instance
        room = data.get('room')
        date = data.get('date')
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        

        if instance:
            room = room or instance.room
            date = date or instance.date
            start_time = start_time or instance.start_time
            end_time = end_time or instance.end_time


        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError(
                {"end_time": "End time must be after start time."}
            )


        if room and date and start_time and end_time:
            conflicts = Meeting.objects.filter(
                room=room,
                date=date,
                start_time__lt=end_time,
                end_time__gt=start_time
            ).exclude(status='Cancelled')


            if instance:
                conflicts = conflicts.exclude(pk=instance.pk)

            if conflicts.exists():
                conflict_meeting = conflicts.first()
                raise serializers.ValidationError({
                    "room": f"Room '{room.name}' is already booked from "
                            f"{conflict_meeting.start_time.strftime('%H:%M')} to "
                            f"{conflict_meeting.end_time.strftime('%H:%M')} on {date}"
                })

        return data

    def create(self, validated_data):
        """Create meeting and attach participants"""

        participant_ids = validated_data.pop('participants', [])
        

        meeting = Meeting.objects.create(**validated_data)
        

        meeting.participants.set(participant_ids)
        
        return meeting

    def update(self, instance, validated_data):
        """Update meeting and update participants"""

        participant_ids = validated_data.pop('participants', None)
        

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        

        if participant_ids is not None:
            instance.participants.set(participant_ids)
        
        return instance
