/**
 * start.ng Bridge & Integration Module
 * Handles iframe postMessage communication with https://start.ng/connect
 * and public leaderboard APIs.
 */

const START_NG = "https://start.ng";
const API_URL = "https://api.start.ng";
const GAME_SLUG = "cyber-slash";

let connectFramePromise = null;
let currentUser = null;
let currentGuest = null;

/**
 * Initializes and returns the hidden connect iframe.
 */
function getConnectFrame() {
  if (!connectFramePromise) {
    connectFramePromise = new Promise((resolve, reject) => {
      const el = document.createElement("iframe");
      el.src = `${START_NG}/connect`;
      el.hidden = true;
      el.style.display = "none";
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not load start.ng connect iframe"));
      document.body.appendChild(el);
    });
  }
  return connectFramePromise;
}

/**
 * Sends a message to start.ng connect iframe and waits for corresponding replyType.
 */
export async function askStartNg(message, replyType, timeoutMs = 4000) {
  try {
    const frame = await getConnectFrame();
    return new Promise((resolve) => {
      const requestId = Math.random().toString(36).slice(2);
      let timer = null;

      function onMessage(e) {
        if (e.origin !== START_NG || e.source !== frame.contentWindow) return;
        if (e.data?.type === replyType && e.data.requestId === requestId) {
          cleanup();
          resolve(e.data);
        }
      }

      function cleanup() {
        if (timer) clearTimeout(timer);
        window.removeEventListener("message", onMessage);
      }

      timer = setTimeout(() => {
        cleanup();
        resolve(null);
      }, timeoutMs);

      window.addEventListener("message", onMessage);
      frame.contentWindow.postMessage({ ...message, requestId }, START_NG);
    });
  } catch (err) {
    console.warn("[start.ng] Connect iframe unavailable:", err);
    return null;
  }
}

/**
 * Queries the current active player identity (user or guest).
 */
export async function fetchPlayer() {
  const reply = await askStartNg({ type: "startng:whoami" }, "startng:user", 3500);
  if (reply) {
    currentUser = reply.user ?? null;
    currentGuest = reply.guest ?? null;
  }
  return {
    user: currentUser,
    guest: currentGuest,
    isGuest: !currentUser,
    player: currentUser || currentGuest || getLocalGuestFallback(),
  };
}

/**
 * Local fallback styling when running offline or locally.
 */
function getLocalGuestFallback() {
  return {
    name: "Cyber Runner",
    account: "guest",
    style: {
      body: "female",
      primaryColor: "#00f0ff", // Neon Cyan
      secondaryColor: "#ff007f", // Neon Magenta
      skinColor: "#e0ac69",
      hairColor: "#ffe600",
      hair: "short",
      hat: "none",
      accessory: "glasses",
    },
    face: "",
  };
}

/**
 * Saves a completed game run score on start.ng.
 */
export async function submitScore(stats) {
  try {
    const reply = await askStartNg(
      { type: "startng:score", stats },
      "startng:scoreSaved",
      4000,
    );
    if (reply?.ok && reply.result) {
      return { ok: true, result: reply.result };
    }
    return { ok: false, error: reply?.error || "Could not save score" };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Fetches the global leaderboard for cyber-slash.
 */
export async function fetchLeaderboard(limit = 10) {
  // 1. Try connect frame
  try {
    const frameReply = await askStartNg(
      { type: "startng:leaderboard", limit },
      "startng:leaderboardData",
      3000,
    );
    if (frameReply?.ok && Array.isArray(frameReply.entries)) {
      return frameReply.entries;
    }
  } catch (_) {
    // fallback to HTTP
  }

  // 2. HTTP API fallback
  try {
    const res = await fetch(`${API_URL}/games/${GAME_SLUG}/leaderboard?limit=${limit}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("[start.ng] Failed to fetch leaderboard:", e);
  }

  return [];
}

/**
 * Redirects player to start.ng sign in.
 */
export function redirectToSignIn() {
  const returnTo = encodeURIComponent(window.location.origin + window.location.pathname);
  window.location.href = `${START_NG}/?return_to=${returnTo}`;
}
