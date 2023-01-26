import { RestrictionType, Sports } from "../models/general";
import { ParameterType, LoadType, ComplexType, LangType, GoalType, TimeValue, RepsValue, CaloriesValue, WeightBaseValue, LowerRepsValue, LengthValue, DistanceValue, PaceValue, UpperTimeValue, WeightValue, TimeValueRu, ComplexTypeRu } from "../models/values";
import { SportsRestrictions } from "../utils/sportsTypesRestrictions";
import { utils } from "../utils/utils";

const MAX_ROUNDS = 25; 
const MAX_PERCENT = 120;
const MAX_ADD = 30; 

export const sliderResolver = {
    maxValueByType: (sliderType: ParameterType, complexType?: ComplexType, goalType?: GoalType, loadType?: LoadType, sport?: Sports) => {

        switch(sliderType) { 
            case ParameterType.Type: 
                return !sport ? Object.keys(ComplexType).length-1 : Object.keys(SportsRestrictions[sport][RestrictionType.ComplexType]).length-1;
            case ParameterType.Goal: 
                return !sport ? Object.keys(GoalType).length-1 : Object.keys(SportsRestrictions[sport][RestrictionType.GoalType]).length-1;
            case ParameterType.Load: 
                return !sport ? Object.keys(LoadType).length-1 : Object.keys(SportsRestrictions[sport][RestrictionType.LoadType]).length-1;
            case ParameterType.Value:
                if(complexType != null) {
                    switch(complexType) { 
                        case ComplexType.AMRAP:
                            return Object.keys(UpperTimeValue).length-1;
                        case ComplexType.TIME:
                        case ComplexType.OT:  
                            return Object.keys(TimeValue).length-1;
                        case ComplexType.ROUNDS:
                        case ComplexType.SETS:
                        case ComplexType.LADDER:
                        case ComplexType.QUALITY:
                        case ComplexType.TABATA:
                        case ComplexType.AFAP:
                        case ComplexType.BTH:
                        case ComplexType.EMOM:
                        case ComplexType.E1HALFMOM:
                        case ComplexType.E2MOM:
                        case ComplexType.E3MOM:
                        case ComplexType.E4MOM:
                        case ComplexType.E5MOM:
                        case ComplexType.E10MOM:
                        case ComplexType.E15MOM:
                            return MAX_ROUNDS;
                        default:
                            return 0;
                    }
                } else if(goalType != null) {
                    switch(goalType) {
                        case GoalType.Time:
                        case GoalType.MaxTime:
                            return Object.keys(TimeValue).length-1;
                        case GoalType.Reps:
                        case GoalType.Combo:
                            return Object.keys(RepsValue).length-1;
                        case GoalType.Calories:
                            return Object.keys(CaloriesValue).length-1;
                        case GoalType.Length:
                            return Object.keys(LengthValue).length-1;
                        case GoalType.Distance:
                            return Object.keys(DistanceValue).length-1;
                        default:
                            return 0;
                    }
                } else if(loadType != null) {
                    switch(loadType) { 
                        case LoadType.Weight:
                        case LoadType.AddWeight:
                            return Object.keys(WeightValue).length-1; 
                        case LoadType.WeightBase:
                            return Object.keys(WeightBaseValue).length-1;
                        case LoadType.WeightPercent:
                            return MAX_PERCENT;
                        case LoadType.Deficit:
                        case LoadType.Height:
                            return Object.keys(LengthValue).length-1;
                        case LoadType.Distance:
                            return Object.keys(DistanceValue).length-1;
                        case LoadType.Pace:
                            return Object.keys(PaceValue).length-1;
                        case LoadType.AddReps:
                            return Object.keys(LowerRepsValue).length-1;
                        case LoadType.AddPercent:
                            return MAX_ADD;
                        case LoadType.OnThe:
                            return Object.keys(TimeValue).length-1;
                        default:
                            return 0;
                    }
                }
            default:
                return 0;
        }
    },
    complexParameterByIndexAndType: (type: ParameterType, complexType: ComplexType, index, sport: Sports) => {
        switch(type) {
            case ParameterType.Type:
                return sliderResolver.complexTypeByIndex(index, sport);
            case ParameterType.Value:
                return sliderResolver.complexValueByIndexAndType(complexType, index);
        }
    },
    complexTypeByIndex: (index: number, sport: Sports) => {
        const keys = !sport ? Object.keys(ComplexType) : Object.keys(SportsRestrictions[sport][RestrictionType.ComplexType]);
        return !sport ? ComplexType[keys[index]] : SportsRestrictions[sport][RestrictionType.ComplexType][keys[index]];
    },
    complexValueByIndexAndType: (complexType: ComplexType, index) => {
        switch(complexType) { 
            case ComplexType.AMRAP:
                const ukeys = Object.keys(UpperTimeValue);
                return UpperTimeValue[ukeys[index]];
            case ComplexType.TIME:
            case ComplexType.OT:  
                const keys = Object.keys(TimeValue);
                return TimeValue[keys[index]];
            case ComplexType.ROUNDS:
            case ComplexType.SETS:
            case ComplexType.LADDER:
            case ComplexType.QUALITY:
            case ComplexType.TABATA:
            case ComplexType.AFAP:
            case ComplexType.BTH:
            case ComplexType.EMOM:
            case ComplexType.E1HALFMOM:
            case ComplexType.E2MOM:
            case ComplexType.E3MOM:
            case ComplexType.E4MOM:
            case ComplexType.E5MOM:
            case ComplexType.E10MOM:
            case ComplexType.E15MOM:
                return index;
            default:
                return '-';
        }
    },
    movementParameterByIndexAndType: (type: ParameterType, subtype: ParameterType, movementGoalType: GoalType, movementLoadType: LoadType, index, sport?: Sports) => {
        switch(type) {
            case ParameterType.Goal:
                return sliderResolver.movementGoalByIndex(index, sport);
            case ParameterType.Load:
                return sliderResolver.movementLoadByIndex(index, sport);
            case ParameterType.Value:
                return sliderResolver.movementValueByIndexAndType(subtype, movementGoalType, movementLoadType, index);
        }
    },
    movementGoalByIndex: (index: number, sport?: Sports) => {
        const keys = !sport ? Object.keys(GoalType) : Object.keys(SportsRestrictions[sport][RestrictionType.GoalType]);
        return !sport ? GoalType[keys[index]] : SportsRestrictions[sport][RestrictionType.GoalType][keys[index]];
    },
    movementLoadByIndex: (index: number, sport?: Sports) => {
        const keys = !sport ? Object.keys(LoadType) : Object.keys(SportsRestrictions[sport][RestrictionType.LoadType]);
        return !sport ? LoadType[keys[index]] : SportsRestrictions[sport][RestrictionType.LoadType][keys[index]];
    },
    movementValueByIndexAndType: (type: ParameterType, movementGoalType: GoalType, movementLoadType: LoadType, index) => {
        
        switch(type) { 
            case ParameterType.Goal:
                switch(movementGoalType) { 
                    case GoalType.Distance:
                        const dkeys = Object.keys(DistanceValue);
                        return DistanceValue[dkeys[index]];
                    case GoalType.Length:
                        const lkeys = Object.keys(LengthValue);
                        return LengthValue[lkeys[index]];
                    case GoalType.MaxTime:
                    case GoalType.Time:
                        const keys = Object.keys(TimeValue);
                        return TimeValue[keys[index]];
                    case GoalType.Reps:
                    case GoalType.Combo:
                        const rkeys = Object.keys(RepsValue);
                        return RepsValue[rkeys[index]];
                    case GoalType.Calories:
                        const ckeys = Object.keys(CaloriesValue);
                        return CaloriesValue[ckeys[index]];
                    default:
                        return '-';
                }
            case ParameterType.Load:
                switch(movementLoadType) { 
                    case LoadType.Distance:
                        const dkeys = Object.keys(DistanceValue);
                        return DistanceValue[dkeys[index]];    
                    case LoadType.Weight:
                    case LoadType.AddWeight:
                        const wkeys = Object.keys(WeightValue);
                        return WeightValue[wkeys[index]];
                    case LoadType.WeightBase:
                        const wbkeys = Object.keys(WeightBaseValue);
                        return WeightBaseValue[wbkeys[index]];
                    case LoadType.Pace:
                        const pkeys = Object.keys(PaceValue);
                        return PaceValue[pkeys[index]];
                    case LoadType.Deficit:
                    case LoadType.Height:
                        const lkeys = Object.keys(LengthValue);
                        return LengthValue[lkeys[index]];
                    case LoadType.AddReps:
                        const rkeys = Object.keys(LowerRepsValue);
                        return LowerRepsValue[rkeys[index]];
                    case LoadType.Weight:
                        const ckeys = Object.keys(CaloriesValue);
                        return CaloriesValue[ckeys[index]];
                    case LoadType.WeightBase:
                        const bkeys = Object.keys(WeightBaseValue);
                        return WeightBaseValue[bkeys[index]];
                    case LoadType.WeightPercent:
                    case LoadType.AddPercent:
                        return index;
                    case LoadType.OnThe:
                        const tkeys = Object.keys(TimeValue);
                        return TimeValue[tkeys[index]];
                    default:
                        return '-';
                }
            default:
                return '-';
        }
    },
    resolveComplexValueShift: (type: ParameterType, complexType: ComplexType, currentValue, shift, sport: Sports) => {
        switch(type) {
            case ParameterType.Type:
                return sliderResolver.complexTypeByIndex(sliderResolver.getShiftedComplexTypeIndex(currentValue, shift, sport), sport);
            case ParameterType.Value:
                return sliderResolver.complexValueByIndexAndType(complexType, sliderResolver.getShiftedComplexValueIndex(complexType, currentValue, shift));
        }
    },
    resolveMovementValueShift: (type: ParameterType, subtype: ParameterType, movementGoalType: GoalType, movementLoadType: LoadType, currentValue, shift, sport?: Sports) => {
        switch(type) {
            case ParameterType.Goal:
                return sliderResolver.movementGoalByIndex(sliderResolver.getShiftedMovementGoalIndex(currentValue, shift, sport), sport);
            case ParameterType.Load:
                return sliderResolver.movementLoadByIndex(sliderResolver.getShiftedMovementLoadIndex(currentValue, shift, sport), sport);
            case ParameterType.Value:
                return sliderResolver.movementValueByIndexAndType(subtype, movementGoalType, movementLoadType, sliderResolver.getShiftedMovementValueIndex(subtype, movementGoalType, movementLoadType, currentValue, shift));
        }
    },
    getShiftedComplexTypeIndex: (currentValue: ComplexType, shift: number, sport: Sports) => {
        return sliderResolver.getShiftedIndex(!sport ? Object.values(ComplexType) : Object.values(SportsRestrictions[sport][RestrictionType.ComplexType]), currentValue, shift);
    },
    getShiftedMovementGoalIndex: (currentValue: GoalType, shift: number, sport: Sports) => {
        return sliderResolver.getShiftedIndex(!sport ? Object.values(GoalType) : Object.values(SportsRestrictions[sport][RestrictionType.GoalType]), currentValue, shift);
    },
    getShiftedMovementLoadIndex: (currentValue: LoadType, shift: number, sport: Sports) => {
        return sliderResolver.getShiftedIndex(!sport ? Object.values(LoadType) : Object.values(SportsRestrictions[sport][RestrictionType.LoadType]), currentValue, shift);
    },
    getIndex: (values, currentValue) => {
        let index = 0;
        
        values.map((nextType, nextIndex) => {
            if(nextType == currentValue) {
                index = nextIndex;
            }
        });

        return index;
    },
    getShiftedIndex: (values, currentValue, shift: number) => {
        let index = sliderResolver.getIndex(values, currentValue) + shift;

        if(index < 0) {
            index = 0;
        }
        if(index == values.length) {
            index = values.length-1;
        }

        return index;
    },
    getShiftedComplexValueIndex: (type: ComplexType, currentValue: any, shift: number) => {
        let values = [];

        switch(type) { 
            case ComplexType.AMRAP:
                values = Object.values(UpperTimeValue); break;
            case ComplexType.TIME:
            case ComplexType.OT:  
                values = Object.values(TimeValue); break;
            case ComplexType.ROUNDS:
            case ComplexType.SETS:
            case ComplexType.LADDER:
            case ComplexType.QUALITY:
            case ComplexType.TABATA:
            case ComplexType.AFAP:
            case ComplexType.BTH:
            case ComplexType.EMOM:
            case ComplexType.E1HALFMOM:
            case ComplexType.E2MOM:
            case ComplexType.E3MOM:
            case ComplexType.E4MOM:
            case ComplexType.E5MOM:
            case ComplexType.E10MOM:
            case ComplexType.E15MOM:
                values = utils.fillArray(MAX_ROUNDS); break;
            default:
                break;
        }

        return sliderResolver.getShiftedIndex(values, currentValue, shift);
    },
    getShiftedMovementValueIndex: (subtype: ParameterType, movementGoalType: GoalType, movementLoadType: LoadType, currentValue: any, shift: number) => {
        let values = [];
        
        switch(subtype) { 
            case ParameterType.Goal:
                switch(movementGoalType) { 
                    case GoalType.Distance:
                        values = Object.values(DistanceValue); break;
                    case GoalType.Length:
                        values = Object.values(LengthValue); break;
                    case GoalType.MaxTime:
                    case GoalType.Time:
                        values = Object.values(TimeValue); break;
                    case GoalType.Reps:
                    case GoalType.Combo:
                        values = Object.values(RepsValue); break;
                    case GoalType.Calories:
                        values = Object.values(CaloriesValue); break;
                    default:
                        break;
                }
            case ParameterType.Load:
                switch(movementLoadType) { 
                    case LoadType.Distance:
                        values = Object.values(DistanceValue); break;   
                    case LoadType.Weight:
                    case LoadType.AddWeight:
                        values = Object.values(WeightValue); break;
                    case LoadType.WeightBase:
                        values = Object.values(WeightBaseValue); break;
                    case LoadType.Pace:
                        values = Object.values(PaceValue); break;
                    case LoadType.Deficit:
                    case LoadType.Height:
                        values = Object.values(LengthValue); break;
                    case LoadType.AddReps:
                        values = Object.values(LowerRepsValue); break;
                    case LoadType.Weight:
                        values = Object.values(CaloriesValue); break;
                    case LoadType.WeightBase:
                        values = Object.values(WeightBaseValue); break;
                    case LoadType.WeightPercent:
                        values = utils.fillArray(MAX_PERCENT); break;
                    case LoadType.AddPercent:
                        values = utils.fillArray(MAX_ADD); break;
                    case LoadType.OnThe:
                        values = Object.values(TimeValue); break;
                    default:
                        break;
                }
            default:
                break;
        }

        return sliderResolver.getShiftedIndex(values, currentValue, shift);
    },
    resolveCurrentValueIndex: (sliderType: ParameterType, complexType?: ComplexType, goalType?: GoalType, loadType?: LoadType, sliderValue?: any, sport?: Sports) => {
        
        switch(sliderType) { 
            case ParameterType.Type: 
                return sliderResolver.getIndex(!sport ? Object.values(ComplexType) : Object.values(SportsRestrictions[sport][RestrictionType.ComplexType]), sliderValue);
            case ParameterType.Goal: 
                return sliderResolver.getIndex(!sport ? Object.values(GoalType) : Object.values(SportsRestrictions[sport][RestrictionType.GoalType]), sliderValue);
            case ParameterType.Load: 
                return sliderResolver.getIndex(!sport ? Object.values(LoadType) : Object.values(SportsRestrictions[sport][RestrictionType.LoadType]), sliderValue);
            case ParameterType.Value:
                if(complexType != null) {
                    switch(complexType) { 
                        case ComplexType.AMRAP:
                            return sliderResolver.getIndex(Object.values(UpperTimeValue), sliderValue);
                        case ComplexType.TIME:
                        case ComplexType.OT:  
                            return sliderResolver.getIndex(Object.values(TimeValue), sliderValue);
                        case ComplexType.ROUNDS:
                        case ComplexType.SETS:
                        case ComplexType.LADDER:
                        case ComplexType.QUALITY:
                        case ComplexType.TABATA:
                        case ComplexType.AFAP:
                        case ComplexType.BTH:
                        case ComplexType.EMOM:
                        case ComplexType.E1HALFMOM:
                        case ComplexType.E2MOM:
                        case ComplexType.E3MOM:
                        case ComplexType.E4MOM:
                        case ComplexType.E5MOM:
                        case ComplexType.E10MOM:
                        case ComplexType.E15MOM:
                            return sliderResolver.getIndex(utils.fillArray(MAX_ROUNDS), sliderValue);
                        default:
                            return 0;
                    }
                } else if(goalType != null) {
                    switch(goalType) { 
                        case GoalType.Time:
                        case GoalType.MaxTime:
                            return sliderResolver.getIndex(Object.values(TimeValue), sliderValue);
                        case GoalType.Reps:
                        case GoalType.Combo:
                            return sliderResolver.getIndex(Object.values(RepsValue), sliderValue);
                        case GoalType.Calories:
                            return sliderResolver.getIndex(Object.values(CaloriesValue), sliderValue);
                        case GoalType.Length:
                            return sliderResolver.getIndex(Object.values(LengthValue), sliderValue);
                        case GoalType.Distance:
                            return sliderResolver.getIndex(Object.values(DistanceValue), sliderValue);
                        default:
                            return 0;
                    }
                } else if(loadType != null) {
                    switch(loadType) { 
                        case LoadType.Weight:
                        case LoadType.AddWeight:
                            return sliderResolver.getIndex(Object.values(WeightValue), sliderValue);
                        case LoadType.WeightBase:
                            return sliderResolver.getIndex(Object.values(WeightBaseValue), sliderValue);
                        case LoadType.WeightPercent:
                            return sliderResolver.getIndex(utils.fillArray(MAX_PERCENT), sliderValue);
                        case LoadType.Deficit:
                        case LoadType.Height:
                            return sliderResolver.getIndex(Object.values(LengthValue), sliderValue);
                        case LoadType.Distance:
                            return sliderResolver.getIndex(Object.values(DistanceValue), sliderValue);
                        case LoadType.Pace:
                            return sliderResolver.getIndex(Object.values(PaceValue), sliderValue);
                        case LoadType.AddReps:
                            return sliderResolver.getIndex(Object.values(LowerRepsValue), sliderValue);
                        case LoadType.AddPercent:
                            return sliderResolver.getIndex(utils.fillArray(MAX_ADD), sliderValue);
                        case LoadType.OnThe:
                            return sliderResolver.getIndex(Object.values(TimeValue), sliderValue);
                        default:
                            return 0;
                    }
                }
            default:
                return 0;
        }
    },
};