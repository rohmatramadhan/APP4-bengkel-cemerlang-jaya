import { KerangkaFitur } from "@/components/KerangkaFitur";
import { TabWorkOrder } from "@/components/TabWorkOrder";

export default async function TagihanWorkOrder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <TabWorkOrder id={id} />
      <KerangkaFitur fitur="B" judul="Tagihan" rujukan="6.8 bagian D" />
    </div>
  );
}
