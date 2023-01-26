
import { Sports } from './general';
import {MesurementType, LangType, GoalType, LoadType, WeightBaseValue, ComplexType, WeightType} from './values';

export interface Program {
    id?: string;
    title?: string;
    password?: string;
    program: Complex[];
    system?: MesurementType;
    language?: LangType;
    date?: string;
    sport?: Sports;
    public?: boolean;
}

export interface Complex {
    id?: string;
    name: string;
    type?: ComplexType;
    value?: any;
    blocks: Block[];
    info?: string;
}

export interface Block {
    id?: string;
    movements: MovementConfig[];
    type?: ComplexType;
    value?: any;
    info?: string;
}

export interface MovementConfig {
    id?: string;
    movement: Movement;
    goal: Goal;
    load?: Load[]; 
    info?: string;
}

export interface Goal {
    type: GoalType; // Time, Reps, Calories, Distance, Quality
    values?: any[];
}
export interface Load {
    type: LoadType;
    maleValue: any;
    femaleValue?: any;
    weightType?: WeightType;
}

export interface Movement {
    id?: string;
    name: string;
    url?: string;
}

export interface Result {
    [GoalType.Time]?: any;
    [GoalType.Reps]?: any;
    [ComplexType.ROUNDS]?: any;
    [ComplexType.SETS]?: any;
    [GoalType.Calories]?: any;
    [GoalType.Distance]?: any;
    [GoalType.Length]?: any;
    [LoadType.Weight]?: any;
    [LoadType.Height]?: any;
}