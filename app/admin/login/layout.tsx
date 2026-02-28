export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Login page should not use the admin layout
  // Return only the login form without sidebar
  return <>{children}</>;
}
