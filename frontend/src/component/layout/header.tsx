"use client";

import { ChevronRight } from "lucide-react";
import { User } from "lucide-react";
import { useEffect, useState } from "react";

interface HeaderProps {
  breadcrumbs: { label: string; href?: string }[];
  onNavigate?: (page: string) => void;
}

const hrefToPage: Record<string, string> = {
  "/": "dashboard",
};

export function Header({ breadcrumbs, onNavigate }: HeaderProps) {

  const [userInfo, setUserInfo] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return;

    fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setUserInfo({
          name: data.full_name,
          email: data.email,
        });
      })
      .catch(() => setUserInfo(null));
  }, []);

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-10">
      <nav className="flex items-center gap-2 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <span
            key={`breadcrumb-${crumb.label}-${index}`}
            className="flex items-center gap-2"
          >
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
            {crumb.href && index !== breadcrumbs.length - 1 ? (
              <button
                onClick={() =>
                  onNavigate?.(hrefToPage[crumb.href!] ?? crumb.href!)
                }
                className="text-muted-foreground hover:text-foreground cursor-pointer hover:underline"
              >
                {crumb.label}
              </button>
            ) : (
              <span
                className={
                  index === breadcrumbs.length - 1
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                }
              >
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">
            {userInfo?.name || "Loading..."}
          </p>
          <p className="text-xs text-muted-foreground">
            {userInfo?.email || ""}
          </p>
        </div>

        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <User className="w-5 h-5 text-blue-600" />
        </div>
      </div>
    </header>
  );
}