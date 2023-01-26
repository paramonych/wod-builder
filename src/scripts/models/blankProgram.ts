import {Program, Complex, Block, MovementConfig, Goal, Load, Movement, Result} from './workout';
import {MesurementType, LangType, LoadType, ComplexType, ParameterType, GoalType, WeightType} from './values';
import {utils} from '../utils/utils';
import {textLabels} from '../utils/labels';
import { Sports } from './general';

export class GoalInstance implements Goal {
    type: GoalType;
    values: any[];

    constructor(type?: GoalType) {
        this.type = type || GoalType.None;
        this.values = [];
    }
};
export class LoadInstance implements Load {
    type: LoadType;
    maleValue: any;
    femaleValue?: any;
    weightType?: WeightType;

    constructor(type?: LoadType, maleValue?: any, femaleValue?: any) {
        this.type = type || LoadType.None;
        this.maleValue = maleValue;
        this.femaleValue = femaleValue; 

    }
};

export class MovementInstance implements Movement {
    id?: string;
    name: string;
    url?: string;

    constructor() {
        this.id = `MVMT${utils.random()}`;
        this.name = textLabels.blank.movementName;
        this.url = textLabels.blank.movementURL;
    }
};

export class MovementConfigInstance implements MovementConfig {
    id?: string;
    movement: MovementInstance;
    goal: GoalInstance;
    load?: Load[];
    info?: string;
    showGoalSlider?: boolean;
    showLoadSlider?: boolean;
    showNameInput?: boolean;
    showInfoTextarea?: boolean;
    showVideoTextarea?: boolean;
    loadIndex?: number;
    result?: Result[];
    onAir?: boolean;
    showPmPicker?: boolean;
    
    constructor(showSlider?: boolean, showNameInput?: boolean, showInfoTextarea?: boolean, showVideoTextarea?: boolean) {
        this.id = 'MCFG' + utils.random();
        this.info = textLabels.blank.movementInfo;
        this.movement = new MovementInstance();
        this.loadIndex = 0;
        this.showGoalSlider = showSlider || false;
        this.showLoadSlider = showSlider || false;
        this.showNameInput = showNameInput || false;
        this.showInfoTextarea = showInfoTextarea || false;
        this.showVideoTextarea = showVideoTextarea || false;
        this.goal = new GoalInstance();
        this.load = [new LoadInstance()];
    }
};

export class BlockInstance implements Block {
    id?: string;
    movements: MovementConfigInstance[];
    type?: ComplexType;
    value?: any;
    info?: string;
    showSlider?: boolean;
    showInfoTextarea?: boolean;
    result?: Result[];
    onAir?: boolean;

    constructor(showSlider?: boolean, showInfoTextarea?: boolean) {
        this.id = 'BLCK' + utils.random();
        this.type = ComplexType.NONE;
        this.info = textLabels.blank.blockInfo;
        this.movements = [new MovementConfigInstance()];
        this.showSlider = showSlider || false;
        this.showInfoTextarea = showInfoTextarea || false;
    }
};

export class ComplexInstance implements Complex {
    id?: string;
    name: string;
    type?: ComplexType;
    value?: any;
    blocks: BlockInstance[];
    info?: string;
    showSlider?: boolean;
    showNameInput?: boolean;
    showInfoTextarea?: boolean;
    result?: Result[];
    onAir?: boolean;
    weightBaseKilos?: number;
    
    constructor(showSlider?: boolean, showNameInput?: boolean, showInfoTextarea?: boolean) {
        this.id = 'CPLX' + utils.random();
        this.type = ComplexType.NONE;
        this.name = textLabels.blank.complexName;
        this.info = textLabels.blank.complexInfo;
        this.blocks = [new BlockInstance()];
        this.showSlider = showSlider || false;
        this.showNameInput = showNameInput || false;
        this.showInfoTextarea = showInfoTextarea || false;
    }    
};

export class ProgramInstance implements Program {
    id?: string;
    title?: string;
    program: ComplexInstance[];
    system: MesurementType;
    language: LangType;
    date?: string;
    showTitleInput?: boolean;
    showPasswordInput?: boolean;
    password: string; 
    sport: Sports;
    public: boolean;

    constructor(sport?: Sports) {
        this.id = 'PRGM' + utils.random();
        this.title = textLabels.blank.programTitle;
        this.system = MesurementType.English;
        this.language = LangType.En;
        this.date = '2020-06-15 13:00';
        this.program = [new ComplexInstance()];
        this.showTitleInput = false;
        this.showPasswordInput = false;
        this.sport = sport;
        this.public = false;
    }
}

