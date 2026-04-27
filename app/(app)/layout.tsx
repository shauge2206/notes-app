import { Sidebar } from "@/components/sidebar";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { getFocusZones } from "@/lib/queries/focus-zones";
import { getAllTags } from "@/lib/queries/tags";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [zones, tags] = await Promise.all([getFocusZones(), getAllTags()]);

  return (
    <div className="flex h-full">
      <Sidebar zones={zones} tags={tags} />
      <main className="flex-1 flex flex-col min-h-0">{children}</main>
      <KeyboardShortcuts />
    </div>
  );
}
