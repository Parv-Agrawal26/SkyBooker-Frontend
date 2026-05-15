import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';

function TestComponent() {
  const { isLoggedIn, userEmail, userRole, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="status">{isLoggedIn ? 'logged-in' : 'logged-out'}</span>
      <span data-testid="email">{userEmail}</span>
      <span data-testid="role">{userRole}</span>
      <button onClick={() => login('fake-token', 'test@gmail.com', 'PASSENGER')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

function renderWithProvider() {
  return render(<AuthProvider><TestComponent /></AuthProvider>);
}

beforeEach(() => localStorage.clear());

test('initially logged out when no token in localStorage', () => {
  renderWithProvider();
  expect(screen.getByTestId('status').textContent).toBe('logged-out');
});

test('login sets token, email and role', () => {
  renderWithProvider();
  act(() => screen.getByText('Login').click());
  expect(screen.getByTestId('status').textContent).toBe('logged-in');
  expect(screen.getByTestId('email').textContent).toBe('test@gmail.com');
  expect(screen.getByTestId('role').textContent).toBe('PASSENGER');
});

test('login persists to localStorage', () => {
  renderWithProvider();
  act(() => screen.getByText('Login').click());
  expect(localStorage.getItem('token')).toBe('fake-token');
  expect(localStorage.getItem('userEmail')).toBe('test@gmail.com');
  expect(localStorage.getItem('userRole')).toBe('PASSENGER');
});

test('logout clears state and localStorage', () => {
  renderWithProvider();
  act(() => screen.getByText('Login').click());
  act(() => screen.getByText('Logout').click());
  expect(screen.getByTestId('status').textContent).toBe('logged-out');
  expect(localStorage.getItem('token')).toBeNull();
});

test('reads existing token from localStorage on mount', () => {
  localStorage.setItem('token', 'existing-token');
  localStorage.setItem('userEmail', 'existing@gmail.com');
  localStorage.setItem('userRole', 'ADMIN');
  renderWithProvider();
  expect(screen.getByTestId('status').textContent).toBe('logged-in');
  expect(screen.getByTestId('email').textContent).toBe('existing@gmail.com');
});
