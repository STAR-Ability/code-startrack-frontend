import { DEMO_USER_ID } from "@/lib/api/config.server";
import { localizedMetadata } from "@/lib/i18n/server";
import { Dashboard } from "./dashboard";

export const generateMetadata = () => localizedMetadata("dashboard");

export default function DashboardPage() {
  return <Dashboard userId={DEMO_USER_ID} />;
}
