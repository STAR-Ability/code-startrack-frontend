import { AuthShell } from "@/components/auth/auth-shell";
import { MockNotice } from "@/components/workspace/mock-notice";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MockNotice />
      <AuthShell>{children}</AuthShell>
    </>
  );
}
