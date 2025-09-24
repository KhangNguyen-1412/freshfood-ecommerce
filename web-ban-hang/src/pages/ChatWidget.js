import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAppContext } from "../context/AppContext";
import { MessageSquare, X, Send } from "lucide-react";
import "../styles/ChatWidget.css";

const ChatWidget = () => {
  const { user, userData } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Lắng nghe hoặc tạo cuộc trò chuyện
  useEffect(() => {
    if (!isOpen || !user) return;

    const getOrCreateConversation = async () => {
      // Dùng UID của user làm ID cho document conversation để dễ truy vấn
      const convRef = doc(db, "conversations", user.uid);
      setConversationId(user.uid);

      // Lắng nghe tin nhắn trong sub-collection
      const messagesQuery = query(
        collection(convRef, "messages"),
        orderBy("timestamp")
      );
      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const msgs = snapshot.docs.map((doc) => doc.data());
        setMessages(msgs);
      });

      return unsubscribe;
    };

    const unsubscribePromise = getOrCreateConversation();

    return () => {
      unsubscribePromise.then((unsubscribe) => unsubscribe && unsubscribe());
    };
  }, [isOpen, user]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !conversationId) return;

    const convRef = doc(db, "conversations", conversationId);
    const messagesCol = collection(convRef, "messages");

    await addDoc(messagesCol, {
      text: newMessage,
      senderId: user.uid,
      senderName: userData?.displayName || "Khách",
      timestamp: serverTimestamp(),
    });

    // Cập nhật tin nhắn cuối cùng để admin thấy
    await setDoc(
      convRef,
      {
        lastMessage: newMessage,
        timestamp: serverTimestamp(),
        customerName: userData?.displayName || "Khách",
        customerId: user.uid,
        isReadByAdmin: false,
      },
      { merge: true }
    );

    setNewMessage("");
  };

  if (!user) return null; // Chỉ hiện khi đã đăng nhập

  return (
    <div className="chat-widget-container">
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <h3>Hỗ trợ trực tuyến</h3>
            <button onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${
                  msg.senderId === user.uid ? "sent" : "received"
                }`}
              >
                <p>{msg.text}</p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form className="chat-input-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Nhập tin nhắn..."
            />
            <button type="submit">
              <Send size={20} />
            </button>
          </form>
        </div>
      )}
      <button className="chat-toggle-button" onClick={() => setIsOpen(!isOpen)}>
        <MessageSquare size={28} />
      </button>
    </div>
  );
};

export default ChatWidget;
