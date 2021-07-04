require('dotenv').config();
const { default: Azul } = require('./dist');

(async () => {
  try {
    const client = new Azul({
      auth1: process.env.AZUL_AUTH1,
      auth2: process.env.AZUL_AUTH2,
      cert: process.env.AZUL_CERT,
      key: process.env.AZUL_KEY,
      store: {
        merchantId: process.env.AZUL_MERCHANT_ID,
        channel: process.env.AZUL_CHANNEL,
        posInputMode: process.env.AZUL_INPUT_MODE,
        currencyPosCode: process.env.AZUL_CURRENCY_CODE,
      },

      test: true,
      debug: true,
    });

    const override = {
      CustomOrderId: 'ORDER-1',
    };

    const Card = {
      CardNumber: process.env.AZUL_CARD_NUMBER,
      CVC: process.env.AZUL_CVC,
      Expiration: new Date(process.env.AZUL_EXPIRATION),
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
