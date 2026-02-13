import type { ReactElement, ReactNode } from "react";

type LockedFieldProps = {
  disabled: boolean;
  isLocked: boolean;
  LockedIcon: false | ReactElement;
};

type UseLockedFieldsManagerReturn = {
  isFieldLocked: (_field: string) => boolean;
  shouldLockField: (_field: string) => boolean;
  shouldLockIndicator: (_field: string) => ReactNode;
  shouldLockDisableProps: (_field: string, _options?: { simple?: boolean }) => LockedFieldProps;
  isManagedEventType: boolean;
  isChildrenManagedEventType: boolean;
};

const unlockedFieldProps: LockedFieldProps = {
  disabled: false,
  isLocked: false,
  LockedIcon: false,
};

export default function useLockedFieldsManager(_params?: unknown): UseLockedFieldsManagerReturn {
  return {
    isFieldLocked: () => false,
    shouldLockField: () => false,
    shouldLockIndicator: () => null,
    shouldLockDisableProps: () => unlockedFieldProps,
    isManagedEventType: false,
    isChildrenManagedEventType: false,
  };
}
