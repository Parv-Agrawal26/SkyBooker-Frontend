import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { flightApi } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import './SearchResults.css';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const source      = searchParams.get('source');
  const destination = searchParams.get('destination');
  const date        = searchParams.get('date');
  const passengers  = searchParams.get('passengers') || 1;

  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('price');

  useEffect(() => {
    fetchFlights();
  }, []);

  async function fetchFlights() {
    try {
      setLoading(true);
      const res = await flightApi.search(source, destination, date);
      setFlights(res.data);
    } catch (err) {
      setError('Could not fetch flights. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleSelectFlight(flight) {
    if (!isLoggedIn) {
      
      navigate('/login', { state: { from: `/seats/${flight.id}?passengers=${passengers}` } });
      return;
    }
    navigate(`/seats/${flight.id}?passengers=${passengers}`);
  }

  // sorting
  const sortedFlights = [...flights].sort((a, b) => {
    if (sortBy === 'price') return a.price - b.price;
    if (sortBy === 'duration') return a.durationMinutes - b.durationMinutes;
    return 0;
  });

  if (loading) return <div className="loading">Searching flights...</div>;

  return (
  <div className="search-page">

    {/* HERO */}
    <div className="search-hero">

      <div className="hero-overlay"></div>

      <div className="search-hero-content">

        <div className="route-badge">
          ✈ Flight Search Results
        </div>

        <div className="route-main">
          <h1>
            {source}
            <span> → </span>
            {destination}
          </h1>

          <p>
            {date} • {passengers} Passenger
            {passengers > 1 ? 's' : ''}
          </p>
        </div>

        <button
          className="change-search-btn"
          onClick={() => navigate('/')}
        >
          Change Search
        </button>

      </div>

    </div>

    {/* CONTENT */}
    <div className="results-container">

      {error && (
        <div className="alert-error">
          {error}
        </div>
      )}

      {!error && (
        <>
          {/* TOP BAR */}
          <div className="results-topbar">

            <div>
              <h2>
                {sortedFlights.length} Flights Available
              </h2>

              <p>
                Best available fares for your journey
              </p>
            </div>

            <div className="sort-bar">

              <span>Sort By</span>

              <button
                className={
                  sortBy === 'price'
                    ? 'sort-btn active'
                    : 'sort-btn'
                }
                onClick={() => setSortBy('price')}
              >
                Lowest Price
              </button>

              <button
                className={
                  sortBy === 'duration'
                    ? 'sort-btn active'
                    : 'sort-btn'
                }
                onClick={() => setSortBy('duration')}
              >
                Fastest
              </button>

            </div>

          </div>

          {/* NO FLIGHTS */}
          {sortedFlights.length === 0 ? (

            <div className="no-flights">

              <div className="no-icon">
                ✈
              </div>

              <h3>No Flights Found</h3>

              <p>
                Try different routes or another travel date.
              </p>

              <button
                className="retry-btn"
                onClick={() => navigate('/')}
              >
                Search Again
              </button>

            </div>

          ) : (

            <div className="flights-grid">

              {sortedFlights.map((flight) => (

                <div
                  key={flight.id}
                  className="flight-card"
                >

                  {/* LEFT */}
                  <div className="flight-left">

                    <div className="airline-block">

                      <div className="airline-logo">
                        ✈
                      </div>

                      <div>
                        <h3>{flight.airline}</h3>

                        <span>
                          {flight.flightNumber}
                        </span>
                      </div>

                    </div>

                    <div className="flight-timeline">

                      <div className="time-block">
                        <h2>
                          {flight.departureTime}
                        </h2>

                        <span>{source}</span>
                      </div>

                      <div className="timeline-center">

                        <div className="line"></div>

                        <div className="plane-icon">
                          ✈
                        </div>

                        <div className="line"></div>

                      </div>

                      <div className="time-block">
                        <h2>
                          {flight.arrivalTime}
                        </h2>

                        <span>{destination}</span>
                      </div>

                    </div>

                    <div className="seat-info">

                      <span
                        className={
                          flight.availableSeats < 10
                            ? 'low-seats'
                            : 'good-seats'
                        }
                      >
                        {flight.availableSeats} seats left
                      </span>

                    </div>

                  </div>

                  {/* RIGHT */}
                  <div className="flight-right">

                    <div className="price-card">

                      <small>Per Person</small>

                      <h2 style={{ display: 'flex', gap: '4px' }}>
                        ₹{flight.price?.toLocaleString()}<span style={{ fontSize: '1.1rem', color: '#64748b'}}>*</span>
                      </h2>

                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        *extra charge may apply
                      </span>

                    </div>

                    <button
                      className="book-btn"
                      onClick={() =>
                        handleSelectFlight(flight)
                      }
                      disabled={
                        flight.availableSeats === 0
                      }
                    >
                      {flight.availableSeats === 0
                        ? 'Sold Out'
                        : 'Select Flight'}
                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}
        </>
      )}

    </div>

  </div>
);
}
