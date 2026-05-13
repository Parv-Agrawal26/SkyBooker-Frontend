// import React, { useState, useEffect } from 'react';
// import { flightApi, seatApi } from '../../api/api';
// import './StaffDashboard.css';

// // Today's date for min attribute on date inputs
// const todayStr = new Date().toISOString().split('T')[0];

// export default function StaffDashboard() {
//   const [tab, setTab] = useState('flights');
//   const [flights, setFlights] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [message, setMessage] = useState('');
//   const [error, setError] = useState('');

//   const [flightForm, setFlightForm] = useState({
//     flightNumber: '', airline: '', source: '', destination: '',
//     departureDate: '', departureTime: '',
//     arrivalDate: '', arrivalTime: '',
//     totalSeats: '', price: ''
//   });

//   const [seatForm, setSeatForm] = useState({
//     flightId: '', seatNumber: '', seatClass: 'ECONOMY',
//     row: '', column: '', isWindow: false, isAisle: false,
//     hasExtraLegroom: false, priceMultiplier: 1.0
//   });

//   useEffect(() => { fetchFlights(); }, []);

//   async function fetchFlights() {
//     try {
//       const res = await flightApi.getAll();
//       setFlights(res.data);
//     } catch (err) {
//       setError('Could not load flights');
//     } finally { setLoading(false); }
//   }

//   async function handleAddFlight(e) {
//     e.preventDefault();
//     setError(''); setMessage('');

//     // Frontend validation — departure date past mein nahi honi chahiye
//     if (flightForm.departureDate < todayStr) {
//       setError('Departure date cannot be in the past. Please select today or a future date.');
//       return;
//     }

//     // Arrival date departure date se pehle nahi honi chahiye
//     const arrDate = flightForm.arrivalDate || flightForm.departureDate;
//     if (arrDate < flightForm.departureDate) {
//       setError('Arrival date cannot be before departure date.');
//       return;
//     }

//     // Same day: arrival time must be after departure time
//     if (arrDate === flightForm.departureDate) {
//       if (flightForm.arrivalTime && flightForm.departureTime &&
//           flightForm.arrivalTime <= flightForm.departureTime) {
//         setError('Same-day flight: arrival time must be after departure time. For overnight flights set a different arrival date.');
//         return;
//       }
//     }

//     try {
//       await flightApi.addFlight({
//         ...flightForm,
//         arrivalDate: flightForm.arrivalDate || flightForm.departureDate,
//         totalSeats: parseInt(flightForm.totalSeats),
//         price: parseFloat(flightForm.price),
//       });
//       setMessage('Flight added successfully! Seats auto-generated.');
//       setFlightForm({
//         flightNumber: '', airline: '', source: '', destination: '',
//         departureDate: '', departureTime: '',
//         arrivalDate: '', arrivalTime: '',
//         totalSeats: '', price: ''
//       });
//       fetchFlights();
//     } catch (err) {
//       setError(err.response?.data?.message || 'Could not add flight');
//     }
//   }

//   async function handleAddSeat(e) {
//     e.preventDefault();
//     setError(''); setMessage('');
//     try {
//       await seatApi.addSeat({
//         ...seatForm,
//         flightId: parseInt(seatForm.flightId),
//         row: parseInt(seatForm.row),
//         priceMultiplier: parseFloat(seatForm.priceMultiplier),
//       });
//       setMessage('Seat added successfully!');
//       setSeatForm({
//         flightId: '', seatNumber: '', seatClass: 'ECONOMY',
//         row: '', column: '', isWindow: false, isAisle: false,
//         hasExtraLegroom: false, priceMultiplier: 1.0
//       });
//     } catch (err) {
//       setError(err.response?.data?.message || 'Could not add seat');
//     }
//   }

//   // Helper: format arrival display
//   function formatArrival(flight) {
//     const time = flight.arrivalTime || '-';
//     if (flight.arrivalDate && flight.arrivalDate !== flight.departureDate) {
//       return `${time} (${flight.arrivalDate})`;
//     }
//     return time;
//   }

//   return (
//     <div className="page-container">
//       <div className="staff-header">
//         <h1>Staff Dashboard</h1>
//         <p>Manage flights and seat inventory</p>
//       </div>

//       {message && <div className="alert-success" style={{ marginBottom: '16px' }}>{message}</div>}
//       {error   && <div className="alert-error"   style={{ marginBottom: '16px' }}>{error}</div>}

//       <div className="staff-tabs">
//         <button className={tab === 'flights' ? 'tab active' : 'tab'} onClick={() => setTab('flights')}>
//           ✈ My Flights ({flights.length})
//         </button>
//         <button className={tab === 'add-flight' ? 'tab active' : 'tab'} onClick={() => setTab('add-flight')}>
//           + Add Flight
//         </button>
//         <button className={tab === 'add-seat' ? 'tab active' : 'tab'} onClick={() => setTab('add-seat')}>
//           + Add Seats
//         </button>
//       </div>

//       {/* Flights List */}
//       {tab === 'flights' && (
//         <div className="flights-table-wrap card">
//           {loading ? (
//             <div className="loading">Loading...</div>
//           ) : flights.length === 0 ? (
//             <div className="empty-state-small">No flights added yet</div>
//           ) : (
//             <table className="staff-table">
//               <thead>
//                 <tr>
//                   <th>Flight No.</th><th>Airline</th><th>Route</th>
//                   <th>Departure</th><th>Arrival</th><th>Seats</th><th>Price</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {flights.map(flight => (
//                   <tr key={flight.id}>
//                     <td><strong>{flight.flightNumber}</strong></td>
//                     <td>{flight.airline}</td>
//                     <td>{flight.source} → {flight.destination}</td>
//                     <td>{flight.departureDate}<br/><small>{flight.departureTime}</small></td>
//                     <td>{flight.arrivalDate || flight.departureDate}<br/><small>{formatArrival(flight)}</small></td>
//                     <td>
//                       <span className={flight.availableSeats < 10 ? 'seats-low' : 'seats-ok'}>
//                         {flight.availableSeats}
//                       </span>
//                     </td>
//                     <td>₹{flight.price?.toLocaleString()}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>
//       )}

//       {/* Add Flight Form */}
//       {tab === 'add-flight' && (
//         <div className="card">
//           <h2 style={{ marginBottom: '24px' }}>Add New Flight</h2>
//           <form onSubmit={handleAddFlight} className="staff-form">
//             <div className="form-grid">
//               <div className="form-group">
//                 <label>Flight Number</label>
//                 <input type="text" placeholder="6E-101" value={flightForm.flightNumber}
//                   onChange={e => setFlightForm({ ...flightForm, flightNumber: e.target.value })} required />
//               </div>
//               <div className="form-group">
//                 <label>Airline Name</label>
//                 <input type="text" placeholder="IndiGo" value={flightForm.airline}
//                   onChange={e => setFlightForm({ ...flightForm, airline: e.target.value })} required />
//               </div>
//               <div className="form-group">
//                 <label>Source</label>
//                 <input type="text" placeholder="Delhi" value={flightForm.source}
//                   onChange={e => setFlightForm({ ...flightForm, source: e.target.value })} required />
//               </div>
//               <div className="form-group">
//                 <label>Destination</label>
//                 <input type="text" placeholder="Mumbai" value={flightForm.destination}
//                   onChange={e => setFlightForm({ ...flightForm, destination: e.target.value })} required />
//               </div>

//               {/* Departure Date — min = today */}
//               <div className="form-group">
//                 <label>Departure Date</label>
//                 <input type="date" min={todayStr} value={flightForm.departureDate}
//                   onChange={e => setFlightForm({ ...flightForm, departureDate: e.target.value })} required />
//               </div>
//               <div className="form-group">
//                 <label>Departure Time</label>
//                 <input type="time" value={flightForm.departureTime}
//                   onChange={e => setFlightForm({ ...flightForm, departureTime: e.target.value })} required />
//               </div>

//               {/* Arrival Date — min = departureDate */}
//               <div className="form-group">
//                 <label>Arrival Date</label>
//                 <input type="date"
//                   min={flightForm.departureDate || todayStr}
//                   value={flightForm.arrivalDate}
//                   onChange={e => setFlightForm({ ...flightForm, arrivalDate: e.target.value })}
//                   placeholder={flightForm.departureDate || 'Select departure date first'} />
//                 <small style={{ color: '#64748b', fontSize: '12px' }}>
//                   Leave empty if same day as departure
//                 </small>
//               </div>
//               <div className="form-group">
//                 <label>Arrival Time</label>
//                 <input type="time" value={flightForm.arrivalTime}
//                   onChange={e => setFlightForm({ ...flightForm, arrivalTime: e.target.value })} required />
//               </div>

//               <div className="form-group">
//                 <label>Total Seats</label>
//                 <input type="number" placeholder="150" min="1" value={flightForm.totalSeats}
//                   onChange={e => setFlightForm({ ...flightForm, totalSeats: e.target.value })} required />
//               </div>
//               <div className="form-group">
//                 <label>Price (₹)</label>
//                 <input type="number" placeholder="4500" min="1" value={flightForm.price}
//                   onChange={e => setFlightForm({ ...flightForm, price: e.target.value })} required />
//               </div>
//             </div>
//             <button type="submit" className="btn-primary">Add Flight</button>
//           </form>
//         </div>
//       )}

//       {/* Add Seat Form */}
//       {tab === 'add-seat' && (
//         <div className="card">
//           <h2 style={{ marginBottom: '24px' }}>Add Seat to Flight</h2>
//           <form onSubmit={handleAddSeat} className="staff-form">
//             <div className="form-grid">
//               <div className="form-group">
//                 <label>Flight ID</label>
//                 <input type="number" placeholder="1" value={seatForm.flightId}
//                   onChange={e => setSeatForm({ ...seatForm, flightId: e.target.value })} required />
//               </div>
//               <div className="form-group">
//                 <label>Seat Number</label>
//                 <input type="text" placeholder="12A" value={seatForm.seatNumber}
//                   onChange={e => setSeatForm({ ...seatForm, seatNumber: e.target.value })} required />
//               </div>
//               <div className="form-group">
//                 <label>Class</label>
//                 <select value={seatForm.seatClass}
//                   onChange={e => setSeatForm({ ...seatForm, seatClass: e.target.value })}>
//                   <option value="ECONOMY">Economy</option>
//                   <option value="BUSINESS">Business</option>
//                   <option value="FIRST">First Class</option>
//                 </select>
//               </div>
//               <div className="form-group">
//                 <label>Row</label>
//                 <input type="number" placeholder="12" value={seatForm.row}
//                   onChange={e => setSeatForm({ ...seatForm, row: e.target.value })} required />
//               </div>
//               <div className="form-group">
//                 <label>Column</label>
//                 <input type="text" placeholder="A" value={seatForm.column}
//                   onChange={e => setSeatForm({ ...seatForm, column: e.target.value })} required />
//               </div>
//               <div className="form-group">
//                 <label>Price Multiplier</label>
//                 <input type="number" step="0.1" placeholder="1.0" value={seatForm.priceMultiplier}
//                   onChange={e => setSeatForm({ ...seatForm, priceMultiplier: e.target.value })} />
//               </div>
//             </div>
//             <div className="checkbox-row">
//               <label className="checkbox-label">
//                 <input type="checkbox" checked={seatForm.isWindow}
//                   onChange={e => setSeatForm({ ...seatForm, isWindow: e.target.checked })} />
//                 Window Seat
//               </label>
//               <label className="checkbox-label">
//                 <input type="checkbox" checked={seatForm.isAisle}
//                   onChange={e => setSeatForm({ ...seatForm, isAisle: e.target.checked })} />
//                 Aisle Seat
//               </label>
//               <label className="checkbox-label">
//                 <input type="checkbox" checked={seatForm.hasExtraLegroom}
//                   onChange={e => setSeatForm({ ...seatForm, hasExtraLegroom: e.target.checked })} />
//                 Extra Legroom
//               </label>
//             </div>
//             <button type="submit" className="btn-primary">Add Seat</button>
//           </form>
//         </div>
//       )}
//     </div>
//   );
// }

import React, { useState, useEffect } from 'react';
import { flightApi, seatApi } from '../../api/api';
import './StaffDashboard.css';

const todayStr = new Date().toISOString().split('T')[0];

// Current time HH:mm format mein — today ke liye min time
function getCurrentTime() {
  const now = new Date();
  return now.toTimeString().slice(0, 5); // "HH:mm"
}

export default function StaffDashboard() {
  const [tab, setTab] = useState('flights');
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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

  useEffect(() => { fetchFlights(); }, []);

  async function fetchFlights() {
    try {
      const res = await flightApi.getAll();
      setFlights(res.data);
    } catch (err) {
      setError('Could not load flights');
    } finally { setLoading(false); }
  }

  async function handleAddFlight(e) {
    e.preventDefault();
    setError(''); setMessage('');

    // Date past check
    if (flightForm.departureDate < todayStr) {
      setError('Departure date cannot be in the past.');
      return;
    }

    // Aaj ki date hai toh time bhi future mein hona chahiye
    if (flightForm.departureDate === todayStr && flightForm.departureTime) {
      const currentTime = getCurrentTime();
      if (flightForm.departureTime <= currentTime) {
        setError(
          `Departure time (${flightForm.departureTime}) has already passed. ` +
          `Current time is ${currentTime}. Please select a future time.`
        );
        return;
      }
    }

    const arrDate = flightForm.arrivalDate || flightForm.departureDate;
    if (arrDate < flightForm.departureDate) {
      setError('Arrival date cannot be before departure date.');
      return;
    }

    if (arrDate === flightForm.departureDate) {
      if (flightForm.arrivalTime && flightForm.departureTime &&
          flightForm.arrivalTime <= flightForm.departureTime) {
        setError('Same-day flight: arrival time must be after departure time.');
        return;
      }
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
        departureDate: '', departureTime: '',
        arrivalDate: '', arrivalTime: '',
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

  function formatArrival(flight) {
    const time = flight.arrivalTime || '-';
    if (flight.arrivalDate && flight.arrivalDate !== flight.departureDate) {
      return `${time} (${flight.arrivalDate})`;
    }
    return time;
  }

  // Departure date change hone pe arrival date ka min bhi update ho
  function handleDepDateChange(val) {
    setFlightForm(prev => ({
      ...prev,
      departureDate: val,
      // Agar arrival date departure date se pehle ho toh clear karo
      arrivalDate: prev.arrivalDate && prev.arrivalDate < val ? '' : prev.arrivalDate,
      // Agar aaj nahi hai toh departure time reset mat karo
      departureTime: prev.departureTime,
    }));
  }

  return (
  <div className="staff-page">

    {/* HERO */}
    <div className="staff-hero">

      <div className="staff-hero-content">

        <div className="hero-badge">
          ✈ SkyBooker Operations Center
        </div>

        <h1>Staff Dashboard</h1>

        <p>
          Manage flights, monitor seat inventory, and
          control airline operations in real time.
        </p>

      </div>

    </div>

    {/* CONTENT */}
    <div className="staff-container">

      {message && (
        <div className="alert-success">
          {message}
        </div>
      )}

      {error && (
        <div className="alert-error">
          {error}
        </div>
      )}

      {/* STATS */}
      <div className="stats-grid">

        <div className="stat-card">

          <div className="stat-icon">
            ✈
          </div>

          <div>
            <h2>{flights.length}</h2>
            <span>Total Flights</span>
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon seats">
            💺
          </div>

          <div>
            <h2>
              {flights.reduce(
                (acc, f) =>
                  acc + (f.availableSeats || 0),
                0
              )}
            </h2>

            <span>Available Seats</span>
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon revenue">
            💰
          </div>

          <div>
            <h2>
              ₹
              {flights
                .reduce(
                  (acc, f) =>
                    acc + (f.price || 0),
                  0
                )
                .toLocaleString()}
            </h2>

            <span>Flight Pricing</span>
          </div>

        </div>

      </div>

      {/* TABS */}
      <div className="staff-tabs">

        <button
          className={
            tab === 'flights'
              ? 'tab active'
              : 'tab'
          }
          onClick={() => setTab('flights')}
        >
          ✈ Flights
        </button>

        <button
          className={
            tab === 'add-flight'
              ? 'tab active'
              : 'tab'
          }
          onClick={() =>
            setTab('add-flight')
          }
        >
          + Add Flight
        </button>

        <button
          className={
            tab === 'add-seat'
              ? 'tab active'
              : 'tab'
          }
          onClick={() =>
            setTab('add-seat')
          }
        >
          + Add Seats
        </button>

      </div>

      {/* FLIGHTS */}
      {tab === 'flights' && (

        <div className="dashboard-card">

          <div className="card-header">

            <h2>Flight Inventory</h2>

            <span>
              {flights.length} Flights
            </span>

          </div>

          {loading ? (

            <div className="loading-box">
              Loading flights...
            </div>

          ) : flights.length === 0 ? (

            <div className="empty-small">
              No flights added yet
            </div>

          ) : (

            <div className="table-wrapper">

              <table className="staff-table">

                <thead>
                  <tr>
                    <th>Flight</th>
                    <th>Route</th>
                    <th>Departure</th>
                    <th>Arrival</th>
                    <th>Seats</th>
                    <th>Price</th>
                  </tr>
                </thead>

                <tbody>

                  {flights.map((flight) => (

                    <tr key={flight.id}>

                      <td>

                        <div className="flight-info">

                          <div className="flight-logo">
                            ✈
                          </div>

                          <div>

                            <strong>
                              {
                                flight.flightNumber
                              }
                            </strong>

                            <span>
                              {flight.airline}
                            </span>

                          </div>

                        </div>

                      </td>

                      <td>

                        <div className="route-box">

                          <span>
                            {flight.source}
                          </span>

                          <div className="route-line">

                            <div className="line"></div>

                            <div className="plane-icon">
                              ✈
                            </div>

                            <div className="line"></div>

                          </div>

                          <span>
                            {
                              flight.destination
                            }
                          </span>

                        </div>

                      </td>

                      <td>

                        <strong>
                          {
                            flight.departureDate
                          }
                        </strong>

                        <small>
                          {
                            flight.departureTime
                          }
                        </small>

                      </td>

                      <td>

                        <strong>
                          {flight.arrivalDate ||
                            flight.departureDate}
                        </strong>

                        <small>
                          {formatArrival(
                            flight
                          )}
                        </small>

                      </td>

                      <td>

                        <span
                          className={
                            flight.availableSeats <
                            10
                              ? 'seat-badge low'
                              : 'seat-badge ok'
                          }
                        >
                          {
                            flight.availableSeats
                          }
                        </span>

                      </td>

                      <td>

                        <strong className="price">
                          ₹
                          {flight.price?.toLocaleString()}
                        </strong>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

      )}

      {/* ADD FLIGHT */}
      {tab === 'add-flight' && (

        <div className="dashboard-card">

          <div className="card-header">

            <h2>Add New Flight</h2>

          </div>

          <form
            onSubmit={handleAddFlight}
            className="staff-form"
          >

            <div className="form-grid">

              <div className="form-group">
                <label>
                  Flight Number
                </label>

                <input
                  type="text"
                  placeholder="6E-101"
                  value={
                    flightForm.flightNumber
                  }
                  onChange={(e) =>
                    setFlightForm({
                      ...flightForm,
                      flightNumber:
                        e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Airline Name
                </label>

                <input
                  type="text"
                  placeholder="IndiGo"
                  value={flightForm.airline}
                  onChange={(e) =>
                    setFlightForm({
                      ...flightForm,
                      airline:
                        e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Source</label>

                <input
                  type="text"
                  placeholder="Delhi"
                  value={flightForm.source}
                  onChange={(e) =>
                    setFlightForm({
                      ...flightForm,
                      source:
                        e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Destination
                </label>

                <input
                  type="text"
                  placeholder="Mumbai"
                  value={
                    flightForm.destination
                  }
                  onChange={(e) =>
                    setFlightForm({
                      ...flightForm,
                      destination:
                        e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Departure Date
                </label>

                <input
                  type="date"
                  min={todayStr}
                  value={
                    flightForm.departureDate
                  }
                  onChange={(e) =>
                    handleDepDateChange(
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Departure Time
                </label>

                <input
                  type="time"
                  value={
                    flightForm.departureTime
                  }
                  min={
                    flightForm.departureDate ===
                    todayStr
                      ? getCurrentTime()
                      : undefined
                  }
                  onChange={(e) =>
                    setFlightForm({
                      ...flightForm,
                      departureTime:
                        e.target.value,
                    })
                  }
                  required
                />

                {flightForm.departureDate ===
                  todayStr && (
                  <small className="warning-text">
                    ⚠ Only future times
                    allowed for today
                  </small>
                )}

              </div>

              <div className="form-group">
                <label>
                  Arrival Date
                </label>

                <input
                  type="date"
                  min={
                    flightForm.departureDate ||
                    todayStr
                  }
                  value={
                    flightForm.arrivalDate
                  }
                  onChange={(e) =>
                    setFlightForm({
                      ...flightForm,
                      arrivalDate:
                        e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>
                  Arrival Time
                </label>

                <input
                  type="time"
                  value={
                    flightForm.arrivalTime
                  }
                  onChange={(e) =>
                    setFlightForm({
                      ...flightForm,
                      arrivalTime:
                        e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Total Seats
                </label>

                <input
                  type="number"
                  placeholder="150"
                  min="1"
                  value={
                    flightForm.totalSeats
                  }
                  onChange={(e) =>
                    setFlightForm({
                      ...flightForm,
                      totalSeats:
                        e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Price (₹)
                </label>

                <input
                  type="number"
                  placeholder="4500"
                  min="1"
                  value={flightForm.price}
                  onChange={(e) =>
                    setFlightForm({
                      ...flightForm,
                      price:
                        e.target.value,
                    })
                  }
                  required
                />
              </div>

            </div>

            <button
              type="submit"
              className="submit-btn"
            >
              Add Flight
            </button>

          </form>

        </div>

      )}

      {/* ADD SEAT */}
      {tab === 'add-seat' && (

        <div className="dashboard-card">

          <div className="card-header">

            <h2>Add Seats</h2>

          </div>

          <form
            onSubmit={handleAddSeat}
            className="staff-form"
          >

            <div className="form-grid">

              <div className="form-group">
                <label>Flight ID</label>

                <input
                  type="number"
                  placeholder="1"
                  value={seatForm.flightId}
                  onChange={(e) =>
                    setSeatForm({
                      ...seatForm,
                      flightId:
                        e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Seat Number
                </label>

                <input
                  type="text"
                  placeholder="12A"
                  value={
                    seatForm.seatNumber
                  }
                  onChange={(e) =>
                    setSeatForm({
                      ...seatForm,
                      seatNumber:
                        e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Class</label>

                <select
                  value={seatForm.seatClass}
                  onChange={(e) =>
                    setSeatForm({
                      ...seatForm,
                      seatClass:
                        e.target.value,
                    })
                  }
                >
                  <option value="ECONOMY">
                    Economy
                  </option>

                  <option value="BUSINESS">
                    Business
                  </option>

                  <option value="FIRST">
                    First Class
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label>Row</label>

                <input
                  type="number"
                  placeholder="12"
                  value={seatForm.row}
                  onChange={(e) =>
                    setSeatForm({
                      ...seatForm,
                      row:
                        e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Column</label>

                <input
                  type="text"
                  placeholder="A"
                  value={seatForm.column}
                  onChange={(e) =>
                    setSeatForm({
                      ...seatForm,
                      column:
                        e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Price Multiplier
                </label>

                <input
                  type="number"
                  step="0.1"
                  placeholder="1.0"
                  value={
                    seatForm.priceMultiplier
                  }
                  onChange={(e) =>
                    setSeatForm({
                      ...seatForm,
                      priceMultiplier:
                        e.target.value,
                    })
                  }
                />
              </div>

            </div>

            <div className="checkbox-grid">

              <label className="checkbox-card">

                <input
                  type="checkbox"
                  checked={
                    seatForm.isWindow
                  }
                  onChange={(e) =>
                    setSeatForm({
                      ...seatForm,
                      isWindow:
                        e.target.checked,
                    })
                  }
                />

                <span>
                  Window Seat
                </span>

              </label>

              <label className="checkbox-card">

                <input
                  type="checkbox"
                  checked={
                    seatForm.isAisle
                  }
                  onChange={(e) =>
                    setSeatForm({
                      ...seatForm,
                      isAisle:
                        e.target.checked,
                    })
                  }
                />

                <span>
                  Aisle Seat
                </span>

              </label>

              <label className="checkbox-card">

                <input
                  type="checkbox"
                  checked={
                    seatForm.hasExtraLegroom
                  }
                  onChange={(e) =>
                    setSeatForm({
                      ...seatForm,
                      hasExtraLegroom:
                        e.target.checked,
                    })
                  }
                />

                <span>
                  Extra Legroom
                </span>

              </label>

            </div>

            <button
              type="submit"
              className="submit-btn"
            >
              Add Seat
            </button>

          </form>

        </div>

      )}

    </div>

  </div>
);
}