import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { paymentApi, seatApi, bookingApi } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import './PaymentPage.css';

export default function PaymentPage() {
  const { bookingId }      = useParams();
  const [searchParams]     = useSearchParams();
  const navigate           = useNavigate();
  const { userEmail }      = useAuth();

  const amount  = parseFloat(searchParams.get('amount') || 4500);
  const flightId = searchParams.get('flightId');

  const [paymentMode, setPaymentMode] = useState('UPI');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [heldSeats, setHeldSeats]     = useState([]);

  const taxes = Math.round(amount * 0.18);
  const total  = amount + taxes;

  useEffect(() => {
    if (flightId) fetchHeldSeats();
  }, [flightId]);

  async function fetchHeldSeats() {
    try {
      const res = await seatApi.getAvailableSeats(flightId);
      const held = res.data.filter(s => s.status === 'HELD');
      setHeldSeats(held);
    } catch (e) { /* ignore */ }
  }

  async function handlePay() {
    setLoading(true);
    setError('');

    try {
      await paymentApi.pay({
        bookingId: parseInt(bookingId),
        userEmail,
        amount: total,
        paymentMode,
      });

      if (flightId && heldSeats.length > 0) {
        await Promise.all(
          heldSeats.map(seat =>
            seatApi.confirmSeat(flightId, seat.seatNumber).catch(() => {})
          )
        );
      }

      navigate(`/booking-confirm/${bookingId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const paymentModes = [
    { value: 'UPI',        label: 'UPI',              icon: '📱' },
    { value: 'CARD',       label: 'Credit/Debit Card', icon: '💳' },
    { value: 'NETBANKING', label: 'Net Banking',       icon: '🏦' },
    { value: 'WALLET',     label: 'Wallet',            icon: '👛' },
  ];

  return (
  <div className="payment-page">

    {/* HERO */}
    <div className="payment-hero">

      <div className="hero-content">

        <div className="hero-badge">
          🔒 Secure Payment Gateway
        </div>

        <h1>Complete Your Payment</h1>

        <p>
          Final step before your ticket gets confirmed.
          Fast, secure, and encrypted checkout.
        </p>

      </div>

    </div>

    {/* CONTENT */}
    <div className="payment-container">

      <div className="payment-layout">

        {/* LEFT */}
        <div className="payment-left">

          <div className="payment-card">

            <div className="payment-header">

              <h2>Payment Method</h2>

              <p>
                Choose your preferred payment option
              </p>

            </div>

            <div className="payment-modes">

              {paymentModes.map((mode) => (

                <div
                  key={mode.value}
                  className={`payment-mode ${
                    paymentMode === mode.value
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    setPaymentMode(mode.value)
                  }
                >

                  <div className="mode-left">

                    <div className="mode-icon">
                      {mode.icon}
                    </div>

                    <div>
                      <h4>{mode.label}</h4>

                      <span>
                        Secure payment processing
                      </span>
                    </div>

                  </div>

                  <div className="mode-check">
                    {paymentMode === mode.value
                      ? '✓'
                      : ''}
                  </div>

                </div>

              ))}

            </div>

            {error && (
              <div className="alert-error">
                {error}
              </div>
            )}

            <button
              className="pay-btn"
              onClick={handlePay}
              disabled={loading}
            >
              {loading
                ? 'Processing Payment...'
                : `Pay ₹${total.toLocaleString()}`}
            </button>

            <div className="secure-box">

              <span>🔒</span>

              <p>
                Your transaction is encrypted and
                protected by secure payment gateways.
              </p>

            </div>

          </div>

        </div>

        {/* RIGHT */}
        <div className="payment-right">

          {/* FARE */}
          <div className="summary-card">

            <div className="summary-header">

              <h3>Fare Summary</h3>

              <span>
                Booking #{bookingId}
              </span>

            </div>

            <div className="fare-list">

              <div className="fare-row">
                <span>Base Fare</span>

                <strong>
                  ₹{amount.toLocaleString()}
                </strong>
              </div>

              <div className="fare-row">
                <span>GST (18%)</span>

                <strong>
                  ₹{taxes.toLocaleString()}
                </strong>
              </div>

              <div className="fare-row">
                <span>Convenience Fee</span>

                <strong className="free">
                  FREE
                </strong>
              </div>

            </div>

            <div className="fare-divider"></div>

            <div className="fare-total">

              <span>Total Amount</span>

              <h2>
                ₹{total.toLocaleString()}
              </h2>

            </div>

          </div>

          {/* INFO */}
          <div className="info-card">

            <h4>Important Information</h4>

            <div className="info-list">

              <div className="info-item">
                <span>✈</span>
                <p>
                  Cancellation charges may apply
                </p>
              </div>

              <div className="info-item">
                <span>💳</span>
                <p>
                  Refunds processed within 5–7 days
                </p>
              </div>

              <div className="info-item">
                <span>📩</span>
                <p>
                  E-ticket will be sent to your email
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>

  </div>
);
}
