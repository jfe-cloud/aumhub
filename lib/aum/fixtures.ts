import { randomUUID } from 'crypto';
import type { DownloadMessage } from './types';

const moveOutBase: DownloadMessage = {
  transferId: 'fc3e1d87-8ccc-456c-9327-ecbc1c530370',
  transferTimestamp: '13.02.2020 15:39:52',
  messageTypeCode: 2,
  messageType: 'MoveOut',
  messageTriggerType: 'Scheduled',
  contractor: {
    organisationName: 'GARAIO AG',
    firstName: 'Wilhelm',
    lastName: 'Tell',
    emailAddress: 'info@immo.ch',
    phoneNumber: '+41 012 345 67 89',
    postalAddress: {
      dwellingNumber: '',
      postOfficeBoxNumber: 6249,
      postOfficeBoxText: 'Postfach',
      foreignZipCode: '',
      country: 'CH',
      addressLine1: '',
      addressLine2: '',
      street: 'Laupenstrasse',
      houseNumber: '45',
      town: 'Bern',
      swissZipCode: 3001
    }
  },
  tenant: {
    firstName: 'Luis',
    lastName: 'Gators',
    dateOfBirth: '1980-01-01',
    sex: 1,
    type: 'LegalPerson',
    emailAddress: 'info@tenant.ch',
    phoneNumber: '+41 012 345 67 89'
  },
  owner: {
    firstName: 'Max',
    lastName: 'Studer',
    emailAddress: 'max.studer@owner.ch',
    phoneNumber: '+41 048 852 52 25',
    postalAddress: {
      addressLine1: '',
      addressLine2: '',
      street: 'Eigerstrasse',
      houseNumber: '4',
      dwellingNumber: '',
      postOfficeBoxNumber: 0,
      postOfficeBoxText: '',
      locality: '',
      town: 'Bern',
      swissZipCode: 3001,
      foreignZipCode: '',
      country: 'CH'
    }
  },
  contract: {
    beginOfContract: '2014-01-01',
    endOfContract: '2020-04-30'
  },
  building: {
    egid: 1234567,
    dwellingNumber: '',
    addressLine1: '',
    addressLine2: '',
    street: 'Aachstrasse',
    houseNumber: '11',
    town: 'Erlen',
    swissZipCode: 8586
  },
  dwelling: {
    ewid: 1,
    administativeDwellingIdType: '',
    floorType: 'OG',
    positionOnFloor: 'Links',
    roomCount: 1.5
  },
  goesTo: {
    dwellingNumber: '',
    postOfficeBoxNumber: 0,
    postOfficeBoxText: '',
    foreignZipCode: '',
    country: 'CH',
    addressLine1: '',
    addressLine2: '',
    street: 'Technopark',
    houseNumber: '5',
    town: 'Zuerich',
    swissZipCode: 8005
  },
  goesToOrganisation: {
    egid: '1434933',
    providerId: '12X-0000001365-2',
    providerName: 'Energie Thun AG',
    organisationChanged: true
  },
  previousTenant: {
    firstName: 'Bill',
    lastName: 'Tscherno',
    dateOfBirth: '1986-04-26',
    sex: 3
  },
  meterpointVSENationalID: 'ABC123',
  recognizedBuildingAddress: {
    egid: 2334896,
    street: 'Aachstrasse',
    houseNumber: '11',
    town: 'Erlen',
    swissZipCode: 8586
  },
  additionalPersonData: {
    emailAddress: 'info@tenant.ch',
    phoneNumber: '+41 012 345 67 89'
  },
  additionalTenants: [
    {
      firstName: 'Hans',
      lastName: 'Muster',
      emailAddress: 'hans.muster@tenant.ch',
      phoneNumber: '+41 011 345 67 99'
    },
    {
      firstName: 'Peter',
      lastName: 'Krähenbühl',
      emailAddress: 'peter.kraehenbuehl@tenant.ch',
      phoneNumber: '+41 055 345 79 97'
    }
  ],
  personType: 'LegalPerson',
  idxObjectInfo: {
    idxObjectCategory: 'APPT',
    idxObjectType: 3
  },
  sourceSystemReferences: {
    contract: '0X-C20301',
    building: '023',
    dwelling: '023.2442'
  }
};

const moveInBase: DownloadMessage = {
  ...moveOutBase,
  transferId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567001',
  messageTypeCode: 1,
  messageType: 'MoveIn',
  contract: {
    beginOfContract: '2020-05-01',
    endOfContract: undefined
  }
};

export type FixtureKind = 'moveIn' | 'moveOut';

export function createFixtureMessage(
  kind: FixtureKind,
  options?: { transferId?: string }
): DownloadMessage {
  const base = kind === 'moveIn' ? moveInBase : moveOutBase;
  return {
    ...structuredClone(base),
    transferId: options?.transferId ?? randomUUID(),
    transferTimestamp: new Date().toISOString()
  };
}
