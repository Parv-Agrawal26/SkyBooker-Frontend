import React, { useState, useEffect, useCallback } from 'react';
import { airlineApi, paymentApi } from '../../api/api';
import './AdminDashboard.css';

// ── Country flag helper ───────────────────────────────────────────────────────
const COUNTRY_FLAGS = {
  'India': '🇮🇳', 'United States': '🇺🇸', 'United Kingdom': '🇬🇧',
  'UAE': '🇦🇪', 'Singapore': '🇸🇬', 'Australia': '🇦🇺',
  'Germany': '🇩🇪', 'France': '🇫🇷', 'Japan': '🇯🇵',
  'Canada': '🇨🇦', 'China': '🇨🇳', 'Thailand': '🇹🇭',
};
function flag(country) { return COUNTRY_FLAGS[country] || '🌐'; }

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
      ))}
    </div>
  );
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ text, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <p>{text}</p>
        <div className="modal-actions">
          <button className="modal-cancel" onClick={onCancel}>Cancel</button>
          <button className="modal-confirm" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

// ── Validators ────────────────────────────────────────────────────────────────
function validateAirline(f) {
  const e = {};
  if (!f.name.trim())     e.name     = 'Airline name is required';
  if (!f.iataCode.trim()) e.iataCode = 'IATA code is required';
  if (!f.country.trim())  e.country  = 'Country is required';
  if (f.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.contactEmail))
    e.contactEmail = 'Enter a valid email';
  return e;
}
function validateAirport(f) {
  const e = {};
  if (!f.name.trim())     e.name     = 'Airport name is required';
  if (!f.iataCode.trim()) e.iataCode = 'IATA code is required';
  if (!f.city.trim())     e.city     = 'City is required';
  if (!f.country.trim())  e.country  = 'Country is required';
  if (f.latitude  && isNaN(parseFloat(f.latitude)))  e.latitude  = 'Must be a number';
  if (f.longitude && isNaN(parseFloat(f.longitude))) e.longitude = 'Must be a number';
  return e;
}

const BLANK_AIRLINE = { name: '', iataCode: '', icaoCode: '', country: '', contactEmail: '', contactPhone: '' };
const BLANK_AIRPORT = { name: '', iataCode: '', icaoCode: '', city: '', country: '', latitude: '', longitude: '', timezone: 'Asia/Kolkata' };

export default function AdminDashboard() {
  const [tab, setTab]         = useState('airlines');
  const [airlines, setAirlines] = useState([]);
  const [airports, setAirports] = useState([]);
  const [loading, setLoading]   = useState(true);

  const [payments, setPayments]             = useState([]);
  const [paymentStatus, setPaymentStatus]   = useState('PAID');
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  // toasts
  const [toasts, setToasts] = useState([]);
  function addToast(msg, type = 'success') {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }

  // confirm modal
  const [confirm, setConfirm] = useState(null); // { text, onConfirm }

  // airline form
  const [airlineForm, setAirlineForm]   = useState(BLANK_AIRLINE);
  const [airlineErrors, setAirlineErrors] = useState({});

  // airport form
  const [airportForm, setAirportForm]   = useState(BLANK_AIRPORT);
  const [airportErrors, setAirportErrors] = useState({});

  // search / sort
  const [airlineSearch, setAirlineSearch] = useState('');
  const [airlineSort,   setAirlineSort]   = useState('name');
  const [airportSearch, setAirportSearch] = useState('');

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      const [ar, ap] = await Promise.all([airlineApi.getAll(), airlineApi.getAllAirports()]);
      setAirlines(ar.data);
      setAirports(ap.data);
    } catch { addToast('Could not load data', 'error'); }
    finally { setLoading(false); }
  }

  async function fetchPayments(status) {
    setPaymentsLoading(true);
    try {
      const res = await paymentApi.getByStatus(status);
      setPayments(res.data);
    } catch { addToast('Could not load payments', 'error'); }
    finally { setPaymentsLoading(false); }
  }

  async function handleAddAirline(e) {
    e.preventDefault();
    const errs = validateAirline(airlineForm);
    if (Object.keys(errs).length) { setAirlineErrors(errs); return; }
    setAirlineErrors({});
    try {
      await airlineApi.addAirline(airlineForm);
      addToast('Airline added successfully!');
      setAirlineForm(BLANK_AIRLINE);
      fetchAll();
    } catch (err) { addToast(err.response?.data?.message || 'Could not add airline', 'error'); }
  }

  async function handleAddAirport(e) {
    e.preventDefault();
    const errs = validateAirport(airportForm);
    if (Object.keys(errs).length) { setAirportErrors(errs); return; }
    setAirportErrors({});
    try {
      await airlineApi.addAirport({
        ...airportForm,
        latitude:  airportForm.latitude  ? parseFloat(airportForm.latitude)  : undefined,
        longitude: airportForm.longitude ? parseFloat(airportForm.longitude) : undefined,
      });
      addToast('Airport added successfully!');
      setAirportForm(BLANK_AIRPORT);
      fetchAll();
    } catch (err) { addToast(err.response?.data?.message || 'Could not add airport', 'error'); }
  }

  function handleToggleClick(airline) {
    setConfirm({
      text: `${airline.active ? 'Deactivate' : 'Activate'} "${airline.name}"?`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await airlineApi.toggleStatus(airline.id);
          addToast(`${airline.name} ${airline.active ? 'deactivated' : 'activated'}`);
          fetchAll();
        } catch { addToast('Could not update status', 'error'); }
      },
    });
  }

  // derived data
  const filteredAirlines = airlines
    .filter(a => {
      const q = airlineSearch.toLowerCase();
      return !q || a.name?.toLowerCase().includes(q) || a.country?.toLowerCase().includes(q) || a.iataCode?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (airlineSort === 'name')    return a.name?.localeCompare(b.name);
      if (airlineSort === 'country') return a.country?.localeCompare(b.country);
      if (airlineSort === 'status')  return (b.active ? 1 : 0) - (a.active ? 1 : 0);
      return 0;
    });

  const filteredAirports = airports.filter(a => {
    const q = airportSearch.toLowerCase();
    return !q || a.name?.toLowerCase().includes(q) || a.city?.toLowerCase().includes(q)
      || a.country?.toLowerCase().includes(q) || a.iataCode?.toLowerCase().includes(q);
  });

  const countriesCount  = new Set(airports.map(a => a.country).filter(Boolean)).size;
  const inactiveCount   = airlines.filter(a => !a.active).length;

  const FieldErr = ({ field, errors }) =>
    errors[field] ? <small className="field-err">{errors[field]}</small> : null;

  if (loading) return <div className="loading">Loading admin panel...</div>;

  return (
    <div className="admin-page">

      <Toast toasts={toasts} />
      {confirm && <ConfirmModal text={confirm.text} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}

      {/* HERO */}
      <div className="admin-hero">
        <div className="admin-hero-content">
          <div className="hero-badge">⚡ SkyBooker Control Center</div>
          <h1>Admin Dashboard</h1>
          <p>Manage airlines, airports, and platform operations from one powerful dashboard.</p>
        </div>
      </div>

      {/* CONTENT */}
      <div className="admin-container">

        {/* STATS */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">✈</div>
            <div><h2>{airlines.length}</h2><span>Total Airlines</span></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon active">⚡</div>
            <div><h2>{airlines.filter(a => a.active).length}</h2><span>Active Airlines</span></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon danger">🚫</div>
            <div><h2>{inactiveCount}</h2><span>Inactive Airlines</span></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon airport">🛫</div>
            <div><h2>{airports.length}</h2><span>Total Airports</span></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon country">🌍</div>
            <div><h2>{countriesCount}</h2><span>Countries Covered</span></div>
          </div>
        </div>

        {/* TABS */}
        <div className="admin-tabs">
          {['airlines','add-airline','airports','add-airport','payments'].map(t => (
            <button key={t} className={tab === t ? 'tab active' : 'tab'}
              onClick={() => { setTab(t); if (t === 'payments') fetchPayments(paymentStatus); }}
            >
              {t === 'airlines' ? 'Airlines' : t === 'add-airline' ? '+ Add Airline'
                : t === 'airports' ? 'Airports' : t === 'add-airport' ? '+ Add Airport'
                : '💳 Payments'}
            </button>
          ))}
        </div>

        {/* AIRLINES */}
        {tab === 'airlines' && (
          <div className="dashboard-card">
            <div className="card-header">
              <h2>Airlines Management</h2>
              <span>{filteredAirlines.length} of {airlines.length}</span>
            </div>

            <div className="table-controls">
              <input className="search-input" placeholder="Search by name, country or IATA..."
                value={airlineSearch} onChange={e => setAirlineSearch(e.target.value)} />
              <select className="sort-select" value={airlineSort} onChange={e => setAirlineSort(e.target.value)}>
                <option value="name">Sort: Name</option>
                <option value="country">Sort: Country</option>
                <option value="status">Sort: Status</option>
              </select>
            </div>

            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Airline</th><th>IATA</th><th>Country</th>
                    <th>Contact</th><th>Status</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAirlines.map(airline => (
                    <tr key={airline.id}>
                      <td>
                        <div className="table-airline">
                          <div className="table-logo">✈</div>
                          <strong>{airline.name}</strong>
                        </div>
                      </td>
                      <td><span className="iata-code">{airline.iataCode}</span></td>
                      <td>{flag(airline.country)} {airline.country}</td>
                      <td>{airline.contactEmail}</td>
                      <td>
                        <span className={`status-badge ${airline.active ? 'success' : 'danger'}`}>
                          {airline.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button
                          className={`toggle-btn ${airline.active ? 'deactivate' : 'activate'}`}
                          onClick={() => handleToggleClick(airline)}
                        >
                          {airline.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAirlines.length === 0 && <div className="empty-small">No airlines found</div>}
            </div>
          </div>
        )}

        {/* ADD AIRLINE */}
        {tab === 'add-airline' && (
          <div className="dashboard-card">
            <div className="card-header"><h2>Add New Airline</h2></div>
            <form onSubmit={handleAddAirline} className="admin-form">
              <div className="form-grid">
                {[
                  { key: 'name',         label: 'Airline Name',   placeholder: 'IndiGo',              type: 'text'  },
                  { key: 'iataCode',     label: 'IATA Code',      placeholder: '6E',                  type: 'text', max: 3 },
                  { key: 'icaoCode',     label: 'ICAO Code',      placeholder: 'IGO',                 type: 'text'  },
                  { key: 'country',      label: 'Country',        placeholder: 'India',               type: 'text'  },
                  { key: 'contactEmail', label: 'Contact Email',  placeholder: 'support@airline.com', type: 'email' },
                  { key: 'contactPhone', label: 'Contact Phone',  placeholder: '1800-xxx-xxxx',       type: 'text'  },
                ].map(({ key, label, placeholder, type, max }) => (
                  <div className="form-group" key={key}>
                    <label>{label}</label>
                    <input type={type} placeholder={placeholder} maxLength={max}
                      value={airlineForm[key]}
                      className={airlineErrors[key] ? 'input-error' : ''}
                      onChange={e => {
                        setAirlineForm(p => ({ ...p, [key]: e.target.value }));
                        if (airlineErrors[key]) setAirlineErrors(p => { const n={...p}; delete n[key]; return n; });
                      }} />
                    <FieldErr field={key} errors={airlineErrors} />
                  </div>
                ))}
              </div>
              <div className="form-actions">
                <button type="button" className="clear-btn" onClick={() => { setAirlineForm(BLANK_AIRLINE); setAirlineErrors({}); }}>Clear</button>
                <button type="submit" className="submit-btn">Add Airline</button>
              </div>
            </form>
          </div>
        )}

        {/* AIRPORTS */}
        {tab === 'airports' && (
          <div className="dashboard-card">
            <div className="card-header">
              <h2>Airport Management</h2>
              <span>{filteredAirports.length} of {airports.length}</span>
            </div>

            <div className="table-controls">
              <input className="search-input" placeholder="Search by name, city, country or IATA..."
                value={airportSearch} onChange={e => setAirportSearch(e.target.value)} />
            </div>

            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Airport</th><th>IATA</th><th>City</th>
                    <th>Country</th><th>Coordinates</th><th>Timezone</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAirports.map(airport => (
                    <tr key={airport.id}>
                      <td><strong>{airport.name}</strong></td>
                      <td><span className="iata-code">{airport.iataCode}</span></td>
                      <td>{airport.city}</td>
                      <td>{flag(airport.country)} {airport.country}</td>
                      <td>
                        {airport.latitude && airport.longitude
                          ? <span className="coords">{parseFloat(airport.latitude).toFixed(4)}, {parseFloat(airport.longitude).toFixed(4)}</span>
                          : <span className="coords-na">—</span>}
                      </td>
                      <td>{airport.timezone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAirports.length === 0 && <div className="empty-small">No airports found</div>}
            </div>
          </div>
        )}

        {/* ADD AIRPORT */}
        {tab === 'add-airport' && (
          <div className="dashboard-card">
            <div className="card-header"><h2>Add New Airport</h2></div>
            <form onSubmit={handleAddAirport} className="admin-form">
              <div className="form-grid">
                {[
                  { key: 'name',      label: 'Airport Name', placeholder: 'Indira Gandhi International Airport', type: 'text'   },
                  { key: 'iataCode',  label: 'IATA Code',    placeholder: 'DEL',          type: 'text',   max: 3 },
                  { key: 'icaoCode',  label: 'ICAO Code',    placeholder: 'VIDP',         type: 'text'          },
                  { key: 'city',      label: 'City',         placeholder: 'Delhi',        type: 'text'          },
                  { key: 'country',   label: 'Country',      placeholder: 'India',        type: 'text'          },
                  { key: 'latitude',  label: 'Latitude',     placeholder: '28.5562',      type: 'number'        },
                  { key: 'longitude', label: 'Longitude',    placeholder: '77.1000',      type: 'number'        },
                  { key: 'timezone',  label: 'Timezone',     placeholder: 'Asia/Kolkata', type: 'text'          },
                ].map(({ key, label, placeholder, type, max }) => (
                  <div className="form-group" key={key}>
                    <label>{label}</label>
                    <input type={type} placeholder={placeholder} maxLength={max}
                      step={type === 'number' ? '0.0001' : undefined}
                      value={airportForm[key]}
                      className={airportErrors[key] ? 'input-error' : ''}
                      onChange={e => {
                        setAirportForm(p => ({ ...p, [key]: e.target.value }));
                        if (airportErrors[key]) setAirportErrors(p => { const n={...p}; delete n[key]; return n; });
                      }} />
                    <FieldErr field={key} errors={airportErrors} />
                  </div>
                ))}
              </div>
              <div className="form-actions">
                <button type="button" className="clear-btn" onClick={() => { setAirportForm(BLANK_AIRPORT); setAirportErrors({}); }}>Clear</button>
                <button type="submit" className="submit-btn">Add Airport</button>
              </div>
            </form>
          </div>
        )}

        {/* PAYMENTS */}
        {tab === 'payments' && (
          <div className="dashboard-card">
            <div className="card-header">
              <h2>Payment Dashboard</h2>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <select
                  className="sort-select"
                  value={paymentStatus}
                  onChange={e => { setPaymentStatus(e.target.value); fetchPayments(e.target.value); }}
                >
                  <option value="PAID">Paid</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
                <span>{payments.length} records</span>
              </div>
            </div>
            {paymentsLoading ? (
              <div className="empty-small">Loading payments...</div>
            ) : payments.length === 0 ? (
              <div className="empty-small">No {paymentStatus.toLowerCase()} payments found.</div>
            ) : (
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Payment ID</th><th>Booking ID</th><th>User</th>
                      <th>Amount</th><th>Mode</th><th>Status</th><th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.paymentId}>
                        <td><span className="iata-code">#{p.paymentId}</span></td>
                        <td>#{p.bookingId}</td>
                        <td>{p.userEmail}</td>
                        <td><strong style={{ color: '#93c5fd' }}>₹{p.amount?.toLocaleString()}</strong></td>
                        <td>{p.paymentMode}</td>
                        <td>
                          <span className={`status-badge ${
                            p.status === 'PAID' ? 'success'
                            : p.status === 'REFUNDED' ? 'warning'
                            : p.status === 'FAILED' ? 'danger' : 'info'
                          }`}>{p.status}</span>
                        </td>
                        <td>{p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
