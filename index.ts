import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { randomBytes, randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import https from 'https';
import {
  PostArgs,
  PostResponse,
  RefundArgs,
  ProcessPaymentSaleArgs,
  ProcessPaymentArgs,
  ProcessPaymentSaleResponse,
  UsesCard,
  UsesToken,
  VoidResponse,
  VerifyPaymentResponse,
  ProcessDataVaultCreateArgs,
  ProcessDataVaultCreateResponse,
  ProcessDataVaultDeleteResponse,
  ProcessDataVaultDeleteArgs,
} from './types';

export default class Azul {
  private http: AxiosInstance;
  private defaults: ProcessPaymentArgs;

  constructor(private config: AzulConfig) {
    const subdomain = config.test ? 'pruebas' : 'pagos';

    this.defaults = {
      Store: this.config.store.merchantId,
      PosInputMode: this.config.store.posInputMode || 'E-Commerce',
      Channel: this.config.store.channel || 'EC',
      CurrencyPosCode: this.config.store.currencyPosCode || '$',
      AcquirerRefData: '',
      CardNumber: '',
      Expiration: '',
      CVC: '',
      AltMerchantName: '',
      CustomOrderId: '',
      CustomerServicePhone: '',
      ECommerceURL: '',
      ForceNo3DS: '1',
      OrderNumber: '',
      Payments: '',
      Plan: '',
      RRN: '',
      SaveToDataVault: '0',
    };

    this.http = axios.create({
      baseURL: `https://${subdomain}.azul.com.do/WebServices/JSON/Default.aspx?`,
      headers: {
        Auth1: config.auth1,
        Auth2: config.auth2,
      },
      httpsAgent: new https.Agent({
        cert: readFileSync(config.cert),
        key: readFileSync(config.key),
      }),
    });

    if (config.debug) {
      this.http.interceptors.request.use((request) => {
        const id = randomUUID();
        const method = request.method?.toUpperCase();
        const url = (request.baseURL || '') + (request.url || '');
        request.url = url;

        // @ts-ignore
        request.id = id;
        console.log(
          `--> [${id}] ${method} ${url}${
            request.data ? '\n' + JSON.stringify(request.data, null, 2) : ''
          }`,
        );

        return request;
      });

      this.http.interceptors.response.use(
        (response) => {
          // @ts-ignore
          const id = response.config.id;

          console.log(`<-- [${id}]\n${JSON.stringify(response.data, null, 2)}`);
          return response;
        },
        (error) => {
          // @ts-ignore
          const id = error.config.id;
          console.log(
            `<-- [${id}]\n${JSON.stringify(error.response.data, null, 2)}`,
          );
        },
      );
    }
  }

  sale(
    { Amount, Itbis, Card }: ProcessPaymentSaleArgs,
    optionals?: ProcessPaymentArgs,
  ) {
    return normalize(
      this.http.post<ProcessPaymentSaleResponse>('ProcessPayment', {
        ...this.defaults,
        ...validateCard(Card),
        Amount: (Amount * 100).toFixed(0),
        Itbis: (Itbis * 100).toFixed(0),

        TrxType: 'Sale',
        AcquirerRefData: '1',
        ...optionals,
      }),
    );
  }

  refund(
    { AzulOrderId, OriginalDate, Amount, Itbis }: RefundArgs,
    optionals?: ProcessPaymentArgs,
  ) {
    return normalize(
      this.http.post<ProcessPaymentSaleResponse>('ProcessPayment', {
        ...this.defaults,
        AzulOrderId,
        OriginalDate: OriginalDate.toISOString()
          .replace(/[-:]/g, '')
          .slice(0, 8),
        Amount: (Amount * 100).toFixed(0),
        Itbis: (Itbis * 100).toFixed(0),

        TrxType: 'Refund',
        ForceNo3DS: '1',
        ...optionals,
      }),
    );
  }

  hold(args: ProcessPaymentSaleArgs, optionals?: ProcessPaymentArgs) {
    return this.sale(
      { ...args },
      {
        TrxType: 'Hold',
        ...optionals,
      },
    );
  }

  post(orderId: string, { Amount, Itbis }: PostArgs) {
    return normalize(
      this.http.post<PostResponse>('ProcessPost', {
        ...this.defaults,
        AzulOrderId: orderId,
        Amount: (Amount * 100).toFixed(0),
        Itbis: (Itbis * 100).toFixed(0),
      }),
    );
  }

  void(orderId: string) {
    return normalize(
      this.http.post<VoidResponse>('ProcessVoid', {
        ...this.defaults,
        AzulOrderId: orderId,
      }),
    );
  }

  verify(customOrderId: string) {
    return normalize(
      this.http.post<VerifyPaymentResponse>('VerifyPayment', {
        ...this.defaults,
        CustomOrderId: customOrderId,
      }),
    );
  }

  createToken(Card: ProcessDataVaultCreateArgs) {
    return normalize(
      this.http.post<ProcessDataVaultCreateResponse>('ProcessDataVault', {
        ...this.defaults,
        TrxType: 'CREATE',
        ...validateCard(Card),
      }),
    );
  }

  deleteToken(Card: ProcessDataVaultDeleteArgs) {
    return normalize(
      this.http.post<ProcessDataVaultDeleteResponse>('ProcessDataVault', {
        ...this.defaults,
        TrxType: 'DELETE',
        ...validateCard(Card),
      }),
    );
  }
}

interface AzulConfig {
  /**
   *
   */
  auth1: string;
  auth2: string;
  cert: string;
  key: string;

  store: {
    /**
     * Merchant ID. _Provided by Azul_
     */
    merchantId: string;

    /**
     * Payment Channel. _Provided by Azul_
     *
     * TODO: Check valid values
     */
    channel?: 'EC';

    /**
     * PoS Input Mode. _Provided by Azul_
     *
     * TODO: Check valid values
     */
    posInputMode?: 'E-Commerce';

    /**
     * Currency used by the Merchant. _Provided by Azul_
     *
     * TODO: Check valid values
     */
    currencyPosCode?: '$';
  };

  /**
   * Determines which Azul domain will be used. Testing or Production
   */
  test?: boolean;

  /**
   * If true, every request/response will be logged to stdout
   */
  debug?: boolean;
}

async function normalize<T extends AxiosResponse>(requestPromise: Promise<T>) {
  const { data } = await requestPromise;
  const result: any = data;

  if ('DateTime' in result) {
    result.DateTime = new Date(
      result.DateTime.replace(
        /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
        '$1-$2-$3 $4:$5:$6 -04:00',
      ),
    );
  }

  if ('Expiration' in result) {
    result.Expiration = new Date(
      result.Expiration.replace(/(\d{4})(\d{2})/, '$1-$2'),
    );

    if (isNaN(result.Expiration)) {
      result.Expiration = null;
    }
  }

  const moneyFields = ['Amount', 'Itbis'];
  for (const field of moneyFields) {
    if (field in result) {
      result[field] = Number(result[field]) / 100;
    }
  }

  // Throw error if request has been declined
  if ('ResponseMessage' in result && result.ResponseMessage !== 'APROBADA') {
    throw Object.assign(
      new Error(`${result.ErrorDescription} (${JSON.stringify(result)})`),
      result,
    );
  }

  return result as T['data'];
}

function validateCard(card: UsesCard['Card'] | UsesToken['Card']) {
  if (typeof card === 'string') {
    return {
      DataVaultToken: card,
    };
  }

  return {
    ...card,
    Expiration: new Date(card.Expiration)
      .toISOString()
      .split('-')
      // take only year and month
      .slice(0, 2)
      .join(''),
  };
}
