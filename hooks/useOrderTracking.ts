import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { WS_URL } from '@/lib/constants';
import { useAppStore } from '@/store/app-store';
import type { Order } from '@/lib/types';

/**
 * Real-time order tracking via Socket.IO.
 * Subscribes to order status changes, funding updates, and driver location.
 */
export function useOrderTracking(orderId: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const { authToken, setActiveOrder, activeOrder } = useAppStore();

  useEffect(() => {
    if (!orderId || !authToken) return;

    const socket = io(WS_URL, {
      auth: { token: authToken },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      socket.emit('subscribe:order', orderId);
    });

    socket.on('order:status', (data: { orderId: string; status: string }) => {
      if (activeOrder && data.orderId === activeOrder.id) {
        setActiveOrder({ ...activeOrder, status: data.status as Order['status'] });
      }
    });

    socket.on(
      'order:funding',
      (data: { orderId: string; escrowFunded: number; percentFunded: number }) => {
        if (activeOrder && data.orderId === activeOrder.id) {
          setActiveOrder({ ...activeOrder, escrowFunded: data.escrowFunded });
        }
      }
    );

    socket.on(
      'order:driver-location',
      (data: { orderId: string; lat: number; lng: number }) => {
        if (activeOrder && data.orderId === activeOrder.id) {
          setActiveOrder({
            ...activeOrder,
            driverLocation: { lat: data.lat, lng: data.lng },
          });
        }
      }
    );

    socketRef.current = socket;

    return () => {
      socket.emit('unsubscribe:order', orderId);
      socket.disconnect();
    };
  }, [orderId, authToken]);

  return { socket: socketRef.current };
}
