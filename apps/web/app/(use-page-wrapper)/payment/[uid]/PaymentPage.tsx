"use client";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import type { FC } from "react";

const PaymentPage: FC<any> = () => {
  const { t } = useLocale();

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center">
        <h3 className="text-2xl font-semibold">{t("payment")}</h3>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Payments are not supported in this version.</p>
      </div>
    </div>
  );
};

export default PaymentPage;
