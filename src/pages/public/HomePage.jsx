import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plane, MapPin, CalendarDays, Users,
  ShieldCheck, Wallet, Zap, LayoutDashboard, Star, ChevronDown,
} from 'lucide-react';
import { airlineApi } from '../../api/api';
import './HomePage.css';

// ── Airport Autocomplete ──────────────────────────────────────────────────────
function AirportInput({ label, placeholder, value, onSelect }) {
  const [query, setQuery]       = useState(value || '');
  const [results, setResults]   = useState([]);
  const [open, setOpen]         = useState(false);
  const debounceRef             = useRef(null);
  const wrapperRef              = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Sync if parent resets value (swap)
  useEffect(() => { setQuery(value || ''); }, [value]);

  function handleChange(e) {
    const q = e.target.value;
    setQuery(q);
    onSelect(''); // clear selected value until user picks
    clearTimeout(debounceRef.current);
    if (q.trim().length < 2) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await airlineApi.searchAirports(q.trim());
        setResults(res.data || []);
        setOpen(true);
      } catch { setResults([]); }
    }, 300);
  }

  function handleSelect(airport) {
    const display = airport.city || airport.name;
    setQuery(`${display} (${airport.iataCode})`);
    onSelect(display);
    setResults([]);
    setOpen(false);
  }

  return (
    <div className="input-box" ref={wrapperRef} style={{ position: 'relative' }}>
      <label>{label}</label>
      <div className="input-wrapper">
        <MapPin size={18} />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          autoComplete="off"
        />
      </div>
      {open && results.length > 0 && (
        <ul className="airport-dropdown">
          {results.map(a => (
            <li key={a.id} onMouseDown={() => handleSelect(a)}>
              <span className="airport-iata">{a.iataCode}</span>
              <span className="airport-name">{a.name}</span>
              <span className="airport-city">{a.city}, {a.country}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();

  const [tripType, setTripType] = useState('oneway');
  const [form, setForm] = useState({
    source: '',
    destination: '',
    date: '',
    returnDate: '',
    passengers: 1,
  });

  function swapCities() {
    setForm(f => ({ ...f, source: f.destination, destination: f.source }));
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSearch(e) {
    e.preventDefault();

    if (!form.source || !form.destination || !form.date) {
      alert('Please fill all fields');
      return;
    }
    if (tripType === 'roundtrip' && !form.returnDate) {
      alert('Please select a return date');
      return;
    }
    if (tripType === 'roundtrip' && form.returnDate < form.date) {
      alert('Return date cannot be before departure date');
      return;
    }

    const base = `/search?source=${form.source}&destination=${form.destination}&date=${form.date}&passengers=${form.passengers}`;
    const url = tripType === 'roundtrip'
      ? `${base}&tripType=roundtrip&returnDate=${form.returnDate}`
      : `${base}&tripType=oneway`;
    navigate(url);
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

            {/* TRIP TYPE TOGGLE */}
            <div className="trip-type-toggle">
              <button
                type="button"
                className={`trip-type-btn ${tripType === 'oneway' ? 'active' : ''}`}
                onClick={() => setTripType('oneway')}
              >
                One Way
              </button>
              <button
                type="button"
                className={`trip-type-btn ${tripType === 'roundtrip' ? 'active' : ''}`}
                onClick={() => setTripType('roundtrip')}
              >
                ⇄ Round Trip
              </button>
            </div>

            <div className="input-grid">

              <AirportInput
                label="From"
                placeholder="Delhi"
                value={form.source}
                onSelect={val => setForm(f => ({ ...f, source: val }))}
              />

              <button type="button" className="swap-btn" onClick={swapCities}>⇄</button>

              <AirportInput
                label="To"
                placeholder="Mumbai"
                value={form.destination}
                onSelect={val => setForm(f => ({ ...f, destination: val }))}
              />

              <div className="input-box">
                <label>Departure Date</label>
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

              {tripType === 'roundtrip' && (
                <div className="input-box">
                  <label>Return Date</label>
                  <div className="input-wrapper">
                    <CalendarDays size={18} />
                    <input
                      type="date"
                      name="returnDate"
                      value={form.returnDate}
                      min={form.date || new Date().toISOString().split('T')[0]}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              <div className="input-box">
                <label>Passengers</label>
                <div className="input-wrapper">
                  <Users size={18} />
                  <select name="passengers" value={form.passengers} onChange={handleChange}>
                    {[1,2,3,4,5,6].map(n => (
                      <option key={n} value={n}>{n} Passenger{n > 1 ? 's' : ''}</option>
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