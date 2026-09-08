import { redirect } from "next/navigation";

export default async function SignUpRedirect({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const { redirect_url } = await searchParams;
  redirect(
    redirect_url ? `/signup?redirect_url=${encodeURIComponent(redirect_url)}` : "/signup"
  );
}
