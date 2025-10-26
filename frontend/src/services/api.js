import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Students API 
export const studentsAPI = {
  getAll: () => api.get('/students'),
  getByAdmission: (admissionNumber) => api.get(`/students/by-admission?admissionNumber=${encodeURIComponent(admissionNumber)}`),
  create: (studentData) => api.post('/students', studentData),
  update: (id, studentData) => api.put(`/students/${id}`, studentData),
  delete: (id) => api.delete(`/students/${id}`), // Add this line if missing
};

// Fees API
export const feesAPI = {
  getPayments: () => api.get('/fees/payments'),
  // admissionNumber may contain slashes (e.g., AEC/001/2025) so encode it when used in the URL path
  getStudentPayments: (admissionNumber) => api.get(`/fees/payments/student/${encodeURIComponent(admissionNumber)}`),
  recordPayment: (paymentData) => api.post('/fees/payments', paymentData),
  getBalance: (admissionNumber) => api.get(`/fees/balance/${encodeURIComponent(admissionNumber)}`),
  getFeeStructures: () => api.get('/fees/structure'),
  getDashboardSummary: () => api.get('/fees/dashboard/summary'),
  updatePayment: (id, paymentData) => api.put(`/fees/payments/${id}`, paymentData),
  deletePayment: (id) => api.delete(`/fees/payments/${id}`),
};

export default api;