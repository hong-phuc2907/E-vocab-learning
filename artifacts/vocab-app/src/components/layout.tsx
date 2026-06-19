import React from "react";
import { Link, useLocation } from "wouter";
import {
BookOpen,
LayoutDashboard,
BrainCircuit,
GraduationCap,
PlusCircle,
LogOut,
ListOrdered,
FolderTree,
} from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export function Layout({
children,
}: {
children: React.ReactNode;
}) {
const [location] =
useLocation();

const {
user,
logout,
} = useAuth();

const navItems = [
{
href: "/",
label: "Trang chủ",
icon: LayoutDashboard,
},

{
  href: "/study",
  label: "Học bài",
  icon: BrainCircuit,
},

{
  href: "/quiz",
  label: "Kiểm tra",
  icon: GraduationCap,
},

{
  href: "/groups",
  label: "Nhóm từ vựng",
  icon: FolderTree,
},

{
  href: "/words",
  label: "Quản lý từ vựng",
  icon: ListOrdered,
},

{
  href: "/words/new",
  label: "Thêm từ mới",
  icon: PlusCircle,
},

];

return (
<div className="min-h-screen bg-background flex">
<aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 fixed inset-y-0 left-0 z-20">

    <div className="px-5 py-5 border-b border-sidebar-border">
      <Link
        href="/"
        className="flex items-center gap-3"
      >
        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-sm">
          <BookOpen className="w-5 h-5 text-white" />
        </div>

        <span className="font-bold text-xl text-foreground tracking-tight">
          Lexify
        </span>
      </Link>
    </div>

    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {navItems.map(
        (item) => {
          const isActive =
            location ===
              item.href ||
            (item.href !==
              "/" &&
              location.startsWith(
                item.href
              ));

          return (
            <Link
              key={
                item.href
              }
              href={
                item.href
              }
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />

              {item.label}
            </Link>
          );
        }
      )}
    </nav>

    <div className="px-3 py-4 border-t border-sidebar-border">
      <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-sidebar-accent mb-2">

        {user?.photoURL ? (
          <img
            src={
              user.photoURL
            }
            alt=""
            className="w-9 h-9 rounded-full ring-2 ring-primary/20"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
            {user?.displayName?.[0]?.toUpperCase() ??
              "?"}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {user?.displayName ??
              "Người dùng"}
          </p>

          <p className="text-xs text-muted-foreground truncate">
            {user?.email}
          </p>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-red-50 text-sm"
        onClick={
          logout
        }
      >
        <LogOut className="w-4 h-4" />
        Đăng xuất
      </Button>
    </div>
  </aside>

  <main className="flex-1 ml-64 min-h-screen overflow-auto">
    <div className="p-8 max-w-6xl mx-auto">
      {children}
    </div>
  </main>
</div>

);
}
