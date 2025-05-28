export interface Goal {
    id?: number;
    name: string;
    indicator: string;
    objective: string;
    currentSituation: string;
    session: Session;
    status: string;
}

export interface Session {
    id: number;
    name: string;
    description: string;
}