"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Database, MessageSquare, Menu, X } from "lucide-react";

const navItems = [
  {
    title: "Data Generation",
    href: "/data-generation",
    icon: Database,
  },
  {
    title: "Talk to your data",
    href: "/talk-to-data",
    icon: MessageSquare,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Si el pathname no matchea ninguna ruta (ej. "/"), la primera opción
  // queda marcada como activa por defecto.
  const hasMatch = navItems.some((item) => item.href === pathname);

  const isItemActive = (href: string, index: number) =>
    pathname === href || (!hasMatch && index === 0);

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <ul className="space-y-2">
      {navItems.map((item, index) => {
        const Icon = item.icon;
        const isActive = isItemActive(item.href, index);

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.title}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* Desktop sidebar (md y superior) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Data Assistant</h1>
        </div>

        <nav className="flex-1 p-4">
          <NavLinks />
        </nav>

        <div className="p-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Powered by Gemini 3.5 Flash Lite
          </p>
        </div>
      </aside>

      {/* Mobile navbar (debajo de md) */}
      <div className="md:hidden bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900">Data Assistant</h1>
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Toggle navigation menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isOpen && (
          <nav className="px-4 pb-4 border-t border-gray-200 pt-3">
            <NavLinks onNavigate={() => setIsOpen(false)} />
          </nav>
        )}
      </div>
    </>
  );
}