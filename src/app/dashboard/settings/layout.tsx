import SettingsSidebar from "@/components/dashboard/settings/SettingsSidebar";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex md:flex-row gap-8 p-6 max-w-7xl mx-auto w-auto">
      <SettingsSidebar />
      <main className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
