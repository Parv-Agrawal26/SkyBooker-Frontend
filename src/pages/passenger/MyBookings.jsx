import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { paymentApi, bookingApi } from '../../api/api';
import { useNavigate } from 'react-router-dom';
import './MyBookings.css';

export default function MyBookings() {
  const { userEmail }  = useAuth();
  const navigate       = useNavigate();
  const [payments, setPayments]   = useState([]);
  const [bookings, setBookings]   = useState({});
  const [loading, setLoading]     = useState(true);
  const [cancelMsg, setCancelMsg] = useState('');
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('newest');
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => { fetchMyBookings(); }, []);

  async function fetchMyBookings() {
    try {
      const res = await paymentApi.getByUser(userEmail);
      setPayments(res.data);
      const bookingDetails = {};
      await Promise.all(res.data.map(async (payment) => {
        try {
          const b = await bookingApi.getByBookingId(payment.bookingId);
          bookingDetails[payment.bookingId] = b.data;
        } catch (e) { /* ignore */ }
      }));
      setBookings(bookingDetails);
    } catch (err) {
      // empty state
    } finally {
      setLoading(false);
    }
  }

  async function handleRefund(bookingId) {
    if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) return;
    try {
      await paymentApi.refund(bookingId);
      setCancelMsg('Booking cancelled. Refund will be processed in 5–7 working days.');
      fetchMyBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not cancel booking. Please try again.');
    }
  }

  function handleRebook(bookingId) {
    const booking = bookings[bookingId];
    if (!booking) return;
    navigate(`/search?source=${booking.source}&destination=${booking.destination}&date=&passengers=1`);
  }

  function handlePrint(payment, booking) {
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Ticket #${payment.bookingId}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
        h2 { margin-bottom: 4px; }
        .row { display: flex; justify-content: space-between; margin: 12px 0; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .label { color: #666; font-size: 13px; }
        .value { font-weight: bold; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .badge { padding: 4px 12px; border-radius: 999px; background: #d1fae5; color: #065f46; font-size: 13px; }
      </style></head><body>
      <div class="header"><h2>✈ SkyBooker — E-Ticket</h2><span class="badge">${payment.status}</span></div>
      <div class="row"><span class="label">Booking ID</span><span class="value">#${payment.bookingId}</span></div>
      <div class="row"><span class="label">Route</span><span class="value">${booking?.source || '-'} → ${booking?.destination || '-'}</span></div>
      <div class="row"><span class="label">Airline</span><span class="value">${booking?.airline || 'SkyBooker Airways'}</span></div>
      <div class="row"><span class="label">Seat</span><span class="value">${booking?.seatNumber || '-'}</span></div>
      <div class="row"><span class="label">Departure</span><span class="value">${booking?.departureDate || '-'} ${booking?.departureTime || ''}</span></div>
      <div class="row"><span class="label">Amount Paid</span><span class="value">₹${payment.amount?.toLocaleString()}</span></div>
      <div class="row"><span class="label">Payment Mode</span><span class="value">${payment.paymentMode}</span></div>
      <div class="row"><span class="label">Transaction ID</span><span class="value">${payment.transactionId}</span></div>
      <div class="row"><span class="label">Booked On</span><span class="value">${payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('en-IN') : '-'}</span></div>
      </body></html>
    `);
    win.document.close();
    win.print();
  }

  function getStatusBadge(status) {
    const map = {
      PAID:     'badge badge-success',
      REFUNDED: 'badge badge-warning',
      PENDING:  'badge badge-blue',
      FAILED:   'badge badge-danger',
    };
    return map[status] || 'badge badge-blue';
  }

  function isUpcoming(payment) {
    const booking = bookings[payment.bookingId];
    if (!booking?.departureDate) return true;
    return new Date(booking.departureDate) >= new Date(new Date().toDateString());
  }

  const totalSpent = payments
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const filtered = payments
    .filter(p => activeTab === 'upcoming' ? isUpcoming(p) : !isUpcoming(p))
    .filter(p => statusFilter === 'ALL' || p.status === statusFilter)
    .filter(p => {
      if (!search.trim()) return true;
      const b = bookings[p.bookingId];
      const q = search.toLowerCase();
      return (
        String(p.bookingId).includes(q) ||
        b?.source?.toLowerCase().includes(q) ||
        b?.destination?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const da = new Date(a.paidAt || 0);
      const db = new Date(b.paidAt || 0);
      return sortOrder === 'newest' ? db - da : da - db;
    });

  if (loading) return <div className="loading">Loading your bookings...</div>;

  return (
  <div className="mybookings-page">

    {/* HERO */}
    <div className="bookings-hero">
      <div className="hero-content">
        <div className="hero-badge">✈ Your Flight Dashboard</div>
        <h1>My Bookings</h1>
        <p>Track flights, manage bookings, and monitor refunds from one place.</p>
        <div className="hero-stats">
          <div className="hero-stat">
            <h2>{payments.length}</h2>
            <span>Total Bookings</span>
          </div>
          <div className="hero-stat">
            <h2>{payments.filter(p => p.status === 'PAID').length}</h2>
            <span>Active Trips</span>
          </div>
          <div className="hero-stat">
            <h2>{payments.filter(p => p.status === 'REFUNDED').length}</h2>
            <span>Refunded</span>
          </div>
          <div className="hero-stat">
            <h2>₹{totalSpent.toLocaleString()}</h2>
            <span>Total Spent</span>
          </div>
        </div>
      </div>
    </div>

    {/* CONTENT */}
    <div className="bookings-container">

      {cancelMsg && <div className="alert-success">{cancelMsg}</div>}

      {/* TABS */}
      <div className="bookings-tabs">
        <button className={activeTab === 'upcoming' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('upcoming')}>Upcoming</button>
        <button className={activeTab === 'past'     ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('past')}>Past</button>
      </div>

      {/* CONTROLS */}
      <div className="bookings-controls">
        <input
          className="search-input"
          placeholder="Search by booking ID or city..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="ALL">All</option>
          <option value="PAID">Paid</option>
          <option value="REFUNDED">Refunded</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>
        <select className="filter-select" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✈</div>
          <h2>{payments.length === 0 ? 'No Bookings Yet' : 'No Results Found'}</h2>
          <p>
            {payments.length === 0
              ? 'Your booked flights will appear here once you complete a reservation.'
              : 'Try adjusting your search or filters.'}
          </p>
          {payments.length === 0 && (
            <button className="search-flights-btn" onClick={() => navigate('/')}>Search Flights</button>
          )}
        </div>
      ) : (
        <div className="bookings-grid">
          {filtered.map((payment) => {
            const booking = bookings[payment.bookingId];
            return (
              <div key={payment.paymentId} className="booking-card">

                {/* TOP */}
                <div className="booking-top">
                  <div className="booking-route">
                    <span>{booking?.source || 'City'}</span>
                    <div className="route-line">
                      <div className="line"></div>
                      <div className="plane-icon">✈</div>
                      <div className="line"></div>
                    </div>
                    <span>{booking?.destination || 'City'}</span>
                  </div>
                  <div className={getStatusBadge(payment.status)}>{payment.status}</div>
                </div>

                {/* AIRLINE */}
                <div className="airline-block">
                  <div className="airline-logo">✈</div>
                  <div>
                    <h3>{booking?.airline || 'SkyBooker Airways'}</h3>
                    <span>Booking ID #{payment.bookingId}</span>
                  </div>
                </div>

                {/* INFO GRID */}
                <div className="booking-info-grid">
                  <div className="info-card">
                    <small>Departure</small>
                    <strong>{booking?.departureDate || '-'}</strong>
                    <span>{booking?.departureTime || '--:--'}</span>
                  </div>
                  <div className="info-card">
                    <small>Amount Paid</small>
                    <strong>₹{payment.amount?.toLocaleString()}</strong>
                    <span>{payment.paymentMode}</span>
                  </div>
                  <div className="info-card">
                    <small>Booked On</small>
                    <strong>{payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('en-IN') : '-'}</strong>
                    <span>Payment Success</span>
                  </div>
                  {booking?.seatNumber && (
                    <div className="info-card">
                      <small>Seat</small>
                      <strong>{booking.seatNumber}</strong>
                      <span>Assigned Seat</span>
                    </div>
                  )}
                </div>

                {/* TRANSACTION */}
                <div className="transaction-box">
                  <small>Transaction ID</small>
                  <p>{payment.transactionId}</p>
                </div>

                {/* ACTIONS */}
                <div className="card-actions">
                  <button className="print-btn" onClick={() => handlePrint(payment, booking)}>🖨 Download Ticket</button>
                  {payment.status === 'PAID' && (
                    <button className="cancel-btn" onClick={() => handleRefund(payment.bookingId)}>Cancel & Refund</button>
                  )}
                  {payment.status === 'REFUNDED' && (
                    <button className="rebook-btn" onClick={() => handleRebook(payment.bookingId)}>↩ Rebook This Route</button>
                  )}
                </div>

                {payment.status === 'REFUNDED' && (
                  <div className="refund-box">
                    ✓ Refund of ₹{payment.refundAmount?.toLocaleString()} initiated successfully
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>
  </div>
);
}