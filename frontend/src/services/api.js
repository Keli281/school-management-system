import axios from 'axios';

// Change from local to deployed backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://awinja-backend.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

console.log('🔗 API Base URL:', API_BASE_URL); // Add this to debug

// Add token to requests automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

// Students API 
export const studentsAPI = {
  getAll: () => api.get('/students'),
  getByAdmission: (admissionNumber) => api.get(`/students/by-admission?admissionNumber=${encodeURIComponent(admissionNumber)}`),
  create: (studentData) => api.post('/students', studentData),
  update: (id, studentData) => api.put(`/students/${id}`, studentData),
  delete: (id) => api.delete(`/students/${id}`),
};

// Fees API
export const feesAPI = {
  getPayments: () => api.get('/fees/payments'),
  getStudentPayments: (admissionNumber) => api.get(`/fees/payments/student/${encodeURIComponent(admissionNumber)}`),
  recordPayment: (paymentData) => api.post('/fees/payments', paymentData),
  getBalance: (admissionNumber) => api.get(`/fees/balance/${encodeURIComponent(admissionNumber)}`),
  getFeeStructures: () => api.get('/fees/structure'),
  getDashboardSummary: () => api.get('/fees/dashboard/summary'),
  updatePayment: (id, paymentData) => api.put(`/fees/payments/${id}`, paymentData),
  deletePayment: (id) => api.delete(`/fees/payments/${id}`),
};

// Teachers API
export const teachersAPI = {
  getAll: () => api.get('/teachers'),
  getById: (id) => api.get(`/teachers/${id}`),
  create: (teacherData) => api.post('/teachers', teacherData),
  update: (id, teacherData) => api.put(`/teachers/${id}`, teacherData),
  delete: (id) => api.delete(`/teachers/${id}`),
  getByGrade: (grade) => api.get(`/teachers/grade/${grade}`),
};

export default api;