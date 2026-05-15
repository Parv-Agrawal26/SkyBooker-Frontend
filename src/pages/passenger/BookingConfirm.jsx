import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { paymentApi, bookingApi, passengerApi } from '../../api/api';
import './BookingConfirm.css';

export default function BookingConfirm() {
  const { bookingId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [payment, setPayment]     = useState(null);
  const [booking, setBooking]     = useState(null);
  const [passengers, setPassengers] = useState([]);

  // Round trip return flight params (passed through from SearchResults → SeatSelection → PaymentPage → here)
  const returnFlightId   = searchParams.get('returnFlightId');
  const returnPrice      = searchParams.get('returnPrice');
  const returnSource     = searchParams.get('returnSource');
  const returnDest       = searchParams.get('returnDestination');
  const returnDate       = searchParams.get('returnDate');
  const passengers_count = searchParams.get('passengers') || 1;
  const isRoundTrip      = !!returnFlightId;

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      const [pRes, bRes] = await Promise.all([
        paymentApi.getByBooking(bookingId),
        bookingApi.getByBookingId(bookingId),
      ]);
      setPayment(pRes.data);
      setBooking(bRes.data);
      const paxRes = await passengerApi.getByBooking(bookingId);
      setPassengers(paxRes.data);
    } catch (err) { /* ignore */ }
  }

  return (
    <div className="confirm-page">
      <div className="confirm-card">

        <div className="success-icon">✓</div>
        <h1>Booking Confirmed!</h1>
        <p className="confirm-subtitle">
          Your flight has been booked successfully. Have a great journey!
        </p>

        {/* FLIGHT ITINERARY */}
        {booking && (
          <div className="itinerary-block">
            <div className="itinerary-airline">
              <span className="airline-icon">✈</span>
              <strong>{booking.airline || 'SkyBooker Airways'}</strong>
            </div>
            <div className="itinerary-route">
              <div className="itin-city">
                <h2>{booking.source}</h2>
                <span>{booking.departureDate}</span>
                <strong>{booking.departureTime || '--:--'}</strong>
              </div>
              <div className="itin-line">
                <div className="itin-dot"></div>
                <div className="itin-dash"></div>
                <span>✈</span>
                <div className="itin-dash"></div>
                <div className="itin-dot"></div>
              </div>
              <div className="itin-city right">
                <h2>{booking.destination}</h2>
                <span>{booking.arrivalDate || booking.departureDate}</span>
                <strong>{booking.arrivalTime || '--:--'}</strong>
              </div>
            </div>
          </div>
        )}

        {/* BOOKING DETAILS */}
        <div className="confirm-details">
          <div className="detail-row">
            <span>Booking ID</span>
            <span className="detail-value">#{bookingId}</span>
          </div>
          {booking?.flightNumber && (
            <div className="detail-row">
              <span>Flight</span>
              <span className="detail-value">{booking.flightNumber}</span>
            </div>
          )}
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

        {/* PASSENGERS */}
        {passengers.length > 0 && (
          <div className="passengers-block">
            <h4>Passengers</h4>
            {passengers.map((p, i) => (
              <div key={p.passengerId} className="pax-row">
                <span className="pax-num">{i + 1}</span>
                <div className="pax-info">
                  <strong>{p.title} {p.firstName} {p.lastName}</strong>
                  <span>{p.ticketNumber || 'Ticket pending'}</span>
                  {p.addons && (() => {
                    try {
                      const list = JSON.parse(p.addons);
                      return list.length > 0 ? (
                        <span style={{ color: '#16a34a', fontSize: '12px' }}>
                          {list.map(a => `${a.icon} ${a.name}`).join(' · ')}
                        </span>
                      ) : null;
                    } catch { return null; }
                  })()}
                </div>
                {p.seatNumber && <span className="pax-seat">{p.seatNumber}</span>}
              </div>
            ))}
          </div>
        )}

        <div className="confirm-note">
          📧 Your e-ticket has been sent to your registered email address
        </div>

        {/* ROUND TRIP PROMPT */}
        {isRoundTrip && (
          <div className="rt-prompt">
            <div className="rt-prompt-icon">⇄</div>
            <div>
              <strong>Round Trip — Book Your Return Flight</strong>
              <p>{returnSource} → {returnDest} &nbsp;&bull;&nbsp; {returnDate}</p>
            </div>
            <button
              className="btn-primary rt-prompt-btn"
              onClick={() =>
                navigate(`/seats/${returnFlightId}?passengers=${passengers_count}&price=${returnPrice}&source=${encodeURIComponent(returnSource)}&destination=${encodeURIComponent(returnDest)}`)
              }
            >
              Book Return Flight →
            </button>
          </div>
        )}

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