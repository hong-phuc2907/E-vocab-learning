import { Switch, Route } from "wouter";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

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

function Router() {
  return (
    <Switch>
      {/* SỬA LỖI CHÍ MẠNG: Chuyển toàn bộ component={...} sang dạng lồng chuẩn React */}
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
        <AuthProvider>
          <AppShell />
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
