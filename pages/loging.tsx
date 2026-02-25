import { useEffect } from "react";
import { useRouter } from "next/router";

/**
 * Redirect /loging -> /admin/login/ (typo fix)
 */
export default function LoginTypoRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/login");
  }, [router]);

  return null;
}
