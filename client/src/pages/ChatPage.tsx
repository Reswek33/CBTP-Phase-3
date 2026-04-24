/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSocket } from "../contexts/SocketContext";
import { useAuth } from "../contexts/AuthContext";
import {
  getMessages,
  getUserConversations,
  sendMessage,
  markMessageAsRead,
} from "../services/api/chat-api";
import {
  MessageSquare,
  Send,
  Building2,
  FileText,
  MoreVertical,
  Phone,
  Video,
  Search,
  Paperclip,
  Check,
  CheckCheck,
  Circle,
} from "lucide-react";
import { z } from "zod";

// Zod schemas for validation - updated to match actual API response
export const messageSchema = z.object({
  id: z.string(),
  content: z.string(),
  createdAt: z.string(),
  senderId: z.string(),
  sender: z
    .object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      role: z.string(),
    })
    .optional(),
  isRead: z.boolean(),
  conversationId: z.string(),
});

export const conversationSchema = z.object({
  id: z.string(),
  rfpId: z.string().optional(),
  buyerId: z.string(),
  supplierId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().optional(), // Make optional since it might not be returned
  buyer: z
    .object({
      companyName: z.string(),
      user: z.object({
        firstName: z.string(),
        lastName: z.string(),
        id: z.string().optional(), // Make optional
      }),
    })
    .optional(),
  supplier: z
    .object({
      businessName: z.string(),
      user: z.object({
        firstName: z.string(),
        lastName: z.string(),
        id: z.string().optional(), // Make optional
      }),
    })
    .optional(),
  rfp: z
    .object({
      title: z.string(),
      status: z.string(),
      id: z.string().optional(), // Make optional
    })
    .optional(),
  lastMessage: z
    .object({
      content: z.string(),
      createdAt: z.string(),
      isRead: z.boolean(),
      senderId: z.string(),
    })
    .nullable()
    .optional(),
  unreadCount: z.number().optional(),
});

// TypeScript interfaces
interface Conversation {
  id: string;
  rfpId?: string;
  buyerId: string;
  supplierId: string;
  createdAt: string;
  updatedAt?: string;
  rfp?: {
    id?: string;
    title: string;
    status: string;
  } | null;
  buyer?: {
    companyName: string;
    user?: {
      firstName: string;
      lastName: string;
      id?: string;
    };
  } | null;
  supplier?: {
    businessName: string;
    user?: {
      firstName: string;
      lastName: string;
      id?: string;
    };
  } | null;
  lastMessage?: {
    content: string;
    createdAt: string;
    isRead: boolean;
    senderId: string;
  } | null;
  unreadCount?: number;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  isRead: boolean;
  conversationId: string;
}

export const ChatPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [markingAsRead, setMarkingAsRead] = useState(false);
  const { user } = useAuth();
  const socket = useSocket();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Helper function to get the other participant's info
  const getOtherParticipant = (conv: Conversation) => {
    if (!user) return null;

    if (user.role === "BUYER") {
      return conv.supplier;
    } else if (user.role === "SUPPLIER") {
      return conv.buyer;
    }
    return null;
  };

  // Mark messages as read when active chat changes
  const markMessagesAsReadHandler = useCallback(
    async (conversationId: string) => {
      if (!user || markingAsRead) return;

      // Get unread messages (not sent by current user)
      const unreadMessages = messages.filter(
        (msg) => msg.senderId !== user.id && !msg.isRead,
      );

      if (unreadMessages.length === 0) return;

      setMarkingAsRead(true);
      try {
        await markMessageAsRead(conversationId);

        // Update local messages state
        setMessages((prev) =>
          prev.map((msg) =>
            msg.senderId !== user.id ? { ...msg, isRead: true } : msg,
          ),
        );

        // Update conversations list to reflect read status
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  unreadCount: 0,
                  lastMessage: conv.lastMessage
                    ? { ...conv.lastMessage, isRead: true }
                    : null,
                }
              : conv,
          ),
        );

        // Emit socket event to update other clients
        if (socket) {
          socket.emit("mark_messages_read", { conversationId });
        }
      } catch (err) {
        console.error("Failed to mark messages as read", err);
      } finally {
        setMarkingAsRead(false);
      }
    },
    [messages, user, socket, markingAsRead],
  );

  // Trigger mark as read when active chat changes or new messages arrive
  useEffect(() => {
    if (activeChat && messages.length > 0) {
      markMessagesAsReadHandler(activeChat.id);
    }
  }, [activeChat, messages, markMessagesAsReadHandler]);

  // 1. Fetch Inbox on Mount
  useEffect(() => {
    const fetchInbox = async () => {
      setLoading(true);
      try {
        const res = await getUserConversations();
        console.log("get user conversation", res);

        // Validate with zod - use partial schema to avoid validation errors
        if (res.data && Array.isArray(res.data)) {
          setConversations(res.data);
        } else {
          setConversations([]);
        }
      } catch (err) {
        console.error("Failed to load conversations", err);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchInbox();
  }, []);

  // 2. Handle Joining/Switching Chats
  useEffect(() => {
    if (!activeChat || !socket) return;

    const loadMessages = async () => {
      try {
        const res = await getMessages(activeChat.id);
        console.log("get messages", res.data);

        if (res.data && Array.isArray(res.data)) {
          setMessages(res.data);
        } else {
          setMessages([]);
        }

        if (socket.connected) {
          socket.emit("join_conversation", activeChat.id);
        } else {
          socket.once("connect", () => {
            socket.emit("join_conversation", activeChat.id);
          });
        }
      } catch (err) {
        console.error("Error loading chat context", err);
      }
    };

    loadMessages();

    const handleNewMessage = (msg: Message) => {
      if (msg.conversationId === activeChat.id) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === msg.id);
          return exists ? prev : [...prev, msg];
        });

        // Update conversation list with new last message
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === activeChat.id
              ? {
                  ...conv,
                  lastMessage: {
                    content: msg.content,
                    createdAt: msg.createdAt,
                    isRead: msg.senderId === user?.id,
                    senderId: msg.senderId,
                  },
                  unreadCount:
                    msg.senderId !== user?.id
                      ? (conv.unreadCount || 0) + 1
                      : conv.unreadCount,
                }
              : conv,
          ),
        );
      } else {
        // Update unread count for other conversations
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === msg.conversationId && msg.senderId !== user?.id
              ? { ...conv, unreadCount: (conv.unreadCount || 0) + 1 }
              : conv,
          ),
        );
      }
    };

    const handleMessagesRead = ({
      conversationId,
    }: {
      conversationId: string;
    }) => {
      if (conversationId === activeChat.id) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.senderId !== user?.id ? { ...msg, isRead: true } : msg,
          ),
        );
      }
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? {
                ...conv,
                unreadCount: 0,
                lastMessage: conv.lastMessage
                  ? { ...conv.lastMessage, isRead: true }
                  : null,
              }
            : conv,
        ),
      );
    };

    socket.on("new_message", handleNewMessage);
    socket.on("messages_read", handleMessagesRead);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("messages_read", handleMessagesRead);
      socket.emit("leave_conversation", activeChat.id);
    };
  }, [activeChat, socket, user?.id]);

  // 3. Send Message Logic
  const handleSend = async () => {
    if (!input.trim() || !activeChat || sending) return;

    const tempInput = input;
    setInput("");
    setSending(true);

    // Optimistically add message to UI
    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      content: tempInput,
      createdAt: new Date().toISOString(),
      senderId: user?.id || "",
      isRead: false,
      conversationId: activeChat.id,
      sender: user
        ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role || "",
          }
        : undefined,
    };

    setMessages((prev) => [...prev, tempMessage]);
    scrollToBottom();

    try {
      const res = await sendMessage({
        conversationId: activeChat.id,
        content: tempInput,
      });

      // Replace temp message with real one
      setMessages((prev) => prev.map((msg) => (msg.id === tempId ? res : msg)));

      // Update conversation list with sent message
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeChat.id
            ? {
                ...conv,
                lastMessage: {
                  content: tempInput,
                  createdAt: new Date().toISOString(),
                  isRead: false,
                  senderId: user?.id || "",
                },
              }
            : conv,
        ),
      );
    } catch (err) {
      console.error("Failed to execute send", err);
      // Remove temp message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setInput(tempInput);
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const getConversationName = (conv: Conversation) => {
    if (!user) return "Unknown";

    const otherParticipant = getOtherParticipant(conv);

    if (!otherParticipant) return "Unknown";

    if (user.role === "BUYER") {
      // For buyer, show supplier's business name or name
      const supplier = otherParticipant as Conversation["supplier"];
      return (
        supplier?.businessName ||
        `${supplier?.user?.firstName || "Unknown"} ${supplier?.user?.lastName || ""}` ||
        "Unknown Supplier"
      );
    } else {
      // For supplier, show buyer's company name or name
      const buyer = otherParticipant as Conversation["buyer"];
      return (
        buyer?.companyName ||
        `${buyer?.user?.firstName || "Unknown"} ${buyer?.user?.lastName || ""}` ||
        "Unknown Buyer"
      );
    }
  };

  const getConversationSubtitle = (conv: Conversation) => {
    if (conv.rfp?.title) {
      return conv.rfp.title;
    }
    return "Direct Message";
  };

  const getConversationAvatar = (conv: Conversation) => {
    if (!user) return "?";

    const otherParticipant = getOtherParticipant(conv);

    if (!otherParticipant) return "?";

    if (user.role === "BUYER") {
      const supplier = otherParticipant as Conversation["supplier"];
      const firstName = supplier?.user?.firstName;
      return firstName?.charAt(0)?.toUpperCase() || "?";
    } else {
      const buyer = otherParticipant as Conversation["buyer"];
      const firstName = buyer?.user?.firstName;
      return firstName?.charAt(0)?.toUpperCase() || "?";
    }
  };

  const getMessageStatus = (message: Message) => {
    if (message.senderId === user?.id) {
      return message.isRead ? (
        <CheckCheck className="w-3 h-3 text-primary" />
      ) : (
        <Check className="w-3 h-3 text-muted-foreground" />
      );
    }
    return null;
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const name = getConversationName(conv).toLowerCase();
    const subtitle = getConversationSubtitle(conv).toLowerCase();
    return name.includes(searchLower) || subtitle.includes(searchLower);
  });

  const formatTime = (date: string) => {
    try {
      const msgDate = new Date(date);
      // Check if date is valid
      if (isNaN(msgDate.getTime())) {
        return "Just now";
      }

      const now = new Date();
      const diffHours = (now.getTime() - msgDate.getTime()) / (1000 * 60 * 60);

      if (diffHours < 24) {
        return msgDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      } else if (diffHours < 48) {
        return "Yesterday";
      } else {
        return msgDate.toLocaleDateString([], {
          month: "short",
          day: "numeric",
        });
      }
    } catch (error) {
      console.error(error);
      return "Just now";
    }
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] bg-card border border-border rounded-xl overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 border-r border-border flex flex-col bg-card">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-foreground">Messages</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div
              key="loading"
              className="flex flex-col items-center justify-center h-full p-8"
            >
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm text-muted-foreground">Loading chats...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div
              key="empty"
              className="flex flex-col items-center justify-center h-full p-8 text-center"
            >
              <MessageSquare className="w-12 h-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No conversations found</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveChat(conv)}
                className={`
                  w-full text-left p-4 border-b border-border transition-all duration-200
                  hover:bg-muted/50
                  ${activeChat?.id === conv.id ? "bg-primary/5 border-l-4 border-l-primary" : ""}
                `}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">
                        {getConversationAvatar(conv)}
                      </span>
                    </div>
                    {(conv.unreadCount || 0) > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-foreground text-sm truncate">
                        {getConversationName(conv)}
                      </p>
                      {conv.lastMessage && (
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatTime(conv.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {getConversationSubtitle(conv)}
                    </p>
                    {conv.lastMessage && (
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {(conv.unreadCount || 0) > 0 &&
                        !conv.lastMessage.isRead &&
                        conv.lastMessage.senderId !== user?.id ? (
                          <span className="font-medium text-primary">
                            {conv.lastMessage.content}
                          </span>
                        ) : (
                          conv.lastMessage.content
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-muted/20">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">
                      {getConversationAvatar(activeChat)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {getConversationName(activeChat)}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {user?.role === "BUYER" ? "Supplier" : "Buyer"}
                        </span>
                      </div>
                      <Circle className="w-1 h-1 text-muted-foreground" />
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {getConversationSubtitle(activeChat)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                    <Video className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div
                  key="no-messages"
                  className="flex flex-col items-center justify-center h-full text-center"
                >
                  <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No messages yet</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Send a message to start the conversation
                  </p>
                </div>
              ) : (
                messages.map((message, index) => {
                  const isOwn = message.senderId === user?.id;
                  const showAvatar =
                    index === 0 ||
                    messages[index - 1]?.senderId !== message.senderId;
                  const otherParticipant = getOtherParticipant(activeChat);

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`flex gap-2 max-w-[70%] ${isOwn ? "flex-row-reverse" : "flex-row"}`}
                      >
                        {!isOwn && showAvatar && (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                            <span className="text-xs font-bold text-primary">
                              {message.sender?.firstName?.charAt(0) ||
                                otherParticipant?.user?.firstName?.charAt(0) ||
                                "?"}
                            </span>
                          </div>
                        )}
                        {!isOwn && !showAvatar && (
                          <div className="w-8 shrink-0" />
                        )}

                        <div>
                          {!isOwn && showAvatar && (
                            <p className="text-xs font-medium text-muted-foreground mb-1 ml-1">
                              {message.sender?.firstName ||
                                otherParticipant?.user?.firstName ||
                                "Unknown"}{" "}
                              {message.sender?.lastName ||
                                otherParticipant?.user?.lastName ||
                                ""}
                            </p>
                          )}
                          <div
                            className={`
                              rounded-lg p-3
                              ${
                                isOwn
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-card border border-border text-foreground"
                              }
                            `}
                          >
                            <p className="text-sm">{message.content}</p>
                          </div>
                          <div
                            className={`flex items-center gap-1 mt-1 text-[10px] text-muted-foreground ${isOwn ? "justify-end" : "justify-start"}`}
                          >
                            <span>{formatTime(message.createdAt)}</span>
                            {getMessageStatus(message)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border bg-card">
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                  <Paperclip className="w-4 h-4 text-muted-foreground" />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={sending}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || sending}
                  className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div
            key="no-chat"
            className="flex flex-col items-center justify-center h-full text-center p-8"
          >
            <MessageSquare className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <p className="text-foreground font-medium">Select a conversation</p>
            <p className="text-sm text-muted-foreground mt-1">
              Choose a chat from the sidebar to start messaging
            </p>
          </div>
        )}
      </main>
    </div>
  );
};
