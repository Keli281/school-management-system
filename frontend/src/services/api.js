import axios from 'axios';

// Detect if we're in development or production
const isDevelopment = import.meta.env.DEV;

// Use local backend in development, deployed backend in production
const API_BASE_URL = isDevelopment 
  ? 'http://localhost:5000/api'  // Local development
  : import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'; // Production

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 40000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
});

console.log('🔗 API Base URL:', API_BASE_URL);
console.log('🌐 Environment:', isDevelopment ? 'Development' : 'Production');

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
  getFeeStructures: () => api.get('/fees/structure'),
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
  
  // Payroll endpoints
  markPaid: (id, paymentData) => api.post(`/teachers/${id}/mark-paid`, paymentData),
  getPaymentStatus: (id, year, month) => api.get(`/teachers/${id}/payment-status/${year}/${month}`),
  getPaymentHistory: (id) => api.get(`/teachers/${id}/payment-history`),
  bulkMarkPaid: (paymentData) => api.post('/teachers/bulk/mark-paid', paymentData),
  getPayrollSummary: (year, month) => api.get(`/teachers/payroll/summary/${year}/${month}`)
};

// Non-Teaching Staff API
export const nonTeachingStaffAPI = {
  getAll: () => api.get('/non-teaching-staff'),
  getById: (id) => api.get(`/non-teaching-staff/${id}`),
  create: (staffData) => api.post('/non-teaching-staff', staffData),
  update: (id, staffData) => api.put(`/non-teaching-staff/${id}`, staffData),
  delete: (id) => api.delete(`/non-teaching-staff/${id}`),
  getByRole: (role) => api.get(`/non-teaching-staff/role/${role}`),
  getStats: () => api.get('/non-teaching-staff/stats/summary'),
  
  // Payroll endpoints
  markPaid: (id, paymentData) => api.post(`/non-teaching-staff/${id}/mark-paid`, paymentData),
  getPaymentStatus: (id, year, month) => api.get(`/non-teaching-staff/${id}/payment-status/${year}/${month}`),
  getPaymentHistory: (id) => api.get(`/non-teaching-staff/${id}/payment-history`),
  bulkMarkPaid: (paymentData) => api.post('/non-teaching-staff/bulk/mark-paid', paymentData),
  getPayrollSummary: (year, month) => api.get(`/non-teaching-staff/payroll/summary/${year}/${month}`)
};

// NEW: Combined Payroll API (for both teachers and staff)
export const payrollAPI = {
  // You can add combined endpoints here if needed
};

export default api;