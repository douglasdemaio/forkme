"use client";

import { useTranslation } from "react-i18next";

export type VendorType = "restaurant" | "home_cook" | "retail";

export interface MerchantLabelProps {
  vendorType: VendorType;
}

export function MerchantLabel({ vendorType }: MerchantLabelProps) {
  const { t } = useTranslation();
  return <>{t(`merchant.label.${vendorType}`)}</>;
}
