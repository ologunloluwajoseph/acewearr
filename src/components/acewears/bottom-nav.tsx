"use client";

import { Home, Grid3x3, Play, ShoppingCart, User } from "lucide-react";
import { useCartCount, useCartStore } from "@/lib/stores/cart-store";

export function BottomNav({ active, onNavigate }: {
  active: string;
  onNavigate: (id: string) => void;
}) {
  const cartCount = useCartCount();
  const openCart = useCartStore((s) => s.open);

  const items = [
    { id: "home",     label: "Home",       icon: Home },
    { id: "catalog",  label: "Categories", icon: Grid3x3 },
    { id: "reels",    label: "Reels",      icon: Play },
    { id: "cart",     label: "Cart",       icon: ShoppingCart, badge: cartCount, onClick: openCart },
    { id: "account",  label: "Account",    icon: User },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white pb-safe lg:hidden"
      aria-label="Primary navigation"
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <li key={item.id}>
              <button
                onClick={() => (item.onClick ? item.onClick() : onNavigate(item.id))}
                aria-current={isActive ? "page" : undefined}
                className={`flex w-full flex-col items-center gap-0.5 py-2 transition ${
                  isActive ? "text-amber" : "text-navy"
                }`}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {item.badge ? (
                    <span className="absolute -right-2 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-amber px-1 text-[9px] font-bold text-navy">
                      {item.badge}
                    </span>
                  ) : null}
                </span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
