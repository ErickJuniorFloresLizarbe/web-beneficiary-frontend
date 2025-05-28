export interface ReportDto {
    id: number;
    year: number;
    trimester: string;
    description: string;
    schedule: string;
    status: string;
}

export interface ReportWorkshopDto {
    id: number;
    reportId: number;
    workshopId?: number;
    workshopName: string;
    workshopDateStart?: string;
    workshopDateEnd?: string;
    description: string;
    imageUrl: string[];
    workshopStatus?: string;
}


export interface ReportWithWorkshopsDto {
    report: ReportDto;
    workshops: ReportWorkshopDto[];
}


export interface ImageUrl {
    file: File | null
    preview: string
    name: string
}

export interface WorkshopKafkaEventDto {
    id: number;
    name: string;
    dateStart: string;
    dateEnd: string;
    status: string;
}