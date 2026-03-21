import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { WS_URL, API_URL } from '@/lib/constants';
import { useAppStore } from '@/store/app-store';
import type { Order, OrderStatus, StatusEvent, OrderReceipt, FundsReleasedPayload } from '@/lib/types';

/**
 * Real-time order tracking via Socket.IO.
 * Subscribes to order status changes, funding updates, driver location,
 * and funds-released events. Also fetches the structured receipt.
 */
export function useOrderTracking(orderId: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const { authToken, setActiveOrder, activeOrder } = useAppStore();

  const [statusHistory, setStatusHistory] = useState<StatusEvent[]>([]);
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);
  const [fundsReleased, setFundsReleased] = useState<FundsReleasedPayload | null>(null);

  const addStatusEvent = useCallback((event: StatusEvent) => {
    setStatusHistory((prev) => {
      if (prev.some((e) => e.status === event.status)) return prev;
      return [...prev, event];
    });
  }, []);

  const fetchReceipt = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/customers/orders/${id}/receipt`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      if (res.ok) setReceipt(await res.json());
    } catch {}
  }, [authToken]);

  useEffect(() => {
    if (!orderId || !authToken) return;

    if (activeOrder?.status) {
      addStatusEvent({ status: activeOrder.status as OrderStatus, timestamp: activeOrder.createdAt });
    }
    if (activeOrder?.status === 'Settled' || activeOrder?.status === 'Delivered') {
      fetchReceipt(orderId);
    }

    const socket = io(WS_URL, {
      auth: { token: authToken },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      socket.emit('subscribe:order', orderId);
    });

    socket.on('order:status', (data: { orderId: string; status: OrderStatus; deliveryService?: string; note?: string }) => {
      if (!activeOrder || data.orderId !== activeOrder.id) return;
      setActiveOrder({ ...activeOrder, status: data.status });
      addStatusEvent({
        status: data.status,
        timestamp: new Date().toISOString(),
        deliveryService: data.deliveryService as any,
        note: data.note,
      });
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

    socket.on('order:funds-released', (data: FundsReleasedPayload) => {
      if (data.orderId !== orderId) return;
      setFundsReleased(data);
      if (activeOrder) {
        setActiveOrder({ ...activeOrder, status: 'Settled', settleTxSignature: data.txSignature });
      }
      fetchReceipt(orderId);
    });

    socket.on('order:settled', (data: { orderId: string }) => {
      if (data.orderId === orderId) fetchReceipt(orderId);
    });

    socketRef.current = socket;

    return () => {
      socket.emit('unsubscribe:order', orderId);
      socket.disconnect();
    };
  }, [orderId, authToken]);

  return { socket: socketRef.current, statusHistory, receipt, fundsReleased };
}
