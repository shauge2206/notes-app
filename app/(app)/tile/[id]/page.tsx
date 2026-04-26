import { notFound } from "next/navigation";
import { getTileById } from "@/lib/queries/tiles";
import { ChecklistTilePage } from "@/components/tile/checklist-tile-page";

export default async function TilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let tile;
  try {
    tile = await getTileById(id);
  } catch {
    notFound();
  }

  if (tile.type === "checklist") {
    return <ChecklistTilePage tile={tile} />;
  }

  // Phase 7: sections tile
  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-muted-foreground">
        Sections tile — coming in Phase 7
      </p>
    </div>
  );
}
