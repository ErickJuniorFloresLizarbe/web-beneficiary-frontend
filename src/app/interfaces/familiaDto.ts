import { Person } from "./person";

// family.dto.ts
export interface Family {
  id: number;
  lastName: string;
  direction: string;
  reasibAdmission: string;
  numberMembers: number;
  numberChildren: number;
  familyType: string;
  socialProblems: string;
  weeklyFrequency: string;
  feedingType: string;
  safeType: string;
  familyDisease: string;
  treatment: string;
  diseaseHistory: string;
  medicalExam: string;
  tenure: string;
  status: string;
  created?: string;
  deleted?: string;
  basicService: BasicService;
  housingDetails: HousingDetails;
}

export interface BasicService {
  waterService: string;
  servDrain: string;
  servLight: string;
  servCable: string;
  servGas: string;
  area: string;
  referenceLocation: string;
  residue: string;
  publicLighting: string;
  security: string;
  material: string;
  feeding: string;
  economic: string;
  spiritual: string;
  socialCompany: string;
  guideTip: string;
}

export interface HousingDetails {
  typeOfHousing: string;
  housingMaterial: string;
  housingSecurity: string;
  homeEnvironment: number;
  bedroomNumber: number;
  habitability: string;
  numberRooms: number;
  numberOfBedrooms: number;
  habitabilityBuilding: string;
}
