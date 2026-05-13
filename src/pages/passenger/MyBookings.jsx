import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { paymentApi, bookingApi } from '../../api/api';
import './MyBookings.css';

export default function MyBookings() {
  const { userEmail }  = useAuth();
  const [payments, setPayments]   = useState([]);
  const [bookings, setBookings]   = useState({});
  const [loading, setLoading]     = useState(true);
  const [cancelMsg, setCancelMsg] = useState('');

  useEffect(() => { fetchMyBookings(); }, []);

  async function fetchMyBookings() {
    try {
      const res = await paymentApi.getByUser(userEmail);
      setPayments(res.data);

      // Har booking ki flight details fetch karo
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

  function getStatusBadge(status) {
    const map = {
      PAID:     'badge badge-success',
      REFUNDED: 'badge badge-warning',
      PENDING:  'badge badge-blue',
      FAILED:   'badge badge-danger',
    };
    return map[status] || 'badge badge-blue';
  }

  if (loading) return <div className="loading">Loading your bookings...</div>;

  return (
  <div className="mybookings-page">

    {/* HERO */}
    <div className="bookings-hero">

      <div className="hero-overlay"></div>

      <div className="hero-content">

        <div className="hero-badge">
          ✈ Your Flight Dashboard
        </div>

        <h1>My Bookings</h1>

        <p>
          Track flights, manage bookings, and monitor refunds
          from one place.
        </p>

        <div className="hero-stats">

          <div className="hero-stat">
            <h2>{payments.length}</h2>
            <span>Total Bookings</span>
          </div>

          <div className="hero-stat">
            <h2>
              {
                payments.filter(
                  (p) => p.status === 'PAID'
                ).length
              }
            </h2>
            <span>Active Trips</span>
          </div>

          <div className="hero-stat">
            <h2>
              {
                payments.filter(
                  (p) => p.status === 'REFUNDED'
                ).length
              }
            </h2>
            <span>Refunded</span>
          </div>

        </div>

      </div>

    </div>

    {/* CONTENT */}
    <div className="bookings-container">

      {cancelMsg && (
        <div className="alert-success">
          {cancelMsg}
        </div>
      )}

      {payments.length === 0 ? (

        <div className="empty-state">

          <div className="empty-icon">
            ✈
          </div>

          <h2>No Bookings Yet</h2>

          <p>
            Your booked flights will appear here once
            you complete a reservation.
          </p>

        </div>

      ) : (

        <div className="bookings-grid">

          {payments.map((payment) => {
            const booking =
              bookings[payment.bookingId];

            return (

              <div
                key={payment.paymentId}
                className="booking-card"
              >

                {/* TOP */}
                <div className="booking-top">

                  <div className="booking-route">

                    <span>
                      {booking?.source || 'City'}
                    </span>

                    <div className="route-line">

                      <div className="line"></div>

                      <div className="plane-icon">
                        ✈
                      </div>

                      <div className="line"></div>

                    </div>

                    <span>
                      {booking?.destination || 'City'}
                    </span>

                  </div>

                  <div
                    className={getStatusBadge(
                      payment.status
                    )}
                  >
                    {payment.status}
                  </div>

                </div>

                {/* AIRLINE */}
                <div className="airline-block">

                  <div className="airline-logo">
                    ✈
                  </div>

                  <div>
                    <h3>
                      {booking?.airline ||
                        'SkyBooker Airways'}
                    </h3>

                    <span>
                      Booking ID #
                      {payment.bookingId}
                    </span>
                  </div>

                </div>

                {/* INFO GRID */}
                <div className="booking-info-grid">

                  <div className="info-card">
                    <small>Departure</small>

                    <strong>
                      {booking?.departureDate || '-'}
                    </strong>

                    <span>
                      {booking?.departureTime ||
                        '--:--'}
                    </span>
                  </div>

                  <div className="info-card">
                    <small>Amount Paid</small>

                    <strong>
                      ₹
                      {payment.amount?.toLocaleString()}
                    </strong>

                    <span>
                      {payment.paymentMode}
                    </span>
                  </div>

                  <div className="info-card">
                    <small>Booked On</small>

                    <strong>
                      {payment.paidAt
                        ? new Date(
                            payment.paidAt
                          ).toLocaleDateString(
                            'en-IN'
                          )
                        : '-'}
                    </strong>

                    <span>
                      Payment Success
                    </span>
                  </div>

                </div>

                {/* TRANSACTION */}
                <div className="transaction-box">

                  <small>Transaction ID</small>

                  <p>
                    {payment.transactionId}
                  </p>

                </div>

                {/* ACTIONS */}
                {payment.status === 'PAID' && (

                  <button
                    className="cancel-btn"
                    onClick={() =>
                      handleRefund(
                        payment.bookingId
                      )
                    }
                  >
                    Cancel & Refund
                  </button>

                )}

                {payment.status === 'REFUNDED' && (

                  <div className="refund-box">
                    ✓ Refund of ₹
                    {payment.refundAmount?.toLocaleString()}
                    {' '}initiated successfully
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