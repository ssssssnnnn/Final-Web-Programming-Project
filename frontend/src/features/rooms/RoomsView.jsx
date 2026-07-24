import React, { useState, useEffect } from 'react';
import { roomService } from '../../services/api';

export default function RoomsView() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    room_number: '',
    building: '',
    capacity: 10,
    description: ''
  });

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await roomService.getAll();
      setRooms(response.data || []);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      setError('Failed to load rooms. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    // Validate
    if (formData.capacity < 1) {
      setError('Capacity must be at least 1.');
      setSubmitting(false);
      return;
    }

    try {
      await roomService.create(formData);
      setSuccess('Room created successfully!');
      setFormData({ name: '', room_number: '', building: '', capacity: 10, description: '' });
      await fetchRooms();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error("Error creating room:", error);
      const errorMsg = error.response?.data?.name?.[0] || 
                       error.response?.data?.detail || 
                       'Failed to create room. Please try again.';
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Room Management</h1>

      {success && (
        <div className="p-4 bg-green-100 text-green-800 rounded-lg border border-green-200">
          ✅ {success}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-100 text-red-800 rounded-lg border border-red-200">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ADD ROOM FORM */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit sticky top-4">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Add New Room</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Room Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Tesla Hall"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Room Number *</label>
              <input
                type="text"
                name="room_number"
                value={formData.room_number}
                onChange={handleChange}
                required
                className="mt-1 block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 302"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Building *</label>
              <input
                type="text"
                name="building"
                value={formData.building}
                onChange={handleChange}
                required
                className="mt-1 block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Engineering Block"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Capacity *</label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                required
                min="1"
                className="mt-1 block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="2"
                className="mt-1 block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Optional room description"
              />
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
              {submitting ? 'Creating...' : 'Create Room'}
            </button>
          </form>
        </div>

        {/* ROOMS TABLE */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">System Rooms</h2>
            <span className="text-sm text-gray-500">{rooms.length} room{rooms.length !== 1 ? 's' : ''}</span>
          </div>
          
          {rooms.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No rooms created yet. Add your first room using the form.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-700 text-sm font-semibold border-b">
                    <th className="p-4">Room Name</th>
                    <th className="p-4">Number</th>
                    <th className="p-4">Building</th>
                    <th className="p-4">Capacity</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-gray-600">
                  {rooms.map((room) => (
                    <tr key={room.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-medium text-gray-900">{room.name}</td>
                      <td className="p-4">{room.room_number}</td>
                      <td className="p-4">{room.building}</td>
                      <td className="p-4">{room.capacity} people</td>
                      <td className="p-4">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Available
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
