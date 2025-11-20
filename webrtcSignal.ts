import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// In-memory signaling storage (resets on function restart, but works for active sessions)
const signalingData = new Map();

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, sessionId, signal, role } = await req.json();

    if (!sessionId) {
      return Response.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Initialize session storage if needed
    if (!signalingData.has(sessionId)) {
      signalingData.set(sessionId, {
        offer: null,
        answer: null,
        creatorCandidates: [],
        partnerCandidates: []
      });
    }

    const data = signalingData.get(sessionId);

    switch (action) {
      case 'send_offer':
        data.offer = signal;
        signalingData.set(sessionId, data);
        return Response.json({ success: true });

      case 'send_answer':
        data.answer = signal;
        signalingData.set(sessionId, data);
        return Response.json({ success: true });

      case 'send_ice_candidate':
        if (role === 'creator') {
          data.creatorCandidates.push(signal);
        } else {
          data.partnerCandidates.push(signal);
        }
        signalingData.set(sessionId, data);
        return Response.json({ success: true });

      case 'get_signals':
        return Response.json({ 
          success: true,
          data: data
        });

      case 'clear':
        signalingData.delete(sessionId);
        return Response.json({ success: true });

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});