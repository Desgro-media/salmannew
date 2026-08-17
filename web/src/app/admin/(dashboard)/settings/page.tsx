import { getStoreSettings } from "@/lib/store-settings";
import { StoreSettingsForm } from "@/components/admin/StoreSettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getStoreSettings();

  return (
    <div>
      <div>
        <h1 className="text-3xl font-black tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Delivery charges used at checkout. Changes apply to new orders
          immediately — orders already placed keep the charge they were made
          with.
        </p>
      </div>

      <div className="mt-8">
        <StoreSettingsForm settings={settings} />
      </div>
    </div>
  );
}
