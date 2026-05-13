import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';

// Public pages
import HomePage from './pages/public/HomePage';
import SearchResults from './pages/public/SearchResults';
import LoginPage from './pages/public/LoginPage';

// Passenger pages
import SeatSelection from './pages/passenger/SeatSelection';
import PaymentPage from './pages/passenger/PaymentPage';
import BookingConfirm from './pages/passenger/BookingConfirm';
import MyBookings from './pages/passenger/MyBookings';

// Staff pages
import StaffDashboard from './pages/staff/StaffDashboard';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>

          {/* Public Routes - login ke bina access */}
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Passenger Routes - login ke baad */}
          <Route path="/seats/:flightId" element={
            <ProtectedRoute><SeatSelection /></ProtectedRoute>
          } />
          <Route path="/payment/:bookingId" element={
            <ProtectedRoute><PaymentPage /></ProtectedRoute>
          } />
          <Route path="/booking-confirm/:bookingId" element={
            <ProtectedRoute><BookingConfirm /></ProtectedRoute>
          } />
          <Route path="/my-bookings" element={
            <ProtectedRoute><MyBookings /></ProtectedRoute>
          } />

          {/* Staff Routes - sirf AIRLINE_STAFF */}
          <Route path="/staff" element={
            <RoleRoute role="AIRLINE_STAFF"><StaffDashboard /></RoleRoute>
          } />

          {/* Admin Routes - sirf ADMIN */}
          <Route path="/admin" element={
            <RoleRoute role="ADMIN"><AdminDashboard /></RoleRoute>
          } />

          {/* 404 - koi page nahi mila */}
          <Route path="*" element={
            <div style={{ textAlign: 'center', padding: '100px 20px' }}>
              <h2>404 - Page Not Found</h2>
              <p style={{ color: '#64748b', marginTop: '8px' }}>
                The page you're looking for doesn't exist.
              </p>
            </div>
          } />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
