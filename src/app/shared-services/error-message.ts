export function getErrorMessage(error: any, fallback = 'Something went wrong. Please try again.'): string {
  return (
    error?.error?.message ||
    error?.error?.msg ||
    error?.error?.hint ||
    error?.message ||
    error?.statusText ||
    fallback
  );
}
