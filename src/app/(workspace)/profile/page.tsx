import { TrainingPage } from "@/components/training/training-page";
import { DEMO_USER_ID } from "@/lib/api/config.server";
import { localizedMetadata } from "@/lib/i18n/server";

export const generateMetadata = () => localizedMetadata("profile");
export default function ProfilePage() {
  return <TrainingPage userId={DEMO_USER_ID} view="profile" />;
}
