import { useEffect, useRef, useState } from "react";
import { ChevronDown, KeyRound } from "lucide-react";
import ChangePasswordModal from "./ChangePasswordModal";

// Dropdown di navbar admin — dibuka lewat ikon ChevronDown
const AdminUserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Tutup saat klik di luar menu atau tekan Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const openChangePassword = () => {
    setIsOpen(false);
    setIsChangePasswordOpen(true);
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Menu akun"
        className="flex items-center rounded-full p-1 hover:bg-gray-100 cursor-pointer transition-colors"
      >
        <ChevronDown
          size={24}
          className={`text-gray-600 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-4 w-52 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={openChangePassword}
            className="flex w-full items-center gap-2.5 rounded-xl py-2.5 px-3 text-sm font-semibold text-chocolate hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <KeyRound size={16} className="text-gray-500" />
            Ganti Password
          </button>
        </div>
      )}

      {isChangePasswordOpen && (
        <ChangePasswordModal onClose={() => setIsChangePasswordOpen(false)} />
      )}
    </div>
  );
};

export default AdminUserMenu;
