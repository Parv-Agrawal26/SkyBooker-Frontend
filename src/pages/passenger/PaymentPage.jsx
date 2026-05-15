import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { paymentApi, passengerApi, seatApi } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import './PaymentPage.css';

const HOLD_DURATION = 15 * 60; // 15 minutes in seconds

export default function PaymentPage() {
  const { bookingId }      = useParams();
  const [searchParams]     = useSearchParams();
  const navigate           = useNavigate();
  const { userEmail }      = useAuth();

  const amount   = parseFloat(searchParams.get('amount') || 0);
  const flightId = searchParams.get('flightId');
  const selectedSeatNumbers = (searchParams.get('seats') || '').split(',').filter(Boolean);

  // Round trip return params — forwarded through to BookingConfirm
  const returnFlightId  = searchParams.get('returnFlightId') || '';
  const returnPrice     = searchParams.get('returnPrice') || '';
  const returnSource    = searchParams.get('returnSource') || '';
  const returnDest      = searchParams.get('returnDestination') || '';
  const returnDate      = searchParams.get('returnDate') || '';
  const passengersCount = searchParams.get('passengers') || 1;

  const [paymentMode, setPaymentMode] = useState('UPI');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [paxCount, setPaxCount]       = useState(null);
  const [paxWarning, setPaxWarning]   = useState('');
  const [timeLeft, setTimeLeft]       = useState(HOLD_DURATION);
  const timerRef = useRef(null);

  const taxes = Math.round(amount * parseFloat(process.env.REACT_APP_GST_RATE || 0.18));
  const total  = amount + taxes;

  useEffect(() => {
    // Load Razorpay checkout script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    fetchPassengerCount();
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setError('Your seat hold has expired. Please restart your booking.');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      clearInterval(timerRef.current);
      document.body.removeChild(script);
    };
  }, []);

  async function fetchPassengerCount() {
    try {
      const res = await passengerApi.getCount(bookingId);
      setPaxCount(res.data);
      const seatList = (searchParams.get('seats') || '').split(',').filter(Boolean);
      if (res.data < seatList.length) {
        setPaxWarning(`Only ${res.data} of ${seatList.length} passenger(s) have been added. Please go back and complete all passenger details.`);
      }
    } catch (e) { /* ignore */ }
  }

  function formatTime(secs) {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  async function handlePay() {
    if (paxWarning) { alert(paxWarning); return; }
    if (timeLeft === 0) { setError('Your seat hold has expired. Please restart your booking.'); return; }
    setLoading(true);
    setError('');

    try {
      // Step 1: Create Razorpay order on backend
      const orderRes = await paymentApi.createOrder({
        bookingId: parseInt(bookingId),
        userEmail,
        amount: total,
      });
      const { razorpayOrderId, keyId } = orderRes.data;

      // Step 2: Open Razorpay checkout modal
      const options = {
        key: keyId,
        amount: total * 100, // paise
        currency: 'INR',
        name: 'SkyBooker',
        description: `Booking #${bookingId}`,
        order_id: razorpayOrderId,
        prefill: { email: userEmail },
        theme: { color: '#2563eb' },
        handler: async function (response) {
          try {
            // Step 3: Verify signature + save payment
            await paymentApi.verifyPayment({
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              bookingId: parseInt(bookingId),
              userEmail,
              amount: total,
              paymentMode: paymentMode,
            });

            // Step 4: Confirm only the seats this user selected
            if (flightId && selectedSeatNumbers.length > 0) {
              await Promise.all(
                selectedSeatNumbers.map(seatNumber =>
                  seatApi.confirmSeat(flightId, seatNumber).catch(() => {})
                )
              );
            }

            clearInterval(timerRef.current);
            navigate(`/booking-confirm/${bookingId}${returnFlightId ? `?returnFlightId=${returnFlightId}&returnPrice=${returnPrice}&returnSource=${encodeURIComponent(returnSource)}&returnDestination=${encodeURIComponent(returnDest)}&returnDate=${returnDate}&passengers=${passengersCount}` : ''}`);
          } catch (err) {
            setError(err.response?.data?.message || 'Payment verification failed.');
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setError('Payment cancelled. Your seats are still held.');
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        setError(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });
      rzp.open();

    } catch (err) {
      setError(err.response?.data?.message || 'Could not initiate payment. Please try again.');
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
              <p>Razorpay secure checkout — pay via UPI, Card, Net Banking or Wallet</p>
            </div>

            {/* SEAT HOLD COUNTDOWN */}
            <div className={`hold-timer ${timeLeft <= 120 ? 'urgent' : ''}`}>
              <span>⏱</span>
              <div>
                <strong>Seat hold expires in {formatTime(timeLeft)}</strong>
                <p>Complete payment before your seats are released</p>
              </div>
            </div>

            {/* PASSENGER COUNT WARNING */}
            {paxWarning && (
              <div className="pax-warning">
                ⚠ {paxWarning}
                <button onClick={() => navigate(-1)}>← Go Back</button>
              </div>
            )}

            <div className="razorpay-methods">
              {['UPI', 'Credit / Debit Card', 'Net Banking', 'Wallet'].map(m => (
                <div key={m} className="razorpay-method-badge">{m}</div>
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
