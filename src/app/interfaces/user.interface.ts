export interface User {
    id?: number;
    firebaseUid?: string;
    name: string;
    lastName: string;
    documentNumber: string;
    documentType: "DNI" | "CNE";
    cellPhone: string;
    email: string;
    password?: string;
    role: string[];
    profileImage?: string;
}
