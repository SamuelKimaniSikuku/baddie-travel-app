// ═══════════════════════════════════════════════════════════════
// FLIGHTS SERVICE — live flight search via the `flight-search`
// Supabase Edge Function (which proxies the Amadeus API).
// ═══════════════════════════════════════════════════════════════

import { supabase, isDemo } from '../lib/supabase';

// Sample results used in demo mode (no Supabase / no Amadeus keys),
// so the search UI is fully usable without a backend.
function demoResults({ origin, destination, date }) {
  var from = (origin || 'CDG').toUpperCase();
  var to = (destination || 'DPS').toUpperCase();
  return [
    { id: 'd1', airline: 'Singapore Airlines', flight_number: 'SQ 726', from: from, to: to, fromCity: from, toCity: to,
      departTime: '08:25', arriveTime: '18:40', date: date, duration: '14h 15m', stops: 1, price: 742, currency: 'USD' },
    { id: 'd2', airline: 'Emirates', flight_number: 'EK 73', from: from, to: to, fromCity: from, toCity: to,
      departTime: '14:10', arriveTime: '23:05', date: date, duration: '13h 55m', stops: 1, price: 815, currency: 'USD' },
    { id: 'd3', airline: 'Qatar Airways', flight_number: 'QR 40', from: from, to: to, fromCity: from, toCity: to,
      departTime: '21:30', arriveTime: '19:50', date: date, duration: '16h 20m', stops: 1, price: 698, currency: 'USD' },
  ];
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
