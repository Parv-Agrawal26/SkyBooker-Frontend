import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { seatApi, bookingApi, passengerApi } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import './SeatSelection.css';

const HOLD_MINUTES = 15;

export default function SeatSelection() {
  const { flightId }       = useParams();
  const [searchParams]     = useSearchParams();
  const navigate           = useNavigate();
  const { userEmail }      = useAuth();
  const passengers         = parseInt(searchParams.get('passengers') || 1);
  const returnFlightId     = searchParams.get('returnFlightId') || '';
  const returnPrice        = searchParams.get('returnPrice') || '';
  const returnSource       = searchParams.get('returnSource') || '';
  const returnDest         = searchParams.get('returnDestination') || '';
  const returnDate         = searchParams.get('returnDate') || '';

  const [step, setStep]               = useState(1);
  const [seats, setSeats]             = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [bookingId, setBookingId]     = useState(null);
  const [holdTimeLeft, setHoldTimeLeft] = useState(null); // seconds remaining
  const holdTimerRef = useRef(null);
  const selectedSeatsRef = useRef([]);  // always up-to-date for cleanup
  const stepRef = useRef(1);            // always up-to-date for cleanup
  const [addonsByPassenger, setAddonsByPassenger] = useState(
    Array(passengers).fill(null).map(() => ({}))
  );

  const [passengerForms, setPassengerForms] = useState(
    Array(passengers).fill(null).map(() => ({
      title: 'Mr', firstName: '', lastName: '',
      dateOfBirth: '', gender: 'MALE',
      passportNumber: '', nationality: 'Indian',
      passportExpiry: '', passengerType: 'ADULT',
    }))
  );

  useEffect(() => { fetchSeats(); }, []);

  // Keep refs in sync
  useEffect(() => { selectedSeatsRef.current = selectedSeats; }, [selectedSeats]);
  useEffect(() => { stepRef.current = step; }, [step]);

  // Release all held seats (fire-and-forget)
  const releaseHeldSeats = useCallback(() => {
    selectedSeatsRef.current.forEach(seat => {
      seatApi.releaseSeat(flightId, seat.seatNumber).catch(() => {});
    });
  }, [flightId]);

  // Start 15-min hold countdown when first seat is held
  function startHoldTimer() {
    if (holdTimerRef.current) return; // already running
    setHoldTimeLeft(HOLD_MINUTES * 60);
    holdTimerRef.current = setInterval(() => {
      setHoldTimeLeft(t => {
        if (t <= 1) {
          clearInterval(holdTimerRef.current);
          holdTimerRef.current = null;
          setError('Your seat hold has expired. Please reselect your seats.');
          setSelectedSeats([]);
          fetchSeats(); // refresh seat map
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  // Release seats on unmount (back button, close tab, navigate away)
  useEffect(() => {
    function handleBeforeUnload(e) {
      releaseHeldSeats();
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(holdTimerRef.current);
      // Only release if still on step 1 (not yet proceeded to payment)
      if (stepRef.current === 1) releaseHeldSeats();
    };
  }, [releaseHeldSeats]);

  async function fetchSeats() {
    try {
      const res = await seatApi.getAvailableSeats(flightId);
      setSeats(res.data);
    } catch (err) {
      setError('Could not load seat map. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const [tooltip, setTooltip] = useState(null);

  function formatHoldTime(secs) {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  const CLASS_PRICES = {
    FIRST:    (parseFloat(searchParams.get('price') || 4500)) * 3,
    BUSINESS: (parseFloat(searchParams.get('price') || 4500)) * 2,
    ECONOMY:  (parseFloat(searchParams.get('price') || 4500)) * 1,
  };

  const AISLE_AFTER = { FIRST: 1, BUSINESS: 1, ECONOMY: 1 };

  async function handleSeatClick(seat) {
    // Deselect a seat that is already selected (was held by us)
    if (selectedSeats.find(s => s.id === seat.id)) {
      if (!window.confirm(`Remove seat ${seat.seatNumber} from your selection?`)) return;
      await seatApi.releaseSeat(flightId, seat.seatNumber).catch(() => {});
      setSelectedSeats(selectedSeats.filter(s => s.id !== seat.id));
      setSeats(seats.map(s => s.id === seat.id ? { ...s, status: 'AVAILABLE' } : s));
      return;
    }

    if (seat.status !== 'AVAILABLE') return;

    if (selectedSeats.length >= passengers) {
      alert(`You can only select ${passengers} seat(s).`);
      return;
    }

    try {
      await seatApi.holdSeat(flightId, seat.seatNumber);
      setSelectedSeats([...selectedSeats, seat]);
      setSeats(seats.map(s => s.id === seat.id ? { ...s, status: 'HELD' } : s));
      startHoldTimer();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not hold seat. Please try again.');
    }
  }

  function handleMouseEnter(e, seat) {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ seat, x: rect.left + rect.width / 2, y: rect.top - 8 });
  }

  function handleMouseLeave() {
    setTooltip(null);
  }

  async function handleProceedToPassengers() {
    if (selectedSeats.length !== passengers) {
      alert(`Please select ${passengers} seat(s) to continue.`);
      return;
    }
    try {
      const res = await bookingApi.createBooking({
        flightId: parseInt(flightId),
        userEmail,
        seats: passengers,
      });
      setBookingId(res.data.bookingId);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
    }
  }

  async function handleSubmitPassengers(e) {
    e.preventDefault();
    setError('');

    // Basic frontend validation
    for (let i = 0; i < passengerForms.length; i++) {
      const f = passengerForms[i];
      if (!f.firstName.trim() || !f.lastName.trim()) {
        setError(`Please enter the full name for Passenger ${i + 1}.`);
        return;
      }
      if (!f.dateOfBirth) {
        setError(`Please enter the date of birth for Passenger ${i + 1}.`);
        return;
      }
    }

    try {
      for (let i = 0; i < passengerForms.length; i++) {
        const f = passengerForms[i];
        const addons = Object.values(addonsByPassenger[i] || {}).map(a => ({
          id: a.id, name: a.name, icon: a.icon, price: a.price,
        }));
        await passengerApi.addPassenger({
          bookingId:      bookingId.toString(),
          title:          f.title,
          firstName:      f.firstName,
          lastName:       f.lastName,
          dateOfBirth:    f.dateOfBirth,
          gender:         f.gender,
          nationality:    f.nationality,
          passengerType:  f.passengerType,
          passportNumber: f.passportNumber || null,
          passportExpiry: f.passportExpiry || null,
          addons:         addons.length > 0 ? JSON.stringify(addons) : null,
          seatId:         selectedSeats[i]?.id || null,
          seatNumber:     selectedSeats[i]?.seatNumber || null,
          flightId:       parseInt(flightId),
        });
      }
      // navigate(`/payment/${bookingId}?amount=${calculateTotal()}`);
      navigate(`/payment/${bookingId}?amount=${calculateTotal()}&flightId=${flightId}&seats=${selectedSeats.map(s=>s.seatNumber).join(',')}&passengers=${passengers}${returnFlightId ? `&returnFlightId=${returnFlightId}&returnPrice=${returnPrice}&returnSource=${encodeURIComponent(returnSource)}&returnDestination=${encodeURIComponent(returnDest)}&returnDate=${returnDate}` : ''}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save passenger details. Please try again.';
      setError(msg);
      if (err.response?.status === 400 && msg.toLowerCase().includes('already booked')) {
        setSelectedSeats([]);
        setStep(1);
        fetchSeats();
      }
    }
  }

  function updatePassengerForm(index, field, value) {
    const updated = [...passengerForms];
    updated[index] = { ...updated[index], [field]: value };
    setPassengerForms(updated);
  }

  function toggleAddon(passengerIndex, addon) {
    setAddonsByPassenger(prev => {
      const updated = [...prev];
      const current = { ...updated[passengerIndex] };
      if (current[addon.id]) delete current[addon.id];
      else current[addon.id] = addon;
      updated[passengerIndex] = current;
      return updated;
    });
  }

  function calculateTotal() {
    const base = parseFloat(searchParams.get('price') || 4500);
    const multiplier = { FIRST: 3, BUSINESS: 2, ECONOMY: 1 };
    const seatTotal = selectedSeats.reduce((sum, seat) => sum + base * (multiplier[seat.seatClass] || 1), 0);
    const addonTotal = addonsByPassenger.reduce((sum, pAddons) =>
      sum + Object.values(pAddons).reduce((s, a) => s + a.price, 0), 0
    );
    return seatTotal + addonTotal;
  }

  // FIRST class bhi include karo
  const firstSeats    = seats.filter(s => s.seatClass === 'FIRST');
  const businessSeats = seats.filter(s => s.seatClass === 'BUSINESS');
  const economySeats  = seats.filter(s => s.seatClass === 'ECONOMY');

  if (loading) return <div className="loading">Loading seat map...</div>;

  return (
  <div className="seat-page">

    {/* HERO */}
    <div className="seat-hero">

      <div className="hero-content">

        <div className="hero-badge">
          ✈ Premium Flight Experience
        </div>

        <h1>Choose Your Seats</h1>

        <p>
          Select seats, add passenger details, and complete
          your journey booking.
        </p>

      </div>

    </div>

    {/* CONTENT */}
    <div className="seat-container">

      {/* STEPS */}
      <div className="steps-wrapper">

        <div className={`step-item ${step >= 1 ? 'active' : ''}`}>
          <div className="step-circle">1</div>
          <span>Seat Selection</span>
        </div>

        <div className="step-line"></div>

        <div className={`step-item ${step >= 2 ? 'active' : ''}`}>
          <div className="step-circle">2</div>
          <span>Passenger Details</span>
        </div>

        <div className="step-line"></div>

        <div className="step-item">
          <div className="step-circle">3</div>
          <span>Payment</span>
        </div>

      </div>

      {error && (
        <div className="alert-error">
          {error}
        </div>
      )}

      {/* STEP 1 */}
      {step === 1 && (

        <div className="seat-layout">

          <div className="seat-map-card">

            <div className="seat-header">

              <div>
                <h2>Select Your Seats</h2>

                <p>
                  {selectedSeats.length} of {passengers}
                  {' '}selected
                </p>
              </div>

              {holdTimeLeft !== null && (
                <div className={`hold-countdown ${holdTimeLeft <= 120 ? 'urgent' : ''}`}>
                  <span>⏱</span>
                  <span>Seats held for <strong>{formatHoldTime(holdTimeLeft)}</strong></span>
                </div>
              )}

            </div>

            {/* LEGEND */}
            <div className="seat-legend">
              <div className="legend-item">
                <div className="seat-demo available"></div>
                <span>Available</span>
              </div>
              <div className="legend-item">
                <div className="seat-demo selected"></div>
                <span>Selected</span>
              </div>
              <div className="legend-item">
                <div className="seat-demo held"></div>
                <span>Held</span>
              </div>
              <div className="legend-item">
                <div className="seat-demo booked-demo"></div>
                <span>Unavailable</span>
              </div>
            </div>

            {/* FIRST */}
            {firstSeats.length > 0 && (
              <SeatClassSection
                label="👑 First Class"
                cls="first"
                seatList={firstSeats}
                selectedSeats={selectedSeats}
                aisleAfter={AISLE_AFTER.FIRST}
                price={CLASS_PRICES.FIRST}
                onSeatClick={handleSeatClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              />
            )}

            {/* BUSINESS */}
            {businessSeats.length > 0 && (
              <SeatClassSection
                label="✨ Business Class"
                cls="business"
                seatList={businessSeats}
                selectedSeats={selectedSeats}
                aisleAfter={AISLE_AFTER.BUSINESS}
                price={CLASS_PRICES.BUSINESS}
                onSeatClick={handleSeatClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              />
            )}

            {/* ECONOMY */}
            {economySeats.length > 0 && (
              <SeatClassSection
                label="Economy Class"
                cls="economy"
                seatList={economySeats}
                selectedSeats={selectedSeats}
                aisleAfter={AISLE_AFTER.ECONOMY}
                price={CLASS_PRICES.ECONOMY}
                onSeatClick={handleSeatClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              />
            )}

          </div>

          {/* SUMMARY */}
          <div className="summary-card">

            <h3>Booking Summary</h3>

            <div className="summary-section">

              <small>Passengers</small>

              <strong>{passengers}</strong>

            </div>

            <div className="summary-section">

              <small>Selected Seats</small>

              <div className="selected-seats">

                {selectedSeats.length === 0 ? (
                  <span className="empty-seat">
                    No seats selected
                  </span>
                ) : (
                  selectedSeats.map((s) => (
                    <span
                      key={s.id}
                      className="seat-badge"
                    >
                      {s.seatNumber}
                    </span>
                  ))
                )}

              </div>

            </div>

            <div className="summary-section">

              <small>Total Amount</small>

              <h2>
                ₹{calculateTotal().toLocaleString()}
              </h2>

            </div>

            <button
              className="continue-btn"
              onClick={
                handleProceedToPassengers
              }
              disabled={
                selectedSeats.length !== passengers
              }
            >
              Continue
            </button>

          </div>

        </div>

      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="step2-layout">

          <form onSubmit={handleSubmitPassengers} className="passenger-layout">

            {passengerForms.map((form, index) => (
              <div key={index} className="passenger-card">

                <div className="passenger-header">
                  <h3>Passenger {index + 1}</h3>
                  <span>Seat {selectedSeats[index]?.seatNumber || '--'} · {selectedSeats[index]?.seatClass || ''}</span>
                </div>

                <div className="passenger-grid">

                  <div className="form-group">
                    <label>Title</label>
                    <select value={form.title} onChange={(e) => updatePassengerForm(index, 'title', e.target.value)}>
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Ms">Ms</option>
                      <option value="Dr">Dr</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>First Name</label>
                    <input type="text" placeholder="John" value={form.firstName}
                      onChange={(e) => updatePassengerForm(index, 'firstName', e.target.value)} required />
                  </div>

                  <div className="form-group">
                    <label>Last Name</label>
                    <input type="text" placeholder="Doe" value={form.lastName}
                      onChange={(e) => updatePassengerForm(index, 'lastName', e.target.value)} required />
                  </div>

                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input type="date" value={form.dateOfBirth}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={(e) => updatePassengerForm(index, 'dateOfBirth', e.target.value)} required />
                  </div>

                  <div className="form-group">
                    <label>Gender</label>
                    <select value={form.gender} onChange={(e) => updatePassengerForm(index, 'gender', e.target.value)}>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Passenger Type</label>
                    <select value={form.passengerType} onChange={(e) => updatePassengerForm(index, 'passengerType', e.target.value)}>
                      <option value="ADULT">Adult</option>
                      <option value="CHILD">Child</option>
                      <option value="INFANT">Infant</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Nationality</label>
                    <input type="text" value={form.nationality}
                      onChange={(e) => updatePassengerForm(index, 'nationality', e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label>Passport Number</label>
                    <input type="text" placeholder="A1234567" value={form.passportNumber}
                      onChange={(e) => updatePassengerForm(index, 'passportNumber', e.target.value.toUpperCase())} />
                  </div>

                  {form.passportNumber && (
                    <div className="form-group">
                      <label>Passport Expiry</label>
                      <input type="date" value={form.passportExpiry}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => updatePassengerForm(index, 'passportExpiry', e.target.value)} />
                    </div>
                  )}

                </div>

                {/* ADDONS */}
                <div className="addons-section">
                  <h4 className="addons-title">Add-ons for Passenger {index + 1}</h4>
                  <div className="addons-grid">
                    {ADDONS.map(addon => {
                      const checked = !!addonsByPassenger[index]?.[addon.id];
                      return (
                        <div
                          key={addon.id}
                          className={`addon-card ${checked ? 'selected' : ''}`}
                          onClick={() => toggleAddon(index, addon)}
                        >
                          <div className="addon-top">
                            <span className="addon-icon">{addon.icon}</span>
                            <div className={`addon-check ${checked ? 'checked' : ''}`}>{checked ? '✓' : ''}</div>
                          </div>
                          <div className="addon-name">{addon.name}</div>
                          <div className="addon-desc">{addon.desc}</div>
                          <div className="addon-price">+₹{addon.price.toLocaleString()}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            ))}

            <div className="passenger-actions">
              <button type="button" className="back-btn" onClick={() => setStep(1)}>← Back</button>
              <button type="submit" className="payment-btn">Continue To Payment</button>
            </div>

          </form>

          {/* ORDER SUMMARY SIDEBAR */}
          <div className="order-summary-card">
            <h3>Order Summary</h3>

            <div className="os-section">
              <small>Flight</small>
              <div className="os-route">
                {searchParams.get('source') || 'Origin'}
                <span> → </span>
                {searchParams.get('destination') || 'Destination'}
              </div>
            </div>

            <div className="os-section">
              <small>Seats</small>
              <div className="os-seats">
                {selectedSeats.map(s => (
                  <div key={s.id} className="os-seat-row">
                    <span className="os-seat-num">{s.seatNumber}</span>
                    <span className="os-seat-class">{s.seatClass}</span>
                    <span className="os-seat-price">₹{(parseFloat(searchParams.get('price') || 4500) * ({ FIRST: 3, BUSINESS: 2, ECONOMY: 1 }[s.seatClass] || 1)).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {addonsByPassenger.some(p => Object.keys(p).length > 0) && (
              <div className="os-section">
                <small>Add-ons</small>
                {addonsByPassenger.map((pAddons, pi) =>
                  Object.values(pAddons).map(addon => (
                    <div key={`${pi}-${addon.id}`} className="os-seat-row">
                      <span className="os-seat-num">{addon.icon} {addon.name}</span>
                      <span className="os-seat-class">Pax {pi + 1}</span>
                      <span className="os-seat-price">₹{addon.price.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            <div className="os-divider"></div>

            <div className="os-total">
              <span>Total (excl. taxes)</span>
              <strong>₹{calculateTotal().toLocaleString()}</strong>
            </div>
            <div className="os-tax">
              <span>GST (18%)</span>
              <span>₹{Math.round(calculateTotal() * 0.18).toLocaleString()}</span>
            </div>
            <div className="os-grand">
              <span>Grand Total</span>
              <strong>₹{Math.round(calculateTotal() * 1.18).toLocaleString()}</strong>
            </div>
          </div>

        </div>
      )}

    </div>

    {/* TOOLTIP */}
    <SeatTooltip tooltip={tooltip} />

  </div>
);
}

// ── Addons ────────────────────────────────────────────────────────────────────
const ADDONS = [
  { id: 'meal_veg',   icon: '🥗', name: 'Veg Meal',       desc: 'Vegetarian in-flight meal',     price: 350  },
  { id: 'meal_nonveg',icon: '🍗', name: 'Non-Veg Meal',   desc: 'Non-vegetarian in-flight meal', price: 400  },
  { id: 'baggage_15', icon: '🧳', name: 'Extra 15kg',     desc: 'Additional checked baggage',    price: 800  },
  { id: 'baggage_30', icon: '🧳', name: 'Extra 30kg',     desc: 'Additional checked baggage',    price: 1400 },
  { id: 'insurance',  icon: '🛡️', name: 'Travel Insurance',desc: 'Trip cancellation cover',       price: 299  },
  { id: 'priority',   icon: '⚡', name: 'Priority Boarding',desc: 'Board before general queue',   price: 199  },
];

// ── Seat Class Section ────────────────────────────────────────────────────────
const COL_LETTERS = ['A','B','C','D','E','F'];

function SeatClassSection({ label, cls, seatList, selectedSeats, aisleAfter, price, onSeatClick, onMouseEnter, onMouseLeave }) {
  const availableCount = seatList.filter(s => s.status === 'AVAILABLE').length;

  const rows = {};
  seatList.forEach(s => {
    const row = s.seatNumber.replace(/[A-Z]/g, '');
    if (!rows[row]) rows[row] = [];
    rows[row].push(s);
  });
  Object.values(rows).forEach(r =>
    r.sort((a, b) => {
      const ca = a.seatNumber.replace(/[0-9]/g, '');
      const cb = b.seatNumber.replace(/[0-9]/g, '');
      return COL_LETTERS.indexOf(ca) - COL_LETTERS.indexOf(cb);
    })
  );
  const sortedRows = Object.keys(rows).sort((a, b) => parseInt(a) - parseInt(b));

  return (
    <div className="class-section">
      <div className="class-title-row">
        <span className={`class-title ${cls}`}>{label}</span>
        <span className="class-count">{availableCount} seat{availableCount !== 1 ? 's' : ''} available</span>
        <span className="class-price">from ₹{price.toLocaleString()}</span>
      </div>

      <div className="seat-col-header">
        <span className="row-num-spacer"></span>
        {['A','B'].map(c => <span key={c} className="col-letter">{c}</span>)}
        <span className="aisle-spacer"></span>
        {['C','D','E','F'].map(c => <span key={c} className="col-letter">{c}</span>)}
      </div>

      {sortedRows.map(rowNum => {
        const rowSeats = rows[rowNum];
        const left  = rowSeats.filter(s => COL_LETTERS.indexOf(s.seatNumber.replace(/[0-9]/g,'')) <= aisleAfter);
        const right = rowSeats.filter(s => COL_LETTERS.indexOf(s.seatNumber.replace(/[0-9]/g,'')) >  aisleAfter);
        return (
          <div key={rowNum} className="seat-row">
            <span className="row-num">{rowNum}</span>
            <div className="seat-group">
              {left.map(seat => (
                <SeatBox key={seat.id} seat={seat} selectedSeats={selectedSeats}
                  onClick={onSeatClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} />
              ))}
            </div>
            <div className="aisle"></div>
            <div className="seat-group">
              {right.map(seat => (
                <SeatBox key={seat.id} seat={seat} selectedSeats={selectedSeats}
                  onClick={onSeatClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SeatBox({ seat, selectedSeats, onClick, onMouseEnter, onMouseLeave }) {
  const isSelected = !!selectedSeats.find(s => s.id === seat.id);
  const cls = isSelected ? 'selected' : seat.status.toLowerCase();
  const isClickable = isSelected || seat.status === 'AVAILABLE';
  return (
    <div
      className={`seat-box ${cls}`}
      onClick={() => isClickable && onClick(seat)}
      onMouseEnter={e => onMouseEnter(e, seat)}
      onMouseLeave={onMouseLeave}
      style={!isClickable ? { cursor: 'not-allowed' } : {}}
    >
      {seat.seatNumber}
    </div>
  );
}

function SeatTooltip({ tooltip }) {
  if (!tooltip) return null;
  const { seat, x, y } = tooltip;
  const statusLabel = { AVAILABLE: 'Available', HELD: 'Held', BOOKED: 'Unavailable' };
  return (
    <div className="seat-tooltip" style={{ left: x, top: y }}>
      <strong>{seat.seatNumber}</strong>
      <span>{seat.seatClass}</span>
      <span>{statusLabel[seat.status] || seat.status}</span>
    </div>
  );
}