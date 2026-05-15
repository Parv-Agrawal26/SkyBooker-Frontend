import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { AuthContext } from '../context/AuthContext';

function renderWithAuth(isLoggedIn, ui) {
  return render(
    <AuthContext.Provider value={{ isLoggedIn }}>
      <MemoryRouter>{ui}</MemoryRouter>
    </AuthContext.Provider>
  );
}

test('renders children when logged in', () => {
  renderWithAuth(true, (
    <ProtectedRoute><span>Protected Content</span></ProtectedRoute>
  ));
  expect(screen.getByText('Protected Content')).toBeInTheDocument();
});

test('redirects to /login when not logged in', () => {
  renderWithAuth(false, (
    <ProtectedRoute><span>Protected Content</span></ProtectedRoute>
  ));
  expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
});
