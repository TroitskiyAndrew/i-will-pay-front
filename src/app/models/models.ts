export interface IRoom {
  id: string;
  chatId: number | null;
  name: string;
  balance: number;
}

export interface IMember {
  id: string;
  userId: number;
  roomId: string;
  name: string;
  isAdmin: boolean;
  grantedBy: string | null;
  chatMember: boolean;
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
  photos: string[];
  date: string;
}

export interface IShare {
  id: string;
  paymentId: string;
  roomId: string;
  userId: string;
  payer: string;
  share: number | null;
  amount: number | null;
  balance: number;
  confirmedByPayer: boolean;
  confirmedByUser: boolean;
}