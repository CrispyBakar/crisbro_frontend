import type { LucideIcon } from "lucide-react";

const CustomerInfoRow = ({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) => (
  <li className="flex items-center gap-3">
    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-cream text-muted">
      <Icon size={16} />
    </span>
    {children}
  </li>
);

export default CustomerInfoRow;
