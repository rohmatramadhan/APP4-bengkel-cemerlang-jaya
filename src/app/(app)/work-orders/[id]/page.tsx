import { KerangkaFitur } from "@/components/KerangkaFitur";
import { TabWorkOrder } from "@/components/TabWorkOrder";

export default async function RincianWorkOrder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <TabWorkOrder id={id} />
      <KerangkaFitur fitur="A" judul="Rincian Work Order" rujukan="6.8" />
    </div>
  );
}
