export interface Issue {
    id?: number;
    name: string;
    workshopId: number;
    workshopName?: string;
    scheduledTime: string;
    state: string;
    sesion?: string;
}
