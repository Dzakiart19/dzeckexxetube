import { AppFooter } from "@/components/layout/AppFooter";
import { AppHeader } from "@/components/layout/AppHeader";

/**
 * Root layout shell: sticky header, flexible content area and a footer that
 * always sticks to the bottom of the viewport (mt-auto) and is pushed down
 * naturally when content overflows.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main id="main-content" className="mx-auto w-full max-w-[1440px] flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        {children}
      </main>
      <AppFooter />
    </div>
  );
}
