import React from "react";
import { Link, useLocation } from "wouter";
import { Book, LayoutDashboard, BrainCircuit, GraduationCap, PlusCircle } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/study", label: "Study", icon: BrainCircuit },
    { href: "/quiz", label: "Quiz", icon: GraduationCap },
    { href: "/words", label: "Vocabulary", icon: Book },
    { href: "/words/new", label: "Add Word", icon: PlusCircle },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2 text-primary font-serif text-2xl font-bold">
            <Book className="w-6 h-6" />
            Lexify
          </Link>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                  isActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 p-6 md:p-12 overflow-auto">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
