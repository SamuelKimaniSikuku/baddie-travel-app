// ═══════════════════════════════════════════════════════════════
// KYC SERVICE — Didit automated identity verification.
// The client only ever asks the edge functions to act; the Didit API
// key and all decision logic stay server-side. Images are captured on
// Didit's hosted flow and never touch our storage.
// ═══════════════════════════════════════════════════════════════

import { supabase, isDemo } from '../lib/supabase';

export var ID_TYPES = [
  { value: 'passport',        label: 'Passport',          icon: '🛂' },
  { value: 'national_id',     label: 'National ID card',  icon: '🪪' },
  { value: 'drivers_licence', label: "Driver's licence",  icon: '🚗' },
];

class KycService {
  // Current verification state for the signed-in user.
  async fetchVerification() {
    var empty = { status: 'unverified', idType: '', submittedAt: null, declineReason: null };
    if (isDemo) return empty;

    var { data: auth } = await supabase.auth.getSession();
    var uid = auth?.session?.user?.id;
    if (!uid) return empty;

    var { data, error } = await supabase
      .from('kyc_verifications')
      .select('id_type, status, created_at, decline_reason')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return empty;
    return {
      status: data.status,
      idType: data.id_type,
      submittedAt: data.created_at,
      declineReason: data.decline_reason || null,
    };
  }

  // Opens a Didit session and returns the hosted-flow URL to redirect to.
  async startVerification(idType) {
    if (isDemo) return { url: null, error: { message: 'Verification is disabled in demo mode.' } };
    var { data, error } = await supabase.functions.invoke('didit-session', {
      body: { id_type: idType },
    });
    if (error) {
      var message = error.message || 'Could not start verification';
      try { var ctx = error.context && (await error.context.json()); if (ctx?.error) message = ctx.error; } catch (e) {}
      return { url: null, error: { message: message } };
    }
    return { url: data?.url || null, error: data?.url ? null : { message: 'No verification URL returned' } };
  }

  // Admin: list sessions waiting on a human.
  async fetchReviewQueue() {
    if (isDemo) return { items: [], error: null };
    var { data, error } = await supabase.functions.invoke('verification-review', { body: { action: 'list' } });
    if (error) return { items: [], error: { message: error.message || 'Could not load queue' } };
    return { items: (data && data.items) || [], error: null };
  }

  // Admin: approve or decline a session ("approve" | "decline").
  async decide(id, decision, note) {
    if (isDemo) return { ok: false, error: { message: 'Disabled in demo mode.' } };
    var { data, error } = await supabase.functions.invoke('verification-review', {
      body: { action: 'decide', id: id, decision: decision, note: note || '' },
    });
    if (error) return { ok: false, error: { message: error.message || 'Decision failed' } };
    if (data && data.error) return { ok: false, error: { message: data.error } };
    return { ok: true, mirroredToDidit: !!(data && data.mirroredToDidit) };
  }
}

export var kycService = new KycService();
export default kycService;
