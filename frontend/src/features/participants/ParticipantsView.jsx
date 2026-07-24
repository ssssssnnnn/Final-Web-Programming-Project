import React, { useState, useEffect } from 'react';
import { participantService } from '../../services/api';

export default function ParticipantsView() {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const [searchTerm, setSearchTerm] = useState('');

  const fetchParticipants = async (search = '') => {
    try {
      setLoading(true);
      setError('');
      const response = await participantService.getAll(search);
      setParticipants(response.data || []);
    } catch (error) {
      console.error("Error fetching participants:", error);
      setError('Failed to load participants. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchParticipants(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      setSubmitting(false);
      return;
    }

    try {
      await participantService.create(formData);
      setSuccess('Participant registered successfully!');
      setFormData({ name: '', email: '', phone: '' });
      await fetchParticipants(searchTerm);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error("Error creating participant:", error);
      
      let errorMsg = 'Failed to add participant. ';
      if (error.response?.data?.email) {
        errorMsg = `Email "${formData.email}" is already registered.`;
      } else if (error.response?.data?.detail) {
        errorMsg += error.response.data.detail;
      } else {
        errorMsg += 'Please check your input and try again.';
      }
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && participants.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">People Management</h1>

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
        {/* Registration Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit sticky top-4">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Register New Participant</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="john@example.com"
              />
              <p className="text-xs text-gray-400 mt-1">Must be unique</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="+1 234 567 890"
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
              {submitting ? 'Registering...' : 'Add Participant'}
            </button>
          </form>
        </div>

        {/* Directory */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
            <span className="font-semibold text-gray-700">
              Registered Directory ({participants.length})
            </span>
            <input
              type="text"
              placeholder="Search participants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-2 border rounded-md text-sm w-64 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {participants.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              {searchTerm ? 'No participants match your search.' : 'No participants registered yet.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-700 text-sm font-semibold border-b">
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">Meetings</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-gray-600">
                  {participants.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-medium text-gray-900">{p.name}</td>
                      <td className="p-4">
                        <a href={`mailto:${p.email}`} className="text-blue-600 hover:underline">
                          {p.email}
                        </a>
                      </td>
                      <td className="p-4">{p.phone || '—'}</td>
                      <td className="p-4">
                        <span className="text-sm text-gray-500">
                          {p.meetings?.length || 0} meeting{p.meetings?.length !== 1 ? 's' : ''}
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
