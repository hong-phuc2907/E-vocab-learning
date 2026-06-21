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

const queryClient =
  new QueryClient();

function Router() {
  return (
    <Switch>

      {/* Trang chủ */}
      <Route
        path="/"
        component={Home}
      />

      {/* Học */}
      <Route
        path="/study"
        component={Study}
      />

      {/* Quiz */}
      <Route
        path="/quiz"
        component={Quiz}
      />

      {/* Nhóm */}
      <Route
        path="/groups"
        component={GroupsPage}
      />

      <Route path="/groups/:id">
        {(params) => (
          <GroupDetail
            id={params.id}
          />
        )}
      </Route>

      {/* Từ vựng */}
      <Route
        path="/words"
        component={Words}
      />

      <Route
        path="/words/new"
        component={WordNew}
      />

      {/* Sửa từ */}
      <Route path="/words/:id/edit">
        {(params) => (
          <WordEdit
            id={params.id}
          />
        )}
      </Route>

      {/* Chi tiết từ */}
      <Route path="/words/:id">
        {(params) => (
          <WordDetail
            id={params.id}
          />
        )}
      </Route>

      {/* 404 */}
      <Route>
        <div className="min-h-screen flex items-center justify-center">
          <h1 className="text-2xl font-bold">
            404 - Không tìm thấy trang
          </h1>
        </div>
      </Route>

    </Switch>
  );
}

function AppShell() {
  const {
    user,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          Đang tải...
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
    <QueryClientProvider
      client={queryClient}
    >
      <TooltipProvider>

        <AuthProvider>
          <AppShell />
        </AuthProvider>

        <Toaster />

      </TooltipProvider>
    </QueryClientProvider>
  );
}
