"use client";

import { cn } from "../../lib/utils";
import {
  Home,
  LayoutGrid,
  Users,
  Settings,
  FileText,
  LogOut,
  GraduationCap,
  Building2,
  ClipboardList,
} from "lucide-react";

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const navItems = [
  { id: "dashboard", label: "Home", icon: Home },
  { id: "room-config", label: "Room Config", icon: Building2 },
  { id: "seating", label: "Seating Allocation", icon: LayoutGrid },
  { id: "invigilator", label: "Invigilator Mgmt", icon: Users },
  { id: "configurations", label: "Configurations", icon: Settings },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "email", label: "Email Notifications", icon: ClipboardList },
];

export function Sidebar({ currentPage, onNavigate, onLogout }: SidebarProps) {
  return (
    <aside className="w-64 bg-slate-800 text-white flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-white">Exam Cell</h2>
            <p className="text-xs text-slate-300">SJCET Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white",
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-300 hover:bg-red-500/20 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
