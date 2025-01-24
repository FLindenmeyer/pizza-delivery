export enum OrderStatus {
  PENDING = 'PENDING',
  IN_PREPARATION = 'IN_PREPARATION',
  ASSEMBLY = 'ASSEMBLY',
  ASSEMBLY_COMPLETED = 'ASSEMBLY_COMPLETED',
  BAKING = 'BAKING',
  READY = 'READY',
  DELIVERED = 'DELIVERED'
}

export const OrderStatusTranslation: { [key in OrderStatus]: string } = {
  [OrderStatus.PENDING]: 'Pendente',
  [OrderStatus.IN_PREPARATION]: 'Em Preparação',
  [OrderStatus.ASSEMBLY]: 'Montagem',
  [OrderStatus.ASSEMBLY_COMPLETED]: 'Montagem Concluída',
  [OrderStatus.BAKING]: 'Assando',
  [OrderStatus.READY]: 'Pronto',
  [OrderStatus.DELIVERED]: 'Entregue'
}; 