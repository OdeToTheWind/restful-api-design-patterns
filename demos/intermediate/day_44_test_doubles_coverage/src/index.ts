import { startServer } from '@restful/shared';
import { createApp } from './app';
import { config } from './config';
import {
  InMemoryInventory,
  InMemoryOrderRepository,
  LogMailer,
  SandboxPaymentGateway,
  systemClock,
} from './adapters/in-memory';
import { CheckoutService } from './checkout/checkout.service';

const checkout = new CheckoutService({
  payments: new SandboxPaymentGateway(),
  inventory: new InMemoryInventory(),
  orders: new InMemoryOrderRepository(),
  mailer: new LogMailer(),
  clock: systemClock,
});

startServer(createApp(checkout), { port: config.port, name: 'Day 44' });
