import { useState } from "react";

function Home() {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomType, setRoomType] = useState("coding");
  const [role, setRole] = useState("candidate");
  const [message, setMessage] = useState("");

  const enterRoom = (finalRoomType) => {
    localStorage.setItem("username", username || "Anonymous");
    localStorage.setItem("roomId", roomId);
    localStorage.setItem("roomType", finalRoomType);
    localStorage.setItem("role", role);
    window.location.reload();
  };

  const createRoom = async () => {
    if (!username.trim()) return setMessage("Please enter your name");
    if (!roomId.trim()) return setMessage("Please enter a Room ID");

    try {
      const res = await fetch("https://collab-code-platform-y9nt.onrender.com/api/rooms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          title: "Coding Room",
          language: "javascript",
          type: roomType,
        }),
      });

      const data = await res.json();

      if (res.ok) enterRoom(roomType);
      else setMessage(data.message);
    } catch {
      setMessage("Server error");
    }
  };

  const joinRoom = async () => {
    if (!username.trim()) return setMessage("Please enter your name");
    if (!roomId.trim()) return setMessage("Please enter a Room ID");

    try {
      const res = await fetch("https://collab-code-platform-y9nt.onrender.com/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
      });

      const data = await res.json();

      if (res.ok) enterRoom(data.room.type || "coding");
      else setMessage(data.message);
    } catch {
      setMessage("Server error");
    }
  };

  return (
    <div style={pageStyle}>
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-16px); }
            100% { transform: translateY(0px); }
          }

          @keyframes pulseGlow {
            0% { opacity: 0.45; transform: scale(1); }
            50% { opacity: 0.85; transform: scale(1.08); }
            100% { opacity: 0.45; transform: scale(1); }
          }

          @keyframes slideIn {
            from { opacity: 0; transform: translateY(24px); }
            to { opacity: 1; transform: translateY(0); }
          }

          input::placeholder {
            color: #94a3b8;
          }

          button:hover {
            transform: translateY(-2px);
            filter: brightness(1.08);
          }

          .room-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 30px rgba(139, 92, 246, 0.22);
          }
        `}
      </style>

      <div style={gridOverlay}></div>
      <div style={glowOne}></div>
      <div style={glowTwo}></div>
      <div style={glowThree}></div>

      <nav style={navbar}>
        <div style={brand}>
          <span style={brandIcon}>{"</>"}</span>
          <span>
            Collab<span style={purpleText}>Code</span>
          </span>
        </div>

        <div style={navPill}>
          <span>⚡ Real-time</span>
          <span>💬 Chat</span>
          <span>⏱ Timer</span>
        </div>
      </nav>

      <main style={mainLayout}>
        <section style={heroSection}>
          <div style={badge}>🚀 Built for pair coding & interviews</div>

          <h1 style={heroTitle}>
            Code Together.
            <br />
            Interview Better.
            <br />
            <span style={gradientText}>Collaborate Live.</span>
          </h1>

          <p style={heroText}>
            Create coding rooms, run JavaScript, chat in real time, track live
            cursors, manage interview sessions, and keep your code synced.
          </p>

          <div style={statsRow}>
            <div style={statCard}>
              <h2>Live</h2>
              <p>Code Sync</p>
            </div>

            <div style={statCard}>
              <h2>2 Modes</h2>
              <p>Coding + Interview</p>
            </div>

            <div style={statCard}>
              <h2>Auto</h2>
              <p>Save Enabled</p>
            </div>
          </div>

          <div style={featureGrid}>
            <div style={featureItem}>👥 Multi-user rooms</div>
            <div style={featureItem}>📍 Cursor tracking</div>
            <div style={featureItem}>🧪 Test cases</div>
            <div style={featureItem}>💾 MongoDB save</div>
          </div>

          <div style={floatingCodeCard}>
            <div style={codeHeader}>
              <span style={dotRed}></span>
              <span style={dotYellow}></span>
              <span style={dotGreen}></span>
              <span style={{ marginLeft: "10px", color: "#94a3b8" }}>
                interview-room.js
              </span>
            </div>

            <pre style={codePreview}>{`function add(a, b) {
  return a + b;
}

console.log(add(2, 3)); // 5`}</pre>
          </div>
        </section>
                <section style={formCard}>
          <div style={formGlow}></div>

          <div style={formIcon}>{"</>"}</div>

          <h2 style={formTitle}>Welcome Back 👋</h2>

          <p style={formSub}>
            Join an existing room or create your own collaborative workspace.
          </p>

          <input
            type="text"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="Enter room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            style={inputStyle}
          />

          <div style={sectionBox}>
            <h4 style={sectionTitle}>Room Type</h4>

            <div style={roomCards}>
              <div
                className="room-card"
                onClick={() => setRoomType("coding")}
                style={{
                  ...roomCard,
                  border:
                    roomType === "coding"
                      ? "2px solid #8b5cf6"
                      : "1px solid #334155",
                }}
              >
                <h3>💻 Coding</h3>
                <p>Collaborative coding session</p>
              </div>

              <div
                className="room-card"
                onClick={() => setRoomType("interview")}
                style={{
                  ...roomCard,
                  border:
                    roomType === "interview"
                      ? "2px solid #8b5cf6"
                      : "1px solid #334155",
                }}
              >
                <h3>🎤 Interview</h3>
                <p>Structured interview room</p>
              </div>
            </div>
          </div>

          {roomType === "interview" && (
            <div style={sectionBox}>
              <h4 style={sectionTitle}>Select Role</h4>

              <label style={roleLabel}>
                <input
                  type="radio"
                  value="interviewer"
                  checked={role === "interviewer"}
                  onChange={(e) => setRole(e.target.value)}
                />
                👑 Interviewer
              </label>

              <label style={roleLabel}>
                <input
                  type="radio"
                  value="candidate"
                  checked={role === "candidate"}
                  onChange={(e) => setRole(e.target.value)}
                />
                👨‍💻 Candidate
              </label>
            </div>
          )}

          <button onClick={joinRoom} style={primaryButton}>
            Join Room →
          </button>

          <button onClick={createRoom} style={secondaryButton}>
            + Create New Room
          </button>

          {message && <p style={errorText}>{message}</p>}
        </section>
      </main>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#020617",
  color: "white",
  overflow: "hidden",
  position: "relative",
  fontFamily: "Inter, Arial, sans-serif",
};

const gridOverlay = {
  position: "absolute",
  inset: 0,
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
  backgroundSize: "40px 40px",
};

const glowOne = {
  position: "absolute",
  width: "350px",
  height: "350px",
  borderRadius: "50%",
  background: "#7c3aed",
  filter: "blur(120px)",
  opacity: 0.35,
  top: "10%",
  left: "5%",
  animation: "pulseGlow 8s infinite",
};

const glowTwo = {
  position: "absolute",
  width: "300px",
  height: "300px",
  borderRadius: "50%",
  background: "#0ea5e9",
  filter: "blur(120px)",
  opacity: 0.3,
  right: "10%",
  top: "20%",
  animation: "pulseGlow 10s infinite",
};

const glowThree = {
  position: "absolute",
  width: "250px",
  height: "250px",
  borderRadius: "50%",
  background: "#ec4899",
  filter: "blur(120px)",
  opacity: 0.22,
  bottom: "5%",
  left: "40%",
  animation: "pulseGlow 12s infinite",
};

const navbar = {
  height: "85px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0 70px",
  position: "relative",
  zIndex: 2,
};

const brand = {
  fontSize: "28px",
  fontWeight: "800",
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const brandIcon = {
  color: "#8b5cf6",
};

const purpleText = {
  color: "#8b5cf6",
};

const navPill = {
  display: "flex",
  gap: "18px",
  background: "rgba(15,23,42,0.65)",
  padding: "12px 18px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
};

const mainLayout = {
  position: "relative",
  zIndex: 2,
  display: "grid",
  gridTemplateColumns: "1.2fr 0.9fr",
  gap: "60px",
  alignItems: "center",
  padding: "20px 70px 70px",
};

const heroSection = {};

const badge = {
  display: "inline-block",
  padding: "10px 18px",
  borderRadius: "999px",
  background: "rgba(124,58,237,0.18)",
  border: "1px solid rgba(168,85,247,0.4)",
  color: "#d8b4fe",
};

const heroTitle = {
  fontSize: "72px",
  lineHeight: 1.05,
  marginTop: "25px",
  marginBottom: "20px",
  fontWeight: "900",
};

const gradientText = {
  background: "linear-gradient(90deg,#38bdf8,#8b5cf6,#ec4899)",
  WebkitBackgroundClip: "text",
  color: "transparent",
};

const heroText = {
  fontSize: "19px",
  color: "#cbd5e1",
  maxWidth: "650px",
  lineHeight: "1.8",
};

const statsRow = {
  display: "flex",
  gap: "18px",
  marginTop: "30px",
};

const statCard = {
  background: "rgba(15,23,42,0.7)",
  padding: "18px",
  borderRadius: "16px",
  minWidth: "130px",
};

const featureGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
  marginTop: "30px",
};

const featureItem = {
  background: "rgba(15,23,42,0.6)",
  padding: "14px",
  borderRadius: "12px",
};

const floatingCodeCard = {
  marginTop: "35px",
  width: "420px",
  background: "#0f172a",
  borderRadius: "18px",
  overflow: "hidden",
  border: "1px solid #334155",
  animation: "float 5s infinite",
};

const codeHeader = {
  padding: "12px",
  display: "flex",
  alignItems: "center",
  borderBottom: "1px solid #1e293b",
};

const dotRed = {
  width: "10px",
  height: "10px",
  background: "#ef4444",
  borderRadius: "50%",
  marginRight: "6px",
};

const dotYellow = {
  width: "10px",
  height: "10px",
  background: "#f59e0b",
  borderRadius: "50%",
  marginRight: "6px",
};

const dotGreen = {
  width: "10px",
  height: "10px",
  background: "#22c55e",
  borderRadius: "50%",
};

const codePreview = {
  padding: "20px",
  margin: 0,
  color: "#93c5fd",
};

const formCard = {
  position: "relative",
  background: "rgba(15,23,42,0.78)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(18px)",
  borderRadius: "28px",
  padding: "40px",
  animation: "slideIn 1s ease",
};

const formGlow = {
  position: "absolute",
  inset: 0,
  borderRadius: "28px",
  boxShadow: "0 0 60px rgba(139,92,246,0.25)",
  pointerEvents: "none",
};
const formIcon = {
  width: "80px",
  height: "80px",
  borderRadius: "50%",
  margin: "0 auto 20px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "linear-gradient(135deg,#2563eb,#9333ea)",
  fontSize: "30px",
  fontWeight: "900",
};

const formTitle = {
  textAlign: "center",
  fontSize: "34px",
};

const formSub = {
  textAlign: "center",
  color: "#94a3b8",
  marginBottom: "25px",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "16px",
  background: "#020617",
  border: "1px solid #334155",
  borderRadius: "12px",
  color: "white",
  marginBottom: "14px",
};

const sectionBox = {
  background: "rgba(2,6,23,0.5)",
  padding: "16px",
  borderRadius: "14px",
  marginBottom: "14px",
};

const sectionTitle = {
  marginTop: 0,
};

const roomCards = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
};

const roomCard = {
  padding: "15px",
  borderRadius: "14px",
  cursor: "pointer",
  transition: "0.3s",
};

const roleLabel = {
  display: "block",
  marginTop: "10px",
};

const primaryButton = {
  width: "100%",
  padding: "16px",
  border: "none",
  borderRadius: "12px",
  background: "linear-gradient(90deg,#2563eb,#8b5cf6,#ec4899)",
  color: "white",
  fontWeight: "800",
  cursor: "pointer",
  transition: "0.3s",
};

const secondaryButton = {
  width: "100%",
  padding: "16px",
  borderRadius: "12px",
  border: "1px solid #8b5cf6",
  background: "transparent",
  color: "#d8b4fe",
  fontWeight: "800",
  marginTop: "12px",
  cursor: "pointer",
};

const errorText = {
  color: "#fca5a5",
  textAlign: "center",
  marginTop: "15px",
};

export default Home;