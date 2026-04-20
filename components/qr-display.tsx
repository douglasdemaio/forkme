'use client';
import { QRCodeSVG } from 'qrcode.react';

interface Props {
  value: string;
  label?: string;
  size?: number;
}

export function QRDisplay({ value, label, size = 200 }: Props) {
  return (
    <div className="flex flex-col items-center gap-3">
      {label && <p className="text-dark-300 text-sm text-center">{label}</p>}
      <div className="bg-white p-4 rounded-2xl">
        <QRCodeSVG value={value} size={size} level="M" />
      </div>
      <code className="text-dark-300 text-xs font-mono break-all text-center max-w-xs">{value}</code>
    </div>
  );
}
