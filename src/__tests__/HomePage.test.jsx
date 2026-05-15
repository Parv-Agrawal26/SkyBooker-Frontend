import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../pages/public/HomePage';

jest.mock('../api/api', () => ({
  airlineApi: { searchAirports: jest.fn(() => Promise.resolve({ data: [] })) },
}));

function renderHomePage() {
  return render(<MemoryRouter><HomePage /></MemoryRouter>);
}

test('renders Search Flights button', () => {
  renderHomePage();
  expect(screen.getByText('Search Flights')).toBeInTheDocument();
});

test('renders One Way and Round Trip toggle buttons', () => {
  renderHomePage();
  expect(screen.getByText('One Way')).toBeInTheDocument();
  expect(screen.getByText('⇄ Round Trip')).toBeInTheDocument();
});

test('renders departure date input', () => {
  renderHomePage();
  expect(screen.getByText('Departure Date')).toBeInTheDocument();
});

test('renders Why Choose SkyBooker section', () => {
  renderHomePage();
  expect(screen.getByText('Why Choose SkyBooker?')).toBeInTheDocument();
});

test('renders FAQ section', () => {
  renderHomePage();
  expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
});
