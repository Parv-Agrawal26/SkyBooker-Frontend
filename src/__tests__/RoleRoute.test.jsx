import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RoleRoute from '../components/RoleRoute';
import { AuthContext } from '../context/AuthContext';

function renderWithAuth(isLoggedIn, userRole, ui) {
  return render(
    <AuthContext.Provider value={{ isLoggedIn, userRole }}>
      <MemoryRouter>{ui}</MemoryRouter>
    </AuthContext.Provider>
  );
}

test('renders children when logged in with correct role', () => {
  renderWithAuth(true, 'ADMIN', (
    <RoleRoute role="ADMIN"><span>Admin Content</span></RoleRoute>
  ));
  expect(screen.getByText('Admin Content')).toBeInTheDocument();
});

test('redirects when logged in but wrong role', () => {
  renderWithAuth(true, 'PASSENGER', (
    <RoleRoute role="ADMIN"><span>Admin Content</span></RoleRoute>
  ));
  expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
});

test('redirects to /login when not logged in', () => {
  renderWithAuth(false, null, (
    <RoleRoute role="ADMIN"><span>Admin Content</span></RoleRoute>
  ));
  expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
});

test('renders children for AIRLINE_STAFF role', () => {
  renderWithAuth(true, 'AIRLINE_STAFF', (
    <RoleRoute role="AIRLINE_STAFF"><span>Staff Content</span></RoleRoute>
  ));
  expect(screen.getByText('Staff Content')).toBeInTheDocument();
});
