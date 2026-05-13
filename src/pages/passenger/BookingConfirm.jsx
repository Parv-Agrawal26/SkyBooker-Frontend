import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { paymentApi } from '../../api/api';
import './BookingConfirm.css';

export default function BookingConfirm() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    fetchPayment();
  }, []);

  async function fetchPayment() {
    try {
      const res = await paymentApi.getByBooking(bookingId);
      setPayment(res.data);
    } catch (err) {
      // payment details load nahi hue toh bhi confirm page dikhao
    }
  }

  return (
    <div className="confirm-page">
      <div className="confirm-card">

        {/* Success Icon */}
        <div className="success-icon">✓</div>

        <h1>Booking Confirmed!</h1>
        <p className="confirm-subtitle">
          Your flight has been booked successfully. Have a great journey!
        </p>

        {/* Booking Details */}
        <div className="confirm-details">
          <div className="detail-row">
            <span>Booking ID</span>
            <span className="detail-value">#{bookingId}</span>
          </div>

          {payment && (
            <>
              <div className="detail-row">
                <span>Amount Paid</span>
                <span className="detail-value">₹{payment.amount?.toLocaleString()}</span>
              </div>
              <div className="detail-row">
                <span>Payment Mode</span>
                <span className="detail-value">{payment.paymentMode}</span>
              </div>
              <div className="detail-row">
                <span>Transaction ID</span>
                <span className="detail-value txn">{payment.transactionId}</span>
              </div>
              <div className="detail-row">
                <span>Status</span>
                <span className="badge badge-success">{payment.status}</span>
              </div>
            </>
          )}
        </div>

        <div className="confirm-note">
          📧 Your e-ticket has been sent to your registered email address
        </div>

        {/* Actions */}
        <div className="confirm-actions">
          <button className="btn-primary" onClick={() => navigate('/my-bookings')}>
            View My Bookings
          </button>
          <button className="btn-outline" onClick={() => navigate('/')}>
            Book Another Flight
          </button>
        </div>

      </div>
    </div>
  );
}
