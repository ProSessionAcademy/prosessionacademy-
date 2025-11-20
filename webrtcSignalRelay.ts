import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// In-memory store for active connections (resets on deployment, but that's fine for ephemeral signaling)
const activeSignals = new Map();

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, sessionId, signalData } = await req.json();

    if (action === 'offer') {
      // Store offer
      activeSignals.set(`${sessionId}_offer`, signalData);
      return Response.json({ success: true, message: 'Offer stored' });
    }

    if (action === 'answer') {
      // Store answer
      activeSignals.set(`${sessionId}_answer`, signalData);
      return Response.json({ success: true, message: 'Answer stored' });
    }

    if (action === 'ice') {
      // Store ICE candidate
      const key = `${sessionId}_ice_${signalData.isCreator ? 'creator' : 'partner'}`;
      const existing = activeSignals.get(key) || [];
      existing.push(signalData.candidate);
      activeSignals.set(key, existing);
      return Response.json({ success: true, message: 'ICE candidate stored' });
    }

    if (action === 'get') {
      // Retrieve signals for this session
      const offer = activeSignals.get(`${sessionId}_offer`) || null;
      const answer = activeSignals.get(`${sessionId}_answer`) || null;
      const creatorCandidates = activeSignals.get(`${sessionId}_ice_creator`) || [];
      const partnerCandidates = activeSignals.get(`${sessionId}_ice_partner`) || [];

      return Response.json({
        success: true,
        signals: {
          offer,
          answer,
          creator_candidates: creatorCandidates,
          partner_candidates: partnerCandidates
        }
      });
    }

    if (action === 'clear') {
      // Clear signals for session
      activeSignals.delete(`${sessionId}_offer`);
      activeSignals.delete(`${sessionId}_answer`);
      activeSignals.delete(`${sessionId}_ice_creator`);
      activeSignals.delete(`${sessionId}_ice_partner`);
      return Response.json({ success: true, message: 'Signals cleared' });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('WebRTC Relay Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});