import React, { useState } from "react";
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
Menu,
X,
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

const [open, setOpen] =
useState(false);

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

  <button
    className="fixed top-4 left-4 z-50 md:hidden bg-primary text-white p-2 rounded-lg"
    onClick={() =>
      setOpen(!open)
    }
  >
    {open ? (
      <X size={20} />
    ) : (
      <Menu size={20} />
    )}
  </button>

  <aside
    className={`
    fixed inset-y-0 left-0 z-40
    w-64 bg-sidebar
    border-r border-sidebar-border
    flex flex-col
    transform transition-transform

    ${open
      ? "translate-x-0"
      : "-translate-x-full"}

    md:translate-x-0
    `}
  >
    <div className="px-5 py-5 border-b border-sidebar-border">
      <Link
        href="/"
        className="flex items-center gap-3"
      >
        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-white" />
        </div>

        <span className="font-bold text-xl">
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
              onClick={() =>
                setOpen(
                  false
                )
              }
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary text-white"
                  : "hover:bg-muted"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        }
      )}
    </nav>

    <div className="px-3 py-4 border-t">
      <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-muted mb-2">

        {user?.photoURL ? (
          <img
            src={
              user.photoURL
            }
            alt=""
            className="w-9 h-9 rounded-full"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold">
            {user?.displayName?.[0]?.toUpperCase() ??
              "?"}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">
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
        className="w-full justify-start gap-2"
        onClick={logout}
      >
        <LogOut className="w-4 h-4" />
        Đăng xuất
      </Button>
    </div>
  </aside>

  {open && (
    <div
      className="fixed inset-0 bg-black/40 z-30 md:hidden"
      onClick={() =>
        setOpen(false)
      }
    />
  )}

  <main className="flex-1 md:ml-64 min-h-screen overflow-auto">
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {children}
    </div>
  </main>
</div>

);
}
