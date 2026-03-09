import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AuditTrailsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/internal/audit-trails');
  }, [router]);

  return <div>Redirecting to internal page...</div>;
}
