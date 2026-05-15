import axios from 'axios';

const GATEWAY_URL = process.env.REACT_APP_GATEWAY_URL;

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

axios.interceptors.response.use(
  response => response,
  error => {
    const url    = error.config?.url || 'unknown';
    const status = error.response?.status || 'NO_RESPONSE';
    const msg    = error.response?.data?.message || error.message;
    console.error(`[API ERROR] ${status} — ${url} — ${msg}`);
    return Promise.reject(error);
  }
);

export const authApi = {
  register:      (data) => axios.post(`${GATEWAY_URL}/auth/register`, data),
  login:         (data) => axios.post(`${GATEWAY_URL}/auth/login`, data),
  forgotPassword:(data) => axios.post(`${GATEWAY_URL}/auth/forgot-password`, data),
  verifyResetOtp:(data) => axios.post(`${GATEWAY_URL}/auth/verify-reset-otp`, data),
  resetPassword: (data) => axios.post(`${GATEWAY_URL}/auth/reset-password`, data),
  googleLogin:   (data) => axios.post(`${GATEWAY_URL}/auth/google`, data),
  getProfile:    ()     => axios.get(`${GATEWAY_URL}/auth/profile`, { headers: authHeader() }),
};

export const flightApi = {
  search:      (source, destination, date) =>
    axios.get(`${GATEWAY_URL}/flights/search`, { params: { source, destination, date } }),
  getAll:      () => axios.get(`${GATEWAY_URL}/flights`, { headers: authHeader() }),
  addFlight:   (data) => axios.post(`${GATEWAY_URL}/flights`, data, { headers: authHeader() }),
  reduceSeats: (flightId, seats) =>
    axios.put(`${GATEWAY_URL}/flights/${flightId}/reduce-seats`, null, {
      params: { seats }, headers: authHeader(),
    }),
  updateStatus: (flightId, status) =>
    axios.put(`${GATEWAY_URL}/flights/${flightId}/status`, null, {
      params: { status }, headers: authHeader(),
    }),
  getPassengers: (flightId) =>
    axios.get(`${GATEWAY_URL}/passengers/flight/${flightId}`, { headers: authHeader() }),
};

export const seatApi = {
  getSeatsByFlight:  (flightId) =>
    axios.get(`${GATEWAY_URL}/seats/flight/${flightId}`, { headers: authHeader() }),
  getAvailableSeats: (flightId) =>
    axios.get(`${GATEWAY_URL}/seats/flight/${flightId}/available`, { headers: authHeader() }),
  getSeatsByClass: (flightId, seatClass) =>
    axios.get(`${GATEWAY_URL}/seats/flight/${flightId}/class/${seatClass}`, { headers: authHeader() }),
  getSeatCount: (flightId) =>
    axios.get(`${GATEWAY_URL}/seats/flight/${flightId}/count`, { headers: authHeader() }),
  holdSeat:    (flightId, seatNumber) =>
    axios.put(`${GATEWAY_URL}/seats/flight/${flightId}/hold/${seatNumber}`, null, { headers: authHeader() }),
  confirmSeat: (flightId, seatNumber) =>
    axios.put(`${GATEWAY_URL}/seats/flight/${flightId}/confirm/${seatNumber}`, null, { headers: authHeader() }),
  releaseSeat: (flightId, seatNumber) =>
    axios.put(`${GATEWAY_URL}/seats/flight/${flightId}/release/${seatNumber}`, null, { headers: authHeader() }),
  addSeat:     (data) => axios.post(`${GATEWAY_URL}/seats`, data, { headers: authHeader() }),
};

export const bookingApi = {
  createBooking:  (data) => axios.post(`${GATEWAY_URL}/bookings`, data, { headers: authHeader() }),
  getByBookingId: (bookingId) =>
    axios.get(`${GATEWAY_URL}/bookings/${bookingId}`, { headers: authHeader() }),
  cancelBooking:  (bookingId) =>
    axios.delete(`${GATEWAY_URL}/bookings/${bookingId}`, { headers: authHeader() }),
};

export const passengerApi = {
  addPassenger:    (data) => axios.post(`${GATEWAY_URL}/passengers`, data, { headers: authHeader() }),
  getByBooking:    (bookingId) =>
    axios.get(`${GATEWAY_URL}/passengers/booking/${bookingId}`, { headers: authHeader() }),
  updatePassenger: (id, data) =>
    axios.put(`${GATEWAY_URL}/passengers/${id}`, data, { headers: authHeader() }),
  deletePassenger: (id) =>
    axios.delete(`${GATEWAY_URL}/passengers/${id}`, { headers: authHeader() }),
  deleteByBooking: (bookingId) =>
    axios.delete(`${GATEWAY_URL}/passengers/booking/${bookingId}`, { headers: authHeader() }),
  getByTicket:     (ticketNumber) =>
    axios.get(`${GATEWAY_URL}/passengers/ticket/${ticketNumber}`, { headers: authHeader() }),
  getByPassport:   (passportNumber) =>
    axios.get(`${GATEWAY_URL}/passengers/passport/${passportNumber}`, { headers: authHeader() }),
  getCount:        (bookingId) =>
    axios.get(`${GATEWAY_URL}/passengers/count/${bookingId}`, { headers: authHeader() }),
};

export const paymentApi = {
  pay:          (data) => axios.post(`${GATEWAY_URL}/payments`, data, { headers: authHeader() }),
  createOrder:  (data) => axios.post(`${GATEWAY_URL}/payments/create-order`, data, { headers: authHeader() }),
  verifyPayment:(data) => axios.post(`${GATEWAY_URL}/payments/verify`, data, { headers: authHeader() }),
  getByBooking: (bookingId) =>
    axios.get(`${GATEWAY_URL}/payments/booking/${bookingId}`, { headers: authHeader() }),
  getByUser:    (email) =>
    axios.get(`${GATEWAY_URL}/payments/user/${email}`, { headers: authHeader() }),
  getByStatus:  (status) =>
    axios.get(`${GATEWAY_URL}/payments/status/${status}`, { headers: authHeader() }),
  refund:       (bookingId) =>
    axios.post(`${GATEWAY_URL}/payments/refund/${bookingId}`, null, { headers: authHeader() }),
  getRevenueForBookings: (bookingIds) =>
    axios.post(`${GATEWAY_URL}/payments/bookings/total`, bookingIds, { headers: authHeader() }),
};

export const adminApi = {
  backfillPassengerFlightIds: () =>
    axios.post(`${GATEWAY_URL}/passengers/admin/backfill-flight-ids`, null, { headers: authHeader() }),
};

export const authProfileApi = {
  getProfile:   () => axios.get(`${GATEWAY_URL}/auth/profile`, { headers: authHeader() }),
  updateProfile: (data) => axios.put(`${GATEWAY_URL}/auth/profile`, data, { headers: authHeader() }),
};

export const airlineApi = {
  getAll:         () => axios.get(`${GATEWAY_URL}/airlines`, { headers: authHeader() }),
  addAirline:     (data) => axios.post(`${GATEWAY_URL}/airlines`, data, { headers: authHeader() }),
  toggleStatus:   (id) =>
    axios.put(`${GATEWAY_URL}/airlines/${id}/toggle-status`, null, { headers: authHeader() }),
  searchAirports: (keyword) =>
    axios.get(`${GATEWAY_URL}/airports/search`, { params: { keyword }, headers: authHeader() }),
  getAllAirports:  () => axios.get(`${GATEWAY_URL}/airports`, { headers: authHeader() }),
  addAirport:     (data) => axios.post(`${GATEWAY_URL}/airports`, data, { headers: authHeader() }),
};