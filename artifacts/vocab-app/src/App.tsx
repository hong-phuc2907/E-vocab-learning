import { Switch, Route } from "wouter"; // ✅ Đã sửa chữ i viết thường
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import {
  AuthProvider,
  useAuth,
} from "@/lib/auth-context";

import Login from "@/pages/login";
import Home from "@/pages/home";
import Study from "@/pages/study";
import Quiz from "@/pages/quiz";

import Words from "@/pages/words";
import WordNew from "@/pages/word-new";
import WordDetail from "@/pages/word-detail";
import WordEdit from "@/pages/word-edit";

import GroupsPage from "@/pages/groups";
import GroupDetail from "@/pages/group-detail";

const queryClient = new QueryClient();

// Bộ hứng lỗi trực quan dành riêng cho điện thoại
function MobileErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const errorHandler = (e: ErrorEvent) => {
      setHasError(true);
      setErrorMsg(e.message || "Lỗi Runtime không xác định");
    };
    window.addEventListener("error", errorHandler);
    return () => window.removeEventListener("error", errorHandler);
  }, []);

  if (hasError) {
    return (
      <div className="p-6 min-h-screen bg-red-50 text-red-900 font-mono text-xs overflow-auto">
        <h1 className="text-base font-bold text-red-700 mb-2">🚨 Ứng dụng bị sập ngầm!</h1>
        <p className="bg-white p-3 border border-red-200 rounded mb-4 font-semibold">{errorMsg}</p>
        <p className="text-gray-600">Mẹo: Hãy kiểm tra file code bạn vừa chỉnh sửa gần đây xem có biến nào bị null hoặc import sai tên không.</p>
      </div>
    );
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Home />
      </Route>

      <Route path="/study">
        <Study />
      </Route>

      <Route path="/quiz">
        <Quiz />
      </Route>

      <Route path="/groups">
        <GroupsPage />
      </Route>

      <Route path="/groups/:id">
        {(params) => (
          <GroupDetail id={params.id ?? ""} />
        )}
      </Route>

      <Route path="/words">
        <Words />
      </Route>

      <Route path="/words/new">
        <WordNew />
      </Route>

      <Route path="/words/edit/:id">
        {(params) => (
          <WordEdit id={params.id ?? ""} />
        )}
      </Route>

      <Route path="/words/:id">
        {(params) => (
          <WordDetail id={params.id ?? ""} />
        )}
      </Route>

      {/* Trang 404 bảo vệ */}
      <Route>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <h1 className="text-2xl font-bold text-foreground">
            404 - Không tìm thấy trang
          </h1>
        </div>
      </Route>
    </Switch>
  );
}

function AppShell() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground font-medium">
          Đang tải ứng dụng...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <Router />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MobileErrorBoundary>
          <AuthProvider>
            <AppShell />
          </AuthProvider>
          <Toaster />
        </MobileErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
