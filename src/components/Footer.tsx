import logoCrisbar from "@/assets/logo-crisbar.png";

export function Footer() {
  return (
    <footer className="mt-20 px-4 pb-8">
      <div className="mx-auto max-w-6xl rounded-3xl bg-primary text-primary-foreground p-8 md:p-12 shadow-(--shadow-soft)">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-[#5c5c5c]">
          <div className="flex items-center gap-3">
            <img src={logoCrisbar} alt="Logo Crisbar" className="h-12 w-12 object-contain" />
            <div>
              <p className="text-2xl font-extrabold">Crisbar</p>
              <p className="text-sm opacity-80">Ayam Crispy Bakar</p>
            </div>
          </div>
          <p className="text-sm opacity-80">
            © {new Date().getFullYear()} Crisbar. Made with Sweet and Kind
          </p>
        </div>
      </div>
    </footer>
  );
}
