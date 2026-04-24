/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-refresh/only-export-components */
// SocketContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";
import { baseURL } from "../services/api/api-client";

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    let newSocket: Socket | null = null;

    if (isAuthenticated && user?.id) {
      console.log("🟢 Connecting socket for user:", user.id);

      newSocket = io(baseURL, {
        query: { userId: user.id },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // Connection event handlers
      newSocket.on("connect", () => {
        console.log("✅ Socket connected successfully");
      });

      newSocket.on("connect_error", (error) => {
        console.error("❌ Socket connection error:", error);
      });

      newSocket.on("disconnect", (reason) => {
        console.log("🔌 Socket disconnected:", reason);
      });

      newSocket.on("connected", (data) => {
        console.log("📡 Socket server confirmation:", data);
      });

      setSocket(newSocket);
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }

    return () => {
      if (newSocket) {
        console.log("🧹 Cleaning up socket connection");
        newSocket.disconnect();
      }
    };
  }, [isAuthenticated, user?.id]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
