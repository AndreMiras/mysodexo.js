interface BasicResponse {
  code: number;
  msg: string;
}

interface GetClearPinResponse {
  clearPin: {
    pin: string;
  };
}

interface LoginResponse extends BasicResponse {
  response: {
    beneficiaryCode: number;
    companyId: number;
    name: string;
    surname1: string;
    surname2: string;
    dni: string;
    email: string;
    password: string;
    dateBorn: string;
    gender: number;
    mobile: string;
    typeAddressJob: number;
    nameAddressJob: string;
    complementaryDataJob: string;
    postalCodeJob: string;
    stateJob: number;
    cityJob: number;
    activated: number;
    dateUp: string;
    internalCode: number;
    newsletter: number;
    cardCode4: string;
    securityDate: string;
    matricula: string;
    acepto_terminos: number;
    changePassword: number;
    userData: {
      userId: number;
      nameAddress: string;
      typeAddress: number;
      complementaryData: string;
      postalCode: string;
      state: number;
      city: number;
      typeWorkDay: number;
      departmentId: number;
      functionId: number;
      netIncomeId: number;
      hasChildren: number;
    };
    interestCollection: Array<{
      idInteres: number;
    }>;
  };
}

interface LoginFunctionResponse {
  accountInfo: LoginResponse["response"];
  cookie: string;
}

interface CardResponseItem {
  service: string;
  idCard: number;
  cardNumber: string;
  cardStatus: string;
  idCardStatus: string;
  pan: string;
  caducityDateCard: string;
  idProduct: number;
  programFis: string;
  hasChip: number;
  idCompany: number;
  arrFisToChange: Array<{
    key: string;
    value: string;
  }>;
  idFisToChange: string;
  fisToChangeState: string;
}

interface GetCardsResponse extends BasicResponse {
  response: {
    listCard: CardResponseItem[];
  };
}

interface BalanceFis {
  saldoDisponible: number;
  apuntesPendientes: number;
}

interface CardDetail {
  idCard: number;
  cardNumber: string;
  idCardPayProvider: number;
  idBeneficiary: number;
  idCardStatus: string;
  employeeName: string;
  printerName: string;
  legalNumber: string;
  cardBalance: number;
  caducityDateCard: string;
  cardStatus: string;
  idCompany: number;
  faceValue: number;
  creationDate: string;
  idAddress: number;
  addressReference: string;
  idCustomize: number;
  perfil: string;
  description: string;
  itemType: number;
  idProduct: number;
  idContract: number;
  pan: string;
  cardStatusDate: string;
  accountId: string;
  limitPassed: number;
  idProfile: number;
  maxValueOfConsum: number;
  limiteConsumo: number;
  programFis: string;
  hasChip: number;
  balanceFis: BalanceFis;
  arrFisToChange: Array<{
    key: string;
    value: string;
  }>;
  idFisToChange: string;
  blockedAmount: string;
  totalBalance: string;
  maxLoad: number;
  maxUsesDay: number;
  infoBalanceRestriction: string;
  dayRestriction: string;
  useOnHoliday: string;
}

interface GetDetailCardResponse extends BasicResponse {
  response: {
    cardDetail: CardDetail;
  };
}

export type {
  BasicResponse,
  GetClearPinResponse,
  LoginResponse,
  LoginFunctionResponse,
  CardResponseItem,
  GetCardsResponse,
  BalanceFis,
  CardDetail,
  GetDetailCardResponse,
};
