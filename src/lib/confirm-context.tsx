"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useI18n } from "@/lib/i18n-context";

type ConfirmState = {
  message: string;
  resolve: (ok: boolean) => void;
};

type ConfirmContextValue = {
  confirm: (message: string) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);
  const { t } = useI18n();

  const confirm = useCallback((message: string) => {
    return new Promise<boolean>((resolve) => {
      setState({ message, resolve });
    });
  }, []);

  const close = useCallback((ok: boolean) => {
    state?.resolve(ok);
    setState(null);
  }, [state]);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {state ? (
        <div className="mv-confirm-overlay" role="presentation" onClick={() => close(false)}>
          <div
            className="mv-confirm-dialog"
            role="alertdialog"
            aria-labelledby="mv-confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <p id="mv-confirm-title" className="mv-confirm-message">
              {state.message}
            </p>
            <div className="mv-confirm-actions">
              <button type="button" className="dash-profile-btn-secondary" onClick={() => close(false)}>
                {t("cancel")}
              </button>
              <button type="button" className="dash-profile-btn-primary" onClick={() => close(true)}>
                {t("confirm")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx.confirm;
}
