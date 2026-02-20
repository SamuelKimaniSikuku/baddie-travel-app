// ═══════════════════════════════════════════════════════════════
// MATCHING SERVICE — Swipes, matches, discovery
// ═══════════════════════════════════════════════════════════════

import { supabase, isDemo } from '../lib/supabase';

class MatchingService {
  // Record a swipe action
  async swipe(swiperId, swipedId, action = 'like') {
    if (isDemo) {
      // Simulate: always match in demo mode
      return {
        swipe: { swiper_id: swiperId, swiped_id: swipedId, action },
        isMatch: action === 'like' || action === 'super_like',
        error: null,
      };
    }

    // Insert swipe (the database trigger handles match detection)
    const { data, error } = await supabase
      .from('swipes')
      .insert({ swiper_id: swiperId, swiped_id: swipedId, action })
      .select()
      .single();

    if (error) return { swipe: null, isMatch: false, error };

    // Check if a match was created
    const { data: match } = await supabase
      .from('matches')
      .select('*')
      .or(`and(user1_id.eq.${swiperId},user2_id.eq.${swipedId}),and(user1_id.eq.${swipedId},user2_id.eq.${swiperId})`)
      .single();

    return { swipe: data, isMatch: !!match, match, error: null };
  }

  // Get all matches for a user
  async getMatches(userId) {
    if (isDemo) {
      return {
        data: [
          { id: 'm1', user1_id: 'demo-user-001', user2_id: 'd1', shared_destination: 'Bali', matched_at: new Date().toISOString(), is_active: true },
          { id: 'm2', user1_id: 'demo-user-001', user2_id: 'd2', shared_destination: 'Tokyo', matched_at: new Date().toISOString(), is_active: true },
        ],
        error: null,
      };
    }

    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        user1:profiles!matches_user1_id_fkey(id, name, avatar, avatar_url, verified, online, last_seen),
        user2:profiles!matches_user2_id_fkey(id, name, avatar, avatar_url, verified, online, last_seen)
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq('is_active', true)
      .order('matched_at', { ascending: false });

    return { data, error };
  }

  // Unmatch (deactivate match)
  async unmatch(matchId) {
    if (isDemo) return { error: null };

    const { error } = await supabase
      .from('matches')
      .update({ is_active: false })
      .eq('id', matchId);
    return { error };
  }

  // Subscribe to new matches in real-time
  subscribeToMatches(userId, callback) {
    if (isDemo) return { unsubscribe: () => {} };

    const channel = supabase
      .channel('matches-' + userId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `user1_id=eq.${userId}`,
        },
        (payload) => callback(payload.new)
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `user2_id=eq.${userId}`,
        },
        (payload) => callback(payload.new)
      )
      .subscribe();

    return { unsubscribe: () => supabase.removeChannel(channel) };
  }
}

export const matchingService = new MatchingService();
export default matchingService;
