"use client";

import { ChevronRight } from "lucide-react";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface HeaderProps {
  breadcrumbs: { label: string; href?: string }[];
}

export function Header({ breadcrumbs }: HeaderProps) {
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
            <span
              className={
                index === breadcrumbs.length - 1
                  ? "font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground cursor-pointer"
              }
            >
              {crumb.label}
            </span>
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">Staff</p>
          <p className="text-xs text-muted-foreground">staff@sjcet.ac.in</p>
        </div>
        {/* <Avatar className="h-10 w-10 bg-primary">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <User className="w-5 h-5" />
          </AvatarFallback>
        </Avatar> */}
      </div>
    </header>
  );
}
