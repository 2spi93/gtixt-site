import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ReproducibilityDemoRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/internal/reproducibility-demo');
  }, [router]);

  return <div>Redirecting to internal page...</div>;
}
