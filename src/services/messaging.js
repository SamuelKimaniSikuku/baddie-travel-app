// ═══════════════════════════════════════════════════════════════
// MESSAGING SERVICE — Real-time chat with Supabase Realtime
// ═══════════════════════════════════════════════════════════════

import { supabase, isDemo } from '../lib/supabase';

class MessagingService {
  constructor() {
    this.activeSubscriptions = new Map();
  }

  // ── Conversations ──

  // Get all conversations for a user
  async getConversations(userId) {
    if (isDemo) return { data: [], error: null };

    const { data, error } = await supabase
      .from('conversation_members')
      .select(`
        conversation_id,
        last_read_at,
        muted,
        conversations!inner(
          id,
          is_group,
          group_name,
          group_avatar,
          updated_at,
          match:matches(
            shared_destination,
            user1:profiles!matches_user1_id_fkey(id, name, avatar, avatar_url, verified, online, last_seen),
            user2:profiles!matches_user2_id_fkey(id, name, avatar, avatar_url, verified, online, last_seen)
          )
        )
      `)
      .eq('user_id', userId)
      .order('conversations(updated_at)', { ascending: false });

    if (error) return { data: null, error };

    // Get last message for each conversation
    const convos = await Promise.all(
      (data || []).map(async (cm) => {
        const { data: msgs } = await supabase
          .from('messages')
          .select('content, type, created_at, sender_id')
          .eq('conversation_id', cm.conversation_id)
          .order('created_at', { ascending: false })
          .limit(1);

        // Count unread
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', cm.conversation_id)
          .gt('created_at', cm.last_read_at)
          .neq('sender_id', userId);

        return {
          id: cm.conversation_id,
          ...cm.conversations,
          lastMessage: msgs?.[0] || null,
          unreadCount: count || 0,
          muted: cm.muted,
        };
      })
    );

    return { data: convos, error: null };
  }

  // Create a group conversation
  async createGroupConversation(creatorId, memberIds, groupName, groupAvatar) {
    if (isDemo) return { data: { id: 'demo-group' }, error: null };

    const { data: convo, error: convoError } = await supabase
      .from('conversations')
      .insert({ is_group: true, group_name: groupName, group_avatar: groupAvatar })
      .select()
      .single();

    if (convoError) return { data: null, error: convoError };

    const members = [creatorId, ...memberIds].map(uid => ({
      conversation_id: convo.id,
      user_id: uid,
    }));

    const { error: memberError } = await supabase
      .from('conversation_members')
      .insert(members);

    // System message
    await supabase.from('messages').insert({
      conversation_id: convo.id,
      type: 'system',
      content: `Group "${groupName}" created! Start planning your trip together ✈️`,
    });

    return { data: convo, error: memberError };
  }

  // ── Messages ──

  // Get messages for a conversation
  async getMessages(conversationId, { limit = 50, before = null } = {}) {
    if (isDemo) return { data: [], error: null };

    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, name, avatar, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;
    return { data: data?.reverse() || [], error };
  }

  // Send a text message
  async sendMessage(conversationId, senderId, content, type = 'text', metadata = {}) {
    if (isDemo) {
      return {
        data: {
          id: Date.now().toString(),
          conversation_id: conversationId,
          sender_id: senderId,
          content,
          type,
          metadata,
          created_at: new Date().toISOString(),
        },
        error: null,
      };
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        type,
        metadata,
      })
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, name, avatar, avatar_url)
      `)
      .single();

    return { data, error };
  }

  // Send location message
  async sendLocation(conversationId, senderId, latitude, longitude, placeName) {
    return this.sendMessage(conversationId, senderId, `📍 ${placeName || 'Shared location'}`, 'location', {
      latitude,
      longitude,
      place_name: placeName,
    });
  }

  // Send image message
  async sendImage(conversationId, senderId, file) {
    if (isDemo) return { data: null, error: null };

    const fileExt = file.name.split('.').pop();
    const fileName = `${conversationId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-media')
      .upload(fileName, file);

    if (uploadError) return { data: null, error: uploadError };

    const { data: { publicUrl } } = supabase.storage
      .from('chat-media')
      .getPublicUrl(fileName);

    return this.sendMessage(conversationId, senderId, '📸 Photo', 'image', {
      image_url: publicUrl,
    });
  }

  // Mark messages as read
  async markAsRead(conversationId, userId) {
    if (isDemo) return { error: null };

    const { error } = await supabase
      .from('conversation_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);
    return { error };
  }

  // ── Real-time Subscriptions ──

  // Subscribe to messages in a conversation
  subscribeToMessages(conversationId, callback) {
    if (isDemo) return { unsubscribe: () => {} };

    const channelName = `messages-${conversationId}`;

    // Remove existing subscription if any
    if (this.activeSubscriptions.has(channelName)) {
      this.activeSubscriptions.get(channelName).unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Fetch sender info
          const { data: sender } = await supabase
            .from('profiles')
            .select('id, name, avatar, avatar_url')
            .eq('id', payload.new.sender_id)
            .single();

          callback({ ...payload.new, sender });
        }
      )
      .subscribe();

    this.activeSubscriptions.set(channelName, channel);
    return { unsubscribe: () => supabase.removeChannel(channel) };
  }

  // Subscribe to all conversation updates (new messages across all chats)
  subscribeToAllConversations(userId, callback) {
    if (isDemo) return { unsubscribe: () => {} };

    const channel = supabase
      .channel('all-conversations-' + userId)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => callback('conversation_updated', payload.new)
      )
      .subscribe();

    return { unsubscribe: () => supabase.removeChannel(channel) };
  }

  // Broadcast typing indicator via Supabase Realtime Broadcast
  sendTypingIndicator(conversationId, userId, isTyping) {
    if (isDemo) return;

    const channel = supabase.channel(`typing-${conversationId}`);
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: userId, is_typing: isTyping },
    });
  }

  // Subscribe to typing indicators
  subscribeToTyping(conversationId, callback) {
    if (isDemo) return { unsubscribe: () => {} };

    const channel = supabase
      .channel(`typing-${conversationId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        callback(payload.payload);
      })
      .subscribe();

    return { unsubscribe: () => supabase.removeChannel(channel) };
  }

  // Broadcast presence (online/offline)
  async trackPresence(userId) {
    if (isDemo) return { unsubscribe: () => {} };

    const channel = supabase.channel('online-users');

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        // Could update UI with who's online
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: userId, online_at: new Date().toISOString() });
        }
      });

    // Update database
    await supabase.rpc('update_online_status', { user_uuid: userId, is_online: true });

    // Handle page unload
    window.addEventListener('beforeunload', () => {
      supabase.rpc('update_online_status', { user_uuid: userId, is_online: false });
    });

    return { unsubscribe: () => supabase.removeChannel(channel) };
  }

  // Mute/unmute a conversation
  async toggleMute(conversationId, userId, muted) {
    if (isDemo) return { error: null };

    const { error } = await supabase
      .from('conversation_members')
      .update({ muted })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);
    return { error };
  }

  // Clean up all subscriptions
  cleanup() {
    this.activeSubscriptions.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.activeSubscriptions.clear();
  }
}

export const messagingService = new MessagingService();
export default messagingService;
