import { prisma } from "@/lib/db";
import { DeliveryBoyForm } from "@/components/admin/DeliveryBoyForm";
import { DeleteDeliveryBoyButton } from "@/components/admin/DeleteDeliveryBoyButton";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function DeliveryBoysPage() {
  const deliveryBoys = await prisma.admin.findMany({
    where: { role: "DELIVERY" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div>
        <h1 className="text-3xl font-black tracking-tight">Delivery Boys</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Accounts that can sign in at /delivery/login to see every order and
          update its delivery status.
        </p>
      </div>

      <div className="mt-8 border border-line bg-paper-2 px-6 py-6">
        <DeliveryBoyForm />
      </div>

      {deliveryBoys.length === 0 ? (
        <p className="mt-10 text-sm text-ink-soft">No delivery accounts yet.</p>
      ) : (
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {deliveryBoys.map((deliveryBoy) => (
            <li
              key={deliveryBoy.id}
              className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold">{deliveryBoy.name}</p>
                <p className="mt-0.5 break-words text-xs text-ink-soft">
                  {deliveryBoy.email} · added {dateFormatter.format(deliveryBoy.createdAt)}
                </p>
              </div>
              <DeleteDeliveryBoyButton
                deliveryBoyId={deliveryBoy.id}
                deliveryBoyName={deliveryBoy.name ?? deliveryBoy.email}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
