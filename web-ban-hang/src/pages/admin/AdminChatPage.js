import React, { useState, useEffect, useRef } from "react";
import SEO from "../../components/common/SEO";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  addDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAppContext } from "../../context/AppContext";
import { Send, MessageSquare, User } from "lucide-react";
import Spinner from "../../components/common/Spinner";

const AdminChatPage = () => {
  const { user, userData } = useAppContext();
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Lấy danh sách các cuộc trò chuyện
  useEffect(() => {
    const q = query(
      collection(db, "conversations"),
      orderBy("timestamp", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setConversations(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Lấy tin nhắn của cuộc trò chuyện được chọn
  useEffect(() => {
    if (!selectedConv) return;

    const messagesQuery = query(
      collection(db, "conversations", selectedConv.id, "messages"),
      orderBy("timestamp")
    );
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => doc.data()));
    });

    // Đánh dấu đã đọc
    const convRef = doc(db, "conversations", selectedConv.id);
    updateDoc(convRef, { isReadByAdmin: true });

    return () => unsubscribe();
  }, [selectedConv]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (reply.trim() === "" || !selectedConv) return;

    const convRef = doc(db, "conversations", selectedConv.id);
    const messagesCol = collection(convRef, "messages");

    await addDoc(messagesCol, {
      text: reply,
      senderId: user.uid, // ID của admin
      senderName: userData?.displayName || "Admin",
      timestamp: serverTimestamp(),
    });

    await updateDoc(convRef, {
      lastMessage: reply,
      timestamp: serverTimestamp(),
    });

    setReply("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) return <Spinner />;

  return (
    <>
      <SEO title="Hỗ trợ khách hàng" />
      <div className="flex h-[calc(100vh-120px)] bg-white dark:bg-gray-800 rounded-lg shadow-md">
        {/* Conversation List */}
        <div className="w-1/3 border-r dark:border-gray-700 overflow-y-auto">
          <h2 className="p-4 font-bold text-lg border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
            Các cuộc trò chuyện
          </h2>
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setSelectedConv(conv)}
              className={`p-4 cursor-pointer border-b dark:border-gray-700 flex items-start gap-3 ${
                selectedConv?.id === conv.id
                  ? "bg-gray-100 dark:bg-gray-700"
                  : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
              }`}
            >
              <div
                className={`mt-1 p-1 rounded-full ${
                  !conv.isReadByAdmin ? "bg-blue-500" : ""
                }`}
              ></div>
              <div className="flex-grow overflow-hidden">
                <p
                  className={`truncate ${
                    !conv.isReadByAdmin ? "font-bold" : ""
                  }`}
                >
                  {conv.customerName}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {conv.lastMessage}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Window */}
        <div className="w-2/3 flex flex-col">
          {selectedConv ? (
            <>
              <div className="p-4 border-b dark:border-gray-700">
                <h3 className="font-bold flex items-center gap-2">
                  <User size={18} /> {selectedConv.customerName}
                </h3>
              </div>
              <div className="flex-grow p-4 overflow-y-auto flex flex-col gap-3">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`p-2 px-4 rounded-lg max-w-lg ${
                      msg.senderId !== user.uid
                        ? "bg-gray-200 dark:bg-gray-600 self-start"
                        : "bg-blue-500 text-white self-end"
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form
                className="p-4 border-t dark:border-gray-700 flex gap-2"
                onSubmit={handleReply}
              >
                <input
                  type="text"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Nhập câu trả lời..."
                  className="flex-grow p-2 border rounded-md dark:bg-gray-700"
                />
                <button
                  type="submit"
                  className="p-2 bg-blue-600 text-white rounded-md"
                >
                  <Send size={20} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <MessageSquare size={48} className="mb-4 text-gray-400" />
              <p className="text-lg font-semibold">Hộp thư hỗ trợ</p>
              <p>Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminChatPage;
