import React from "react";

export interface Props {
  payment: any;
  booking: any;
  [key: string]: any;
}

export interface States {
  status: "idle" | "processing" | "error" | "success";
  error?: Error;
}

export const PaymentFormComponent = ({ children, onSubmit, onCancel }: any) => {
  return (
    <form onSubmit={onSubmit}>
      {children}
      <div className="mt-4 flex flex-col space-y-2">
        <button type="submit" className="btn-primary w-full">
          Pay Now (Stub)
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary w-full">
          Cancel
        </button>
      </div>
    </form>
  );
};
