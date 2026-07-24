import React, { useState, useEffect } from 'react';
import { roomService, meetingService, participantService } from '../../services/api';

export default function MeetingsView() {
  const [meetings, setMeetings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    room: '',
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRoom, setFilterRoom] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      
      const [meetingsRes, roomsRes, participantsRes] = await Promise.all([
        meetingService.getAll(),
        roomService.getAll(),
        participantService.getAll()
      ]);

      // No defensive extraction needed - interceptor handles pagination
      setMeetings(meetingsRes.data || []);
      setRooms(roomsRes.data || []);
      setParticipants(participantsRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
      setErrorMessage('Failed to load data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Toggle participant selection
  const handleParticipantToggle = (id) => {
    setSelectedParticipants(prev =>
      prev.includes(id)
        ? prev.filter(pId => pId !== id)
        : [...prev, id]
    );
  };

  // Submit new meeting
 const handleSubmit = async (e) => {
  e.preventDefault();
  setErrorMessage('');
  setSuccessMessage('');
  setSubmitting(true);

  // Validate time
  if (formData.start_time >= formData.end_time) {
    setErrorMessage('Start time must be before end time.');
    setSubmitting(false);
    return;
  }

  // Validate room selection
  if (!formData.room) {
    setErrorMessage('Please select a room.');
    setSubmitting(false);
    return;
  }

  // Prepare data - MATCHES BACKEND EXPECTATIONS
  const submissionData = {
    title: formData.title,
    description: formData.description || '',
    date: formData.date,
    start_time: formData.start_time,
    end_time: formData.end_time,
    room: Number(formData.room), // ⭐ MUST be a number, not string
    participant_ids: selectedParticipants, // ⭐ MUST be participant_ids (matches backend)
  };

  console.log('📤 Sending data:', submissionData); // Debug log

  try {
    const response = await meetingService.create(submissionData);
    
    setSuccessMessage(`Meeting "${response.data.title}" booked successfully!`);
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      date: '',
      start_time: '',
      end_time: '',
      room: '',
    });
    setSelectedParticipants([]);
    
    // Refresh data
    await fetchData();
    
    // Auto-clear success message after 5 seconds
    setTimeout(() => setSuccessMessage(''), 5000);
  } catch (error) {
    console.error("Error creating meeting:", error);
    
    // Extract error message from response
    let errorMsg = 'Failed to book meeting. ';
    if (error.response && error.response.data) {
      const data = error.response.data;
      console.log('❌ Error details:', data);
      
      if (typeof data === 'string') {
        errorMsg += data;
      } else if (data.non_field_errors) {
        errorMsg += data.non_field_errors.join(' ');
      } else if (data.room) {
        errorMsg += Array.isArray(data.room) ? data.room.join(' ') : data.room;
      } else if (data.participant_ids) {
        errorMsg += 'Invalid participant selection.';
      } else if (data.detail) {
        errorMsg += data.detail;
      } else {
        errorMsg += 'Please check your input and try again.';
      }
    } else {
      errorMsg += 'Please check your connection and try again.';
    }
    
    setErrorMessage(errorMsg);
  } finally {
    setSubmitting(false);
  }
};

  // Cancel meeting
  const handleCancelMeeting = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this meeting?')) {
      return;
    }

    try {
      await meetingService.cancel(id);
      await fetchData();
      setSuccessMessage('Meeting cancelled successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error("Error cancelling meeting:", error);
      setErrorMessage('Failed to cancel meeting. Please try again.');
    }
  };

  // Filter meetings client-side
  const filteredMeetings = meetings.filter((meeting) => {
    // Handle both ID and object for room
    const roomId = typeof meeting.room === 'object' ? meeting.room?.id : meeting.room;
    
    const matchesSearch = meeting.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRoom = !filterRoom || String(roomId) === String(filterRoom);
    const matchesStatus = !filterStatus || meeting.status === filterStatus;
    const matchesDate = !filterDate || meeting.date === filterDate;
    
    return matchesSearch && matchesRoom && matchesStatus && matchesDate;
  });

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Meetings Scheduler</h1>

      {/* Messages */}
      {successMessage && (
        <div className="p-4 bg-green-100 text-green-800 rounded-lg font-medium border border-green-200">
          ✅ {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-red-100 text-red-800 rounded-lg font-medium border border-red-200">
          ⚠️ {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* FORM PANEL */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit sticky top-4">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Book New Meeting</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Meeting Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="mt-1 block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Sprint Planning"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Date *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
                className="mt-1 block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start *</label>
                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End *</label>
                <input
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Room *</label>
              <select
                name="room"
                value={formData.room}
                onChange={handleChange}
                required
                className="mt-1 block w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Choose a Room --</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} (Capacity: {r.capacity})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Participants ({selectedParticipants.length} selected)
              </label>
              <div className="border rounded-md p-3 max-h-32 overflow-y-auto space-y-2 bg-gray-50">
                {participants.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center">No participants registered.</p>
                ) : (
                  participants.map(p => (
                    <label
                      key={p.id}
                      className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer hover:bg-gray-100 p-1 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedParticipants.includes(p.id)}
                        onChange={() => handleParticipantToggle(p.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{p.name}</span>
                      <span className="text-xs text-gray-400">({p.email})</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full text-white p-2.5 rounded-md font-semibold transition ${
                submitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {submitting ? 'Booking...' : 'Confirm Reservation'}
            </button>
          </form>
        </div>

        {/* LIST PANEL */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="p-2 border rounded-md text-sm w-full focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className="p-2 border rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Rooms</option>
              {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="p-2 border rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

            {/* Meetings List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b font-semibold text-gray-700 flex justify-between">
              <span>Scheduled Reservations</span>
              <span className="text-sm font-normal text-gray-500">
                {filteredMeetings.length} meeting{filteredMeetings.length !== 1 ? 's' : ''}
              </span>
            </div>
           
            {filteredMeetings.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                No meetings found matching your criteria.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredMeetings.map((meeting) => {
                  let roomName = 'Unknown Room';
                  if (typeof meeting.room === 'object' && meeting.room) {
                    roomName = meeting.room.name;
                  } else if (meeting.room) {
                    const foundRoom = rooms.find(r => String(r.id) === String(meeting.room));
                    roomName = foundRoom ? foundRoom.name : `Room ${meeting.room}`;
                  }
                 
                  return (
                    <div key={meeting.id} className="p-6 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-lg">{meeting.title}</h3>
                          <p className="text-sm text-gray-500">
                            📅 {new Date(meeting.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                            &nbsp;|&nbsp; 🕒 {meeting.start_time.substring(0,5)} - {meeting.end_time.substring(0,5)}
                          </p>
                          <p className="text-xs text-blue-600 mt-1 font-medium">🏢 Room: {roomName}</p>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                          meeting.status === 'Scheduled'
                            ? 'bg-green-100 text-green-800'
                            : meeting.status === 'Cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {meeting.status}
                        </span>
                      </div>

                      {/* Participants with Notes */}
                      {meeting.participants && meeting.participants.length > 0 && (
                        <div className="mt-5">
                          <p className="text-sm font-medium text-gray-700 mb-3">👥 Participants & Notes:</p>
                          <div className="space-y-3">
                            {meeting.participants.map((p, index) => (
                              <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <div className="font-medium">{p.name}</div>
                                <div className="text-xs text-gray-500">{p.email}</div>
                                {p.note ? (
                                  <p className="mt-3 text-sm text-gray-600 italic pl-3 border-l-2 border-blue-500">
                                    "{p.note}"
                                  </p>
                                ) : (
                                  <p className="mt-3 text-xs text-gray-400">No note added</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {meeting.status === 'Scheduled' && (
                        <button
                          onClick={() => handleCancelMeeting(meeting.id)}
                          className="mt-4 text-xs text-red-500 border border-red-200 rounded px-3 py-1 hover:bg-red-50 transition whitespace-nowrap"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
