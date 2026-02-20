// ═══════════════════════════════════════════════════════════════
// PROFILES SERVICE — User profiles, discovery, compatibility
// ═══════════════════════════════════════════════════════════════

import { supabase, isDemo, getStorageUrl } from '../lib/supabase';

// Demo data for offline mode
const DEMO_PROFILES = [
  { id:'d1', name:"Sofia", age:26, avatar:"🧕", verified:true, city:"Barcelona", destination:"Bali", destination_emoji:"🌴", date_display:"Mar 15 – Apr 2", bio:"Yoga retreats, sunrise hikes, and street food adventures.", vibe:"Adventurous", budget:"Mid-range", interests:["Yoga","Hiking","Food","Photography"], languages:["English","Spanish"], trip_count:7, rating:4.8, online:true, last_seen:"now" },
  { id:'d2', name:"Marcus", age:29, avatar:"👨🏾", verified:true, city:"London", destination:"Tokyo", destination_emoji:"🗼", date_display:"Apr 5 – Apr 20", bio:"Anime nerd meets foodie. Every ramen shop in Akihabara.", vibe:"Cultural", budget:"Flexible", interests:["Food","Nightlife","Gaming","Anime"], languages:["English","Japanese"], trip_count:12, rating:4.9, online:true, last_seen:"now" },
  { id:'d3', name:"Ayla", age:24, avatar:"👩🏻", verified:false, city:"Istanbul", destination:"Morocco", destination_emoji:"🕌", date_display:"May 1 – May 14", bio:"Photographer chasing golden hour in the medinas.", vibe:"Creative", budget:"Budget", interests:["Photography","Art","Tea","Markets"], languages:["English","Turkish","Arabic"], trip_count:5, rating:4.7, online:false, last_seen:"2h ago" },
  { id:'d4', name:"Kai", age:31, avatar:"👨🏽", verified:true, city:"Auckland", destination:"Patagonia", destination_emoji:"🏔️", date_display:"Jun 10 – Jul 1", bio:"Mountaineer & trail runner. Planning the W Trek.", vibe:"Extreme", budget:"Mid-range", interests:["Trekking","Camping","Wildlife","Running"], languages:["English","Maori"], trip_count:15, rating:5.0, online:true, last_seen:"now" },
  { id:'d5', name:"Priya", age:27, avatar:"👩🏽", verified:true, city:"Mumbai", destination:"Greece", destination_emoji:"🇬🇷", date_display:"Jul 5 – Jul 18", bio:"Island hopping, sunset cocktails, and ancient ruins.", vibe:"Social", budget:"Luxury", interests:["Islands","History","Parties","Diving"], languages:["English","Hindi","French"], trip_count:9, rating:4.6, online:false, last_seen:"30m ago" },
  { id:'d6', name:"Liam", age:28, avatar:"🧑🏼", verified:true, city:"Dublin", destination:"Vietnam", destination_emoji:"🇻🇳", date_display:"Aug 1 – Aug 21", bio:"Motorbike through mountains, eat pho for breakfast.", vibe:"Adventurous", budget:"Budget", interests:["Food","Hiking","Motorcycles","Photography"], languages:["English","Irish"], trip_count:11, rating:4.8, online:true, last_seen:"now" },
  { id:'d7', name:"Zara", age:25, avatar:"🧑‍🎤", verified:false, city:"Berlin", destination:"Colombia", destination_emoji:"🇨🇴", date_display:"Sep 10 – Sep 28", bio:"Salsa dancing, coffee farms, Caribbean coastlines.", vibe:"Social", budget:"Mid-range", interests:["Dancing","Coffee","Beach","Nightlife"], languages:["English","German","Spanish"], trip_count:6, rating:4.5, online:true, last_seen:"now" },
];

class ProfilesService {
  // Get current user's profile
  async getMyProfile(userId) {
    if (isDemo) return { data: { id: 'demo-user-001', name: 'Demo Traveler', avatar: '😎', city: 'Earth', vibe: 'Adventurous', budget: 'Mid-range', interests: ['Hiking','Food','Photography'], languages: ['English'], trip_count: 0, rating: 0, online: true }, error: null };

    const { data, error } = await supabase
      .from('profiles')
      .select('*, destinations(*)')
      .eq('id', userId)
      .single();
    return { data, error };
  }

  // Update profile
  async updateProfile(userId, updates) {
    if (isDemo) return { data: { ...updates, id: userId }, error: null };

    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  }

  // Upload avatar image
  async uploadAvatar(userId, file) {
    if (isDemo) return { url: null, error: null };

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) return { url: null, error: uploadError };

    const url = getStorageUrl('avatars', fileName);
    await this.updateProfile(userId, { avatar_url: url });
    return { url, error: null };
  }

  // Set travel destination
  async setDestination(userId, { destination, emoji, startDate, endDate, dateDisplay }) {
    if (isDemo) return { data: { destination, destination_emoji: emoji }, error: null };

    // Deactivate existing destinations
    await supabase
      .from('destinations')
      .update({ is_active: false })
      .eq('user_id', userId);

    const { data, error } = await supabase
      .from('destinations')
      .insert({
        user_id: userId,
        destination,
        destination_emoji: emoji || '🌍',
        start_date: startDate,
        end_date: endDate,
        date_display: dateDisplay,
      })
      .select()
      .single();
    return { data, error };
  }

  // Discover travelers (people to swipe on)
  async discoverTravelers(userId, { limit = 20, offset = 0 } = {}) {
    if (isDemo) return { data: DEMO_PROFILES, error: null };

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        destinations!inner(destination, destination_emoji, date_display, start_date, end_date)
      `)
      .neq('id', userId)
      .not('id', 'in', `(SELECT swiped_id FROM swipes WHERE swiper_id = '${userId}')`) // Not already swiped
      .not('id', 'in', `(SELECT blocked_id FROM blocks WHERE blocker_id = '${userId}')`) // Not blocked
      .eq('destinations.is_active', true)
      .order('last_seen', { ascending: false })
      .range(offset, offset + limit - 1);

    // Flatten destination data
    const profiles = data?.map(p => ({
      ...p,
      destination: p.destinations?.[0]?.destination,
      destination_emoji: p.destinations?.[0]?.destination_emoji,
      date_display: p.destinations?.[0]?.date_display,
    }));

    return { data: profiles, error };
  }

  // Get a single profile
  async getProfile(profileId) {
    if (isDemo) return { data: DEMO_PROFILES.find(p => p.id === profileId) || DEMO_PROFILES[0], error: null };

    const { data, error } = await supabase
      .from('profiles')
      .select('*, destinations(*)')
      .eq('id', profileId)
      .single();
    return { data, error };
  }

  // Calculate compatibility score between two users
  calcCompatibility(userProfile, otherProfile) {
    let score = 50;
    if (userProfile.vibe === otherProfile.vibe) score += 20;
    if (userProfile.budget === otherProfile.budget) score += 10;
    const sharedInterests = (userProfile.interests || [])
      .filter(i => (otherProfile.interests || []).includes(i)).length;
    score += sharedInterests * 8;
    const sharedLanguages = (userProfile.languages || [])
      .filter(l => (otherProfile.languages || []).includes(l)).length;
    score += sharedLanguages * 5;
    return Math.min(score, 99);
  }

  // Report a user
  async reportUser(reporterId, reportedId, reason, description) {
    if (isDemo) return { error: null };

    const { error } = await supabase
      .from('reports')
      .insert({ reporter_id: reporterId, reported_id: reportedId, reason, description });
    return { error };
  }

  // Block a user
  async blockUser(blockerId, blockedId) {
    if (isDemo) return { error: null };

    const { error } = await supabase
      .from('blocks')
      .insert({ blocker_id: blockerId, blocked_id: blockedId });
    return { error };
  }
}

export const profilesService = new ProfilesService();
export default profilesService;
