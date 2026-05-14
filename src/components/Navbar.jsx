import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Plane } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { isLoggedIn, userEmail, userRole, logout } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/');
  }

  function getDashboardLink() {
    if (userRole === 'ADMIN') return '/admin';
    if (userRole === 'AIRLINE_STAFF') return '/staff';
    return '/my-bookings';
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">

        <Link to="/" className="navbar-logo">
          <div className="logo-icon">
            <Plane size={18} />
          </div>

          <div className="logo-text">
            <span>SkyBooker</span>
            <small>Fly Smarter</small>
          </div>
        </Link>

        <div className={`navbar-menu ${menuOpen ? 'active' : ''}`}>

          <Link to="/" onClick={() => setMenuOpen(false)}>
            Explore Flights
          </Link>

          {isLoggedIn ? (
            <>
              <Link
                to={getDashboardLink()}
                onClick={() => setMenuOpen(false)}
              >
                {userRole === 'ADMIN'
                  ? 'Admin Panel'
                  : userRole === 'AIRLINE_STAFF'
                  ? 'Staff Panel'
                  : 'My Bookings'}
              </Link>

              {userRole !== 'ADMIN' && userRole !== 'AIRLINE_STAFF' && (
                <Link to="/profile" onClick={() => setMenuOpen(false)}>Profile</Link>
              )}

              <div className="navbar-user">
                <div className="user-avatar">
                  {userEmail?.charAt(0).toUpperCase()}
                </div>

                <div className="user-info">
                  <span className="user-label">Signed in as</span>
                  <span className="user-email">{userEmail}</span>
                </div>
              </div>

              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)}>
              <button className="login-btn">
                Get Started
              </button>
            </Link>
          )}
        </div>

        <button
          className="mobile-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

      </div>
    </nav>
  );
}