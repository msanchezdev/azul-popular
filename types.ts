export type AllAsString<T> = Record<keyof T, string>;

export type Card = {
  CardNumber: string;
  Expiration: Date | string;
  CVC: number;
};

export type UsesCard = {
  Card: Card;
};

export type UsesToken = {
  Card: string;
};

export type ProcessPaymentArgs = {
  /**
   * Merchant ID. _(Provided by Azul)_
   */
  Store?: string;

  /**
   * PoS Input Mode. _(Provided by Azul)_
   */
  PosInputMode?: string;

  /**
   * Payment Channel. _(Provided by Azul)_
   */
  Channel?: string;

  /**
   * Currency used in trasnaction. _(Provided by Azul)_
   */
  CurrencyPosCode?: string;

  /**
   * Transaction Type. Defines the action to be realized
   */
  TrxType?: 'Sale' | 'Hold' | 'Refund';

  /**
   * _TBD_
   */
  Payments?: string;

  /**
   * _TBD_
   */
  Plan?: string;

  /**
   * _TBD_
   */
  AcquirerRefData?: string;

  /**
   * Retrieval Reference Number
   */
  RRN?: string;

  /**
   * Order Number
   */
  OrderNumber?: string;

  /**
   * Should save transaction info to data vault?
   */
  SaveToDataVault?: '0' | '1';

  /**
   * Customer Service Phone Number for the Merchant. Example: 8095442985
   */
  CustomerServicePhone?: string;

  /**
   * E-Commerce's URL
   */
  ECommerceURL?: string;

  /**
   * Custom Order Id. **Required for order retrieval**
   */
  CustomOrderId?: string;

  /**
   * Name to display on the client bank transaction.
   */
  AltMerchantName?: string;

  /**
   * Should 3D Secure be disabled? Disabled by default to avoid.
   *
   * TODO: Need to provide details about 3DS implementation
   */
  ForceNo3DS?: string;

  /**
   * Card Number. 16-digit string without spaces or special characters
   */
  CardNumber?: string;

  /**
   * Expiration Date. 6-digit string without spaces or special characters
   */
  Expiration?: string;

  /**
   * CVC. 3-digit string without spaces or special characters
   */
  CVC?: string;
};

export type ProcessPaymentSaleResponse = {
  AzulOrderId: string;
  AuthorizationCode: string;
  CustomOrderId: string;
  DateTime: Date;
  ErrorDescription: string;
  IsoCode: string;
  LotNumber: string;
  RRN: string;
  ResponseCode: string;
  ResponseMessage: string;
  Ticket: string;
  /**
   * If the request has been saved to the Data Vault. A Token if be returned.
   */
  DataVaultToken?: string;

  /**
   * If the request has been saved to the Data Vault. A Token if be returned.
   */
  DataVaultExpiration?: string;

  /**
   * If the Card has been saved to the Data Vault. The Brand will be returned
   */
  DataVaultBrand?: string;
};

export type ProcessPaymentSaleArgs = {
  Amount: number;
  Itbis: number;
  Use3DS?: boolean;
} & (UsesCard | UsesToken);

export type VoidResponse = ProcessPaymentSaleResponse;

export type PostArgs = {
  Amount: number;
  Itbis: number;
};
export type PostResponse = ProcessPaymentSaleResponse;

export type RefundArgs = {
  Amount: number;
  Itbis: number;
  OriginalDate: Date;
  AzulOrderId: string;
} & (UsesCard | UsesToken);

export type VerifyPaymentResponse = {
  Amount: number;
  AuthorizationCode: string;
  AzulOrderId: string;
  CardNumber: string;
  CurrencyPosCode: string;
  DateTime: string;
  ErrorDescription: string;
  Found: boolean;
  IsoCode: string;
  Itbis: number;
  LotNumber: string;
  OrderNumber: string;
  RRN: string;
  ResponseCode: string;
  Ticket: string;
};

export type ProcessDataVaultCreateArgs = UsesCard['Card'];
export type ProcessDataVaultCreateResponse = {
  Brand: string;
  CardNumber: string;
  DataVaultToken: string;
  ErrorDescription: string;
  Expiration: string;
  HasCVV: boolean;
  IsoCode: string;
  ResponseMessage: string;
};

export type ProcessDataVaultDeleteArgs = UsesToken['Card'];
export type ProcessDataVaultDeleteResponse = ProcessDataVaultCreateResponse;
