import { ComplexType, GoalType, LoadType } from "../models/values";
import { svg } from "../utils/svg";

export const iconsResolver = {
    byComplexType: (type) => {
        switch(type) { // AMRAP='AMRAP', AFAP='AFAP', ROUNDS='ROUNDS', TIME='TIME', BTH='BTH', TABATA='TABATA', QUALITY='QUALITY' 
            case ComplexType.AMRAP:
                return svg.twoCap;
            case ComplexType.TIME: 
            case ComplexType.OT:  
                return svg.roundDuration;
            case ComplexType.AFAP:
            case ComplexType.ROUNDS:
            case ComplexType.SETS:
            case ComplexType.LADDER:
            case ComplexType.QUALITY:    
            case ComplexType.TABATA:
            case ComplexType.BTH: 
            case ComplexType.EMOM:
            case ComplexType.E1HALFMOM:
            case ComplexType.E2MOM:
            case ComplexType.E3MOM:
            case ComplexType.E4MOM:
            case ComplexType.E5MOM:
            case ComplexType.E10MOM:
            case ComplexType.E15MOM:
                return svg.rounds;
            default:
                return '';
        }
    },
    byBlockType: (type) => {
        switch(type) { // AMRAP='AMRAP', AFAP='AFAP', ROUNDS='ROUNDS', TIME='TIME', BTH='BTH', TABATA='TABATA', QUALITY='QUALITY' 
            case ComplexType.AMRAP:
                return svg.blackCap;
            case ComplexType.TIME: 
            case ComplexType.TABATA: 
            case ComplexType.OT:  
                return svg.blackRoundDuration;
            case ComplexType.AFAP:
            case ComplexType.ROUNDS:
            case ComplexType.SETS:
            case ComplexType.LADDER:
            case ComplexType.QUALITY:
            case ComplexType.BTH: 
            case ComplexType.EMOM:
            case ComplexType.E1HALFMOM:
            case ComplexType.E2MOM:
            case ComplexType.E3MOM:
            case ComplexType.E4MOM:
            case ComplexType.E5MOM:
            case ComplexType.E10MOM:
            case ComplexType.E15MOM:
                return svg.blackRounds;
            default:
                return '';
        }
    },
    byConfigGoalType: (type, colorClass) => {
        switch(type) { // Reps='Reps', Time='Time', Calories='Calories', Distance='Distance', Quality='Quality', Length='Length', MinTime='Min time', MaxTime='Max time', MaxReps='Max reps', RepsUnbroken='Max unbroken reps' 
            case GoalType.Reps:
            case GoalType.Combo:
            case GoalType.None:
            case GoalType.MaxReps:
            case GoalType.PercentMaxReps:
            case GoalType.RepsUnbroken:
                return svg[`${colorClass}Reps`];
            case GoalType.Time: 
                return svg[`${colorClass}SetDuration`];
            case GoalType.MaxTime: 
                return svg[`${colorClass}Cap`];
            case GoalType.Calories: 
            case GoalType.MaxCal: 
                return svg[`${colorClass}Calories`];
            case GoalType.Distance:
            case GoalType.Length: 
                return svg[`${colorClass}Distance`];
            default:
                return '';
        }
    },
    byConfigLoadType: (type, colorClass) => {
        switch(type) { // Weight='Weight', WeightPercent="Weight %", WeightBase="Weight base", Pace='Pace', Deficit='Deficit', Height='Height', Distance='Distance', AddReps='Add reps'
            case LoadType.None:
            case LoadType.Weight:
            case LoadType.WeightPercent:
            case LoadType.WeightBase:
            case LoadType.MaxWeight:
            case LoadType.AddWeight:
            case LoadType.AddPercent:
                return svg[`${colorClass}Weight`];
            case LoadType.Deficit: 
            case LoadType.Height: 
                return svg[`${colorClass}Height`];
            case LoadType.Pace: 
                return svg[`${colorClass}Pace`];
            case LoadType.Distance:
                return svg[`${colorClass}Distance`];
            case LoadType.AddReps: 
                return svg[`${colorClass}Reps`];
            default:
                return '';
        }
    },
}; 