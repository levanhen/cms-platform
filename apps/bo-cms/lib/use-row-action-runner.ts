"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";

type ActionResult = { ok: boolean; message?: string };

/** Shared transition + toast pattern for list row actions. */
export function useRowActionRunner() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(
    action: () => Promise<ActionResult>,
    successMessage: string,
    fallbackError = "Không thể thực hiện thao tác.",
  ) {
    startTransition(async () => {
      try {
        const result = await action();
        if (!notify.result(result, { success: successMessage, fallbackError })) {
          return;
        }
        router.refresh();
      } catch (error) {
        notify.unexpected(error);
      }
    });
  }

  return { pending, run, router };
}
