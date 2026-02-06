export default function useLockedFieldsManager() {
  return {
    isFieldLocked: () => false,
    shouldLockField: () => false,
  };
}
