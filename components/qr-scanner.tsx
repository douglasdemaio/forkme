'use client';
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface Props {
  onScan: (result: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const divId = 'qr-scanner-div';

  useEffect(() => {
    const scanner = new Html5Qrcode(divId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decoded) => {
          scanner.stop().catch(() => {});
          onScan(decoded);
        },
        undefined
      )
      .catch((err) => setError(String(err)));

    return () => {
      scanner.isScanning && scanner.stop().catch(() => {});
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-dark-950/95 z-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h3 className="text-white text-lg font-semibold text-center mb-4">Scan QR Code</h3>
        {error ? (
          <p className="text-red-400 text-sm text-center">{error}</p>
        ) : (
          <div id={divId} className="rounded-2xl overflow-hidden" />
        )}
        <button
          onClick={onClose}
          className="mt-6 w-full py-3 bg-dark-800 text-white rounded-2xl hover:bg-dark-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
