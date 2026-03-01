import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from "../lib/useTranslationStub";

export default function CareersPage() {
  const { t } = useTranslation("common");
  const router = useRouter();

  useEffect(() => {
    // Redirect to contact page - careers inquiries handled there
    router.push('/contact');
  }, [router]);

  return null;
}
