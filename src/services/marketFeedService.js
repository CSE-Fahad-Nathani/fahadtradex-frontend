import { useMarketStore } from "../store/marketStore";

class MarketFeedService {
  constructor() {
    this.socket = null;
    this.isConnected = false;

    // token -> { callbacks: Set, refCount: number, scrip }
    this.subscribers = new Map();

    this.pingInterval = null;

    this.accessToken = null;
    this.clientCode = null;

    this.reconnectTimeout = null;
  }

  // ✅ CONNECT
  connect({ accessToken, clientCode }) {
    console.log("🔌 Trying to connect...");
    console.log("🔑 accessToken:", accessToken);
    console.log("👤 clientCode:", clientCode);

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    this.accessToken = accessToken;
    this.clientCode = clientCode;

    const url = `wss://openfeed.5paisa.com/feeds/api/chat?Value1=${accessToken}|${clientCode}`;

    console.log("🔌 Connecting WebSocket...");

    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log("✅ WS OPENED SUCCESSFULLY");
      this.isConnected = true;

      this.startHeartbeat();
      this.resubscribeAll();
    };

    this.socket.onmessage = (event) => {
      console.log("📩 RAW WS MESSAGE:", event.data);

      try {
        // ✅ HANDLE PONG
        if (event.data === "PONG") {
          console.log("💓 PONG received");
          return;
        }

        const parsed = JSON.parse(event.data);
        const messages = Array.isArray(parsed) ? parsed : [parsed];

        messages.forEach((data) => {
          const token = String(data.Token);

          console.log("📊 Parsed Data:", data);
          console.log("🎯 Token received:", token);

          // ✅ 🔥 UPDATE ZUSTAND STORE (MAIN CHANGE)
          useMarketStore.getState().setTick(data);

          const entry = this.subscribers.get(token);

          // if (entry) {
          //   entry.callbacks.forEach((cb) => cb(data));
          // }
          if (entry) {
            entry.callbacks.forEach((cb) => {
              if (typeof cb === "function") {
                cb(data);
              } else {
                console.warn("⚠️ Invalid callback found:", cb);
              }
            });
          }
        });
      } catch (err) {
        console.error("❌ WS Message Parse Error:", err);
      }
    };

    this.socket.onclose = () => {
      console.log("❌ WebSocket Disconnected");
      this.isConnected = false;

      this.stopHeartbeat();
      this.reconnect();
    };

    this.socket.onerror = (err) => {
      console.error("❌ WebSocket Error:", err);
    };
  }

  // ✅ RECONNECT
  reconnect() {
    if (this.reconnectTimeout) return;

    this.reconnectTimeout = setTimeout(() => {
      console.log("🔄 Reconnecting WebSocket...");

      this.reconnectTimeout = null;

      this.connect({
        accessToken: this.accessToken,
        clientCode: this.clientCode,
      });
    }, 2000);
  }

  // ✅ HEARTBEAT
  startHeartbeat() {
    this.stopHeartbeat();

    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send("PING");
        console.log("📤 PING sent");
      }
    }, 10000);
  }

  stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  // ✅ SAFE SEND
  send(payload) {
    console.log("📤 Sending WS Payload:", payload);

    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn("⚠️ WebSocket not ready");
      return;
    }

    this.socket.send(JSON.stringify(payload));
  }

  // ✅ SUBSCRIBE
  subscribe({ scrips = [], callback }) {
    console.log("📡 Subscribe called with:", scrips);

    const newSubscriptions = [];

    scrips.forEach((scrip) => {
      const token = String(scrip.ScripCode);

      if (!this.subscribers.has(token)) {
        this.subscribers.set(token, {
          callbacks: new Set(),
          refCount: 0,
          scrip,
        });

        newSubscriptions.push(scrip);
      }

      const entry = this.subscribers.get(token);

      if (typeof callback === "function") {
        entry.callbacks.add(callback);
      }
      entry.refCount++;
    });

    if (newSubscriptions.length > 0) {
      console.log("📡 Subscribing:", newSubscriptions);

      this.send({
        Method: "MarketFeedV3",
        Operation: "Subscribe",
        ClientCode: this.clientCode,
        MarketFeedData: newSubscriptions,
      });
    }

    return () => {
      this.unsubscribe({ scrips, callback });
    };
  }

  // ✅ UNSUBSCRIBE
  unsubscribe({ scrips = [], callback }) {
    const toUnsubscribe = [];

    scrips.forEach((scrip) => {
      const token = String(scrip.ScripCode);
      const entry = this.subscribers.get(token);
      if (!entry) return;

      if (typeof callback === "function") {
        entry.callbacks.delete(callback);
      }
      entry.refCount--;

      if (entry.refCount <= 0) {
        this.subscribers.delete(token);
        toUnsubscribe.push(scrip);
      }
    });

    if (toUnsubscribe.length > 0) {
      console.log("📴 Unsubscribing:", toUnsubscribe);

      this.send({
        Method: "MarketFeedV3",
        Operation: "Unsubscribe",
        ClientCode: this.clientCode,
        MarketFeedData: toUnsubscribe,
      });
    }
  }

  // ✅ RESUBSCRIBE
  resubscribeAll() {
    const allScrips = [];

    this.subscribers.forEach((entry) => {
      allScrips.push(entry.scrip);
    });

    if (allScrips.length > 0) {
      console.log("🔁 Resubscribing to:", allScrips);

      this.send({
        Method: "MarketFeedV3",
        Operation: "Subscribe",
        ClientCode: this.clientCode,
        MarketFeedData: allScrips,
      });
    }
  }

  // ✅ STATUS
  isSocketConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }
}

const marketFeedService = new MarketFeedService();
export default marketFeedService;