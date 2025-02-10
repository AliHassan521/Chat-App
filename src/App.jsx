import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import "./App.css"; // Import the CSS file for styling

function App() {
  const [session, setSession] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [usersOnline, setUsersOnline] = useState([]);

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
    const { error } = await supabase.auth.signOut();
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
    if (!newMessage.trim()) return; // Prevent empty messages

    supabase.channel("room_one").send({
      type: "broadcast",
      event: "message",
      payload: {
        message: newMessage,
        user_name: session?.user?.user_metadata?.email,
        avatar: session?.user?.user_metadata?.avatar_url,
        timestamp: new Date().toISOString(),
      },
    });
    setNewMessage("");
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
        {/* Header */}
        <div className="chat-header">
          <div className="header-content">
            <p className="user-email">{session?.user?.user_metadata?.email}</p>
            <p className="online-users">{usersOnline.length} users online</p>
          </div>
          <button onClick={signOut} className="sign-out-button">
            Sign out
          </button>
        </div>

        {/* Chat Messages */}
        <div ref={chatContainerRef} className="chat-messages">
          {messages.map((msg, idx) => (
            <div
              key={idx}
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
                <div className="message-text">{msg.message}</div>
                <div className="timestamp">{formatTime(msg?.timestamp)}</div>
              </div>

              {/* Avatar for sent messages */}
              {msg?.user_name === session?.user?.email && (
                <img src={msg?.avatar} alt="avatar" className="avatar" />
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
            Send
          </button>
        </form>
      </div>
    );
  }
}

export default App;