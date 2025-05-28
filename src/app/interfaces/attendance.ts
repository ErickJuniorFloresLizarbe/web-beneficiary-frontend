export interface Attendance {
    id?: number;
    issueId: number | null;
    issueName?: string;
    personId: number | null;
    personName?: string;
    entryTime: string;
    justificationDocument: string;
    workshopName?: string;
    record: string;
    state: string;
}
