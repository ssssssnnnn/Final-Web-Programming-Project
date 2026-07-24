import React, { useEffect, useState } from 'react';
import { dashboardService } from '../../services/api';

export default function DashboardView() {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');
        
        const [statsRes, reportsRes] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getReports()
        ]);
        
        setStats(statsRes.data);
        setReports(reportsRes.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError('Failed to load dashboard data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-100 text-red-800 rounded-lg border border-red-200">
        ⚠️ {error}
      </div>
    );
  }

  const statCards = [
    { label: 'Total Meetings', value: stats?.total_meetings || 0, color: 'text-blue-600' },
    { label: 'Active Reservations', value: stats?.active_reservations || 0, color: 'text-green-600' },
    { label: 'Completed Meetings', value: stats?.completed_meetings || 0, color: 'text-purple-600' },
    { label: 'Cancelled Bookings', value: stats?.cancelled_meetings || 0, color: 'text-red-600' },
    { label: 'Total Rooms', value: stats?.total_rooms || 0, color: 'text-indigo-600' },
    { label: 'Total Participants', value: stats?.total_participants || 0, color: 'text-teal-600' },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard Metrics</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition"
          >
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              {stat.label}
            </h3>
            <p className={`text-3xl font-bold mt-2 ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Room Utilization Report */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Room Performance & Utilization
        </h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-700 text-sm font-semibold border-b">
                  <th className="p-4">Room Name</th>
                  <th className="p-4">Building</th>
                  <th className="p-4">Capacity</th>
                  <th className="p-4">Meetings</th>
                  <th className="p-4">Active</th>
                  <th className="p-4">Completed</th>
                  <th className="p-4">Utilization</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-600">
                {reports?.room_utilization?.map((room, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-medium text-gray-900">{room.room_name}</td>
                    <td className="p-4">{room.building}</td>
                    <td className="p-4">{room.capacity}</td>
                    <td className="p-4">{room.total_meetings}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {room.active_reservations}
                      </span>
                    </td>
                    <td className="p-4">{room.completed_meetings}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              room.utilization_rate_pct > 70
                                ? 'bg-green-500'
                                : room.utilization_rate_pct > 40
                                ? 'bg-yellow-500'
                                : 'bg-blue-500'
                            }`}
                            style={{ width: `${room.utilization_rate_pct}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {room.utilization_rate_pct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(!reports?.room_utilization || reports.room_utilization.length === 0) && (
            <div className="p-8 text-center text-gray-400">
              No room data available yet.
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Meetings */}
      {reports?.upcoming_meetings && reports.upcoming_meetings.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Upcoming Meetings (Next 7 Days)
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {reports.upcoming_meetings.slice(0, 5).map((meeting) => (
                <div key={meeting.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <h3 className="font-bold text-gray-900">{meeting.title}</h3>
                    <p className="text-sm text-gray-500">
                      📅 {new Date(meeting.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                      &nbsp;|&nbsp; 🕒 {meeting.start_time.substring(0,5)} - {meeting.end_time.substring(0,5)}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      🏢 {meeting.room_details?.name || `Room ${meeting.room}`}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                    Scheduled
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
