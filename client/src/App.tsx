import "./App.css";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { router } from "./router";
import { SocketProvider } from "./contexts/SocketContext";
import { ThemeProvider } from "./components/theme-provider";
import { UiProvider } from "./contexts/UiContext";

import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <ThemeProvider>
      <UiProvider>
        <AuthProvider>
          <SocketProvider>
            <RouterProvider router={router} />
            <Toaster />
          </SocketProvider>
        </AuthProvider>
      </UiProvider>
    </ThemeProvider>
  );
}

export default App;
