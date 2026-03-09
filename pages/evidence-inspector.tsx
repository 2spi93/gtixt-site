import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function EvidenceInspectorRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/internal/evidence-inspector');
  }, [router]);

  return <div>Redirecting to internal page...</div>;
}
