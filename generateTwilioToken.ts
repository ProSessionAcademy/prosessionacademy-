import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import twilio from 'npm:twilio@5.3.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomName, identity } = await req.json();

    if (!roomName || !identity) {
      return Response.json({ error: 'Missing roomName or identity' }, { status: 400 });
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const apiKeySid = Deno.env.get('TWILIO_API_KEY_SID');
    const apiKeySecret = Deno.env.get('TWILIO_API_KEY_SECRET');

    if (!accountSid || !apiKeySid || !apiKeySecret) {
      return Response.json({ error: 'Twilio credentials not configured' }, { status: 500 });
    }

    const AccessToken = twilio.jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;

    const token = new AccessToken(accountSid, apiKeySid, apiKeySecret, {
      identity: identity,
      ttl: 3600
    });

    const videoGrant = new VideoGrant({
      room: roomName
    });

    token.addGrant(videoGrant);

    return Response.json({
      token: token.toJwt(),
      identity: identity,
      roomName: roomName
    });

  } catch (error) {
    console.error('Token generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});