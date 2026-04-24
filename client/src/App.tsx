import "./App.css";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { router } from "./router";
import { SocketProvider } from "./contexts/SocketContext";
import { ThemeProvider } from "./components/theme-provider";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <RouterProvider router={router} />
        </SocketProvider>
      </AuthProvider>{" "}
    </ThemeProvider>
  );
}

export default App;
