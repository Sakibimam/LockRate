import { LiveView } from "@/components/LiveView";

export const dynamic = "force-dynamic";

export default function LivePage() {
  return <LiveView enabled={process.env.LOCKRATE_LIVE === "1"} />;
}
