import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plane,
  MapPin,
  CalendarDays,
  Users,
  ShieldCheck,
  Wallet,
  Zap,
  LayoutDashboard,
} from 'lucide-react';

import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    source: '',
    destination: '',
    date: '',
    passengers: 1,
  });

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function swapCities() {
    setForm({
      ...form,
      source: form.destination,
      destination: form.source,
    });
  }

  function handleSearch(e) {
    e.preventDefault();

    if (!form.source || !form.destination || !form.date) {
      alert('Please fill all fields');
      return;
    }

    navigate(
      `/search?source=${form.source}&destination=${form.destination}&date=${form.date}&passengers=${form.passengers}`
    );
  }

  return (
    <div className="homepage">

      {/* HERO SECTION */}
      <section className="hero-section">

        <div className="hero-overlay"></div>

        <div className="hero-content">

          <div className="hero-badge">
            ✈ Trusted by 50,000+ travelers
          </div>

          <h1>
            Book Flights <span>Without Stress</span>
          </h1>

          <p>
            Compare fares, explore destinations, and secure your tickets
            in minutes with SkyBooker.
          </p>

          {/* SEARCH CARD */}
          <form className="search-card" onSubmit={handleSearch}>

            <div className="input-grid">

              <div className="input-box">
                <label>From</label>

                <div className="input-wrapper">
                  <MapPin size={18} />
                  <input
                    type="text"
                    name="source"
                    placeholder="Delhi"
                    value={form.source}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <button
                type="button"
                className="swap-btn"
                onClick={swapCities}
              >
                ⇄
              </button>

              <div className="input-box">
                <label>To</label>

                <div className="input-wrapper">
                  <MapPin size={18} />
                  <input
                    type="text"
                    name="destination"
                    placeholder="Mumbai"
                    value={form.destination}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="input-box">
                <label>Date</label>

                <div className="input-wrapper">
                  <CalendarDays size={18} />
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="input-box">
                <label>Passengers</label>

                <div className="input-wrapper">
                  <Users size={18} />

                  <select
                    name="passengers"
                    value={form.passengers}
                    onChange={handleChange}
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} Passenger{n > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

            </div>

            <button type="submit" className="search-btn">
              <Plane size={18} />
              Search Flights
            </button>

          </form>

        </div>
      </section>

      {/* POPULAR ROUTES */}
      <section className="content-section">

        <div className="section-header">
          <h2>Popular Routes</h2>
          <p>Most booked destinations this week</p>
        </div>

        <div className="routes-grid">
          {popularRoutes.map((route, i) => (
            <div
              key={i}
              className="route-card"
              onClick={() => {
                setForm({
                  source: route.from,
                  destination: route.to,
                  date: '',
                  passengers: 1,
                });

                window.scrollTo({
                  top: 0,
                  behavior: 'smooth',
                });
              }}
            >
              <div className="route-top">
                <span>{route.from}</span>

                <Plane size={18} className="route-plane" />

                <span>{route.to}</span>
              </div>

              <div className="route-bottom">
                Starting from
                <strong> ₹{route.price}</strong>
              </div>
            </div>
          ))}
        </div>

      </section>

      {/* FEATURES */}
      <section className="content-section">

        <div className="section-header">
          <h2>Why Choose SkyBooker?</h2>
          <p>Everything you need for smooth travel booking</p>
        </div>

        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card">

              <div className="feature-icon">
                {f.icon}
              </div>

              <h3>{f.title}</h3>

              <p>{f.desc}</p>

            </div>
          ))}
        </div>

      </section>

    </div>
  );
}

const popularRoutes = [
  { from: 'Delhi', to: 'Mumbai', price: '4,499' },
  { from: 'Mumbai', to: 'Bengaluru', price: '4,799' },
  { from: 'Delhi', to: 'Bengaluru', price: '4,999' },
  { from: 'Mumbai', to: 'Delhi', price: '4,299' },
];

const features = [
  {
    icon: <Wallet size={30} />,
    title: 'Best Prices',
    desc: 'Find the lowest fares across top airlines instantly.',
  },

  {
    icon: <ShieldCheck size={30} />,
    title: 'Secure Booking',
    desc: 'Your payments and personal information stay protected.',
  },

  {
    icon: <LayoutDashboard size={30} />,
    title: 'Easy Dashboard',
    desc: 'Track and manage all your trips from one place.',
  },

  {
    icon: <Zap size={30} />,
    title: 'Instant Tickets',
    desc: 'Get confirmed e-tickets delivered immediately.',
  },
];