const CustomerFormField = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-sm font-semibold text-chocolate">{label}</span>
    {children}
  </label>
);

export default CustomerFormField;
