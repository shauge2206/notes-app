import { Sidebar } from "@/components/sidebar";
import { getFocusZones } from "@/lib/queries/focus-zones";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const zones = await getFocusZones();

  return (
    <div className="flex h-full">
      <Sidebar zones={zones} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
