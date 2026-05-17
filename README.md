# ✈️ SkyBooker Frontend

> The modern, responsive, and user-friendly web interface for the **SkyBooker Airline Management System**.

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white)
![Axios](https://img.shields.io/badge/axios-671ddf?&style=for-the-badge&logo=axios&logoColor=white)

---

## 📖 Overview

The **SkyBooker Frontend** is a Single Page Application (SPA) built with React. It provides a seamless experience for passengers to search, book, and manage flights, while also offering dedicated dashboards for Airline Staff and System Administrators to manage flights, airlines, and airports.

This application connects to the SkyBooker Microservices Backend via an API Gateway.

## ✨ Features

- **Public Access**: Explore flights, search for availability, and view routes.
- **Passenger Portal**: Secure user authentication, flight booking, seat selection, and profile management.
- **Staff Dashboard**: Dedicated tools for Airline Staff to manage flight schedules, update statuses, and view passenger manifests.
- **Admin Dashboard**: System-wide control for Administrators to manage airlines, airports, and backend administration tasks.
- **Role-Based Access Control (RBAC)**: Secure routing ensuring users only access authorized areas.
- **Centralized State Management**: Efficient authentication and user session handling via React Context API.

## 🛠️ Tech Stack

- **Framework**: [React 18](https://reactjs.org/) (Create React App)
- **Routing**: [React Router DOM v6](https://reactrouter.com/)
- **HTTP Client**: [Axios](https://axios-http.com/) (configured with interceptors for JWT injection)
- **Icons**: [Lucide React](https://lucide.dev/) & [React Icons](https://react-icons.github.io/react-icons/)
- **Styling**: Custom CSS for scalable and modular design

## 📂 Project Structure

```text
SkyBooker-Frontend/
├── public/                 # Static assets (index.html, manifest, etc.)
├── src/
│   ├── api/                # Axios configuration and API endpoint modules
│   ├── components/         # Reusable UI components (Navbar, ProtectedRoute)
│   ├── context/            # React Context (AuthContext for state management)
│   ├── pages/              # Domain-specific page components
│   │   ├── admin/          # Admin Dashboard
│   │   ├── passenger/      # Booking, Payment, Profile, Seat Selection
│   │   ├── public/         # Home, Login, Search Results
│   │   └── staff/          # Staff Dashboard
│   ├── App.jsx             # Main application component and routing configuration
│   └── index.js            # React application entry point
├── .env.example            # Example environment variables
├── package.json            # Project dependencies and scripts
└── README.md               # Project documentation
```

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16.x or higher)
- **npm** (v8.x or higher)
- A running instance of the **SkyBooker Backend Microservices** (specifically the API Gateway).

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/SkyBooker-Frontend.git
cd SkyBooker-Frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory. You can use the provided `.env.example` as a template:

```bash
cp .env.example .env
```

Ensure the API Gateway URL is correctly pointed to your local or deployed backend environment:

```env
REACT_APP_GATEWAY_URL=http://localhost:8080
```

### 4. Run the application

Start the development server:

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
