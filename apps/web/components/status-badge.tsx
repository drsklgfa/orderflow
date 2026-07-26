import type { OrderStatus } from '@/lib/types';

const labels: Record<OrderStatus, string> = {
  PENDING: 'Pendente', PAID: 'Pago', PROCESSING: 'Em preparação', SHIPPED: 'Enviado', DELIVERED: 'Entregue', CANCELLED: 'Cancelado'
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`status status-${status.toLowerCase()}`}>{labels[status]}</span>;
}
