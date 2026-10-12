# SignalLine 📡

> **Offline-first real-time messaging and live geospatial streaming mobile application.**  
> Built with **React Native (Expo SDK 54)**, **embedded SQLite Outbox sync**, **2D Kalman filter GPS telemetry**, and a **Node.js Socket.IO spatial backend**.

---

## 🌟 Highlights

* 💬 **WhatsApp-Grade Mobile Experience**: 4-step SMS/OTP phone authentication, protected route guards, edge-to-edge chat feeds, speech bubbles with blue double read ticks (`#53BDEB`), and custom profile management.
* 📦 **Offline-First SQLite Sync Engine**: Embedded WAL-mode SQLite database operating under the **Outbox Pattern**. Messages are instantly rendered optimistically and sync automatically with **exponential backoff + jitter** when reconnected.
* 🛰️ **2D Kalman Filter GPS Smoothing**: Kinematic discrete-time state estimator ($[x, y, v_x, v_y]^T$) that mitigates mobile GPS sensor noise, eliminating marker teleportation on interactive maps.
* ⚡ **High-Throughput Spatial Fan-out Backend**: Dedicated Node.js & TypeScript real-time server with an in-memory **Spatial Grid Index** mirroring Redis `GEOSEARCH` to broadcast live coordinates without $O(N^2)$ fanout bottleneck.
* 🧪 **Automated Algorithmic Tests**: Unit tests covering Kalman variance convergence and spatial radius proximity queries running in <300ms.

---

## 📐 Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │          Mobile Client (Expo)          │
                      │                                        │
                      │   [ UI (Reanimated / MapView) ]        │
                      │                   ▲                    │
                      │                   │ optimistic update  │
                      │   [ Local SQLite Database (WAL) ]      │
                      │                   ▲                    │
                      │                   │ persist & queue    │
                      │   [ Resilient Outbox Worker ]          │
                      │                   │ state: QUEUED      │
                      │   [ 2D Kalman Filter Engine ]          │
                      └───────────────────┬────────────────────┘
                                          │
                                          │ WebSocket (Socket.IO)
                                          ▼
                      ┌────────────────────────────────────────┐
                      │        Backend Server (server/)        │
                      │                                        │
                      │   [ Event Gateway & Message ACKs ]     │
                      │   [ Room & Presence Multiplexer ]      │
                      │   [ In-Memory Spatial Grid Index ]     │
                      │        ├── GEOADD (coordinates)       │
                      │        └── GEOSEARCH (radius filter)   │
                      └────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Mobile Client** | React Native (0.81.5), Expo SDK 54, Expo Router v6, TypeScript 5.9 |
| **State Management** | Zustand 5.0 |
| **Local Database** | Embedded SQLite (`expo-sqlite` with WAL mode) + WebStorage fallback |
| **Geospatial Math** | 2D Discrete-Time Kalman Filter, Haversine formula, Geohashing |
| **Maps** | `react-native-maps` (iOS / Android) + Canvas fallback (Web) |
| **Real-Time Backend** | Node.js, Express, Socket.IO, TypeScript |
| **Testing** | Node.js Test Runner (`node:test`, `node:assert`) |

---

## 🚀 Getting Started

### Prerequisites
* Node.js 18+
* npm or yarn

### 1. Clone & Install
```bash
git clone https://github.com/kelvinagyareyeboah/signalline-mobile.git
cd signalline-mobile

# Install client dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..
```

### 2. Start the Real-Time Server
```bash
npm run server
```
*The server will start on port `4000` with the Spatial Grid & Outbox Ingestion active.*

### 3. Start the Mobile Client
In a second terminal:
```bash
npx expo start
```
* Press `w` to open the web preview in your browser.
* Or scan the QR code using the **Expo Go** app on your physical iPhone or Android.

---

## 🧪 Automated Testing

Run the algorithmic test suite (Kalman filter variance convergence & Spatial Grid radius verification):

```bash
npm test
```

---

## 📄 License
MIT © [Kelvin Agyare Yeboah](https://github.com/kelvinagyareyeboah)
