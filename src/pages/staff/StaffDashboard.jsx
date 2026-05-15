import React, { useState, useEffect, useCallback } from 'react';
import { flightApi, seatApi, passengerApi, paymentApi } from '../../api/api';
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

  // Flight passengers tab
  const [selectedFlightId, setSelectedFlightId] = useState('');
  const [flightPassengers, setFlightPassengers] = useState([]);
  const [flightPaxLoading, setFlightPaxLoading] = useState(false);
  const [flightRevenue, setFlightRevenue] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState({});

  // Passenger search state
  const [paxSearchType, setPaxSearchType] = useState('ticket');
  const [paxSearchQuery, setPaxSearchQuery] = useState('');
  const [paxResult, setPaxResult] = useState(null);
  const [paxError, setPaxError] = useState('');
  const [paxLoading, setPaxLoading] = useState(false);
  const [bookingPassengers, setBookingPassengers] = useState([]);
  const [bookingIdInput, setBookingIdInput] = useState('');
  const [editingPassenger, setEditingPassenger] = useState(null);
  const [editForm, setEditForm] = useState({});

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
        flightId:        parseInt(seatForm.flightId),
        seatNumber:      seatForm.seatNumber,
        seatClass:       seatForm.seatClass,
        row:             parseInt(seatForm.row),
        column:          seatForm.column,
        window:          seatForm.isWindow,
        aisle:           seatForm.isAisle,
        hasExtraLegroom: seatForm.hasExtraLegroom,
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

  async function handlePassengerSearch(e) {
    e.preventDefault();
    setPaxError(''); setPaxResult(null);
    setPaxLoading(true);
    try {
      let res;
      if (paxSearchType === 'ticket')   res = await passengerApi.getByTicket(paxSearchQuery);
      if (paxSearchType === 'passport') res = await passengerApi.getByPassport(paxSearchQuery);
      setPaxResult(res.data);
    } catch {
      setPaxError('No passenger found.');
    } finally {
      setPaxLoading(false);
    }
  }

  async function handleLoadBookingPassengers(e) {
    e.preventDefault();
    setPaxError('');
    setPaxResult(null);
    try {
      const res = await passengerApi.getByBooking(bookingIdInput);
      setBookingPassengers(res.data);
      if (res.data.length === 0) setPaxError('No passengers found for this booking.');
    } catch {
      setPaxError('Could not load passengers for this booking.');
    }
  }

  async function handleUpdatePassenger(e) {
    e.preventDefault();
    try {
      await passengerApi.updatePassenger(editingPassenger.passengerId, {
        firstName:      editForm.firstName,
        lastName:       editForm.lastName,
        passportNumber: editForm.passportNumber,
        nationality:    editForm.nationality,
        gender:         editForm.gender,
        passengerType:  editForm.passengerType,
        // preserve existing read-only fields
        bookingId:      editingPassenger.bookingId,
        title:          editingPassenger.title,
        dateOfBirth:    editingPassenger.dateOfBirth,
        passportExpiry: editingPassenger.passportExpiry,
      });
      setBookingPassengers(p => p.map(x =>
        x.passengerId === editingPassenger.passengerId ? { ...x, ...editForm } : x
      ));
      setEditingPassenger(null);
      setMessage('Passenger updated.');
    } catch {
      setError('Could not update passenger.');
    }
  }

  async function handleDeletePassenger(id) {
    if (!window.confirm('Remove this passenger from the booking?')) return;
    try {
      await passengerApi.deletePassenger(id);
      setBookingPassengers(p => p.filter(x => x.passengerId !== id));
      setMessage('Passenger removed.');
    } catch {
      setError('Could not remove passenger.');
    }
  }

  async function handleDeleteByBooking(bookingId) {
    if (!window.confirm(`Remove ALL passengers for booking #${bookingId}? This cannot be undone.`)) return;
    try {
      await passengerApi.deleteByBooking(bookingId);
      setBookingPassengers([]);
      setMessage(`All passengers for booking #${bookingId} removed.`);
    } catch {
      setError('Could not remove passengers.');
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

  async function handleUpdateStatus(flightId, status) {
    setStatusUpdating(prev => ({ ...prev, [flightId]: true }));
    try {
      const res = await flightApi.updateStatus(flightId, status);
      setFlights(prev => prev.map(f => f.id === flightId ? { ...f, status: res.data.status } : f));
      setMessage(`Flight #${flightId} status updated to ${status}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update status');
    } finally {
      setStatusUpdating(prev => ({ ...prev, [flightId]: false }));
    }
  }

  async function handleLoadFlightPassengers() {
    if (!selectedFlightId) return;
    setFlightPaxLoading(true);
    setFlightPassengers([]);
    setFlightRevenue(null);
    try {
      const res = await flightApi.getPassengers(selectedFlightId);
      setFlightPassengers(res.data);
      // collect unique booking IDs then fetch revenue
      const bookingIds = [...new Set(res.data.map(p => Number(p.bookingId)).filter(Boolean))];
      if (bookingIds.length > 0) {
        const rev = await paymentApi.getRevenueForBookings(bookingIds);
        setFlightRevenue(rev.data);
      } else {
        setFlightRevenue(0);
      }
    } catch {
      setError('Could not load passengers for this flight.');
    } finally {
      setFlightPaxLoading(false);
    }
  }

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
          <button className={tab === 'passengers' ? 'tab active' : 'tab'} onClick={() => setTab('passengers')}>
            👥 Passengers
          </button>
          <button className={tab === 'flight-passengers' ? 'tab active' : 'tab'} onClick={() => setTab('flight-passengers')}>
            ✈ Flight Passengers
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
                      <th>Occupancy</th>
                      <th>Price</th>
                      <th>Status / Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFlights.map(flight => {
                      const booked = (flight.totalSeats || 0) - (flight.availableSeats || 0);
                      const occupancy = flight.totalSeats > 0 ? Math.round(booked / flight.totalSeats * 100) : 0;
                      const statusColors = { ON_TIME: '#10b981', DELAYED: '#f59e0b', CANCELLED: '#ef4444' };
                      return (
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
                            <div style={{ minWidth: 90 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
                                <span>{booked}/{flight.totalSeats}</span>
                                <span>{occupancy}%</span>
                              </div>
                              <div style={{ background: '#e5e7eb', borderRadius: 4, height: 6 }}>
                                <div style={{ width: `${occupancy}%`, background: occupancy > 80 ? '#ef4444' : '#10b981', height: 6, borderRadius: 4, transition: 'width 0.3s' }} />
                              </div>
                            </div>
                          </td>
                          <td><strong className="price">₹{flight.price?.toLocaleString()}</strong></td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {['ON_TIME', 'DELAYED', 'CANCELLED'].map(s => (
                                  <button
                                    key={s}
                                    disabled={statusUpdating[flight.id] || flight.status === s}
                                    onClick={() => handleUpdateStatus(flight.id, s)}
                                    style={{
                                      fontSize: 10, padding: '2px 6px', borderRadius: 4, border: 'none', cursor: 'pointer',
                                      background: flight.status === s ? statusColors[s] : '#e5e7eb',
                                      color: flight.status === s ? '#fff' : '#374151', fontWeight: flight.status === s ? 700 : 400,
                                    }}
                                  >{s.replace('_', ' ')}</button>
                                ))}
                              </div>
                              <button
                                className="view-seats-btn"
                                onClick={() => toggleSeats(flight.id)}
                              >
                                {expandedFlightId === flight.id ? 'Hide Seats' : 'View Seats'}
                              </button>
                            </div>
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
                                        title={`${seat.seatClass} | ${seat.status}${seat.window ? ' | Window' : ''}${seat.aisle ? ' | Aisle' : ''}${seat.hasExtraLegroom ? ' | Extra Legroom' : ''}`}
                                      >
                                        {seat.seatNumber}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <div className="seat-legend">
                                  <span className="seat-chip available">Available</span>
                                  <span className="seat-chip confirmed">Confirmed</span>
                                  <span className="seat-chip held">Held</span>
                                  <span className="seat-chip booked">Booked/Other</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                      );
                    })}
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

        {/* FLIGHT PASSENGERS TAB */}
        {tab === 'flight-passengers' && (
          <div className="dashboard-card">
            <div className="card-header"><h2>Passengers by Flight</h2></div>
            <div className="pax-section">
              <div className="pax-search-form">
                <select value={selectedFlightId} onChange={e => setSelectedFlightId(e.target.value)}>
                  <option value="">— Select a flight —</option>
                  {flights.map(f => (
                    <option key={f.id} value={f.id}>
                      #{f.id} · {f.flightNumber} · {f.source} → {f.destination} ({f.departureDate})
                    </option>
                  ))}
                </select>
                <button className="submit-btn" onClick={handleLoadFlightPassengers} disabled={!selectedFlightId || flightPaxLoading}>
                  {flightPaxLoading ? 'Loading...' : 'Load Passengers'}
                </button>

              </div>

              {flightRevenue !== null && (
                <div style={{ display: 'flex', gap: 16, margin: '16px 0', flexWrap: 'wrap' }}>
                  <div className="stat-card" style={{ flex: 1, minWidth: 140 }}>
                    <div className="stat-icon">👥</div>
                    <div><h2>{flightPassengers.length}</h2><span>Passengers</span></div>
                  </div>
                  <div className="stat-card" style={{ flex: 1, minWidth: 140 }}>
                    <div className="stat-icon booked">💰</div>
                    <div><h2>₹{flightRevenue?.toLocaleString()}</h2><span>Revenue</span></div>
                  </div>
                  {(() => {
                    const fl = flights.find(f => String(f.id) === String(selectedFlightId));
                    const occ = fl && fl.totalSeats > 0
                      ? Math.round(((fl.totalSeats - fl.availableSeats) / fl.totalSeats) * 100) : 0;
                    return (
                      <div className="stat-card" style={{ flex: 1, minWidth: 140 }}>
                        <div className="stat-icon seats">📊</div>
                        <div>
                          <h2>{occ}%</h2>
                          <span>Occupancy</span>
                          <div style={{ background: '#e5e7eb', borderRadius: 4, height: 8, marginTop: 4 }}>
                            <div style={{ width: `${occ}%`, background: occ > 80 ? '#ef4444' : '#10b981', height: 8, borderRadius: 4 }} />
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {flightPassengers.length > 0 && (
                <div className="table-wrapper">
                  <table className="staff-table">
                    <thead>
                      <tr><th>Name</th><th>Ticket</th><th>Seat</th><th>Type</th><th>Nationality</th><th>Add-ons</th></tr>
                    </thead>
                    <tbody>
                      {flightPassengers.map(p => {
                        let addons = [];
                        try { addons = JSON.parse(p.addons || '[]'); } catch { addons = []; }
                        return (
                          <tr key={p.passengerId}>
                            <td>{p.title} {p.firstName} {p.lastName}</td>
                            <td>{p.ticketNumber || '—'}</td>
                            <td>{p.seatNumber || '—'}</td>
                            <td>{p.passengerType || '—'}</td>
                            <td>{p.nationality || '—'}</td>
                            <td>
                              {addons.length > 0
                                ? addons.map((a, i) => <span key={i} title={`₹${a.price}`} style={{ marginRight: 4 }}>{a.icon} {a.name}</span>)
                                : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {flightPassengers.length === 0 && flightRevenue !== null && (
                <div className="empty-small">No passengers found for this flight.</div>
              )}
            </div>
          </div>
        )}

        {/* PASSENGERS TAB */}
        {tab === 'passengers' && (
          <div className="dashboard-card">
            <div className="card-header"><h2>Passenger Management</h2></div>

            {/* Search by ticket / passport */}
            <div className="pax-section">
              <h3>Lookup Passenger</h3>
              <form onSubmit={handlePassengerSearch} className="pax-search-form">
                <select value={paxSearchType} onChange={e => setPaxSearchType(e.target.value)}>
                  <option value="ticket">Ticket Number</option>
                  <option value="passport">Passport Number</option>
                </select>
                <input
                  type="text"
                  placeholder={paxSearchType === 'ticket' ? 'TKT-XXXXXXXX' : 'Passport number'}
                  value={paxSearchQuery}
                  onChange={e => setPaxSearchQuery(e.target.value)}
                  required
                />
                <button type="submit" className="submit-btn" disabled={paxLoading}>
                  {paxLoading ? 'Searching...' : 'Search'}
                </button>
              </form>
              {paxError && <div className="alert-error">{paxError}</div>}
              {paxResult && (
                <div className="pax-result-card">
                  <strong>{paxResult.firstName} {paxResult.lastName}</strong>
                  <span>Ticket: {paxResult.ticketNumber}</span>
                  <span>Passport: {paxResult.passportNumber}</span>
                  <span>Seat: {paxResult.seatNumber || 'Not assigned'}</span>
                  <span>Booking #{paxResult.bookingId}</span>
                </div>
              )}
            </div>

            {/* Passengers by booking */}
            <div className="pax-section">
              <h3>Passengers by Booking</h3>
              <form onSubmit={handleLoadBookingPassengers} className="pax-search-form">
                <input
                  type="number"
                  placeholder="Booking ID"
                  value={bookingIdInput}
                  onChange={e => setBookingIdInput(e.target.value)}
                  required
                />
                <button type="submit" className="submit-btn">Load</button>
              </form>
              {bookingPassengers.length > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                    <button className="cancel-btn-sm" onClick={() => handleDeleteByBooking(bookingIdInput)}>
                      🗑 Remove All Passengers
                    </button>
                  </div>
                  <div className="table-wrapper">
                    <table className="staff-table">
                      <thead>
                        <tr><th>Name</th><th>Ticket</th><th>Passport</th><th>Nationality</th><th>Type</th><th>Seat</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {bookingPassengers.map(p => (
                          <tr key={p.passengerId}>
                            <td>{p.title} {p.firstName} {p.lastName}</td>
                            <td>{p.ticketNumber || '—'}</td>
                            <td>{p.passportNumber || '—'}</td>
                            <td>{p.nationality || '—'}</td>
                            <td>{p.passengerType || '—'}</td>
                            <td>{p.seatNumber || '—'}</td>
                            <td>
                              <button className="view-seats-btn" onClick={() => {
                                setEditingPassenger(p);
                                setEditForm({
                                  firstName:      p.firstName,
                                  lastName:       p.lastName,
                                  passportNumber: p.passportNumber,
                                  nationality:    p.nationality,
                                  gender:         p.gender,
                                  passengerType:  p.passengerType,
                                });
                              }}>Edit</button>
                              {' '}
                              <button className="cancel-btn-sm" onClick={() => handleDeletePassenger(p.passengerId)}>Remove</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Edit passenger modal */}
            {editingPassenger && (
              <div className="modal-overlay">
                <div className="modal-box">
                  <h3>Edit Passenger</h3>
                  <form onSubmit={handleUpdatePassenger}>
                    <div className="form-grid">
                      {[
                        { key: 'firstName',      label: 'First Name' },
                        { key: 'lastName',       label: 'Last Name' },
                        { key: 'passportNumber', label: 'Passport Number' },
                        { key: 'nationality',    label: 'Nationality' },
                        { key: 'gender',         label: 'Gender' },
                        { key: 'passengerType',  label: 'Passenger Type' },
                      ].map(f => (
                        <div className="form-group" key={f.key}>
                          <label>{f.label}</label>
                          <input
                            type="text"
                            value={editForm[f.key] || ''}
                            onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="modal-actions">
                      <button type="button" className="modal-cancel" onClick={() => setEditingPassenger(null)}>Cancel</button>
                      <button type="submit" className="modal-confirm">Save</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
