import { Goal } from './goal';
// transformation.model.ts
import { Family } from '../interfaces/familiaDto';

export interface Transformation {
    id: number;
    firstPlanDate: Date;
    lastUpdateDate: Date;
    duration: string;
    status: string;
    goal: Goal;
    family: Family;  // Relación completa con Family
}