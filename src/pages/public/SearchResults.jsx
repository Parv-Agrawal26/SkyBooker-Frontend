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
  const tripType    = searchParams.get('tripType') || 'oneway';
  const returnDate  = searchParams.get('returnDate');
  const isRoundTrip = tripType === 'roundtrip';

  const [outboundFlights, setOutboundFlights] = useState([]);
  const [returnFlights,   setReturnFlights]   = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState('');
  const [sortBy,          setSortBy]          = useState('price');

  // Round trip step: 'outbound' | 'return'
  const [step,             setStep]           = useState('outbound');
  const [selectedOutbound, setSelectedOutbound] = useState(null);

  useEffect(() => { fetchFlights(); }, []);

  async function fetchFlights() {
    try {
      setLoading(true);
      const outRes = await flightApi.search(source, destination, date);
      setOutboundFlights(outRes.data);
      if (isRoundTrip && returnDate) {
        const retRes = await flightApi.search(destination, source, returnDate);
        setReturnFlights(retRes.data);
      }
    } catch {
      setError('Could not fetch flights. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function sorted(list) {
    return [...list].sort((a, b) => {
      if (sortBy === 'price')    return a.price - b.price;
      if (sortBy === 'duration') return a.durationMinutes - b.durationMinutes;
      return 0;
    });
  }

  function buildSeatUrl(flight, extraParams = '') {
    return `/seats/${flight.id}?passengers=${passengers}&price=${flight.price}&source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}${extraParams}`;
  }

  function handleSelectOutbound(flight) {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: buildSeatUrl(flight) } });
      return;
    }
    if (!isRoundTrip) {
      navigate(buildSeatUrl(flight));
      return;
    }
    // Round trip — save outbound, move to return step
    setSelectedOutbound(flight);
    setStep('return');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSelectReturn(returnFlight) {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: buildSeatUrl(selectedOutbound) } });
      return;
    }
    // Navigate to outbound seat selection; pass return flight info as query params
    // After outbound booking completes, SeatSelection navigates to payment, then confirm.
    // Return flight is booked independently after — we pass it via URL so the confirm page can prompt.
    const returnParams = `&returnFlightId=${returnFlight.id}&returnPrice=${returnFlight.price}&returnSource=${encodeURIComponent(destination)}&returnDestination=${encodeURIComponent(source)}&returnDate=${returnDate}`;
    navigate(buildSeatUrl(selectedOutbound, returnParams));
  }

  function FlightCard({ flight, onSelect, selectLabel = 'Select Flight', highlighted = false }) {
    return (
      <div className={`flight-card ${highlighted ? 'flight-card-selected' : ''}`}>
        <div className="flight-left">
          <div className="airline-block">
            <div className="airline-logo">✈</div>
            <div>
              <h3>{flight.airline}</h3>
              <span>{flight.flightNumber}</span>
            </div>
          </div>
          <div className="flight-timeline">
            <div className="time-block">
              <h2>{flight.departureTime}</h2>
              <span>{flight.source || source}</span>
            </div>
            <div className="timeline-center">
              <div className="line"></div>
              <div className="plane-icon">✈</div>
              <div className="line"></div>
            </div>
            <div className="time-block">
              <h2>{flight.arrivalTime}</h2>
              <span>{flight.destination || destination}</span>
            </div>
          </div>
          <div className="seat-info">
            <span className={flight.availableSeats < 10 ? 'low-seats' : 'good-seats'}>
              {flight.availableSeats} seats left
            </span>
          </div>
        </div>
        <div className="flight-right">
          <div className="price-card">
            <small>Per Person</small>
            <h2 style={{ display: 'flex', gap: '4px' }}>
              ₹{flight.price?.toLocaleString()}<span style={{ fontSize: '1.1rem', color: '#64748b' }}>*</span>
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>*extra charge may apply</span>
          </div>
          <button
            className="book-btn"
            onClick={() => onSelect(flight)}
            disabled={flight.availableSeats === 0}
          >
            {flight.availableSeats === 0 ? 'Sold Out' : selectLabel}
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <div className="loading">Searching flights...</div>;

  return (
    <div className="search-page">

      {/* HERO */}
      <div className="search-hero">
        <div className="hero-overlay"></div>
        <div className="search-hero-content">
          <div className="route-badge">
            {isRoundTrip ? '⇄ Round Trip Results' : '✈ Flight Search Results'}
          </div>
          <div className="route-main">
            <h1>
              {source}<span> → </span>{destination}
              {isRoundTrip && <><span> → </span>{source}</>}
            </h1>
            <p>
              {date}{isRoundTrip && returnDate ? ` — Return: ${returnDate}` : ''} • {passengers} Passenger{passengers > 1 ? 's' : ''}
            </p>
          </div>
          <button className="change-search-btn" onClick={() => navigate('/')}>Change Search</button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="results-container">

        {error && <div className="alert-error">{error}</div>}

        {!error && (
          <>
            {/* ROUND TRIP STEP INDICATOR */}
            {isRoundTrip && (
              <div className="rt-steps">
                <div className={`rt-step ${step === 'outbound' ? 'rt-step-active' : 'rt-step-done'}`}>
                  <div className="rt-step-circle">{step === 'outbound' ? '1' : '✓'}</div>
                  <div>
                    <strong>Outbound Flight</strong>
                    <span>{source} → {destination} · {date}</span>
                    {selectedOutbound && (
                      <span className="rt-selected-label">
                        {selectedOutbound.airline} {selectedOutbound.flightNumber} · ₹{selectedOutbound.price?.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="rt-step-connector"></div>
                <div className={`rt-step ${step === 'return' ? 'rt-step-active' : ''}`}>
                  <div className="rt-step-circle">2</div>
                  <div>
                    <strong>Return Flight</strong>
                    <span>{destination} → {source} · {returnDate}</span>
                  </div>
                </div>
              </div>
            )}

            {/* OUTBOUND SECTION */}
            {step === 'outbound' && (
              <>
                <div className="results-topbar">
                  <div>
                    <h2>{sorted(outboundFlights).length} Flights Available</h2>
                    <p>{isRoundTrip ? `Step 1 of 2 — Select your outbound flight` : 'Best available fares for your journey'}</p>
                  </div>
                  <SortBar sortBy={sortBy} setSortBy={setSortBy} />
                </div>

                {sorted(outboundFlights).length === 0 ? (
                  <NoFlights onRetry={() => navigate('/')} />
                ) : (
                  <div className="flights-grid">
                    {sorted(outboundFlights).map(f => (
                      <FlightCard
                        key={f.id}
                        flight={f}
                        onSelect={handleSelectOutbound}
                        selectLabel={isRoundTrip ? 'Select Outbound' : 'Select Flight'}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* RETURN SECTION */}
            {isRoundTrip && step === 'return' && (
              <>
                <div className="results-topbar">
                  <div>
                    <h2>{sorted(returnFlights).length} Return Flights Available</h2>
                    <p>Step 2 of 2 — Select your return flight</p>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button className="back-to-outbound-btn" onClick={() => { setStep('outbound'); setSelectedOutbound(null); }}>
                      ← Change Outbound
                    </button>
                    <SortBar sortBy={sortBy} setSortBy={setSortBy} />
                  </div>
                </div>

                {sorted(returnFlights).length === 0 ? (
                  <NoFlights onRetry={() => navigate('/')} message="No return flights found for this date." />
                ) : (
                  <div className="flights-grid">
                    {sorted(returnFlights).map(f => (
                      <FlightCard
                        key={f.id}
                        flight={{ ...f, source: destination, destination: source }}
                        onSelect={handleSelectReturn}
                        selectLabel="Select Return"
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SortBar({ sortBy, setSortBy }) {
  return (
    <div className="sort-bar">
      <span>Sort By</span>
      <button className={sortBy === 'price' ? 'sort-btn active' : 'sort-btn'} onClick={() => setSortBy('price')}>Lowest Price</button>
      <button className={sortBy === 'duration' ? 'sort-btn active' : 'sort-btn'} onClick={() => setSortBy('duration')}>Fastest</button>
    </div>
  );
}

function NoFlights({ onRetry, message = 'Try different routes or another travel date.' }) {
  return (
    <div className="no-flights">
      <div className="no-icon">✈</div>
      <h3>No Flights Found</h3>
      <p>{message}</p>
      <button className="retry-btn" onClick={onRetry}>Search Again</button>
    </div>
  );
}
