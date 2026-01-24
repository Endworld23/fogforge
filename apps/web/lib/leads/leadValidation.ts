const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export function validateEmail(email: string) {
  const trimmed = email.trim();
  if (!trimmed) {
    return "This field is required.";
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return "Please enter a valid email address.";
  }
  return null;
}

export function validatePhone(phone: string, requiredMessage?: string) {
  const trimmed = phone.trim();
  if (!trimmed) {
    return requiredMessage ?? "This field is required.";
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length !== 10) {
    return "Please enter a valid 10-digit phone number.";
  }
  return null;
}
