import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { toast } from "sonner";

interface DialogState {
  isOpen: boolean;
  type: "confirm" | "prompt";
  title: string;
  message: string;
  defaultValue?: string;
  resolve?: (value: unknown) => void;
}

interface UiContextType {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
  };
  confirm: (message: string, title?: string) => Promise<boolean>;
  prompt: (message: string, title?: string, defaultValue?: string) => Promise<string | null>;
}

const UiContext = createContext<UiContextType | undefined>(undefined);

export const useUi = () => {
  const context = useContext(UiContext);
  if (!context) throw new Error("useUi must be used within a UiProvider");
  return context;
};

export const UiProvider = ({ children }: { children: ReactNode }) => {
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    type: "confirm",
    title: "",
    message: "",
  });
  const [promptValue, setPromptValue] = useState("");

  const toastObj = {
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message),
    info: (message: string) => toast.info(message),
  };

  const confirm = useCallback((message: string, title = "Confirm Action") => {
    return new Promise<boolean>((resolve) => {
      setDialog({ isOpen: true, type: "confirm", title, message, resolve: (val) => resolve(val as boolean) });
    });
  }, []);

  const prompt = useCallback((message: string, title = "Input Required", defaultValue = "") => {
    return new Promise<string | null>((resolve) => {
      setPromptValue(defaultValue);
      setDialog({ isOpen: true, type: "prompt", title, message, defaultValue, resolve: (val) => resolve(val as string | null) });
    });
  }, []);

  const handleDialogClose = (value: unknown) => {
    if (dialog.resolve) dialog.resolve(value);
    setDialog((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <UiContext.Provider value={{ toast: toastObj, confirm, prompt }}>
      {children}

      {/* Dialog Modal */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-2">{dialog.title}</h2>
              <p className="text-muted-foreground text-sm mb-6">{dialog.message}</p>

              {dialog.type === "prompt" && (
                <input
                  type="text"
                  autoFocus
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-6"
                  placeholder="Type here..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleDialogClose(promptValue);
                    if (e.key === "Escape") handleDialogClose(null);
                  }}
                />
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => handleDialogClose(dialog.type === "prompt" ? null : false)}
                  className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDialogClose(dialog.type === "prompt" ? promptValue : true)}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium"
                >
                  {dialog.type === "prompt" ? "Submit" : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </UiContext.Provider>
  );
};
