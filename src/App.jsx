import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { FaEdit, FaTrash, FaPaperPlane } from "react-icons/fa"; // Icons for edit, delete, and send
import "./App.css";

function App() {
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [usersOnline, setUsersOnline] = useState([]);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedMessage, setEditedMessage] = useState("");

  const chatContainerRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign in
  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    });
  };

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    if (!session?.user) {
      setUsersOnline([]);
      return;
    }

    const roomOne = supabase.channel("room_one", {
      config: {
        presence: {
          key: session?.user?.id,
        },
      },
    });

    roomOne.on("broadcast", { event: "message" }, (payload) => {
      setMessages((prevMessages) => [...prevMessages, payload.payload]);
    });

    // Track user presence
    roomOne.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await roomOne.track({
          id: session?.user?.id,
        });
      }
    });

    // Handle user presence
    roomOne.on("presence", { event: "sync" }, () => {
      const state = roomOne.presenceState();
      setUsersOnline(Object.keys(state));
    });

    return () => {
      roomOne.unsubscribe();
    };
  }, [session]);

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    supabase.channel("room_one").send({
      type: "broadcast",
      event: "message",
      payload: {
        id: Date.now(), // Unique ID for each message
        message: newMessage,
        user_name: session?.user?.user_metadata?.email,
        avatar: session?.user?.user_metadata?.avatar_url,
        timestamp: new Date().toISOString(),
      },
    });
    setNewMessage("");
  };

  // Delete message
  const deleteMessage = (id) => {
    setMessages((prevMessages) =>
      prevMessages.filter((msg) => msg.id !== id)
    );
  };

  // Edit message
  const editMessage = (id, newText) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === id ? { ...msg, message: newText } : msg
      )
    );
    setEditingMessageId(null);
    setEditedMessage("");
  };

  // Format timestamp
  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString("en-us", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Auto-scroll to the bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  if (!session) {
    return (
      <div className="auth-container">
        <button onClick={signIn} className="sign-in-button">
          Sign in with Google to chat
        </button>
      </div>
    );
  } else {
    return (
      <div className="chat-app">
        {/* Navigation Header */}
        <nav className="navbar">
          <div className="navbar-left">
            <h1 className="app-name">ChatApp</h1>
          </div>
          <div className="navbar-right">
            <div className="user-dropdown">
              <img
                src={session?.user?.user_metadata?.avatar_url}
                alt="avatar"
                className="user-avatar"
              />
              <div className="dropdown-content">
                <p>{session?.user?.user_metadata?.email}</p>
                <button onClick={signOut} className="dropdown-item">
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Chat Messages */}
        <div ref={chatContainerRef} className="chat-messages">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`message ${
                msg?.user_name === session?.user?.email
                  ? "message-sent"
                  : "message-received"
              }`}
            >
              {/* Avatar for received messages */}
              {msg?.user_name !== session?.user?.email && (
                <img src={msg?.avatar} alt="avatar" className="avatar" />
              )}

              {/* Message Content */}
              <div className="message-content">
                {editingMessageId === msg.id ? (
                  <input
                    type="text"
                    value={editedMessage}
                    onChange={(e) => setEditedMessage(e.target.value)}
                    onBlur={() => editMessage(msg.id, editedMessage)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        editMessage(msg.id, editedMessage);
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <div className="message-text">{msg.message}</div>
                )}
                <div className="timestamp">{formatTime(msg?.timestamp)}</div>
              </div>

              {/* Avatar for sent messages */}
              {msg?.user_name === session?.user?.email && (
                <img src={msg?.avatar} alt="avatar" className="avatar" />
              )}

              {/* Edit and Delete Buttons */}
              {msg?.user_name === session?.user?.email && (
                <div className="message-actions">
                  <button
                    onClick={() => {
                      setEditingMessageId(msg.id);
                      setEditedMessage(msg.message);
                    }}
                  >
                    <FaEdit />
                  </button>
                  <button onClick={() => deleteMessage(msg.id)}>
                    <FaTrash />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Message Input */}
        <form onSubmit={sendMessage} className="message-input">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            type="text"
            placeholder="Type a message..."
            className="input-field"
          />
          <button type="submit" className="send-button">
            <FaPaperPlane />
          </button>
        </form>
      </div>
    );
  }
}

export default App;