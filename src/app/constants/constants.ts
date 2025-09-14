import { IPayment } from "../models/models";

export const NEW_PAYMENT_ID = 'newPaymentId'

export function getNewPayment(payer: string): IPayment {
  return {
    id: NEW_PAYMENT_ID,
    roomId: '',
    payer: payer,
    amount: 0,
    shared: 0,
    comment: '',
    photos: [],
    date: ''
  }
}
