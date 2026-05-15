import { Sidebar } from '@/components/layout/sidebar';
import { BottomNav } from '@/components/layout/bottom-nav';
import { TopBar } from '@/components/layout/top-bar';
import { AuthProvider } from '@/providers/auth-provider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="flex h-[100dvh] overflow-hidden bg-background-subtle">
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopBar />

          {/* Scrollable Content */}
          <main className="flex-1 overflow-y-auto bg-background-subtle">
            <div className="max-w-6xl mx-auto p-4 md:p-6 pb-24 md:pb-8">
              {children}
            </div>
          </main>

          <BottomNav />
        </div>
      </div>
    </AuthProvider>
  );
}
