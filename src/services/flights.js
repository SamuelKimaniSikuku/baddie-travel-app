// ═══════════════════════════════════════════════════════════════
// FLIGHTS SERVICE — live flight search via the `flight-search`
// Supabase Edge Function (which proxies the Amadeus API).
// ═══════════════════════════════════════════════════════════════

import { supabase, isDemo } from '../lib/supabase';

// Sample results used in demo mode (no Supabase / no Amadeus keys),
// so the search UI is fully usable without a backend.
function demoResults({ origin, destination, date, returnDate, adults }) {
  var from = (origin || 'CDG').toUpperCase();
  var to = (destination || 'DPS').toUpperCase();
  var rt = !!returnDate;
  var pax = Math.max(1, parseInt(adults, 10) || 1);
  var base = [
    { id: 'd1', airline: 'Singapore Airlines', flight_number: 'SQ 726', departTime: '08:25', arriveTime: '18:40', duration: '14h 15m', stops: 1, price: 742,
      returnFlightNumber: 'SQ 725', returnDepartTime: '19:20', returnArriveTime: '06:15', returnDuration: '13h 55m', returnStops: 1 },
    { id: 'd2', airline: 'Emirates', flight_number: 'EK 73', departTime: '14:10', arriveTime: '23:05', duration: '13h 55m', stops: 1, price: 815,
      returnFlightNumber: 'EK 72', returnDepartTime: '02:40', returnArriveTime: '13:10', returnDuration: '14h 10m', returnStops: 1 },
    { id: 'd3', airline: 'Qatar Airways', flight_number: 'QR 40', departTime: '21:30', arriveTime: '19:50', duration: '16h 20m', stops: 1, price: 698,
      returnFlightNumber: 'QR 41', returnDepartTime: '08:05', returnArriveTime: '18:30', returnDuration: '15h 25m', returnStops: 1 },
  ];
  return base.map(function(f){
    return {
      id: f.id, airline: f.airline, flight_number: f.flight_number, from: from, to: to, fromCity: from, toCity: to,
      departTime: f.departTime, arriveTime: f.arriveTime, date: date, duration: f.duration, stops: f.stops,
      price: (rt ? Math.round(f.price * 1.85) : f.price) * pax, currency: 'USD',
      roundTrip: rt,
      returnFlightNumber: rt ? f.returnFlightNumber : null,
      returnDepartTime: rt ? f.returnDepartTime : null,
      returnArriveTime: rt ? f.returnArriveTime : null,
      returnDate: rt ? returnDate : null,
      returnDuration: rt ? f.returnDuration : null,
      returnStops: rt ? f.returnStops : null,
    };
  });
}

class FlightsService {
  // Search flights for a one-way route on a given date.
  // params: { origin, destination, date (YYYY-MM-DD), adults?, currency? }
  async search(params) {
    if (isDemo) {
      return { data: demoResults(params), error: null };
    }

    var { data, error } = await supabase.functions.invoke('flight-search', {
      body: {
        origin: params.origin,
        destination: params.destination,
        date: params.date,
        returnDate: params.returnDate || '',
        adults: params.adults || 1,
        currency: params.currency || 'USD',
      },
    });

    if (error) {
      // Edge Function returns a non-2xx -> supabase-js sets `error`.
      // Try to surface the function's JSON message if present.
      var message = error.message || 'Flight search failed';
      try {
        var ctx = error.context && (await error.context.json());
        if (ctx && ctx.message) message = ctx.message;
      } catch (e) { /* ignore */ }
      return { data: [], error: { message: message } };
    }

    return { data: (data && data.results) || [], error: null };
  }
}

export const flightsService = new FlightsService();
export default flightsService;
