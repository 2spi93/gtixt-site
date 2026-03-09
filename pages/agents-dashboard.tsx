import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AgentsDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/internal/agents-dashboard');
  }, [router]);

  return <div>Redirecting to internal page...</div>;
}
