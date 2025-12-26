export enum UserRole {
  ADMIN = "ADMIN",
  CASHIER = "CASHIER",
  WAITER = "WAITER",
}

export type User = {
  id: string;
  name: string;
  username: string;
  password?: string; // Opcional, apenas para envio
  role: UserRole;
  createdAt: string;
};