from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone


class Room(models.Model):
    name = models.CharField(max_length=100, unique=True)
    room_number = models.CharField(max_length=20, default='000')
    building = models.CharField(max_length=100, default='Main')
    capacity = models.IntegerField(default=10)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['building', 'name']
        unique_together = [['building', 'room_number']]  

    def __str__(self):
        return f"{self.name} (Room {self.room_number})"

    def clean(self):
        if self.capacity < 1:
            raise ValidationError({"capacity": "Capacity must be at least 1."})


class Participant(models.Model):
    name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    def clean(self):
        if self.email:

            pass


class Meeting(models.Model):
    STATUS_CHOICES = [
        ('Scheduled', 'Scheduled'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='Scheduled')
    

    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='meetings')
    participants = models.ManyToManyField(
        Participant, 
        through='MeetingParticipant', 
        related_name='meetings'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-start_time']
        indexes = [
            models.Index(fields=['date', 'status']),
            models.Index(fields=['room', 'date']),
        ]

    def __str__(self):
        return f"{self.title} - {self.date} {self.start_time}"

    def clean(self):
        """Validate meeting time and conflicts"""

        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError({
                "end_time": "Start time must be before end time."
            })


        if self.room and self.date and self.start_time and self.end_time:
            overlapping_meetings = Meeting.objects.filter(
                room=self.room,
                date=self.date,
                status='Scheduled'
            ).exclude(pk=self.pk)

            for meeting in overlapping_meetings:
                if self.start_time < meeting.end_time and self.end_time > meeting.start_time:
                    raise ValidationError({
                        "room": f"Time conflict! Room '{self.room.name}' is already booked "
                                f"from {meeting.start_time.strftime('%H:%M')} to "
                                f"{meeting.end_time.strftime('%H:%M')} on {self.date}."
                    })

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class MeetingParticipant(models.Model):
    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE)
    participant = models.ForeignKey(Participant, on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True)  

    class Meta:
        unique_together = ('meeting', 'participant')
        ordering = ['participant__name']

    def __str__(self):
        return f"{self.participant.name} in {self.meeting.title}"
