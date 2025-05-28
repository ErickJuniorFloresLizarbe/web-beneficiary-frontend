export interface Session {
    id: number;
    name: string;
    description: string;
    status: string;
    goals: Goal[];
}

export interface Goal {
    id: number;
    name: string;
    description: string;
    sessionId: number;
}