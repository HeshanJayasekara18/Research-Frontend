import { DashboardBody } from "@/features/dashboard/components/DashboardBody";
import { resolveDashboardAssets } from "@/features/dashboard/lib/assets";

// Shared dashboard (all four research components). Image slots resolve on the server.
export default function Home() {
  return <DashboardBody assets={resolveDashboardAssets()} />;
}
