import { useAuth } from "@/lib/auth-context";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Login() {
  const { signInWithGoogle, redirecting, authError } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Logo + branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-lg shadow-primary/30 mx-auto">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Lexify</h1>
            <p className="text-muted-foreground mt-1">🌟 Học từ vựng thông minh – Ghi nhớ dài lâu 💚</p>
          </div>
        </div>

        {/* Login card */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground">Chào mừng trở lại!</h2>
            <p className="text-sm text-muted-foreground mt-1">Đăng nhập để tiếp tục hành trình học từ vựng</p>
          </div>

          <Button
            size="lg"
            variant="outline"
            className="w-full gap-3 text-base font-medium h-12 rounded-xl border-border hover:bg-muted/50"
            onClick={signInWithGoogle}
            disabled={redirecting}
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {redirecting ? "Đang chuyển hướng..." : "Đăng nhập với Google"}
          </Button>

          {authError && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3">
              <p className="text-xs text-destructive leading-relaxed">{authError}</p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Từ vựng của bạn được lưu riêng tư theo tài khoản Google.
        </p>
      </div>
    </div>
  );
}
