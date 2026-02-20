// ═══════════════════════════════════════════════════════════════
// REACT HOOKS — Connect Supabase services to React components
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import { authService } from '../services/auth';
import { profilesService } from '../services/profiles';
import { matchingService } from '../services/matching';
import { messagingService } from '../services/messaging';
import { tripsService } from '../services/trips';
import { expensesService } from '../services/expenses';
import { isDemo } from '../lib/supabase';

// ── Auth Hook ──
export function useAuth() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    authService.getSession().then(s => {
      setSession(s);
      setUser(s?.user || null);
      setLoading(false);
    });

    // Listen to auth changes
    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const signUp = useCallback(async (data) => authService.signUp(data), []);
  const signIn = useCallback(async (data) => authService.signIn(data), []);
  const signOut = useCallback(async () => authService.signOut(), []);
  const signInWithOAuth = useCallback(async (provider) => authService.signInWithOAuth(provider), []);

  return { user, session, loading, signUp, signIn, signOut, signInWithOAuth, isDemo };
}

// ── Profile Hook ──
export function useProfile(userId) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    profilesService.getMyProfile(userId).then(({ data, error }) => {
      setProfile(data);
      setError(error);
      setLoading(false);
    });
  }, [userId]);

  const updateProfile = useCallback(async (updates) => {
    const { data, error } = await profilesService.updateProfile(userId, updates);
    if (data) setProfile(prev => ({ ...prev, ...data }));
    return { data, error };
  }, [userId]);

  const uploadAvatar = useCallback(async (file) => {
    return profilesService.uploadAvatar(userId, file);
  }, [userId]);

  return { profile, loading, error, updateProfile, uploadAvatar };
}

// ── Discovery Hook ──
export function useDiscovery(userId) {
  const [travelers, setTravelers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    profilesService.discoverTravelers(userId).then(({ data }) => {
      setTravelers(data || []);
      setLoading(false);
    });
  }, [userId]);

  const swipe = useCallback(async (swipedId, action) => {
    const result = await matchingService.swipe(userId, swipedId, action);
    setCurrentIndex(prev => prev + 1);
    return result;
  }, [userId]);

  const currentTraveler = travelers[currentIndex] || null;
  const nextTraveler = travelers[currentIndex + 1] || null;
  const hasMore = currentIndex < travelers.length;

  return { travelers, currentTraveler, nextTraveler, hasMore, loading, swipe, currentIndex };
}

// ── Conversations Hook ──
export function useConversations(userId) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!userId) return;
    const { data } = await messagingService.getConversations(userId);
    setConversations(data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchConversations();

    // Subscribe to conversation updates
    const sub = messagingService.subscribeToAllConversations(userId, () => {
      fetchConversations(); // Refetch on any update
    });

    return () => sub.unsubscribe();
  }, [userId, fetchConversations]);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return { conversations, loading, totalUnread, refresh: fetchConversations };
}

// ── Chat Hook (single conversation) ──
export function useChat(conversationId, userId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeout = useRef(null);

  // Fetch initial messages
  useEffect(() => {
    if (!conversationId) return;
    setLoading(true);
    messagingService.getMessages(conversationId).then(({ data }) => {
      setMessages(data || []);
      setLoading(false);
    });

    // Mark as read
    messagingService.markAsRead(conversationId, userId);
  }, [conversationId, userId]);

  // Subscribe to new messages
  useEffect(() => {
    if (!conversationId) return;

    const msgSub = messagingService.subscribeToMessages(conversationId, (newMsg) => {
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });

      // Mark as read if we're in the conversation
      if (newMsg.sender_id !== userId) {
        messagingService.markAsRead(conversationId, userId);
      }
    });

    // Subscribe to typing
    const typeSub = messagingService.subscribeToTyping(conversationId, ({ user_id, is_typing }) => {
      if (user_id === userId) return;
      setTypingUsers(prev => {
        if (is_typing) return [...new Set([...prev, user_id])];
        return prev.filter(id => id !== user_id);
      });
    });

    return () => {
      msgSub.unsubscribe();
      typeSub.unsubscribe();
    };
  }, [conversationId, userId]);

  // Send message
  const sendMessage = useCallback(async (content, type = 'text', metadata = {}) => {
    const { data, error } = await messagingService.sendMessage(conversationId, userId, content, type, metadata);
    if (data && !isDemo) {
      // Message will arrive via subscription, but add optimistically in demo
    }
    if (data && isDemo) {
      setMessages(prev => [...prev, data]);
    }
    return { data, error };
  }, [conversationId, userId]);

  // Send typing indicator
  const sendTyping = useCallback((isTyping) => {
    messagingService.sendTypingIndicator(conversationId, userId, isTyping);

    // Auto-stop after 3 seconds
    if (isTyping) {
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        messagingService.sendTypingIndicator(conversationId, userId, false);
      }, 3000);
    }
  }, [conversationId, userId]);

  // Send image
  const sendImage = useCallback(async (file) => {
    return messagingService.sendImage(conversationId, userId, file);
  }, [conversationId, userId]);

  // Send location
  const sendLocation = useCallback(async (lat, lng, placeName) => {
    return messagingService.sendLocation(conversationId, userId, lat, lng, placeName);
  }, [conversationId, userId]);

  // Load older messages
  const loadMore = useCallback(async () => {
    if (messages.length === 0) return;
    const oldest = messages[0];
    const { data } = await messagingService.getMessages(conversationId, { before: oldest.created_at });
    if (data?.length) {
      setMessages(prev => [...data, ...prev]);
    }
  }, [conversationId, messages]);

  return {
    messages,
    loading,
    typingUsers,
    sendMessage,
    sendTyping,
    sendImage,
    sendLocation,
    loadMore,
  };
}

// ── Trips Hook ──
export function useTrips(userId) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    tripsService.getTrips(userId).then(({ data }) => {
      setTrips(data || []);
      setLoading(false);
    });
  }, [userId]);

  const createTrip = useCallback(async (tripData) => {
    const result = await tripsService.createTrip(userId, tripData);
    if (result.data) setTrips(prev => [...prev, result.data]);
    return result;
  }, [userId]);

  return { trips, loading, createTrip };
}

// ── Expenses Hook ──
export function useExpenses(tripId) {
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!tripId) return;
    const [expRes, balRes] = await Promise.all([
      expensesService.getExpenses(tripId),
      expensesService.calculateBalances(tripId),
    ]);
    setExpenses(expRes.data || []);
    setBalances(balRes.balances || []);
    setTotal(balRes.total || 0);
    setLoading(false);
  }, [tripId]);

  useEffect(() => { refresh(); }, [refresh]);

  const addExpense = useCallback(async (data) => {
    const result = await expensesService.addExpense(tripId, data);
    if (result.data) refresh();
    return result;
  }, [tripId, refresh]);

  return { expenses, balances, total, loading, addExpense, refresh };
}

// ── Matches Hook ──
export function useMatches(userId) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    matchingService.getMatches(userId).then(({ data }) => {
      setMatches(data || []);
      setLoading(false);
    });

    // Subscribe to new matches
    const sub = matchingService.subscribeToMatches(userId, (newMatch) => {
      setMatches(prev => [newMatch, ...prev]);
    });

    return () => sub.unsubscribe();
  }, [userId]);

  return { matches, loading };
}

// ── Notifications Hook ──
export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!userId || isDemo) return;

    // Initial fetch would go here using supabase query
    // Subscribe to new notifications via realtime
    const { supabase: sb } = require('../lib/supabase');
    const channel = sb
      .channel('notifications-' + userId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => sb.removeChannel(channel);
  }, [userId]);

  return { notifications };
}
