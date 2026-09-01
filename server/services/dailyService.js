const https = require('https');

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_DOMAIN = process.env.DAILY_DOMAIN;

const isConfigured = DAILY_API_KEY && !DAILY_API_KEY.includes('your_');

// Generic Daily.co API request
function dailyApiRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    if (!isConfigured) {
      return reject(new Error('Daily.co not configured'));
    }

    const options = {
      hostname: 'api.daily.co',
      port: 443,
      path: `/v1${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.error?.message || `Daily API error: ${res.statusCode}`));
          }
        } catch (e) {
          reject(new Error('Failed to parse Daily API response'));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Create a video room for a consultation
async function createRoom({ roomName, consultationId }) {
  if (!isConfigured) {
    // Development fallback — returns a fake room
    return {
      name: roomName || `consultation-${consultationId}`,
      url: `${DAILY_DOMAIN || 'mediconnect.daily.co'}/${roomName || consultationId}`,
      config: { start_video_off: false, start_audio_off: false },
      token: null
    };
  }

  try {
    const room = await dailyApiRequest('POST', '/rooms', {
      name: roomName || `consultation-${consultationId}`,
      properties: {
        start_video_off: false,
        start_audio_off: false,
        enable_chat: true,
        enable_screensharing: true,
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiry
      }
    });
    return room;
  } catch (error) {
    // Room might already exist, try to get it
    try {
      const room = await dailyApiRequest('GET', `/rooms/${roomName || `consultation-${consultationId}`}`);
      return room;
    } catch (e) {
      throw error;
    }
  }
}

// Create a meeting token for a participant
async function createMeetingToken({ roomName, isOwner = false, userName }) {
  if (!isConfigured) {
    return {
      token: `dev-token-${Date.now()}`,
      roomName: roomName || 'dev-room'
    };
  }

  const token = await dailyApiRequest('POST', '/meeting-tokens', {
    properties: {
      room_name: roomName,
      is_owner: isOwner,
      user_name: userName || 'Guest'
    }
  });

  return token;
}

// Delete a room
async function deleteRoom(roomName) {
  if (!isConfigured) return { ok: true };
  try {
    await dailyApiRequest('DELETE', `/rooms/${roomName}`);
    return { ok: true };
  } catch (error) {
    console.warn('Failed to delete Daily room:', error.message);
    return { ok: false, error: error.message };
  }
}

// Get room info
async function getRoomInfo(roomName) {
  if (!isConfigured) {
    return { name: roomName, participants: [] };
  }

  try {
    const room = await dailyApiRequest('GET', `/rooms/${roomName}`);
    return room;
  } catch (error) {
    return null;
  }
}

// Get the Daily.co config for the frontend
function getDailyConfig() {
  return {
    domain: DAILY_DOMAIN || 'mediconnect.daily.co',
    apiKey: isConfigured ? process.env.STRIPE_PUBLISHABLE_KEY : null, // Don't expose API key
    isConfigured
  };
}

module.exports = {
  isConfigured,
  createRoom,
  createMeetingToken,
  deleteRoom,
  getRoomInfo,
  getDailyConfig
};
