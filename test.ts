import Azul from '.';
import { ProcessPaymentArgs } from './types';

(async () => {
  try {
    const client = new Azul({
      auth1: 'testcert2',
      auth2: 'testcert2',
      cert: 'cert/certificate.crt',
      key: 'cert/private.key',
      store: {
        merchantId: '12121212121',
        channel: 'EC',
        posInputMode: 'E-Commerce',
        currencyPosCode: '$',
      },

      test: true,
      debug: true,
    });

    const override: ProcessPaymentArgs = {
      CustomOrderId: 'ORDER-1',
    };

    const Card = {
      CardNumber: '1111222233334444',
      CVC: 888,
      Expiration: new Date('2021-12'),
    };

    console.log('====================== Create Token =======================');
    const { DataVaultToken: Token } = await client.createToken(Card);

    console.log('========================== SALE =========================');
    const order1 = await client.sale(
      {
        Amount: 1,
        Itbis: 0.18,
        Card,
      },
      override,
    );

    console.log('=================== SALE (with thoken) =====================');
    const order2 = await client.sale(
      {
        Amount: 1,
        Itbis: 0.18,
        Card: Token,
      },
      override,
    );

    console.log('========================== REFUND ==========================');
    await client.refund({
      AzulOrderId: order1.AzulOrderId,
      OriginalDate: order1.DateTime,
      Amount: 1,
      Itbis: 0.18,
      Card,
    });

    await client.refund({
      AzulOrderId: order2.AzulOrderId,
      OriginalDate: order2.DateTime,
      Amount: 1,
      Itbis: 0.18,
      Card,
    });

    console.log('========================== HOLD ============================');
    const order3 = await client.hold(
      {
        Amount: 1,
        Itbis: 0.18,
        Card,
      },
      override,
    );

    console.log('=========================== VOID ===========================');
    await client.void(order3.AzulOrderId);

    console.log('========================= VERIFY ===========================');
    if (order1.CustomOrderId) {
      console.log(await client.verify(order1.CustomOrderId));
    }

    console.log('==================== Delete Token ========================');
    await client.deleteToken(Token);
  } catch (err) {
    console.log(`An error has occured: ${err}`);
  }
})();
