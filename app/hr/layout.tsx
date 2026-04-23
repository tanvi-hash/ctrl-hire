import { Nav } from "@/components/nav";

export default function HRLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[var(--container-shell)] px-6 py-5">
      <Nav />
      <div className="mt-5">{children}</div>
    </div>
  );
}
