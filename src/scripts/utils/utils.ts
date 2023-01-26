import {DateTime} from 'luxon';
import {div, img} from '@cycle/dom';
import {User} from '../models/general';
import {Complex, Block, Load, Goal, Movement, MovementConfig, Program} from '../models/workout';
import {ComplexType, LoadType, GoalType, TimeValue, GoalTypeRu} from '../models/values';
import { textLabels } from './labels';
import { ProgramInstance, MovementConfigInstance, LoadInstance, BlockInstance } from '../models/blankProgram';
import { svg } from './svg';

const anonymous = require('../../images/ava-stub.jpg'); 
const alphabeth = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
const lang = navigator.language == 'ru-RU' ? 'RU' : 'EN';

export const utils = {
    getElementId: (e) => {
        return e ? e.target.dataset['id'] : '';
    },
    random: () => Math.round(Math.random()*10000),
    getLocalTime: () => DateTime.local().toLocaleString(DateTime.TIME_24_WITH_SECONDS),
    logStream: (stream, name?, scope?) => {
        stream.addListener({
            next: i => console.log(`${name}-${scope} ${JSON.stringify(scope && i[scope] ? i[scope] : i)}`),
            error: err => console.error(err),
            complete: () => console.log('completed')
        })
    },
    // OBJECT FRAME BLINKS DUE TO EACH CYCLE OF THE VDOM CHANGES RENDER
    //SVGContent: (svg: String, png: String) => [object('.svg', {attrs: {type:'image/svg+xml', data: svg} }, `<img src="${png}"/>`), div('.face')],
    SVGContent: (svg: String, className?: String) => img(`.svg${className ? className : ''}`, {attrs: {src: svg}}),
    outOfClassIndex: (index => {
        return !(index%3) ? "three" : ( !(index%2) ? "two" : "one" );
    }),
    isEmpty: (object) => object && (Object.keys(object).length === 0),
    isNum: (value) => !isNaN(+value),
    isNotEmpty: (object) => object && (Object.keys(object).length > 0),
    enumContainsValue: (object, value) => Object.values(object).includes(value),
    getLetter: (index) => index > alphabeth.length ? index : alphabeth[index],
    capitalize: (string) => (string.charAt(0).toUpperCase() + string.slice(1)),
    blankUser: () => ({avatar: anonymous, rating: utils.random(), name: `ATHL${utils.random()}`, city: `LCN${utils.random()}`} as User),
    getQrChartLink: (input, big?) => `https://chart.googleapis.com/chart?cht=qr&chl=${encodeURI(input)}&chs=${big?'500x500':'180x180'}&choe=UTF-8&chld=L|1`,
    extractPathname: (fullURL) => fullURL.substring(fullURL.indexOf('.tech')+5, fullURL.length),
    fillArray: (size) => Array.from({length: size}, (_, k) => k),
    getPlusIcon: (colorClass?) => {
        var plusIcon = svg.onePlus; if(colorClass == 'two' || colorClass == '.two') {plusIcon = svg.twoPlus;} else if(colorClass == 'three' || colorClass == '.three') {plusIcon = svg.threePlus;}
        return plusIcon;
    },
    getDotIcon: (colorClass?) => {
        var dotIcon = svg.oneDot; if(colorClass == 'two' || colorClass == '.two') {dotIcon = svg.twoDot;} else if(colorClass == 'three' || colorClass == '.three') {dotIcon = svg.threeDot;}
        return dotIcon;
    },
    getMinusIcon: (colorClass?) => {
        var minusIcon = svg.oneMinus; if(colorClass == 'two' || colorClass == '.two') {minusIcon = svg.twoMinus;} else if(colorClass == 'three' || colorClass == '.three') {minusIcon = svg.threeMinus;}
        return minusIcon;
    },
    cutDelay: (delay: number) => (delay > 10 ? 10 : delay),
    isCircleType: (type: ComplexType) => {
        switch(type) { 
            case ComplexType.AFAP:
            case ComplexType.ROUNDS:
            case ComplexType.SETS:
            case ComplexType.QUALITY:
            case ComplexType.EMOM:
            case ComplexType.E1HALFMOM:
            case ComplexType.E2MOM:
            case ComplexType.E3MOM:
            case ComplexType.E4MOM:
            case ComplexType.E5MOM:
            case ComplexType.E10MOM:   
            case ComplexType.E15MOM:    
            case ComplexType.TABATA:    
                return true;  
        }
        return false;
    },
    getGoalValue: (value) => utils.isNum(value) ? value : textLabels.values[value],
    getLastSetValueIndex: (values: any[], type: GoalType) => {
        let result = 0;
        values.map((value, index) => {
            if(value != type) {
                result = index;
            }
        });
        return result;
    },
    formatUTCString: (date) => {
        const res = (new Date(date)).toLocaleString();

        return (~res.indexOf(':')) ? res.substring(0, res.lastIndexOf(':')) : res;
    },
    buildSpinner: () => div('.spinner-wrap', [
        div('.dual-ring', [
            div('.spinner', [
                div(''), 
                div('', [div('')])
            ])
        ])
    ])
}

export const converter = {
    convertProgramBuilder: (builder: ProgramInstance) => {
        const program = [];

        builder.program.forEach(complex => { // cleanup the program object, remove unnecessary configuration artifacts
            program.push(converter.convertComplexInstance(complex));
        });

        return {
            title: builder.title,
            password: builder.password,
            program: program,
            sport: builder.sport,
            public: builder.public
        } as Program;
    },
    convertComplexInstance: (complex) => {
        const blocks = [];

        complex.blocks.forEach(block => { 
            blocks.push(converter.convertBlockInstance(block));
        });

        return {
            name: complex.name,
            type: complex.type != ComplexType.NONE ? complex.type : void 0,
            value: complex.value,
            blocks: blocks,
            info: complex.info != textLabels.blank.complexInfo ? complex.info : void 0
        } as Complex;
    },
    convertBlockInstance: (block) => {
        const movements = [];

        block.movements.forEach(config => { 
            movements.push(converter.convertMovementConfigInstance(config));
        });

        return {
            movements: movements,
            type: block.type != ComplexType.NONE ? block.type : void 0,
            value: block.value,
            info: block.info != textLabels.blank.blockInfo ? block.info : void 0
        } as Block;
    },
    convertMovementConfigInstance: (config) => {
        const loads = [];

        config.load.forEach(load => { 
            if(load.type != LoadType.None) {
                loads.push({
                    type: load.type,
                    maleValue: load.maleValue,
                    femaleValue: load.femaleValue
                } as Load);
            }
        });

        return {
            movement: {
                name: config.movement.name, 
                url: config.movement.url != textLabels.blank.movementURL ? config.movement.url : void 0 
            } as Movement,
            goal: {
                type: config.goal.type, 
                values: config.goal.values.map(value => value)
            } as Goal,
            load: loads, 
            info: config.info != textLabels.blank.movementInfo ? config.info : void 0
        } as MovementConfig;
    },
    isProgramComplete: (builder) => {
        if(!builder) {
            return false;
        }
        var complete = builder.program && builder.program.length > 0;

        builder.program.forEach(complex => {
            if(complete) {
                //complete = complex.name != textLabels.blank.complexName; //&& value by type check
                if(complete) {
                    complex.blocks.forEach(block => { 
                        // complete = (
                        //     complex.blocks.length > 1 && block.type != ComplexType.NONE || 
                        //     complex.blocks.length == 1 && (complex.type != ComplexType.NONE || block.type != ComplexType.NONE)
                        // ); //&& value by type check
                        
                        if(complete) {
                            block.movements.forEach(config => { 
                                if(complete) {
                                    complete = (/*config.goal.values != textLabels.blank.goal && */config.movement.name != textLabels.blank.movementName); //&& value by type check
                                }
                            });
                        }
                    });
                }
            }
        });

        return complete;
    },
    setIds: (workout: ProgramInstance) => {
        if(workout && workout.program) {
            workout.program.forEach(complex => {
                complex.id = 'CPLX' + utils.random();
                complex.blocks.forEach(block => { 
                    block.id = 'BLCK' + utils.random();
                    block.movements.forEach(config => { 
                        config.id = 'MCFG' + utils.random();
                    });
                });
            });
        }

        return workout;
    }
}

export const copier = {
    movementConfig: (config: MovementConfigInstance) => {
        let copy = new MovementConfigInstance();

        copy.info = config.info;
        copy.loadIndex = config.loadIndex;

        copy.goal.type = config.goal.type;
        copy.goal.values = [];
        for (let goalValue of config.goal.values) {
            copy.goal.values.push(goalValue);
        }

        copy.load = [];
        for (let load of config.load) {
            copy.load.push(new LoadInstance(load.type, load.maleValue, load.femaleValue));
        }

        copy.movement.name = config.movement.name;
        copy.movement.url = config.movement.url;

        return copy;
    },
    block: (block: Block) => {
        let copy = new BlockInstance();

        copy.type = block.type;
        copy.value = block.value;
        copy.info = block.info;
        copy.movements = [];
      
        for (let config of block.movements) {
            copy.movements.push(copier.movementConfig(config as MovementConfigInstance));
        }

        return copy;
    }
}

export const intervals = {
    resolveTimeValue: (value: TimeValue) => {
        switch(value) { 
            case TimeValue.S1:
                return 1;
            case TimeValue.S2:
                return 2;
            case TimeValue.S3:
                return 3;
            case TimeValue.S4:
                return 4;
            case TimeValue.S5:
                return 5;
            case TimeValue.S6:
                return 6;
            case TimeValue.S7:
                return 7;
            case TimeValue.S15:
                return 15;
            case TimeValue.S20:
                return 20;
            case TimeValue.S30:
                return 30;
            case TimeValue.S40:
                return 40;
            case TimeValue.S45:
                return 45;
            case TimeValue.M1HALF:
                return 60*1.5;
            case TimeValue.M2HALF:
                return 60*2.5;
            case TimeValue.M3HALF:
                return 60*3.5;
            case TimeValue.M4HALF:
                return 60*4.5;
            case TimeValue.M1:
                return 60;
            case TimeValue.M2:
                return 60*2;
            case TimeValue.M3:
                return 60*3;
            case TimeValue.M4:
                return 60*4;
            case TimeValue.M5:
                return 60*5;
            case TimeValue.M6:
                return 60*6;
            case TimeValue.M7:
                return 60*7;
            case TimeValue.M8:
                return 60*8;
            case TimeValue.M9:
                return 60*9;
            case TimeValue.M10:
                return 60*10;
            case TimeValue.M12:
                return 60*12;
            case TimeValue.M15:
                return 60*15;
            case TimeValue.M20:
                return 60*20;
            case TimeValue.M30:
                return 60*30;   
            default:
                return 0;
        }
    } 
}

export const defaults = {
    hideMenu1: {header: {menu: false}, command:'', feedback:'', dest:'main menu action reducer1'},
    hideMenu2: {header: {menu: false}, command:'', feedback:'', dest:'main menu action reducer2'},
}