import React from "react";

type TeamEventTypeFormProps = {
  teamSlug?: string | null;
  teamId: number;
  permissions: {
    canCreateEventType: boolean;
  };
  urlPrefix?: string;
  isPending: boolean;
  form: any;
  isManagedEventType: boolean;
  handleSubmit: (values: any) => void;
  SubmitButton: (isPending: boolean) => JSX.Element;
};

export const TeamEventTypeForm = (_props: TeamEventTypeFormProps) => {
  return null;
};
