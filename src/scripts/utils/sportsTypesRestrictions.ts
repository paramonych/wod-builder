import { Sports, RestrictionType } from "../models/general";
import { ComplexType, ComplexTypeKeys, GoalType, GoalTypeKeys, LoadType, LoadTypeKeys } from "../models/values";

export const SportsRestrictions = {
    [Sports.Crossfit]: {
        [RestrictionType.ComplexType]: { 
            [ComplexTypeKeys.NONE]: ComplexType.NONE, 
            [ComplexTypeKeys.AMRAP]: ComplexType.AMRAP, 
            [ComplexTypeKeys.AFAP]: ComplexType.AFAP,
            [ComplexTypeKeys.ROUNDS]: ComplexType.ROUNDS,
            [ComplexTypeKeys.SETS]: ComplexType.SETS, 
            [ComplexTypeKeys.LADDER]: ComplexType.LADDER,
            [ComplexTypeKeys.OT]: ComplexType.OT,
            [ComplexTypeKeys.TIME]: ComplexType.TIME,
            [ComplexTypeKeys.BTH]: ComplexType.BTH,
            [ComplexTypeKeys.EMOM]: ComplexType.EMOM,
            [ComplexTypeKeys.E1HALFMOM]: ComplexType.E1HALFMOM,
            [ComplexTypeKeys.E2MOM]: ComplexType.E2MOM,
            [ComplexTypeKeys.E3MOM]: ComplexType.E3MOM,
            [ComplexTypeKeys.E4MOM]: ComplexType.E4MOM,
            [ComplexTypeKeys.E5MOM]: ComplexType.E5MOM,
            [ComplexTypeKeys.E10MOM]: ComplexType.E10MOM,
            [ComplexTypeKeys.E15MOM]: ComplexType.E15MOM,
            [ComplexTypeKeys.TABATA]: ComplexType.TABATA,
            [ComplexTypeKeys.QUALITY]: ComplexType.QUALITY,
        },
        [RestrictionType.GoalType]: {
            [GoalTypeKeys.None]: GoalType.None, 
            [GoalTypeKeys.Reps]: GoalType.Reps,
            [GoalTypeKeys.Combo]: GoalType.Combo, 
            [GoalTypeKeys.Time]: GoalType.Time,
            [GoalTypeKeys.Calories]: GoalType.Calories,
            [GoalTypeKeys.Distance]: GoalType.Distance,
            [GoalTypeKeys.Length]: GoalType.Length,
            [GoalTypeKeys.MaxTime]: GoalType.MaxTime,
            [GoalTypeKeys.MaxReps]: GoalType.MaxReps,
            [GoalTypeKeys.PercentMaxReps]: GoalType.PercentMaxReps,
            [GoalTypeKeys.MaxCal]: GoalType.MaxCal,
            [GoalTypeKeys.RepsUnbroken]: GoalType.RepsUnbroken
        },
        [RestrictionType.LoadType]: {
            [LoadTypeKeys.None]: LoadType.None,
            [LoadTypeKeys.MaxWeight]: LoadType.MaxWeight,
            [LoadTypeKeys.Weight]: LoadType.Weight,
            [LoadTypeKeys.WeightPercent]: LoadType.WeightPercent,
            [LoadTypeKeys.WeightBase]: LoadType.WeightBase,
            [LoadTypeKeys.Pace]: LoadType.Pace,
            [LoadTypeKeys.Deficit]: LoadType.Deficit,
            [LoadTypeKeys.Height]: LoadType.Height,
            [LoadTypeKeys.Distance]: LoadType.Distance,
            [LoadTypeKeys.AddReps]: LoadType.AddReps,
            [LoadTypeKeys.AddWeight]: LoadType.AddWeight,
            [LoadTypeKeys.AddPercent]: LoadType.AddPercent,
            [LoadTypeKeys.OnThe]: LoadType.OnThe,
            [LoadTypeKeys.Unbroken]: LoadType.Unbroken
        }
    },
    [Sports.Weightlifting]: {
        [RestrictionType.ComplexType]: {
            [ComplexType.NONE]: ComplexType.NONE, // allowed
            // [ComplexType.AMRAP]: ComplexType.AMRAP, 
            // [ComplexType.AFAP]: ComplexType.AFAP,
            // [ComplexType.ROUNDS]: ComplexType.ROUNDS,
            [ComplexType.SETS]: ComplexType.SETS, // allowed
            // [ComplexType.LADDER]: ComplexType.LADDER,
            // [ComplexType.OT]: ComplexType.OT,
            // [ComplexType.TIME]: ComplexType.TIME,
            // [ComplexType.BTH]: ComplexType.BTH,
            // [ComplexType.EMOM]: ComplexType.EMOM,
            // [ComplexType.E1HALFMOM]: ComplexType.E1HALFMOM,
            // [ComplexType.E2MOM]: ComplexType.E2MOM,
            // [ComplexType.E3MOM]: ComplexType.E3MOM,
            // [ComplexType.E4MOM]: ComplexType.E4MOM,
            // [ComplexType.E5MOM]: ComplexType.E5MOM,
            // [ComplexType.E10MOM]: ComplexType.E10MOM,
            // [ComplexType.E15MOM]: ComplexType.E15MOM,
            // [ComplexType.TABATA]: ComplexType.TABATA,
            // [ComplexType.QUALITY]: ComplexType.QUALITY,
        },
        [RestrictionType.GoalType]: {
            [GoalTypeKeys.None]: GoalType.None, // allowed
            [GoalTypeKeys.Reps]: GoalType.Reps, // allowed
            [GoalTypeKeys.Combo]: GoalType.Combo, // allowed
            // [GoalTypeKeys.Time]: GoalType.Time,
            // [GoalTypeKeys.Calories]: GoalType.Calories,
            // [GoalTypeKeys.Distance]: GoalType.Distance,
            // [GoalTypeKeys.Length]: GoalType.Length,
            // [GoalTypeKeys.MaxTime]: GoalType.MaxTime,
            // [GoalTypeKeys.MaxReps]: GoalType.MaxReps,
            // [GoalTypeKeys.PercentMaxReps]: GoalType.PercentMaxReps,
            // [GoalTypeKeys.MaxCal]: GoalType.MaxCal,
            // [GoalTypeKeys.RepsUnbroken]: GoalType.RepsUnbroken
        },
        [RestrictionType.LoadType]: {
            [LoadTypeKeys.None]: LoadType.None, // allowed
            // [LoadTypeKeys.MaxWeight]: LoadType.MaxWeight,
            [LoadTypeKeys.WeightPercent]: LoadType.WeightPercent, // allowed
            [LoadTypeKeys.Weight]: LoadType.Weight, // allowed
            // [LoadTypeKeys.WeightBase]: LoadType.WeightBase,
            // [LoadTypeKeys.Pace]: LoadType.Pace,
            // [LoadTypeKeys.Deficit]: LoadType.Deficit,
            // [LoadTypeKeys.Height]: LoadType.Height,
            // [LoadTypeKeys.Distance]: LoadType.Distance,
            // [LoadTypeKeys.AddReps]: LoadType.AddReps,
            // [LoadTypeKeys.AddWeight]: LoadType.AddWeight,
            // [LoadTypeKeys.AddPercent]: LoadType.AddPercent,
            // [LoadTypeKeys.OnThe]: LoadType.OnThe,
            // [LoadTypeKeys.Unbroken]: LoadType.Unbroken
        }
    }
}