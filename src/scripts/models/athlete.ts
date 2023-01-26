import {WeightBaseValue, GoalType} from "./values";
import {Movement} from "./workout";

export interface Athlete {
    id: string;
    name: string;
    email: string;
    accessToken: string;
    age: number | null;
    avatarURL: string | null; 
    static: Measurement[]; // in order to track weight, height and other static measurements changes over time
    performance: PerformanceMeasurement[]; // in order to track progress over time and display latest measurements
}

export interface Measurement {
    id: string;
    athleteId: string;
    date: Date;
    type: MeasurementType;
    value: number;
}

export interface PerformanceMeasurement extends Measurement {
    id: string;
    maxRepsBase: WeightBaseValue | null; 
    timeCap: number | null;
    goalType: GoalType; // Time, Reps, Calories, Distance
    movement: Movement;
}

export enum MeasurementType {
    Weight, Height, Movement
}