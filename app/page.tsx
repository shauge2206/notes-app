import { requireUser } from "@/lib/auth";
import { LogoutButton } from "./logout-button";

export default async function Home() {
  const user = await requireUser();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold text-muted-foreground">
        Notes App
      </h1>
      <p className="text-sm text-muted-foreground">
        Logget inn som {user.email}
      </p>
      <LogoutButton />
    </main>
  );
}
