# ✈️ SkyBooker Frontend

A modern airline booking frontend application built with React.js for seamless flight search, booking, seat selection, passenger management, and payment processing.

SkyBooker provides a complete airline reservation experience with role-based dashboards for passengers, staff, and administrators.

---

# 🚀 Features

## 🌍 Public Features

- Flight search system
- Airport autocomplete suggestions
- One-way and round-trip booking
- Flight sorting by price and duration
- Responsive modern UI
- Real-time airport search dropdown
- Passenger count selection
- Route swapping functionality
- Login & authentication system
- Protected routes
- Role-based access control

---

## 👤 Passenger Features

### Flight Booking

- Search available flights
- View detailed flight listings
- Select flights for booking
- Round-trip flight booking support
- Dynamic booking flow

### Seat Management

- View available seats
- Seat hold system
- Seat confirmation system
- Seat release functionality
- Seat class filtering
- Real-time seat availability
- Seat pricing support

### Passenger Management

- Add passenger details
- Passenger count validation
- Passenger booking association
- Booking-based passenger retrieval

### Payment System

- Razorpay integration
- Multiple payment modes
- Dynamic tax calculation
- Booking payment verification
- Seat hold expiration timer
- Secure checkout flow
- Payment status tracking

### Booking Confirmation

- Booking success screen
- Flight itinerary display
- Passenger information display
- Booking summary
- Payment details

### Profile & Booking History

- Passenger profile page
- My bookings page
- Booking tracking
- Previous booking records

---

## 👨‍✈️ Staff Dashboard Features

### Flight Management

- Add new flights
- Update flight status
- Flight listing management
- Flight search & sorting
- Real-time flight monitoring

### Seat Administration

- Add seats to flights
- View seat availability
- Seat analytics
- Expandable seat management panels

### Passenger Operations

- Passenger lookup by ticket
- Passenger lookup by booking ID
- Passenger editing system
- Booking passenger management
- Flight passenger list

### Revenue & Analytics

- Flight revenue tracking
- Passenger count monitoring
- Booking statistics

---

## 🛠️ Admin Dashboard Features

### Airline Management

- Add airlines
- Update airline data
- Country-based airline management
- IATA & ICAO support
- Contact management

### Airport Management

- Add airports
- Airport search system
- Airport location management
- Latitude & longitude support
- Timezone support
- Airport autocomplete integration

### Payment Monitoring

- Payment status filtering
- Payment tracking dashboard
- Transaction management

### Admin Utilities

- Form validation
- Toast notifications
- Confirmation modals
- Error handling system

---

# 🧱 Tech Stack

## Frontend

- React.js
- React Router DOM
- Axios
- Lucide React Icons
- React Icons
- CSS3

## API Communication

- REST APIs
- Axios HTTP Client
- Token-based authentication

## Payment Gateway

- Razorpay Checkout Integration

## Testing

- React Testing Library
- Jest DOM
- User Event Testing

---

# 📂 Project Structure

```bash
src/
│
├── api/
│   └── api.js
│
├── components/
│   ├── Navbar.jsx
│   ├── ProtectedRoute.jsx
│   └── RoleRoute.jsx
│
├── context/
│   └── AuthContext.jsx
│
├── pages/
│   ├── public/
│   │   ├── HomePage.jsx
│   │   ├── LoginPage.jsx
│   │   └── SearchResults.jsx
│   │
│   ├── passenger/
│   │   ├── BookingConfirm.jsx
│   │   ├── MyBookings.jsx
│   │   ├── PaymentPage.jsx
│   │   └── ProfilePage.jsx
│   │
│   ├── staff/
│   │   └── StaffDashboard.jsx
│   │
│   └── admin/
│       └── AdminDashboard.jsx
│
├── __tests__/
│   ├── AuthContext.test.jsx
│   ├── HomePage.test.jsx
│   ├── LoginPage.test.jsx
│   ├── Navbar.test.jsx
│   ├── ProtectedRoute.test.jsx
│   └── RoleRoute.test.jsx
│
├── App.jsx
└── index.js
```
