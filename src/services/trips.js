// ═══════════════════════════════════════════════════════════════
// TRIPS SERVICE — Trip management, itineraries, collaboration
// ═══════════════════════════════════════════════════════════════

import { supabase, isDemo } from '../lib/supabase';

class TripsService {
  // Create a new trip
  async createTrip(createdBy, { destination, emoji, startDate, endDate, dateDisplay, conversationId, memberIds = [] }) {
    if (isDemo) {
      return { data: { id: 'demo-trip', destination, destination_emoji: emoji, date_display: dateDisplay, status: 'planning' }, error: null };
    }

    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        destination,
        destination_emoji: emoji || '🌍',
        start_date: startDate,
        end_date: endDate,
        date_display: dateDisplay,
        conversation_id: conversationId,
        created_by: createdBy,
      })
      .select()
      .single();

    if (tripError) return { data: null, error: tripError };

    // Add members
    const members = [createdBy, ...memberIds].map((uid, i) => ({
      trip_id: trip.id,
      user_id: uid,
      role: i === 0 ? 'organizer' : 'member',
    }));

    await supabase.from('trip_members').insert(members);
    return { data: trip, error: null };
  }

  // Get trips for a user
  async getTrips(userId) {
    if (isDemo) return { data: [], error: null };

    const { data, error } = await supabase
      .from('trip_members')
      .select(`
        role,
        trips!inner(
          *,
          trip_members(
            user:profiles(id, name, avatar, avatar_url)
          )
        )
      `)
      .eq('user_id', userId)
      .order('trips(start_date)', { ascending: true });

    const trips = data?.map(tm => ({
      ...tm.trips,
      myRole: tm.role,
      members: tm.trips.trip_members?.map(m => m.user) || [],
    }));

    return { data: trips, error };
  }

  // Get a single trip with full details
  async getTrip(tripId) {
    if (isDemo) return { data: null, error: null };

    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        trip_members(
          role,
          user:profiles(id, name, avatar, avatar_url, verified)
        ),
        itinerary_days(
          *,
          itinerary_items(*, added_by_user:profiles!itinerary_items_added_by_fkey(name, avatar))
        )
      `)
      .eq('id', tripId)
      .single();

    return { data, error };
  }

  // Update trip status
  async updateTripStatus(tripId, status) {
    if (isDemo) return { error: null };

    const { error } = await supabase
      .from('trips')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', tripId);
    return { error };
  }

  // ── Checklist (flattened itinerary items) ──

  // Get all checklist items for a trip, flattened across itinerary days.
  async getChecklist(tripId) {
    if (isDemo) return { data: [], error: null };

    const { data, error } = await supabase
      .from('itinerary_days')
      .select('id, day_number, itinerary_items(*)')
      .eq('trip_id', tripId)
      .order('day_number', { ascending: true });

    if (error) return { data: [], error };

    const items = (data || [])
      .flatMap(d => (d.itinerary_items || []))
      .sort((a, b) => (a.sort_order - b.sort_order) || (new Date(a.created_at) - new Date(b.created_at)));

    return { data: items, error: null };
  }

  // Add a checklist item, auto-creating a default itinerary day if needed.
  async addChecklistItem(tripId, title, addedBy) {
    if (isDemo) return { data: null, error: null };

    let { data: day } = await supabase
      .from('itinerary_days')
      .select('id')
      .eq('trip_id', tripId)
      .order('day_number', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!day) {
      const { data: created, error: dayErr } = await supabase
        .from('itinerary_days')
        .insert({ trip_id: tripId, day_number: 1, title: 'Checklist' })
        .select('id')
        .single();
      if (dayErr) return { data: null, error: dayErr };
      day = created;
    }

    const { data, error } = await supabase
      .from('itinerary_items')
      .insert({ day_id: day.id, title, added_by: addedBy })
      .select()
      .single();
    return { data, error };
  }

  // ── Flights ──

  // Map a DB row (snake_case) to the camelCase shape the UI cards use.
  _flightFromRow(row) {
    return {
      id: row.id,
      airline: row.airline,
      flight_number: row.flight_number,
      from: row.from_code, to: row.to_code,
      fromCity: row.from_city, toCity: row.to_city,
      departTime: row.depart_time, arriveTime: row.arrive_time,
      date: row.depart_date, duration: row.duration, stops: row.stops,
      price: row.price, currency: row.currency,
      roundTrip: row.round_trip,
      returnFlightNumber: row.return_flight_number,
      returnDepartTime: row.return_depart_time,
      returnArriveTime: row.return_arrive_time,
      returnDate: row.return_date,
      returnDuration: row.return_duration,
      returnStops: row.return_stops,
    };
  }

  // Save a flight (a search result) to a trip.
  async addFlight(tripId, flight, addedBy) {
    if (isDemo) return { data: { ...flight, id: 'demo-flight-' + Date.now() }, error: null };

    const { data, error } = await supabase
      .from('trip_flights')
      .insert({
        trip_id: tripId,
        airline: flight.airline,
        flight_number: flight.flight_number,
        from_code: flight.from, to_code: flight.to,
        from_city: flight.fromCity, to_city: flight.toCity,
        depart_time: flight.departTime, arrive_time: flight.arriveTime,
        depart_date: flight.date, duration: flight.duration, stops: flight.stops,
        price: flight.price, currency: flight.currency || 'USD',
        round_trip: !!flight.roundTrip,
        return_flight_number: flight.returnFlightNumber || null,
        return_depart_time: flight.returnDepartTime || null,
        return_arrive_time: flight.returnArriveTime || null,
        return_date: flight.returnDate || null,
        return_duration: flight.returnDuration || null,
        return_stops: flight.returnStops == null ? null : flight.returnStops,
        added_by: addedBy,
      })
      .select()
      .single();
    if (error) return { data: null, error };
    return { data: this._flightFromRow(data), error: null };
  }

  // List flights saved to a trip (soonest departure first).
  async getFlights(tripId) {
    if (isDemo) return { data: [], error: null };
    const { data, error } = await supabase
      .from('trip_flights')
      .select('*')
      .eq('trip_id', tripId)
      .order('depart_date', { ascending: true });
    if (error) return { data: [], error };
    return { data: (data || []).map(this._flightFromRow), error: null };
  }

  // Remove a saved flight.
  async deleteFlight(flightId) {
    if (isDemo) return { error: null };
    const { error } = await supabase.from('trip_flights').delete().eq('id', flightId);
    return { error };
  }

  // ── Itinerary ──

  // Add a day to itinerary
  async addItineraryDay(tripId, dayNumber, title, date) {
    if (isDemo) return { data: { id: 'demo-day', day_number: dayNumber, title }, error: null };

    const { data, error } = await supabase
      .from('itinerary_days')
      .insert({ trip_id: tripId, day_number: dayNumber, title, date })
      .select()
      .single();
    return { data, error };
  }

  // Add an item to itinerary day
  async addItineraryItem(dayId, { title, description, time, location, latitude, longitude, sortOrder, addedBy }) {
    if (isDemo) return { data: { id: 'demo-item', title }, error: null };

    const { data, error } = await supabase
      .from('itinerary_items')
      .insert({
        day_id: dayId,
        title,
        description,
        time,
        location,
        latitude,
        longitude,
        sort_order: sortOrder || 0,
        added_by: addedBy,
      })
      .select()
      .single();
    return { data, error };
  }

  // Toggle itinerary item completion
  async toggleItemComplete(itemId, completed) {
    if (isDemo) return { error: null };

    const { error } = await supabase
      .from('itinerary_items')
      .update({ completed })
      .eq('id', itemId);
    return { error };
  }

  // Delete itinerary item
  async deleteItineraryItem(itemId) {
    if (isDemo) return { error: null };

    const { error } = await supabase
      .from('itinerary_items')
      .delete()
      .eq('id', itemId);
    return { error };
  }

  // Reorder itinerary items
  async reorderItems(items) {
    if (isDemo) return { error: null };

    const updates = items.map((item, i) =>
      supabase
        .from('itinerary_items')
        .update({ sort_order: i })
        .eq('id', item.id)
    );
    await Promise.all(updates);
    return { error: null };
  }
}

export const tripsService = new TripsService();
export default tripsService;
