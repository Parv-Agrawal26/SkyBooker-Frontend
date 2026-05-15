import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';

function renderNavbar(authValue) {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter><Navbar /></MemoryRouter>
    </AuthContext.Provider>
  );
}

test('renders SkyBooker logo', () => {
  renderNavbar({ isLoggedIn: false, userEmail: null, userRole: null, logout: jest.fn() });
  expect(screen.getByText('SkyBooker')).toBeInTheDocument();
});

test('shows Get Started button when logged out', () => {
  renderNavbar({ isLoggedIn: false, userEmail: null, userRole: null, logout: jest.fn() });
  expect(screen.getByText('Get Started')).toBeInTheDocument();
});

test('shows Logout button when logged in', () => {
  renderNavbar({ isLoggedIn: true, userEmail: 'test@gmail.com', userRole: 'PASSENGER', logout: jest.fn() });
  expect(screen.getByText('Logout')).toBeInTheDocument();
});

test('shows My Bookings link for PASSENGER', () => {
  renderNavbar({ isLoggedIn: true, userEmail: 'test@gmail.com', userRole: 'PASSENGER', logout: jest.fn() });
  expect(screen.getByText('My Bookings')).toBeInTheDocument();
});

test('shows Admin Panel link for ADMIN', () => {
  renderNavbar({ isLoggedIn: true, userEmail: 'admin@gmail.com', userRole: 'ADMIN', logout: jest.fn() });
  expect(screen.getByText('Admin Panel')).toBeInTheDocument();
});

test('shows Staff Panel link for AIRLINE_STAFF', () => {
  renderNavbar({ isLoggedIn: true, userEmail: 'staff@gmail.com', userRole: 'AIRLINE_STAFF', logout: jest.fn() });
  expect(screen.getByText('Staff Panel')).toBeInTheDocument();
});

test('shows user email when logged in', () => {
  renderNavbar({ isLoggedIn: true, userEmail: 'test@gmail.com', userRole: 'PASSENGER', logout: jest.fn() });
  expect(screen.getByText('test@gmail.com')).toBeInTheDocument();
});
