'use client';

interface Props {
  funded: number;
  target: number;
  currency: string;
}

export function FundingProgress({ funded, target, currency }: Props) {
  const pct = target > 0 ? Math.min(100, (funded / target) * 100) : 0;

  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-dark-300">Funded</span>
        <span className="text-white font-medium">
          {funded.toFixed(2)} / {target.toFixed(2)} {currency}
        </span>
      </div>
      <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-right mt-1">
        <span className={`text-xs font-medium ${pct >= 100 ? 'text-green-400' : 'text-brand-500'}`}>
          {pct.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
