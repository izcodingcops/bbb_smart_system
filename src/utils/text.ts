/**
 * Masks an email's local part for display (e.g. "j●●●y@smartsystem.io").
 * Single-character locals are masked entirely rather than leaked verbatim.
 */
export const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (!domain || !local) {
    return email;
  }
  let masked: string;
  if (local.length === 1) {
    masked = '●';
  } else if (local.length === 2) {
    masked = `${local[0]}●`;
  } else {
    masked = `${local[0]}●●●${local[local.length - 1]}`;
  }
  return `${masked}@${domain}`;
};
