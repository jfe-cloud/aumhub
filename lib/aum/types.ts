export const MESSAGE_TYPE_BY_CODE = {
  1: 'MoveIn',
  2: 'MoveOut',
  3: 'Update',
  4: 'Cancellation',
  5: 'PreInfoMoveIn',
  6: 'PreInfoMoveOut'
} as const;

export type MessageTypeCode = keyof typeof MESSAGE_TYPE_BY_CODE;
export type MessageTypeName = (typeof MESSAGE_TYPE_BY_CODE)[MessageTypeCode];

export type PostalAddress = {
  addressLine1?: string;
  addressLine2?: string;
  street?: string;
  houseNumber?: string;
  dwellingNumber?: string;
  postOfficeBoxNumber?: number;
  postOfficeBoxText?: string;
  town?: string;
  swissZipCode?: number;
  foreignZipCode?: string;
  country?: string;
  locality?: string;
};

export type DownloadMessage = {
  transferId: string;
  transferTimestamp: string;
  messageTypeCode: number | string;
  messageType: string;
  messageTriggerType?: string;
  contractor?: Record<string, unknown>;
  tenant?: Record<string, unknown>;
  owner?: Record<string, unknown>;
  contract?: {
    beginOfContract?: string;
    endOfContract?: string;
  };
  building?: {
    egid?: number;
    addressLine1?: string;
    addressLine2?: string;
    street?: string;
    houseNumber?: string;
    dwellingNumber?: string;
    town?: string;
    swissZipCode?: number;
  };
  dwelling?: Record<string, unknown>;
  goesTo?: PostalAddress;
  goesToOrganisation?: Record<string, unknown>;
  previousTenant?: Record<string, unknown>;
  meterpointVSENationalID?: string;
  recognizedBuildingAddress?: Record<string, unknown>;
  additionalTenants?: Record<string, unknown>[];
  additionalPersonData?: Record<string, unknown>;
  personType?: string;
  idxObjectInfo?: Record<string, unknown>;
  sourceSystemReferences?: Record<string, unknown>;
  [key: string]: unknown;
};

export type DownloadMessageSet = DownloadMessage[];

export type AumMessageStatus = 'pending' | 'removed';
export type AumRemovedBy = 'consume' | 'confirm';
export type AumEventAction =
  | 'seed'
  | 'get_next'
  | 'consume'
  | 'consume_peek'
  | 'confirm';

export function normalizeMessageTypeCode(
  value: number | string
): number {
  const n = typeof value === 'string' ? Number.parseInt(value, 10) : value;
  return Number.isFinite(n) ? n : 0;
}

export function resolveMessageType(
  code: number | string,
  fallback?: string
): string {
  const n = normalizeMessageTypeCode(code) as MessageTypeCode;
  return MESSAGE_TYPE_BY_CODE[n] ?? fallback ?? String(code);
}
