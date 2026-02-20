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
