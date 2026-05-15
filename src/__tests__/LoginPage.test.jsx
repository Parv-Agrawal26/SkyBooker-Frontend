import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../pages/public/LoginPage';
import { AuthContext } from '../context/AuthContext';

function renderLoginPage() {
  return render(
    <AuthContext.Provider value={{ login: jest.fn(), isLoggedIn: false }}>
      <MemoryRouter><LoginPage /></MemoryRouter>
    </AuthContext.Provider>
  );
}

test('renders login and register tabs', () => {
  renderLoginPage();
  expect(screen.getAllByText('Login').length).toBeGreaterThan(0);
  expect(screen.getByText('Register')).toBeInTheDocument();
});

test('renders email and password fields on login tab', () => {
  renderLoginPage();
  expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
});

test('renders Login submit button', () => {
  renderLoginPage();
  const loginButtons = screen.getAllByRole('button', { name: 'Login' });
  expect(loginButtons.length).toBeGreaterThan(0);
});

test('renders Forgot Password link', () => {
  renderLoginPage();
  expect(screen.getByText('Forgot Password?')).toBeInTheDocument();
});
