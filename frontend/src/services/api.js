import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/';

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

API.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => {

    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
      return { ...response, data: response.data.results };
    }
    return response;
  },
  (error) => {

    if (error.response) {

      const { status, data } = error.response;
      

      if (status === 400) {

        console.error('Validation Error:', data);
      } else if (status === 404) {
        console.error('Resource not found:', data);
      } else if (status === 500) {
        console.error('Server Error:', data);
      }
    } else if (error.request) {

      console.error('Network Error - No response from server');
    } else {

      console.error('Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);


export const roomService = {
  getAll: () => API.get('rooms/'),
  create: (data) => API.post('rooms/', data),
  update: (id, data) => API.put(`rooms/${id}/`, data),
  delete: (id) => API.delete(`rooms/${id}/`),
  getAvailable: (date, start, end) => 
    API.get(`rooms/available/?date=${date}&start_time=${start}&end_time=${end}`),
  getSchedule: (id, start, end) => 
    API.get(`rooms/${id}/schedule/?start_date=${start}&end_date=${end}`),
};


export const meetingService = {
  getAll: (filters = {}) => {

    const params = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
    );
    return API.get('meetings/', { params });
  },
  create: (data) => API.post('meetings/', data),
  update: (id, data) => API.put(`meetings/${id}/`, data),
  partialUpdate: (id, data) => API.patch(`meetings/${id}/`, data),
  delete: (id) => API.delete(`meetings/${id}/`),
  cancel: (id) => API.patch(`meetings/${id}/`, { status: 'Cancelled' }),
};


export const participantService = {
  getAll: (search = '') => API.get('participants/', { params: { search } }),
  create: (data) => API.post('participants/', data),
  update: (id, data) => API.put(`participants/${id}/`, data),
  delete: (id) => API.delete(`participants/${id}/`),
};


export const dashboardService = {
  getStats: () => API.get('dashboard/stats/'),
  getReports: () => API.get('dashboard/reports/'),
};


export default API;
