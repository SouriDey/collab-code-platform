import MonacoEditor from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import socket from "../socket";

function CodeEditor() {
  const [code, setCode] = useState(`function add(a, b) {
  return a + b;
}`);
  const [userCount, setUserCount] = useState(0);
  const [output, setOutput] = useState("> Server ready...\n> Waiting for output...");
  const [language, setLanguage] = useState("javascript");
  const [searchText, setSearchText] = useState("");
  const [saveStatus, setSaveStatus] = useState("Not saved");
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [cursorUsers, setCursorUsers] = useState({});
  const [roomType, setRoomType] = useState("coding");
  const [timer, setTimer] = useState(45 * 60);
  const [timerMinutes, setTimerMinutes] = useState(45);

  const [problemText, setProblemText] = useState("");
  const [savedProblem, setSavedProblem] = useState("Type your problem here...");

  const editorRef = useRef(null);
  const saveTimer = useRef(null);

  const roomId = localStorage.getItem("roomId");
  const role = localStorage.getItem("role") || "candidate";
  const username = localStorage.getItem("username") || "Anonymous";

  useEffect(() => {
    const loadSavedCode = async () => {
      try {
        const res = await fetch(`http://https://collab-code-platform-y9nt.onrender.com/api/rooms/${roomId}/code`);
        const data = await res.json();

        if (res.ok) {
          setCode(data.code || "");
          setLanguage(data.language || "javascript");
          setRoomType(data.type || localStorage.getItem("roomType") || "coding");
          setSaveStatus("Saved");
        }
      } catch {
        setSaveStatus("Offline");
      }
    };

    loadSavedCode();

    socket.emit("join-room", {
      roomId,
      username,
    });

    socket.on("receive-code", (newCode) => setCode(newCode));
    socket.on("user-count", (count) => setUserCount(count));
    socket.on("participants", (users) => setParticipants(users));

    socket.on("cursor-update", ({ username, lineNumber, column }) => {
      setCursorUsers((prev) => ({
        ...prev,
        [username]: { lineNumber, column },
      }));
    });

    socket.on("receive-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("receive-problem", (problem) => {
      setProblemText(problem);
      setSavedProblem(problem);
    });

    socket.on("timer-update", (time) => {
      setTimer(time);
    });

    socket.on("timer-finished", () => {
      alert("Interview Finished!");
    });

    return () => {
      socket.off("receive-code");
      socket.off("user-count");
      socket.off("participants");
      socket.off("cursor-update");
      socket.off("receive-message");
      socket.off("receive-problem");
      socket.off("timer-update");
      socket.off("timer-finished");
    };
  }, [roomId, username]);

  const saveCodeToDB = async (newCode, newLanguage) => {
    try {
      setSaveStatus("Saving...");

      await fetch(`http://https://collab-code-platform-y9nt.onrender.com/api/rooms/${roomId}/code`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: newCode,
          language: newLanguage,
        }),
      });

      setSaveStatus("Saved");
    } catch {
      setSaveStatus("Save failed");
    }
  };

  const scheduleSave = (newCode, newLanguage) => {
    clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(() => {
      saveCodeToDB(newCode, newLanguage);
    }, 1000);
  };

  const handleChange = (value) => {
    const newCode = value || "";

    setCode(newCode);

    socket.emit("code-change", {
      roomId,
      code: newCode,
    });

    scheduleSave(newCode, language);
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    scheduleSave(code, newLanguage);
  };

  const saveProblem = () => {
    const finalProblem = problemText || "Type your problem here...";
    setSavedProblem(finalProblem);

    socket.emit("problem-change", {
      roomId,
      problem: finalProblem,
    });
  };

  const sendMessage = () => {
    if (!chatMessage.trim()) return;

    socket.emit("send-message", {
      roomId,
      username,
      message: chatMessage,
    });

    setChatMessage("");
  };

  const startTimer = () => {
    socket.emit("start-timer", {
      roomId,
      minutes: timerMinutes,
    });
  };

  const resetTimer = () => {
    socket.emit("reset-timer", {
      roomId,
      minutes: timerMinutes,
    });
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    alert("Room ID copied!");
  };

  const leaveRoom = () => {
    localStorage.removeItem("roomId");
    localStorage.removeItem("roomType");
    localStorage.removeItem("role");
    window.location.reload();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };
    const handleSearch = () => {
    if (!searchText || !editorRef.current) return;

    const editor = editorRef.current;
    const model = editor.getModel();

    const matches = model.findMatches(searchText, true, false, false, null, true);

    if (matches.length > 0) {
      editor.setPosition({
        lineNumber: matches[0].range.startLineNumber,
        column: matches[0].range.startColumn,
      });

      editor.revealLineInCenter(matches[0].range.startLineNumber);
      editor.focus();

      setOutput(`> Found "${searchText}" ${matches.length} time(s)`);
    } else {
      setOutput(`> "${searchText}" not found`);
    }
  };

  const runCode = () => {
    if (language !== "javascript") {
      setOutput(`> ${language.toUpperCase()} execution will be added in future version`);
      return;
    }

    try {
      const logs = [];
      const originalLog = console.log;

      console.log = (...args) => logs.push("> " + args.join(" "));

      const executeCode = new Function(code);
      executeCode();

      console.log = originalLog;
      setOutput(logs.join("\n") || "> Code executed successfully");
    } catch (error) {
      setOutput("> " + error.toString());
    }
  };

  const runTests = () => {
    if (language !== "javascript") {
      setOutput("> Tests are currently supported only for JavaScript");
      return;
    }

    try {
      const userFunction = new Function(
        code + "\n return typeof add === 'function' ? add : null;"
      )();

      if (!userFunction) {
        setOutput("> Test Error: Please define a function named add(a, b)");
        return;
      }

      const tests = [
        { input: [2, 3], expected: 5 },
        { input: [10, 20], expected: 30 },
        { input: [-1, 1], expected: 0 },
      ];

      let result = "> Running Tests...\n\n";

      tests.forEach((test, index) => {
        const actual = userFunction(test.input[0], test.input[1]);

        if (actual === test.expected) {
          result += `✅ Test ${index + 1} Passed: add(${test.input[0]}, ${test.input[1]}) = ${actual}\n`;
        } else {
          result += `❌ Test ${index + 1} Failed: expected ${test.expected}, got ${actual}\n`;
        }
      });

      setOutput(result);
    } catch (error) {
      setOutput("> Test Error: " + error.toString());
    }
  };

  return (
    <div style={page}>
      <div style={topBar}>
        <div style={brandBlock}>
          <div style={logoBox}>{"</>"}</div>

          <div>
            <h2 style={brandTitle}>CollabCode</h2>
            <p style={brandSubtitle}>
              {roomType === "interview" ? "Interview Workspace" : "Coding Workspace"} · Room {roomId}
            </p>
          </div>
        </div>

        <div style={topCenter}>
          <span style={liveDot}>● LIVE</span>
          <span style={topPill}>👥 {userCount} online</span>
          <span style={topPill}>💾 {saveStatus}</span>
          <span style={topPill}>
            {role === "interviewer" ? "👑 Interviewer" : "👨‍💻 Candidate"}
          </span>
        </div>

        <div style={topButtons}>
          <button onClick={copyRoomId} style={ghostButton}>
            Copy ID
          </button>

          <button onClick={leaveRoom} style={dangerButton}>
            Leave
          </button>
        </div>
      </div>

      <div style={workspace}>
        <aside style={leftPanel}>
          {roomType === "interview" && (
            <div style={card}>
              <div style={cardHeader}>
                <span>📋 Problem</span>
                <span style={mutedText}>
                  {role === "interviewer" ? "Editable" : "Read only"}
                </span>
              </div>

              {role === "interviewer" ? (
                <>
                  <textarea
                    placeholder="Type your problem here..."
                    value={problemText}
                    onChange={(e) => setProblemText(e.target.value)}
                    style={problemTextarea}
                  />

                  <button onClick={saveProblem} style={outlineButton}>
                    Save Problem
                  </button>
                </>
              ) : (
                <div style={problemPreview}>{savedProblem}</div>
              )}
            </div>
          )}

          {roomType === "interview" && (
            <div style={card}>
              <div style={cardHeader}>
                <span>⏱ Timer</span>
                <span style={mutedText}>Shared</span>
              </div>

              <div style={timerCircle}>
                <div style={timerText}>{formatTime(timer)}</div>
              </div>

              {role === "interviewer" && (
                <>
                  <input
                    type="number"
                    min="1"
                    placeholder="Minutes"
                    value={timerMinutes}
                    onChange={(e) => setTimerMinutes(e.target.value)}
                    style={input}
                  />

                  <div style={timerButtons}>
                    <button onClick={startTimer} style={successButton}>
                      Start
                    </button>

                    <button onClick={resetTimer} style={primaryButton}>
                      Reset
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <div style={card}>
            <div style={cardHeader}>
              <span>👥 Participants</span>
              <span style={mutedText}>{participants.length}</span>
            </div>

            {participants.map((user) => (
              <div key={user.id} style={userRow}>
                <span style={avatar}>●</span>
                <span>{user.username}</span>
              </div>
            ))}
          </div>

          <div style={card}>
            <div style={cardHeader}>
              <span>📍 Cursors</span>
              <span style={mutedText}>Live</span>
            </div>

            {Object.entries(cursorUsers).length === 0 ? (
              <p style={emptyText}>No cursor activity yet.</p>
            ) : (
              Object.entries(cursorUsers).map(([name, pos]) => (
                <div key={name} style={userRow}>
                  <span>📌</span>
                  <span>
                    {name} · L{pos.lineNumber}:C{pos.column}
                  </span>
                </div>
              ))
            )}
          </div>
        </aside>
                <main style={centerPanel}>
          <div style={editorTop}>
            <div style={tab}>
              <span style={tabDot}></span>
              solution.{language === "javascript" ? "js" : language}
            </div>

            <div style={toolbar}>
              <select value={language} onChange={handleLanguageChange} style={select}>
                <option value="javascript">JavaScript</option>
                <option value="cpp">C++</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
              </select>

              <button onClick={runCode} style={primaryButton}>
                ▶ Run
              </button>

              {roomType === "interview" && (
                <button onClick={runTests} style={successButton}>
                  🧪 Tests
                </button>
              )}

              <input
                placeholder="Search..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={searchInput}
              />

              <button onClick={handleSearch} style={ghostButton}>
                Search
              </button>
            </div>
          </div>

          <div style={editorBox}>
            <MonacoEditor
              height="100%"
              language={language}
              theme="vs-dark"
              value={code}
              onChange={handleChange}
              onMount={(editor) => {
                editorRef.current = editor;

                editor.onDidChangeCursorPosition((e) => {
                  socket.emit("cursor-move", {
                    roomId,
                    username,
                    lineNumber: e.position.lineNumber,
                    column: e.position.column,
                  });
                });
              }}
            />
          </div>

          <div style={outputBox}>
            <div style={cardHeader}>
              <span>⌨ Output</span>
              <span style={mutedText}>Runtime Console</span>
            </div>

            <pre style={outputText}>{output}</pre>
          </div>
        </main>

        <aside style={rightPanel}>
          <div style={chatHeader}>
            <div>
              <h3 style={{ margin: 0 }}>💬 Room Chat</h3>
              <p style={mutedParagraph}>Talk while coding together</p>
            </div>
          </div>

          <div style={chatMessages}>
            {messages.map((msg, index) => (
              <div key={index} style={messageBubble}>
                <div style={messageTop}>
                  <b>{msg.sender}</b>
                  <span style={timeText}>{msg.time}</span>
                </div>
                <p style={messageText}>{msg.message}</p>
              </div>
            ))}
          </div>

          <div style={chatInputRow}>
            <input
              placeholder="Write a message..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              style={chatInput}
            />

            <button onClick={sendMessage} style={primaryButton}>
              Send
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

const page = {
  minHeight: "100vh",
  width: "100%",
  background:
    "radial-gradient(circle at top left, #0f172a 0%, #020617 45%, #000 100%)",
  color: "white",
  fontFamily: "Inter, Arial, sans-serif",
  padding: "8px",
  boxSizing: "border-box",
};

const topBar = {
  height: "76px",
  background: "rgba(15, 23, 42, 0.9)",
  border: "1px solid rgba(148,163,184,0.2)",
  borderRadius: "22px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 22px",
  marginBottom: "18px",
  boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
};

const brandBlock = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
};

const logoBox = {
  height: "44px",
  width: "44px",
  borderRadius: "14px",
  background: "linear-gradient(135deg, #2563eb, #7c3aed)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "900",
};

const brandTitle = {
  margin: 0,
  fontSize: "22px",
};

const brandSubtitle = {
  margin: "4px 0 0",
  color: "#94a3b8",
  fontSize: "13px",
};

const topCenter = {
  display: "flex",
  gap: "10px",
  alignItems: "center",
  flexWrap: "wrap",
  justifyContent: "center",
};

const liveDot = {
  color: "#22c55e",
  background: "rgba(34,197,94,0.12)",
  border: "1px solid rgba(34,197,94,0.35)",
  padding: "8px 12px",
  borderRadius: "999px",
  fontSize: "13px",
  fontWeight: "800",
};

const topPill = {
  background: "#020617",
  border: "1px solid #1e293b",
  padding: "8px 12px",
  borderRadius: "999px",
  color: "#e5e7eb",
  fontSize: "13px",
};

const topButtons = {
  display: "flex",
  gap: "10px",
};

const workspace = {
  display: "grid",
  gridTemplateColumns: "240px minmax(0, 1fr) 260px",
  gap: "10px",
  alignItems: "stretch",
};

const leftPanel = {
  display: "flex",
  flexDirection: "column",
  gap: "14px",
};

const centerPanel = {
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
};

const rightPanel = {
  background: "rgba(15,23,42,0.88)",
  border: "1px solid rgba(148,163,184,0.2)",
  borderRadius: "22px",
  padding: "16px",
  display: "flex",
  flexDirection: "column",
  height: "100%",
};

const card = {
  background: "rgba(15,23,42,0.88)",
  border: "1px solid rgba(148,163,184,0.2)",
  borderRadius: "22px",
  padding: "16px",
  boxShadow: "0 16px 35px rgba(0,0,0,0.22)",
};

const cardHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontWeight: "800",
  marginBottom: "12px",
};

const mutedText = {
  color: "#94a3b8",
  fontSize: "12px",
  fontWeight: "500",
};

const mutedParagraph = {
  color: "#94a3b8",
  margin: "6px 0 0",
  fontSize: "13px",
};

const problemTextarea = {
  width: "100%",
  minHeight: "120px",
  background: "#020617",
  border: "1px solid #1e293b",
  color: "white",
  borderRadius: "14px",
  padding: "12px",
  boxSizing: "border-box",
  resize: "vertical",
  outline: "none",
};

const problemPreview = {
  background: "#020617",
  border: "1px solid #1e293b",
  color: "#e5e7eb",
  borderRadius: "14px",
  padding: "12px",
  lineHeight: "1.6",
};

const timerCircle = {
  height: "145px",
  width: "145px",
  borderRadius: "50%",
  margin: "8px auto 14px",
  background:
    "radial-gradient(circle, rgba(56,189,248,0.22), rgba(2,6,23,1) 70%)",
  border: "1px solid rgba(56,189,248,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 0 35px rgba(56,189,248,0.18)",
};

const timerText = {
  fontSize: "30px",
  fontWeight: "900",
  color: "#7dd3fc",
};

const input = {
  width: "100%",
  boxSizing: "border-box",
  background: "#020617",
  border: "1px solid #1e293b",
  color: "white",
  borderRadius: "12px",
  padding: "11px",
  marginBottom: "10px",
  outline: "none",
};

const timerButtons = {
  display: "flex",
  gap: "10px",
};

const userRow = {
  background: "#020617",
  border: "1px solid #1e293b",
  borderRadius: "12px",
  padding: "10px",
  marginBottom: "8px",
  display: "flex",
  alignItems: "center",
  gap: "9px",
  fontSize: "14px",
};

const avatar = {
  color: "#22c55e",
};

const emptyText = {
  color: "#94a3b8",
  fontSize: "13px",
  margin: 0,
};

const editorTop = {
  background: "rgba(15,23,42,0.92)",
  border: "1px solid rgba(148,163,184,0.2)",
  borderRadius: "22px 22px 0 0",
  padding: "12px",
};

const tab = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  background: "#020617",
  border: "1px solid #1e293b",
  borderRadius: "12px",
  padding: "10px 14px",
  marginBottom: "12px",
  color: "#cbd5e1",
};

const tabDot = {
  height: "9px",
  width: "9px",
  borderRadius: "50%",
  background: "#38bdf8",
};

const toolbar = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  alignItems: "center",
};

const editorBox = {
  height: "58vh",
  borderLeft: "1px solid rgba(148,163,184,0.2)",
  borderRight: "1px solid rgba(148,163,184,0.2)",
  overflow: "hidden",
};

const outputBox = {
  background: "rgba(15,23,42,0.92)",
  border: "1px solid rgba(148,163,184,0.2)",
  borderRadius: "0 0 22px 22px",
  padding: "14px",
};

const outputText = {
  margin: 0,
  minHeight: "105px",
  maxHeight: "145px",
  overflowY: "auto",
  background: "#020617",
  border: "1px solid #1e293b",
  color: "#bbf7d0",
  borderRadius: "14px",
  padding: "13px",
  whiteSpace: "pre-wrap",
};

const select = {
  background: "#020617",
  color: "white",
  border: "1px solid #1e293b",
  borderRadius: "12px",
  padding: "10px",
  outline: "none",
};

const primaryButton = {
  background: "linear-gradient(135deg, #2563eb, #38bdf8)",
  color: "white",
  border: "none",
  borderRadius: "12px",
  padding: "10px 14px",
  fontWeight: "800",
  cursor: "pointer",
};

const successButton = {
  background: "linear-gradient(135deg, #16a34a, #22c55e)",
  color: "white",
  border: "none",
  borderRadius: "12px",
  padding: "10px 14px",
  fontWeight: "800",
  cursor: "pointer",
};

const outlineButton = {
  marginTop: "10px",
  background: "transparent",
  color: "#38bdf8",
  border: "1px solid #38bdf8",
  borderRadius: "12px",
  padding: "10px 14px",
  fontWeight: "800",
  cursor: "pointer",
};

const ghostButton = {
  background: "#020617",
  color: "#cbd5e1",
  border: "1px solid #1e293b",
  borderRadius: "12px",
  padding: "10px 14px",
  fontWeight: "700",
  cursor: "pointer",
};

const dangerButton = {
  background: "rgba(239,68,68,0.12)",
  color: "#fca5a5",
  border: "1px solid rgba(239,68,68,0.35)",
  borderRadius: "12px",
  padding: "10px 14px",
  fontWeight: "800",
  cursor: "pointer",
};

const searchInput = {
  background: "#020617",
  color: "white",
  border: "1px solid #1e293b",
  borderRadius: "12px",
  padding: "10px",
  outline: "none",
  marginLeft: "auto",
};

const chatHeader = {
  marginBottom: "14px",
};

const chatMessages = {
  flex: 1,
  overflowY: "auto",
  paddingRight: "4px",
  marginBottom: "12px",
};

const messageBubble = {
  background: "#020617",
  border: "1px solid #1e293b",
  borderRadius: "14px",
  padding: "11px",
  marginBottom: "10px",
};

const messageTop = {
  display: "flex",
  justifyContent: "space-between",
  gap: "8px",
};

const timeText = {
  color: "#94a3b8",
  fontSize: "11px",
};

const messageText = {
  margin: "6px 0 0",
  color: "#e5e7eb",
};

const chatInputRow = {
  display: "flex",
  gap: "8px",
};

const chatInput = {
  flex: 1,
  background: "#020617",
  color: "white",
  border: "1px solid #1e293b",
  borderRadius: "12px",
  padding: "10px",
  outline: "none",
};

export default CodeEditor;