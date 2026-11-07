import { toast } from "sonner";

type ActionResult = { ok: boolean; message?: string };

const UNEXPECTED = "Có lỗi xảy ra. Vui lòng thử lại.";

export const notify = {
  success(message: string) {
    toast.success(message);
  },
  error(message: string) {
    toast.error(message);
  },
  info(message: string) {
    toast.info(message);
  },
  warning(message: string) {
    toast.warning(message);
  },
  /** Toast lỗi nghiệp vụ từ server action; trả về true nếu ok. */
  result(
    result: ActionResult,
    options: { success?: string; fallbackError?: string } = {},
  ) {
    if (!result.ok) {
      toast.error(result.message ?? options.fallbackError ?? "Không thể thực hiện thao tác.");
      return false;
    }
    if (options.success) toast.success(options.success);
    return true;
  },
  unexpected(error?: unknown) {
    if (error) console.error(error);
    toast.error(UNEXPECTED);
  },
};

/** Bọc async action: bắt exception mạng/runtime và toast. */
export async function runSafe<T>(
  action: () => Promise<T>,
): Promise<T | undefined> {
  try {
    return await action();
  } catch (error) {
    notify.unexpected(error);
    return undefined;
  }
}
