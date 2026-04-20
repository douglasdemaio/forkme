import type { OrderStatus } from '@/lib/types';

const STATUS_STYLES: Record<OrderStatus, string> = {
  Created:         'bg-yellow-500/20 text-yellow-400',
  Funded:          'bg-blue-500/20 text-blue-400',
  Preparing:       'bg-purple-500/20 text-purple-400',
  ReadyForPickup:  'bg-cyan-500/20 text-cyan-400',
  PickedUp:        'bg-indigo-500/20 text-indigo-400',
  Delivered:       'bg-green-500/20 text-green-400',
  Settled:         'bg-emerald-500/20 text-emerald-400',
  Disputed:        'bg-red-500/20 text-red-400',
  Cancelled:       'bg-dark-500/20 text-dark-300',
  Refunded:        'bg-orange-500/20 text-orange-400',
};

const STATUS_DOTS: Record<OrderStatus, string> = {
  Created:        'bg-yellow-400',
  Funded:         'bg-blue-400',
  Preparing:      'bg-purple-400',
  ReadyForPickup: 'bg-cyan-400',
  PickedUp:       'bg-indigo-400',
  Delivered:      'bg-green-400',
  Settled:        'bg-emerald-400',
  Disputed:       'bg-red-400',
  Cancelled:      'bg-dark-400',
  Refunded:       'bg-orange-400',
};

export function OrderStatusBadge({ status, label }: { status: OrderStatus; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[status]}`} />
      {label}
    </span>
  );
}
