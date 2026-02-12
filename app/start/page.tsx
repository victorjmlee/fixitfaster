"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StartRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return (
    <div className="flex justify-center py-16">
      <span className="text-zinc-500">Redirecting...</span>
    </div>
  );
}
