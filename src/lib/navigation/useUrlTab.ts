"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useUrlTab<T extends string>(
  validTabs: readonly T[],
  defaultTab: T,
  parameter = "tab",
): readonly [T, (tab: T) => void] {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get(parameter);
  const activeTab = validTabs.includes(requestedTab as T)
    ? (requestedTab as T)
    : defaultTab;

  const setActiveTab = useCallback(
    (tab: T) => {
      const params = new URLSearchParams(searchParams.toString());

      if (tab === defaultTab) {
        params.delete(parameter);
      } else {
        params.set(parameter, tab);
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [defaultTab, parameter, pathname, router, searchParams],
  );

  return [activeTab, setActiveTab] as const;
}
