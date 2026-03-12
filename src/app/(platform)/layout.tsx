import { Navigation } from "@/components/shared/Navigation";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main>{children}</main>
    </div>
  );
}
