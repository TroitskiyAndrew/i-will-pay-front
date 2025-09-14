import { Signal, WritableSignal } from "@angular/core";

export interface IRoom {
  id: string;
  chatId: number | null;
  name: string;
}

export interface IRoomState {
  balance: number,
  debts: IDebt[],
  hasUnsharedPayment: boolean,
  unchecked: boolean,
}

export interface IDebt {
  owner: string;
  debtor: string;
  amount: number;
}

export interface IMember {
  id: string;
  userId: string;
  roomId: string;
  name: string;
  isAdmin: boolean;
  grantedBy: string | null;
  isGuest: boolean;
  payer: string;
}

export interface IUser {
  id: string;
  telegramId: number;
  name: string;
}

export interface IPayment {
  id: string;
  roomId: string;
  payer: string;
  amount: number;
  shared: number;
  comment: string;
  photos: string[];
  date: string;
}

export interface IPaymentState {
  balance: number,
  unchecked: boolean,
  amount: number,
}

export interface IShare {
  id: string;
  paymentId: string;
  roomId: string;
  userId: string;
  payer: string;
  paymentPayer: string;
  share: number | null;
  amount: number | null;
  balance: number;
  confirmedByPayer: boolean;
  confirmedByUser: boolean;
}

export enum SocketAction {
  AddMember = 'addMember',
  UpdateMember = 'updateMember',
  AddPayment = 'addPayment',
  UpdatePayment = 'updatePayment',
  DeletePayment = 'deletePayment',
  AddShare = 'addShare',
  UpdateShare = 'updateShare',
  DeleteShare = 'deleteShare',
  AddRoom = 'addRoom',
  UpdateRoom = 'updateRoom',
}

export type Callbacks = {
  [key in SocketAction]: SocketCallback<key>;
};

export type SocketCallback<A extends SocketAction> = (data: SocketMessage<A>) => void;

export type SocketMessage<A extends SocketAction> =
  A extends SocketAction.AddMember | SocketAction.UpdateMember
    ? { action: A; member: IMember }
  : A extends SocketAction.AddPayment | SocketAction.UpdatePayment
    ? { action: A; payment: IPayment }
  : A extends SocketAction.AddShare | SocketAction.UpdateShare
    ? { action: A; share: IShare }
  : A extends SocketAction.AddRoom | SocketAction.UpdateRoom
    ? { action: A; room: IRoom }
  : A extends SocketAction.DeletePayment
    ? { action: A; id: string }
  : A extends SocketAction.DeleteShare
    ? { action: A; id: string, paymentId: string }
  : { action: A};


  export interface ISplittedMembers {
    payers: string[]
    [payer: string]: string[]
  }


  export type FilterValue =
  | boolean
  | number
  | string
  | string[]
  | null
  | undefined;

  export interface ActionContext {
    context?: unknown;
    mainItem?: unknown;
    value?: unknown;
  }

  export interface IButton<T = void> {
    icon: string;
    content?: string;
    class?: string;
    actionValue?: () => Promise<unknown>;
    valueFn?: () => FilterValue;
    actionPermission?: (
      actionContext?: ActionContext,
      contextItems?: unknown[]
    ) => Promise<boolean>;
    action: (actionContext: ActionContext) => T | Promise<T>;
    afterAction?: (contextItems: unknown[]) => T | Promise<T>;
    commonAction?: boolean;
    disabled?: Signal<boolean> | WritableSignal<boolean>;
    disabledFn?: () => boolean;
    selected?: Signal<boolean> | WritableSignal<boolean>;
    show?: Signal<boolean> | WritableSignal<boolean>;
    showFn?: (actionContext: ActionContext) => boolean;
    multiMode?: WritableSignal<boolean>;
    statesMapFn?: () => Map<FilterValue, IButtonState>;
    valueAfterMulti?: FilterValue;
  }

  export interface IButtonState {
    stateClass: string;
    content?: string;
    icon?: string;
  }
