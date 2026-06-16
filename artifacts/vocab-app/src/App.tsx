import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Study from "@/pages/study";
import Quiz from "@/pages/quiz";
import Words from "@/pages/words";
import WordNew from "@/pages/word-new";
import WordDetail from "@/pages/word-detail";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/study" component={Study} />
      <Route path="/quiz" component={Quiz} />
      <Route path="/words/new" component={WordNew} />
      <Route path="/words/:id">
        {(params) => <WordDetail id={parseInt(params.id, 10)} />}
      </Route>
      <Route path="/words" component={Words} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
