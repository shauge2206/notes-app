export default async function TilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-muted-foreground">
        Tile {id} — Phase 6/7 will build this view
      </p>
    </div>
  );
}
