import React, { useState, useEffect, useCallback } from 'react';
import { flightApi, seatApi } from '../../api/api';
import './StaffDashboard.css';

const todayStr = new Date().toISOString().split('T')[0];

function getCurrentTime() {
  return new Date().toTimeString().slice(0, 5);
}

export default function StaffDashboard() {
  const [tab, setTab] = useState('flights');
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedFlightId, setExpandedFlightId] = useState(null);
  const [seatsMap, setSeatsMap] = useState({});
  const [seatsLoading, setSeatsLoading] = useState(false);

  const [flightForm, setFlightForm] = useState({
    flightNumber: '', airline: '', source: '', destination: '',
    departureDate: '', departureTime: '',
    arrivalDate: '', arrivalTime: '',
    totalSeats: '', price: ''
  });

  const [seatForm, setSeatForm] = useState({
    flightId: '', seatNumber: '', seatClass: 'ECONOMY',
    row: '', column: '', isWindow: false, isAisle: false,
    hasExtraLegroom: false, priceMultiplier: 1.0
  });

  // Auto-dismiss alerts after 5s
  useEffect(() => {
    if (!message && !error) return;
    const t = setTimeout(() => { setMessage(''); setError(''); }, 5000);
    return () => clearTimeout(t);
  }, [message, error]);

  const fetchFlights = useCallback(async () => {
    setLoading(true);
    try {
      const res = await flightApi.getAll();
      setFlights(res.data);
    } catch {
      setError('Could not load flights');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFlights(); }, [fetchFlights]);

  async function handleAddFlight(e) {
    e.preventDefault();
    setError(''); setMessage('');

    if (flightForm.departureDate < todayStr) {
      setError('Departure date cannot be in the past.'); return;
    }
    if (flightForm.departureDate === todayStr && flightForm.departureTime) {
      if (flightForm.departureTime <= getCurrentTime()) {
        setError(`Departure time has already passed. Current time is ${getCurrentTime()}.`); return;
      }
    }
    const arrDate = flightForm.arrivalDate || flightForm.departureDate;
    if (arrDate < flightForm.departureDate) {
      setError('Arrival date cannot be before departure date.'); return;
    }
    if (arrDate === flightForm.departureDate &&
        flightForm.arrivalTime && flightForm.departureTime &&
        flightForm.arrivalTime <= flightForm.departureTime) {
      setError('Same-day flight: arrival time must be after departure time.'); return;
    }

    try {
      await flightApi.addFlight({
        ...flightForm,
        arrivalDate: flightForm.arrivalDate || flightForm.departureDate,
        totalSeats: parseInt(flightForm.totalSeats),
        price: parseFloat(flightForm.price),
      });
      setMessage('Flight added successfully! Seats auto-generated.');
      setFlightForm({
        flightNumber: '', airline: '', source: '', destination: '',
        departureDate: '', departureTime: '', arrivalDate: '', arrivalTime: '',
        totalSeats: '', price: ''
      });
      fetchFlights();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add flight');
    }
  }

  async function handleAddSeat(e) {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      await seatApi.addSeat({
        ...seatForm,
        flightId: parseInt(seatForm.flightId),
        row: parseInt(seatForm.row),
        priceMultiplier: parseFloat(seatForm.priceMultiplier),
      });
      setMessage('Seat added successfully!');
      setSeatForm({
        flightId: '', seatNumber: '', seatClass: 'ECONOMY',
        row: '', column: '', isWindow: false, isAisle: false,
        hasExtraLegroom: false, priceMultiplier: 1.0
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add seat');
    }
  }

  async function toggleSeats(flightId) {
    if (expandedFlightId === flightId) {
      setExpandedFlightId(null); return;
    }
    setExpandedFlightId(flightId);
    if (seatsMap[flightId]) return;
    setSeatsLoading(true);
    try {
      const res = await seatApi.getSeatsByFlight(flightId);
      setSeatsMap(prev => ({ ...prev, [flightId]: res.data }));
    } catch {
      setError('Could not load seats for this flight');
    } finally {
      setSeatsLoading(false);
    }
  }

  function formatArrival(flight) {
    const time = flight.arrivalTime || '-';
    if (flight.arrivalDate && flight.arrivalDate !== flight.departureDate)
      return `${time} (${flight.arrivalDate})`;
    return time;
  }

  function handleDepDateChange(val) {
    setFlightForm(prev => ({
      ...prev,
      departureDate: val,
      arrivalDate: prev.arrivalDate && prev.arrivalDate < val ? '' : prev.arrivalDate,
    }));
  }

  // Filter + sort
  const filteredFlights = flights
    .filter(f => {
      const q = search.toLowerCase();
      return (
        f.flightNumber?.toLowerCase().includes(q) ||
        f.airline?.toLowerCase().includes(q) ||
        f.source?.toLowerCase().includes(q) ||
        f.destination?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const da = `${a.departureDate}T${a.departureTime || '00:00'}`;
      const db = `${b.departureDate}T${b.departureTime || '00:00'}`;
      return sortAsc ? da.localeCompare(db) : db.localeCompare(da);
    });

  const totalAvailable = flights.reduce((acc, f) => acc + (f.availableSeats || 0), 0);
  const totalBooked = flights.reduce((acc, f) => acc + ((f.totalSeats || 0) - (f.availableSeats || 0)), 0);

  return (
    <div className="staff-page">

      <div className="staff-hero">
        <div className="staff-hero-content">
          <div className="hero-badge">✈ SkyBooker Operations Center</div>
          <h1>Staff Dashboard</h1>
          <p>Manage flights, monitor seat inventory, and control airline operations in real time.</p>
        </div>
      </div>

      <div className="staff-container">

        {message && <div className="alert-success">{message}</div>}
        {error   && <div className="alert-error">{error}</div>}

        {/* STATS */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">✈</div>
            <div><h2>{flights.length}</h2><span>Total Flights</span></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon seats">💺</div>
            <div><h2>{totalAvailable}</h2><span>Available Seats</span></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon booked">🎫</div>
            <div><h2>{totalBooked}</h2><span>Booked Seats</span></div>
          </div>
        </div>

        {/* TABS */}
        <div className="staff-tabs">
          <button className={tab === 'flights' ? 'tab active' : 'tab'} onClick={() => setTab('flights')}>
            ✈ Flights
          </button>
          <button className={tab === 'add-flight' ? 'tab active' : 'tab'} onClick={() => setTab('add-flight')}>
            + Add Flight
          </button>
          <button className={tab === 'add-seat' ? 'tab active' : 'tab'} onClick={() => setTab('add-seat')}>
            + Add Seats
          </button>
        </div>

        {/* FLIGHTS TAB */}
        {tab === 'flights' && (
          <div className="dashboard-card">
            <div className="card-header">
              <h2>Flight Inventory</h2>
              <div className="card-header-actions">
                <input
                  className="search-input"
                  type="text"
                  placeholder="Search flight, airline, route..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <button className="icon-btn" title="Sort by departure date" onClick={() => setSortAsc(p => !p)}>
                  {sortAsc ? '↑ Date' : '↓ Date'}
                </button>
                <button className="icon-btn" title="Refresh" onClick={fetchFlights}>
                  ↻ Refresh
                </button>
              </div>
            </div>

            {loading ? (
              <div className="loading-box">Loading flights...</div>
            ) : filteredFlights.length === 0 ? (
              <div className="empty-small">{search ? 'No flights match your search' : 'No flights added yet'}</div>
            ) : (
              <div className="table-wrapper">
                <table className="staff-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Flight</th>
                      <th>Route</th>
                      <th>Departure</th>
                      <th>Arrival</th>
                      <th>Seats</th>
                      <th>Price</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFlights.map(flight => (
                      <React.Fragment key={flight.id}>
                        <tr>
                          <td><span className="flight-id">#{flight.id}</span></td>
                          <td>
                            <div className="flight-info">
                              <div className="flight-logo">✈</div>
                              <div>
                                <strong>{flight.flightNumber}</strong>
                                <span>{flight.airline}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="route-box">
                              <span>{flight.source}</span>
                              <div className="route-line">
                                <div className="line"></div>
                                <div className="plane-icon">✈</div>
                                <div className="line"></div>
                              </div>
                              <span>{flight.destination}</span>
                            </div>
                          </td>
                          <td>
                            <strong>{flight.departureDate}</strong>
                            <small>{flight.departureTime}</small>
                          </td>
                          <td>
                            <strong>{flight.arrivalDate || flight.departureDate}</strong>
                            <small>{formatArrival(flight)}</small>
                          </td>
                          <td>
                            <span className={flight.availableSeats < 10 ? 'seat-badge low' : 'seat-badge ok'}>
                              {flight.availableSeats}
                            </span>
                          </td>
                          <td><strong className="price">₹{flight.price?.toLocaleString()}</strong></td>
                          <td>
                            <button
                              className="view-seats-btn"
                              onClick={() => toggleSeats(flight.id)}
                            >
                              {expandedFlightId === flight.id ? 'Hide Seats' : 'View Seats'}
                            </button>
                          </td>
                        </tr>

                        {/* Inline seat panel */}
                        {expandedFlightId === flight.id && (
                          <tr className="seat-panel-row">
                            <td colSpan={8}>
                              <div className="seat-panel">
                                {seatsLoading ? (
                                  <span className="seat-panel-loading">Loading seats...</span>
                                ) : !seatsMap[flight.id] || seatsMap[flight.id].length === 0 ? (
                                  <span className="seat-panel-empty">No seats found for this flight</span>
                                ) : (
                                  <div className="seat-chips">
                                    {seatsMap[flight.id].map(seat => (
                                      <span
                                        key={seat.id}
                                        className={`seat-chip ${seat.status?.toLowerCase() || 'available'}`}
                                        title={`${seat.seatClass} | ${seat.status}${seat.isWindow ? ' | Window' : ''}${seat.isAisle ? ' | Aisle' : ''}${seat.hasExtraLegroom ? ' | Extra Legroom' : ''}`}
                                      >
                                        {seat.seatNumber}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <div className="seat-legend">
                                  <span className="seat-chip available">Available</span>
                                  <span className="seat-chip booked">Booked</span>
                                  <span className="seat-chip held">Held</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ADD FLIGHT TAB */}
        {tab === 'add-flight' && (
          <div className="dashboard-card">
            <div className="card-header"><h2>Add New Flight</h2></div>
            <form onSubmit={handleAddFlight} className="staff-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Flight Number</label>
                  <input type="text" placeholder="6E-101" value={flightForm.flightNumber}
                    onChange={e => setFlightForm({ ...flightForm, flightNumber: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Airline Name</label>
                  <input type="text" placeholder="IndiGo" value={flightForm.airline}
                    onChange={e => setFlightForm({ ...flightForm, airline: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Source</label>
                  <input type="text" placeholder="Delhi" value={flightForm.source}
                    onChange={e => setFlightForm({ ...flightForm, source: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Destination</label>
                  <input type="text" placeholder="Mumbai" value={flightForm.destination}
                    onChange={e => setFlightForm({ ...flightForm, destination: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Departure Date</label>
                  <input type="date" min={todayStr} value={flightForm.departureDate}
                    onChange={e => handleDepDateChange(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Departure Time</label>
                  <input type="time" value={flightForm.departureTime}
                    min={flightForm.departureDate === todayStr ? getCurrentTime() : undefined}
                    onChange={e => setFlightForm({ ...flightForm, departureTime: e.target.value })} required />
                  {flightForm.departureDate === todayStr && (
                    <small className="warning-text">⚠ Only future times allowed for today</small>
                  )}
                </div>
                <div className="form-group">
                  <label>Arrival Date</label>
                  <input type="date" min={flightForm.departureDate || todayStr} value={flightForm.arrivalDate}
                    onChange={e => setFlightForm({ ...flightForm, arrivalDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Arrival Time</label>
                  <input type="time" value={flightForm.arrivalTime}
                    onChange={e => setFlightForm({ ...flightForm, arrivalTime: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Total Seats</label>
                  <input type="number" placeholder="150" min="1" value={flightForm.totalSeats}
                    onChange={e => setFlightForm({ ...flightForm, totalSeats: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input type="number" placeholder="4500" min="1" value={flightForm.price}
                    onChange={e => setFlightForm({ ...flightForm, price: e.target.value })} required />
                </div>
              </div>
              <button type="submit" className="submit-btn">Add Flight</button>
            </form>
          </div>
        )}

        {/* ADD SEAT TAB */}
        {tab === 'add-seat' && (
          <div className="dashboard-card">
            <div className="card-header"><h2>Add Seats</h2></div>
            <form onSubmit={handleAddSeat} className="staff-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Flight</label>
                  <select value={seatForm.flightId}
                    onChange={e => setSeatForm({ ...seatForm, flightId: e.target.value })} required>
                    <option value="">— Select a flight —</option>
                    {flights.map(f => (
                      <option key={f.id} value={f.id}>
                        #{f.id} · {f.flightNumber} · {f.source} → {f.destination} ({f.departureDate})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Seat Number</label>
                  <input type="text" placeholder="12A" value={seatForm.seatNumber}
                    onChange={e => setSeatForm({ ...seatForm, seatNumber: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Class</label>
                  <select value={seatForm.seatClass}
                    onChange={e => setSeatForm({ ...seatForm, seatClass: e.target.value })}>
                    <option value="ECONOMY">Economy</option>
                    <option value="BUSINESS">Business</option>
                    <option value="FIRST">First Class</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Row</label>
                  <input type="number" placeholder="12" value={seatForm.row}
                    onChange={e => setSeatForm({ ...seatForm, row: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Column</label>
                  <input type="text" placeholder="A" value={seatForm.column}
                    onChange={e => setSeatForm({ ...seatForm, column: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Price Multiplier</label>
                  <input type="number" step="0.1" placeholder="1.0" value={seatForm.priceMultiplier}
                    onChange={e => setSeatForm({ ...seatForm, priceMultiplier: e.target.value })} />
                </div>
              </div>
              <div className="checkbox-grid">
                <label className="checkbox-card">
                  <input type="checkbox" checked={seatForm.isWindow}
                    onChange={e => setSeatForm({ ...seatForm, isWindow: e.target.checked })} />
                  <span>Window Seat</span>
                </label>
                <label className="checkbox-card">
                  <input type="checkbox" checked={seatForm.isAisle}
                    onChange={e => setSeatForm({ ...seatForm, isAisle: e.target.checked })} />
                  <span>Aisle Seat</span>
                </label>
                <label className="checkbox-card">
                  <input type="checkbox" checked={seatForm.hasExtraLegroom}
                    onChange={e => setSeatForm({ ...seatForm, hasExtraLegroom: e.target.checked })} />
                  <span>Extra Legroom</span>
                </label>
              </div>
              <button type="submit" className="submit-btn">Add Seat</button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
