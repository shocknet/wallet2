export interface ITotalAmount{
  subtotal: number;
  taxes: number;
  total: number;
}

export const totalAmountInitial: ITotalAmount = {
  subtotal: 0,
  taxes: 0,
  total: 0
}