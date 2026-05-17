import axios from 'axios';
import {
  authApi,
  flightApi,
  seatApi,
  bookingApi,
  passengerApi,
  paymentApi,
  adminApi,
  authProfileApi,
  airlineApi
} from '../api/api';

jest.mock('axios', () => {
  const mockAxios = {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      response: {
        use: jest.fn()
      }
    }
  };
  return mockAxios;
});

// Capture interceptor calls before beforeEach clears them
const interceptorUseSpy = axios.interceptors.response.use;
const capturedInterceptorCalls = [...interceptorUseSpy.mock.calls];

describe('API Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('authHeader handles empty and existing tokens', async () => {
    // We can indirectly trigger authHeader through getProfile
    axios.get.mockResolvedValue({ data: 'ok' });
    
    // No token
    await authApi.getProfile();
    expect(axios.get).toHaveBeenCalledWith(expect.any(String), { headers: {} });

    // With token
    localStorage.setItem('token', 'my-test-token');
    await authApi.getProfile();
    expect(axios.get).toHaveBeenLastCalledWith(expect.any(String), {
      headers: { Authorization: 'Bearer my-test-token' }
    });
  });

  test('authApi calls', async () => {
    axios.post.mockResolvedValue({ data: 'ok' });
    axios.get.mockResolvedValue({ data: 'ok' });

    await authApi.register({ username: 'test' });
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/auth/register'), { username: 'test' });

    await authApi.login({ username: 'test' });
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/auth/login'), { username: 'test' });

    await authApi.forgotPassword({ email: 'test' });
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/auth/forgot-password'), { email: 'test' });

    await authApi.verifyResetOtp({ otp: '1234' });
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/auth/verify-reset-otp'), { otp: '1234' });

    await authApi.resetPassword({ pass: '123' });
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/auth/reset-password'), { pass: '123' });

    await authApi.googleLogin({ token: 'abc' });
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/auth/google'), { token: 'abc' });
  });

  test('flightApi calls', async () => {
    axios.get.mockResolvedValue({ data: 'ok' });
    axios.post.mockResolvedValue({ data: 'ok' });
    axios.put.mockResolvedValue({ data: 'ok' });

    await flightApi.search('DEL', 'BOM', '2026-05-20');
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/flights/search'), {
      params: { source: 'DEL', destination: 'BOM', date: '2026-05-20' }
    });

    await flightApi.getAll();
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/flights'), { headers: {} });

    await flightApi.addFlight({ num: '123' });
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/flights'), { num: '123' }, { headers: {} });

    await flightApi.reduceSeats('F1', 2);
    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/flights/F1/reduce-seats'), null, {
      params: { seats: 2 }, headers: {}
    });

    await flightApi.updateStatus('F1', 'DELAYED');
    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/flights/F1/status'), null, {
      params: { status: 'DELAYED' }, headers: {}
    });

    await flightApi.getPassengers('F1');
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/passengers/flight/F1'), { headers: {} });
  });

  test('seatApi calls', async () => {
    axios.get.mockResolvedValue({ data: 'ok' });
    axios.put.mockResolvedValue({ data: 'ok' });
    axios.post.mockResolvedValue({ data: 'ok' });

    await seatApi.getSeatsByFlight('F1');
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/seats/flight/F1'), { headers: {} });

    await seatApi.getAvailableSeats('F1');
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/seats/flight/F1/available'), { headers: {} });

    await seatApi.getSeatsByClass('F1', 'ECONOMY');
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/seats/flight/F1/class/ECONOMY'), { headers: {} });

    await seatApi.getSeatCount('F1');
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/seats/flight/F1/count'), { headers: {} });

    await seatApi.holdSeat('F1', '12A');
    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/seats/flight/F1/hold/12A'), null, { headers: {} });

    await seatApi.confirmSeat('F1', '12A');
    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/seats/flight/F1/confirm/12A'), null, { headers: {} });

    await seatApi.releaseSeat('F1', '12A');
    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/seats/flight/F1/release/12A'), null, { headers: {} });

    await seatApi.addSeat({ seat: '1' });
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/seats'), { seat: '1' }, { headers: {} });
  });

  test('bookingApi calls', async () => {
    axios.post.mockResolvedValue({ data: 'ok' });
    axios.get.mockResolvedValue({ data: 'ok' });
    axios.delete.mockResolvedValue({ data: 'ok' });

    await bookingApi.createBooking({ id: 'B1' });
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/bookings'), { id: 'B1' }, { headers: {} });

    await bookingApi.getByBookingId('B1');
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/bookings/B1'), { headers: {} });

    await bookingApi.cancelBooking('B1');
    expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/bookings/B1'), { headers: {} });
  });

  test('passengerApi calls', async () => {
    axios.post.mockResolvedValue({ data: 'ok' });
    axios.get.mockResolvedValue({ data: 'ok' });
    axios.put.mockResolvedValue({ data: 'ok' });
    axios.delete.mockResolvedValue({ data: 'ok' });

    await passengerApi.addPassenger({ id: 'P1' });
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/passengers'), { id: 'P1' }, { headers: {} });

    await passengerApi.getByBooking('B1');
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/passengers/booking/B1'), { headers: {} });

    await passengerApi.updatePassenger('P1', { name: 'P' });
    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/passengers/P1'), { name: 'P' }, { headers: {} });

    await passengerApi.deletePassenger('P1');
    expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/passengers/P1'), { headers: {} });

    await passengerApi.deleteByBooking('B1');
    expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/passengers/booking/B1'), { headers: {} });

    await passengerApi.getByTicket('T123');
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/passengers/ticket/T123'), { headers: {} });

    await passengerApi.getByPassport('PP123');
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/passengers/passport/PP123'), { headers: {} });

    await passengerApi.getCount('B1');
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/passengers/count/B1'), { headers: {} });
  });

  test('axios interceptor behavior', async () => {
    expect(capturedInterceptorCalls.length).toBe(1);
    const [fulfilled, rejected] = capturedInterceptorCalls[0];

    // test fulfilled returns response directly
    const dummyResponse = { data: 'ok' };
    expect(fulfilled(dummyResponse)).toBe(dummyResponse);

    // test rejected
    const dummyError = {
      config: { url: 'http://test-url' },
      response: { status: 400, data: { message: 'Bad request message' } }
    };
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    await expect(rejected(dummyError)).rejects.toEqual(dummyError);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[API ERROR] 400 — http://test-url — Bad request message'));

    // test rejected with fallback missing fields
    const simpleError = new Error('Generic failure');
    await expect(rejected(simpleError)).rejects.toEqual(simpleError);
    expect(consoleSpy).toHaveBeenLastCalledWith(expect.stringContaining('[API ERROR] NO_RESPONSE — unknown — Generic failure'));
    
    consoleSpy.mockRestore();
  });

  test('paymentApi calls', async () => {
    axios.post.mockResolvedValue({ data: 'ok' });
    axios.get.mockResolvedValue({ data: 'ok' });

    await paymentApi.pay({ amount: 100 });
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/payments'), { amount: 100 }, { headers: {} });

    await paymentApi.createOrder({ amount: 100 });
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/payments/create-order'), { amount: 100 }, { headers: {} });

    await paymentApi.verifyPayment({ signature: '1' });
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/payments/verify'), { signature: '1' }, { headers: {} });

    await paymentApi.getByBooking('B1');
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/payments/booking/B1'), { headers: {} });

    await paymentApi.getByUser('test@gmail.com');
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/payments/user/test@gmail.com'), { headers: {} });

    await paymentApi.getByStatus('SUCCESS');
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/payments/status/SUCCESS'), { headers: {} });

    await paymentApi.refund('B1');
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/payments/refund/B1'), null, { headers: {} });

    await paymentApi.getRevenueForBookings(['B1', 'B2']);
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/payments/bookings/total'), ['B1', 'B2'], { headers: {} });
  });

  test('adminApi calls', async () => {
    axios.post.mockResolvedValue({ data: 'ok' });
    await adminApi.backfillPassengerFlightIds();
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/passengers/admin/backfill-flight-ids'), null, { headers: {} });
  });

  test('authProfileApi calls', async () => {
    axios.get.mockResolvedValue({ data: 'ok' });
    axios.put.mockResolvedValue({ data: 'ok' });

    await authProfileApi.getProfile();
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/auth/profile'), { headers: {} });

    await authProfileApi.updateProfile({ name: 'name' });
    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/auth/profile'), { name: 'name' }, { headers: {} });
  });

  test('airlineApi calls', async () => {
    axios.get.mockResolvedValue({ data: 'ok' });
    axios.post.mockResolvedValue({ data: 'ok' });
    axios.put.mockResolvedValue({ data: 'ok' });

    await airlineApi.getAll();
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/airlines'), { headers: {} });

    await airlineApi.addAirline({ name: 'A1' });
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/airlines'), { name: 'A1' }, { headers: {} });

    await airlineApi.toggleStatus('A1');
    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/airlines/A1/toggle-status'), null, { headers: {} });

    await airlineApi.searchAirports('DEL');
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/airports/search'), {
      params: { keyword: 'DEL' }, headers: {}
    });

    await airlineApi.getAllAirports();
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/airports'), { headers: {} });

    await airlineApi.addAirport({ code: 'DEL' });
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/airports'), { code: 'DEL' }, { headers: {} });
  });
});
