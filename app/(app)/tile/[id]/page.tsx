import { notFound } from "next/navigation";
import { getTileById } from "@/lib/queries/tiles";
import { getAllTags } from "@/lib/queries/tags";
import { ChecklistTilePage } from "@/components/tile/checklist-tile-page";
import { SectionsTilePage } from "@/components/tile/sections-tile-page";

export default async function TilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ s?: string }>;
}) {
  const { id } = await params;
  const { s: sectionId } = await searchParams;

  let tile;
  try {
    tile = await getTileById(id);
  } catch {
    notFound();
  }

  const tagCounts = await getAllTags();
  const allTags = tagCounts.map((t) => t.tag);

  if (tile.type === "checklist") {
    return <ChecklistTilePage tile={tile} allTags={allTags} />;
  }

  const activeSectionId = sectionId ?? tile.sections[0]?.id ?? "";

  return <SectionsTilePage tile={tile} activeSectionId={activeSectionId} allTags={allTags} />;
}
