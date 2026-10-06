// Aturan password backend: minimal 8 karakter, ada huruf besar dan angka
export const passwordRules = [
  { label: "Minimal 8 karakter", test: (value: string) => value.length >= 8 },
  { label: "Huruf besar", test: (value: string) => /[A-Z]/.test(value) },
  { label: "Angka", test: (value: string) => /[0-9]/.test(value) },
];

export const isPasswordValid = (value: string) =>
  passwordRules.every((rule) => rule.test(value));
