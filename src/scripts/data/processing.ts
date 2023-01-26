import { BlockInstance, ComplexInstance, MovementConfigInstance, ProgramInstance } from "../models/blankProgram";
import { ComplexType, GoalType, GoalTypeRu } from "../models/values";
import { utils } from "../utils/utils";

export const workoutProcessor = {
    activateComplex: (workout: ProgramInstance, id) => {
        workout.program.forEach((complex: ComplexInstance) => {
            complex.onAir = complex.id == id ? !complex.onAir : false;
            if(complex.blocks.length > 0) {
                complex.blocks[0].onAir = complex.id == id ? complex.onAir : false;
    
                if(complex.blocks[0].movements.length > 0) {
                    complex.blocks[0].movements[0].onAir = complex.id == id ? complex.onAir : false;
                }
            }
        });
    
        return workout;
    },
    activateMovement: (workout: ProgramInstance, blockId, configId) => {
        workout.program.forEach(complex => {
            if(complex.onAir) {
                complex.blocks.forEach(block => { 
                    block.onAir = block.id == blockId;
                    
                    block.movements.forEach(config => { 
                        config.onAir = config.id == configId;
                    });
                });
            }
        });
    
        return workout;
    },
    activateNextMovement: (workout: ProgramInstance, roundNum?) => {
        let nextBlockId = void 0;
        let nextMovementId = void 0;
    
        workout.program.forEach((complex: ComplexInstance) => {
            if(complex.onAir) {
                complex.blocks.forEach((block: BlockInstance, bindex) => { 
                    if(block.onAir) { 
                        nextBlockId = block.id;
                    
                        block.movements.forEach((config, index) => { 
                            if(config.onAir) { 
                                
                                if(block.movements.length > (index+1)) { // set the next movement in the current block
                                    nextMovementId = block.movements[index+1].id;
                                } else if( // closing the round, set the first movement in the currend block
                                    complex.blocks.length > 1 && utils.isCircleType(block.type) && block.value > 1 && roundNum !== void 0 && roundNum+1 < block.value || 
                                    complex.blocks.length == 1 && utils.isCircleType(complex.type) && complex.value > 1 && roundNum !== void 0 && roundNum+1 < complex.value || 
                                    complex.blocks.length == 1 && utils.isCircleType(block.type) && block.value > 1 && roundNum !== void 0 && roundNum+1 < block.value ||
                                    roundNum === void 0
                                ) {
                                    nextMovementId = block.movements[0].id;
                                } else if(complex.blocks.length > (bindex+1)) { // multiple blocks and last movement in block
                                    let nextBlock = complex.blocks[bindex+1];
                                    nextBlockId = nextBlock.id;
                                    nextMovementId = nextBlock.movements[0].id;
                                }
                            }
                        });
                    }
                });
            }
        });
    
        if(nextBlockId && nextMovementId) {
            return workoutProcessor.activateMovement(workout, nextBlockId, nextMovementId);
        } 
    },
    saveCurrentTime: (workout: ProgramInstance, time) => {
        
        workout.program.forEach((complex: ComplexInstance) => {
            if(complex.onAir) {
                complex.blocks.forEach((block: BlockInstance, bindex) => { 
                    if(block.onAir) { 
                        block.movements.forEach((config, index) => { 
                            if(config.onAir) { 
                                config.result = config.result ? config.result : [];
                                config.result.push({[GoalType.Time]: time});
                            }
                        });
                    }
                });
            }
        });
    },
    getNextActiveMovementInfo: (workout: ProgramInstance, roundNum?) => {
        let result = void 0;
    
        workout.program.forEach((complex: ComplexInstance) => {
            if(complex.onAir) {
                complex.blocks.forEach((block: BlockInstance, bindex) => { 
                    if(block.onAir) { 
                    
                        block.movements.forEach((config, index) => { 
                            if(config.onAir) { 
                                if(block.movements.length > (index+1)) { // set the next movement in the current block
                                    result = {
                                        index: (index+1),
                                        title: block.movements[index+1].movement.name,
                                        goal: block.movements[index+1].goal
                                    };
                                } else if( // closing the round, set the first movement in the currend block
                                    complex.blocks.length > 1 && utils.isCircleType(block.type) && block.value > 1 && roundNum !== void 0 && roundNum+1 < block.value || 
                                    complex.blocks.length == 1 && utils.isCircleType(complex.type) && complex.value > 1 && roundNum !== void 0 && roundNum+1 < complex.value || 
                                    complex.blocks.length == 1 && utils.isCircleType(block.type) && block.value > 1 && roundNum !== void 0 && roundNum+1 < block.value ||
                                    roundNum === void 0
                                ) {
                                    result = {
                                        index: 0,
                                        title: block.movements[0].movement.name,
                                        goal: block.movements[0].goal
                                    };
                                } else if(complex.blocks.length > (bindex+1)) { // multiple blocks and last movement in block
                                    let nextBlock = complex.blocks[bindex+1];
                                    result = {
                                        index: 0,
                                        title: nextBlock.movements[0].movement.name,
                                        goal: block.movements[0].goal
                                    };
                                }
                            }
                        });
                    }
                });
            }
        });
    
        return result;
    },
    deactivateComplex: (workout: ProgramInstance) => {
        workout.program.forEach(complex => {
            complex.onAir = false;
            complex.blocks.forEach(block => { 
                block.onAir = false;
                block.movements.forEach(config => { 
                    config.onAir = false;
                });
            });
        });
    
        return workout;
    },
    getActiveTimeGoal: (workout: ProgramInstance) => {
        let value = void 0;
    
        workout.program.forEach((complex: ComplexInstance) => {
            if(complex.onAir) {
                if(complex.type == ComplexType.TIME) { // use complex time value if block and movement time are not defined
                    value = complex.value;
                }
    
                complex.blocks.forEach((block: BlockInstance) => { 
                    if(block.onAir) {
                        if(block.type == ComplexType.TIME) { // use block time value if movement time is not defined
                            value = block.value;
                        }
    
                        block.movements.forEach((config: MovementConfigInstance) => { 
                            if(config.onAir && config.goal.type == GoalType.Time) { // try to use the movement timing in the first place
                                value = (config.goal.values && config.goal.values[0]) || config.goal.maleValue;
                            }
                        });
                    }
                });
            }
        });
    
        return value;
    },
    getActiveMovementIndex: (workout: ProgramInstance) => {
        let result = 777; // just bigger than 0
    
        workout.program.forEach(complex => {
            if(complex.onAir) {
                complex.blocks.forEach(block => { 
                    if(block.onAir) {
                        block.movements.forEach((config, index) => { 
                            if(config.onAir) {
                                result = index;
                            }
                        });
                    }
                });
            }
        });
    
        return result;
    },
    getActiveMovementTitle: (complex: ComplexInstance) => {
        let title: string = '';
    
        complex.blocks.forEach(block => { 
            if(block.onAir) {
                block.movements.forEach(config => { 
                    if(config.onAir) {
                        title = config.movement.name;
                    }
                });
            }
        });
    
        return title;
    },
    getActiveMovementTitleByWorkout: (workout: ProgramInstance) => {
        let title: string = '';
    
        workout.program.forEach(complex => {
            if(complex.onAir) {
                complex.blocks.forEach(block => { 
                    if(block.onAir) {
                        block.movements.forEach(config => { 
                            if(config.onAir) {
                                title = config.movement.name;
                            }
                        });
                    }
                });
            }
        });
    
        return title;
    },
    getActiveMovementId: (complex: ComplexInstance) => {
        let id: string = '';
    
        complex.blocks.forEach(block => { 
            if(block.onAir) {
                block.movements.forEach(config => { 
                    if(config.onAir) {
                        id = config.id;
                    }
                });
            }
        });
    
        return id;
    },
    getActiveMovement: (complex: ComplexInstance) => {
        let movement = void 0;
        complex.blocks.forEach(block => { 
            if(block.onAir) {
                block.movements.forEach(config => { 
                    if(config.onAir) {
                        movement = config;
                    }
                });
            }
        });
        return movement;
    },
    getActiveBlockId: (complex: ComplexInstance) => {
        let id: string = '';
    
        complex.blocks.forEach(block => { 
            if(block.onAir) {
                id = block.id;
            }
        });
    
        return id;
    }
}