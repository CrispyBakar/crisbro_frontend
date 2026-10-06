import { useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  Circle,
  CircleAlert,
  CircleCheck,
  Eye,
  EyeOff,
  LoaderCircle,
} from "lucide-react";
import crisbarLogo from "@/assets/logo-crisbar-spotlight.png";
import { passwordRules } from "@/lib/password";
import { fieldBoxClass, fieldInputClass } from "./fieldStyles";

const focusRingClass =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border focus-within:ring-border/50";

export const AuthHeader = ({
  backTo,
  backLabel,
}: {
  backTo: string;
  backLabel: string;
}) => {
  return (
    <header className="relative flex h-10 items-center justify-center">
      <Link
        to={backTo}
        aria-label={backLabel}
        className={`absolute left-0 -ml-2 flex h-10 w-10 items-center justify-center rounded-full text-chocolate transition-colors hover:bg-ran/5 ${focusRingClass}`}
      >
        <ArrowLeft size={22} />
      </Link>
      <img src={crisbarLogo} alt="Crisbar" className="h-9 w-9" />
    </header>
  );
};

export const AuthTitle = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  return (
    <div className="mt-10">
      <h1 className="text-[1.75rem] font-extrabold leading-tight tracking-tight text-chocolate">
        {title}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
    </div>
  );
};

type FieldProps = {
  id: string;
  label: string;
  optional?: boolean;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
};

// id pesan mengikuti id input supaya bisa dirujuk lewat aria-describedby
export const Field = ({
  id,
  label,
  optional,
  hint,
  error,
  children,
}: FieldProps) => {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-chocolate"
      >
        {label}
        {optional && (
          <span className="font-normal text-muted"> (opsional)</span>
        )}
      </label>
      <div className="mt-1.5">{children}</div>
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 text-xs text-berry-red"
        >
          {error}
        </p>
      )}
      {hint && (
        <div id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </div>
      )}
    </div>
  );
};

type TextFieldProps = Omit<ComponentProps<"input">, "className" | "id"> &
  Omit<FieldProps, "children"> & {
    leading?: ReactNode;
    trailing?: ReactNode;
  };

export const TextField = ({
  id,
  label,
  optional,
  hint,
  error,
  leading,
  trailing,
  ...inputProps
}: TextFieldProps) => {
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`]
    .filter(Boolean)
    .join(" ");

  return (
    <Field id={id} label={label} optional={optional} hint={hint} error={error}>
      <div className={fieldBoxClass(Boolean(error))}>
        {leading}
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={fieldInputClass}
          {...inputProps}
        />
        {trailing}
      </div>
    </Field>
  );
};

type PresetFieldProps = Omit<
  TextFieldProps,
  "type" | "inputMode" | "leading" | "trailing"
>;

export const PhoneField = (props: PresetFieldProps) => {
  return (
    <TextField
      type="tel"
      inputMode="numeric"
      autoComplete="tel-national"
      leading={
        <span className="flex h-full shrink-0 items-center border-r border-orange/15 px-3.5 text-base font-medium text-muted">
          +62
        </span>
      }
      {...props}
    />
  );
};

export const PasswordField = (props: PresetFieldProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <TextField
      type={isVisible ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setIsVisible((prev) => !prev)}
          aria-label={isVisible ? "Sembunyikan password" : "Tampilkan password"}
          className="flex h-full w-12 shrink-0 cursor-pointer items-center justify-center text-muted transition-colors hover:text-chocolate"
        >
          {isVisible ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      }
      {...props}
    />
  );
};

// Daftar syarat password; tiap syarat berubah hijau begitu terpenuhi
export const PasswordRuleList = ({ password }: { password: string }) => {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1">
      {passwordRules.map((rule) => {
        const isMet = rule.test(password);
        const Icon = isMet ? CircleCheck : Circle;
        return (
          <li
            key={rule.label}
            className={`flex items-center gap-1.5 ${isMet ? "text-success" : ""}`}
          >
            <Icon size={14} className="shrink-0" />
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
};

export const FormAlert = ({
  message,
  tone = "error",
}: {
  message: string;
  tone?: "error" | "success";
}) => {
  const isSuccess = tone === "success";
  const Icon = isSuccess ? CircleCheck : CircleAlert;

  return (
    <p
      role={isSuccess ? "status" : "alert"}
      className={`flex items-start gap-2 rounded-xl border px-3.5 py-3 text-sm ${
        isSuccess
          ? "border-success/20 bg-success/5 text-success"
          : "border-berry-red/20 bg-berry-red/5 text-berry-red"
      }`}
    >
      <Icon size={18} className="mt-px shrink-0" />
      {message}
    </p>
  );
};

export const SubmitButton = ({
  pending,
  disabled,
  children,
}: {
  pending: boolean;
  disabled?: boolean;
  children: ReactNode;
}) => {
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={`flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-berry-red text-base font-bold text-white transition-colors hover:bg-berry-red/90 disabled:cursor-not-allowed disabled:opacity-60 ${focusRingClass}`}
    >
      {pending && <LoaderCircle size={18} className="animate-spin" />}
      {pending ? "Memproses..." : children}
    </button>
  );
};

export const AuthFooterLink = ({
  text,
  linkLabel,
  to,
}: {
  text: string;
  linkLabel: string;
  to: string;
}) => {
  return (
    <p className="text-center text-sm text-muted">
      {text}{" "}
      <Link
        to={to}
        className={`rounded-sm font-semibold text-berry-red hover:underline ${focusRingClass}`}
      >
        {linkLabel}
      </Link>
    </p>
  );
};
