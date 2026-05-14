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
  Star,
  ChevronDown,
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

      {/* STATS */}
      <section className="stats-banner">
        {stats.map((s, i) => (
          <div key={i} className="stat-item">
            <span className="stat-number">{s.number}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </section>

      {/* TESTIMONIALS */}
      <section className="content-section">
        <div className="section-header">
          <h2>What Travelers Say</h2>
          <p>Real experiences from real passengers</p>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((t, i) => (
            <div key={i} className="testimonial-card">
              <div className="testimonial-stars">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} size={16} fill="#facc15" color="#facc15" />
                ))}
              </div>
              <p className="testimonial-text">"{t.text}"</p>
              <div className="testimonial-author">
                <div className="author-avatar">{t.name[0]}</div>
                <div>
                  <div className="author-name">{t.name}</div>
                  <div className="author-route">{t.route}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="content-section">
        <div className="section-header">
          <h2>Frequently Asked Questions</h2>
          <p>Quick answers to common questions</p>
        </div>
        <div className="faq-list">
          {faqs.map((faq, i) => (
            <FAQItem key={i} faq={faq} />
          ))}
        </div>
      </section>

    </div>
  );
}

function FAQItem({ faq }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item ${open ? 'open' : ''}`} onClick={() => setOpen(!open)}>
      <div className="faq-question">
        <span>{faq.q}</span>
        <ChevronDown size={20} className="faq-chevron" />
      </div>
      {open && <p className="faq-answer">{faq.a}</p>}
    </div>
  );
}

const stats = [
  { number: '50,000+', label: 'Flights Booked' },
  { number: '100+', label: 'Destinations' },
  { number: '30+', label: 'Airlines' },
  { number: '99%', label: 'Customer Satisfaction' },
];

const testimonials = [
  {
    name: 'Priya Sharma',
    route: 'Delhi → Mumbai',
    rating: 5,
    text: 'Booked in under 2 minutes. The seat selection was smooth and the ticket arrived instantly.',
  },
  {
    name: 'Rahul Mehta',
    route: 'Mumbai → Bengaluru',
    rating: 5,
    text: 'Best flight booking experience I have had. Clean UI and no hidden charges.',
  },
  {
    name: 'Ananya Iyer',
    route: 'Chennai → Delhi',
    rating: 4,
    text: 'Cancellation and refund were processed quickly. Will definitely use again.',
  },
];

const faqs = [
  {
    q: 'Can I cancel my booking?',
    a: 'Yes. You can cancel any booking from My Bookings before the departure time. Refunds are processed within 5–7 business days.',
  },
  {
    q: 'How do I get my ticket after booking?',
    a: 'Your e-ticket with PNR is shown immediately on the confirmation screen and is also saved under My Bookings.',
  },
  {
    q: 'Is my payment information secure?',
    a: 'Absolutely. All transactions are encrypted and we never store your card details on our servers.',
  },
  {
    q: 'Can I book for multiple passengers?',
    a: 'Yes. You can select up to 6 passengers in a single booking from the search form.',
  },
  {
    q: 'What if no seats are available?',
    a: 'The seat map will show all occupied seats in real time. If a flight is full, you will see no available seats and can search for another flight.',
  },
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