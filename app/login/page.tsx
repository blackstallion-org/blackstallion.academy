import { redirect } from "next/navigation";
import { safeNext } from "@/lib/registration/model";

/** /login is a short address for the one sign-in page (members and staff), keeping a safe return path. */
export default async function LoginRedirect({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? safeNext(sp.next, "") : "";
  redirect(next ? `/admin/login?next=${encodeURIComponent(next)}` : "/admin/login");
}
