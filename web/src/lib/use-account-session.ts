"use client";

import { useEffect, useState } from "react";

interface AccountSessionProfile {
  email: string;
  fullName: string;
}

// undefined = still loading, null = logged out, object = logged in.
export function useAccountSession(): AccountSessionProfile | null | undefined {
  const [profile, setProfile] = useState<AccountSessionProfile | null | undefined>(undefined);

  useEffect(() => {
    fetch("/api/account/me")
      .then((res) => res.json())
      .then(setProfile)
      .catch(() => setProfile(null));
  }, []);

  return profile;
}
