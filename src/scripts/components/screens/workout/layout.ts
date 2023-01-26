import xs, {Stream} from 'xstream';
import sampleCombine from 'xstream/extra/sampleCombine';
import throttle from 'xstream/extra/throttle';
import {a, div, VNode, canvas, input} from '@cycle/dom';
import isolate from '@cycle/isolate';
import {utils, converter, intervals} from '../../../utils/utils';
import {Program, Complex, Block, MovementConfig, Load} from '../../../models/workout';
import {Sources, Sinks, Screen} from '../../../models/general';
import {VoiceCommands as commands} from '../../../utils/voiceCommands';
import {HeaderLayout} from '../../generic/header';
import {ComponentNavigation} from '../../generic/componentNavigation';
import {svg} from '../../../utils/svg';
import {iconsResolver} from '../../../resolvers/icons';
import {appDomain, endpoints, forSliders} from '../../../utils/const';
import {LoadType, ComplexType, GoalType, ParameterType} from '../../../models/values';
import {textLabels} from '../../../utils/labels';
import {SharePayload} from '../../../utils/interfaces';
import {ProgramInstance, ComplexInstance, BlockInstance, MovementConfigInstance} from '../../../models/blankProgram';
import { workoutProcessor } from '../../../data/processing';

const childOptions = {type: Screen.Workout};
const cmd = commands[Screen.Workout];

const tick = 1;

const DISPLAY = 'display';

export function WorkoutLayout(sources: Sources): Sinks {
    
    const state = sources.state.stream;

    const sessionCookie = sources.cookie.select('getSessionCookieWorkout');

    const programByTokenResponse = sources.HTTP.select('program').flatten(); // pick only latest responce

    const compressedWorkoutString = programByTokenResponse.filter(response => !!response.body.compressed).map(response => response.body.compressed);

    const isPublicFlag = compressedWorkoutString.filter(comp => comp.substring(comp.length-5, comp.length) == 'gpxar');
    const isOwnerFlag = compressedWorkoutString.filter(comp => comp.substring(comp.length-5, comp.length) == 'szpow');

    const compressedWorkout = compressedWorkoutString.map(compressed => ({selector: DISPLAY, compressed: compressed}));

    const accessDenied = programByTokenResponse.filter(response => !!response.body.error && response.body.error == 'denied');

    // HISTORY REDIRECTS ////////////////////////////////////////////
    const historyOutput = sources.scanQR.map(workoutURL => utils.extractPathname(workoutURL));
   
    // COMPONENTS SETUP ////////////////////////////////////////////
    const header = isolate(HeaderLayout, 'header')({...sources}, childOptions);
    const componentNavigation = isolate(ComponentNavigation, 'nav')({...sources}, childOptions);
    const componentNavigationShort = isolate(ComponentNavigation, 'navShort')({...sources}, {type: `${Screen.Workout}Short`});

    // HISTORY INPUTS ////////////////////////////////////////////
    const wodToken = state.filter(state => state.external && state.external.displayToken).map(state => state.external.displayToken).compose(throttle(3000)).startWith(null);

    // USER ACTIONS ////////////////////////////////////////////
    const shareAction = sources.DOM.select('#qr').events('click').map(e => e.ownerTarget.dataset as SharePayload);
    const qrCodeScanAction = sources.DOM.select('#scaner').events('click').mapTo(true);

    const showTimerAction = sources.DOM.select('.complex-label .index').events('click').map(e => e.ownerTarget.dataset);
    const hideTimerAction = sources.DOM.select('#timer .cross').events('click').mapTo(true);
    const touchTimerAction = sources.DOM.select('#timer-settings:not(.ready)').events('click').map(e => e.ownerTarget.dataset);
    const endTimerAction = sources.DOM.select('#stop').events('click').map(e => e.ownerTarget.dataset);

    const switchMovementAction = sources.DOM.select('#timer .movement-timer-trigger, #timer .movement-title').events('click').map(e => e.ownerTarget.dataset);

    const sliderChangeAction  = sources.DOM.select("input.range:not(.pm-picker)").events("change").map(e => e.ownerTarget);

    const showPmPickerAction = sources.DOM.select('.weight-percent,.calc-pm').events('click').map(e => e.ownerTarget.dataset);
    const pmPickerAction  = sources.DOM.select("input.range.pm-picker").events("change").map(e => e.ownerTarget);
    const moreAction = sources.DOM.select('.increase').events('click').map(e => e.ownerTarget);
    const lessAction = sources.DOM.select('.descrease').events('click').map(e => e.ownerTarget);
    
    const startTimerAction = touchTimerAction.compose(sampleCombine(state)).filter(([e, state]) => !state.live && state.time == state.left);
    const stopTimerAction = touchTimerAction.compose(sampleCombine(state)).filter(([e, state]) => state.live);
    const resumeTimerAction = touchTimerAction.compose(sampleCombine(state)).map(([e, state]) => state).filter(state => !state.live && state.left > 0);
    const resetTimerAction = touchTimerAction.compose(sampleCombine(state)).map(([e, state]) => state).filter(state => !state.live && state.left == 0);
    const saveTimerAction = endTimerAction.compose(sampleCombine(state)).filter(([e, state]) => state.live && !state.isCountdown).map(([e, state]) => state);

    const timeBufferAction = state.filter(state => state.live && state.isCountdown && state.left == utils.cutDelay(state.delay)-1);
    const timeIsUpAction = state.filter(state => state.live && state.left == -1);
    const delayIsUpAction = state.filter(state => state.live && state.ready === false && state.delayLeft == 0);

    const readSessionCookieAction = wodToken.filter(token => token != null).mapTo({category: 'getSessionCookieWorkout', action: 'get', params: ['app']});

    const fromRootTrigger = state.filter(state => !!state && state.redirected);
    
    const ticks = xs.periodic(tick*1000);

    const timeflow = ticks.compose(sampleCombine(state)).map(([e, state]) => state).filter(state => state.live && state.ready);//xs.periodic(5000).take(1))
    const delayTimeflow = ticks.compose(sampleCombine(state)).map(([e, state]) => state).filter(state => state.live && state.ready === false);

    const termsRedirectAction = sources.DOM.select('.type-config,.goal-config').events('click').mapTo( `/${Screen.Support}`);

    const programShareAction = xs.merge(componentNavigation.clickCommand, componentNavigationShort.clickCommand).filter(command => command == textLabels.nav[Screen.Workout][cmd.GetQRCode]).mapTo(true);
    const programEditAction = xs.merge(componentNavigation.clickCommand, componentNavigationShort.clickCommand).filter(command => command == textLabels.nav[Screen.Workout][cmd.Edit]).mapTo(true);
    const editRedirectAction = programEditAction.compose(sampleCombine(state)).map(([e, state]) => state).filter(state => state.receivedToken != void 0).map(state => `/${Screen.Program}/z/${state.receivedToken}`);
    const qrCodeMakeAction = programShareAction.compose(sampleCombine(state)).filter(([e, state]) => state.QR == void 0).map(([e, state]) => `${appDomain}/workout/z/${state.receivedToken}`);
    const qrCodeDropAction = programShareAction.compose(sampleCombine(state)).filter(([e, state]) => state.QR != void 0).mapTo(true);

    const firstMovementAnnounce = delayIsUpAction.map(state => {
        const activeTitle = workoutProcessor.getActiveMovementTitleByWorkout(state.workout);
        if(activeTitle) {
            return `${textLabels.action.round} 1. ${activeTitle}`;
        } else {
            return '';
        }
    });
    const nextMovementAnnounce = xs.merge(timeIsUpAction, saveTimerAction).map(state => {
        const nextActiveTitleAndIndex = workoutProcessor.getNextActiveMovementInfo(state.workout, state.round);
        if(nextActiveTitleAndIndex) {
            
            const roundNum = state.round + (nextActiveTitleAndIndex.index ? 0 : 1);
            return `${textLabels.action.round} ${roundNum+1}. ${nextActiveTitleAndIndex.title}`;
        } else {
            return `${textLabels.action.goodJob}`; 
        }
    });

    //////////////////////////////////

    const decompressedWod = sources.decompressor.filter(result => result.selector == DISPLAY && result.decompressed).map(result => converter.setIds(JSON.parse(result.decompressed) as ProgramInstance)).startWith(null);

    const resultingWod = xs.merge(/*localyStoredWod,*/ decompressedWod); // since we're not using local storage yet

    const beeps = xs.merge(
        startTimerAction.compose(sampleCombine(state)).map(([e, state]) => ({repeat: state.delay, length: 700, config: {pitch : 'A4'}})),
        timeBufferAction.compose(sampleCombine(state)).map(([e, state]) => ({repeat: utils.cutDelay(state.delay), length: 500, config: {pitch : 'D4'}})),
    );

    // NAVIGATION ///////////////////////////////////////////////////////
    const externalNavigationReducer = decompressedWod.map(_ => {
        return (prevState?) => {
            return {...prevState, external: {...prevState.external, displayToken: void 0}};
        }
    });
    const receivedTokenReducer = wodToken.filter(token => token != null).map(receivedToken => {
        return (prevState?) => {
            return {...prevState, receivedToken: receivedToken, workout: void 0};
        }
    });
    // PROGRAM ///////////////////////////////////////////////////////
    const resultingWodReducer = resultingWod.map(wod => {
        return (prevState?) => {
            return {...prevState, workout: wod, denied: void 0, delay: 5, loading: void 0};
        }
    });
    const accessDeniedReducer = accessDenied.map(_ => {
        return (prevState?) => {
            return {...prevState, workout: void 0, denied: true, loading: void 0};
        }
    });
    const isPublicReducer = isPublicFlag.map(_ => {
        return (prevState?) => {
            return {...prevState, public: true, owner: void 0};
        }
    });
    const isOwnerReducer = isOwnerFlag.map(_ => {
        return (prevState?) => {
            return {...prevState, public: void 0, owner: true};
        }
    });
    // QR CODES //////////////////////////////////////////////////////
    const qrCodeImageReducer = sources.QR.map(qrCode => {
        return (prevState?) => {
            return {...prevState, QR: qrCode};
        }
    });
    const qrCodeDropReducer = xs.merge(qrCodeDropAction, fromRootTrigger).map(_ => {
        return (prevState?) => {
            return {...prevState, QR: void 0, redirected: void 0, denied: void 0, public: void 0, owner: void 0};
        }
    });
    // TIMER ////////////////////////////////////////////////////////
    const showTimerReducer = showTimerAction.map(payload => {
        return (prevState?) => {
            const activatedWorkout = workoutProcessor.activateComplex(prevState.workout, payload.id);
            const activeGoalValue = workoutProcessor.getActiveTimeGoal(activatedWorkout);
            const seconds = intervals.resolveTimeValue(activeGoalValue);
            return {...prevState, workout: activatedWorkout, timerVisible: true, time: seconds, left: seconds, isCountdown: activeGoalValue !== void 0, done: false, delayLeft: prevState.delay}
        };
    });
    const switchMovementReducer = switchMovementAction.map(payload => {
        return (prevState?) => {
            const activatedWorkout = workoutProcessor.activateMovement(prevState.workout, payload.blockId, payload.configId);
            const activeGoalValue = workoutProcessor.getActiveTimeGoal(activatedWorkout);
            const seconds = intervals.resolveTimeValue(activeGoalValue);
            return {...prevState, workout: activatedWorkout, timerVisible: true, time: seconds, left: seconds, isCountdown: activeGoalValue !== void 0, live: void 0, ready: void 0, done: void 0, setNum: void 0, round: void 0, delayLeft: prevState.delay}
        };
    });
    const hideTimerReducer = hideTimerAction.map(_ => {
        return (prevState?) => {
            return {...prevState, workout: workoutProcessor.deactivateComplex(prevState.workout), timerVisible: void 0, time: void 0, left: void 0, live: void 0, ready: void 0, done: void 0, setNum: void 0, round: void 0, delayLeft: void 0};
        }
    });
    const startTimerReducer = startTimerAction.map(_ => {
        return (prevState?) => {
            return {...prevState, live: true, ready: false, setNum: 0, round: 0, done: false, delayLeft: prevState.delayLeft ? prevState.delay : 0};
        }
    });
    const resumeTimerReducer = resumeTimerAction.map(_ => {
        return (prevState?) => {
            return {...prevState, live: true, ready: false, done: false};
        }
    });
    const stopTimerReducer = stopTimerAction.map(_ => {
        return (prevState?) => {
            return {...prevState, live: void 0, ready: void 0, done: void 0};
        }
    });
    const timeflowReducer = timeflow.map(state => {
        return (prevState?) => {
            return {...prevState, left: state.left + (state.isCountdown ? -1 : 1) * tick};
        }
    });
    const timeIsUpReducer = timeIsUpAction.map(state => { 
        return (prevState?) => {
            const activatedWorkout = workoutProcessor.activateNextMovement(prevState.workout, state.round);
            if(activatedWorkout) {
                const activeGoalValue = workoutProcessor.getActiveTimeGoal(activatedWorkout);
                const seconds = intervals.resolveTimeValue(activeGoalValue);
                const index = state.setNum + 1;
                const activeIndex = workoutProcessor.getActiveMovementIndex(activatedWorkout);
                
                const roundNum = state.round + (activeIndex ? 0 : 1);
                return {...prevState, workout: activatedWorkout, timerVisible: true, time: seconds, left: seconds, isCountdown: activeGoalValue !== void 0, live: true, ready: true, setNum: index, round: roundNum};
            } else {
                const activeGoalValue = workoutProcessor.getActiveTimeGoal(workoutProcessor.activateNextMovement(prevState.workout));
                const seconds = intervals.resolveTimeValue(activeGoalValue);
                return {...prevState, live: void 0, time: seconds, ready: void 0, done: true, setNum: void 0, left: 0, isCountdown: activeGoalValue !== void 0, round: void 0, delayLeft: prevState.delay};
            }
        }
    });

    const saveTimerReducer = saveTimerAction.map(state => {
            return (prevState?) => {
                workoutProcessor.saveCurrentTime(prevState.workout, state.left);

                const activatedWorkout = workoutProcessor.activateNextMovement(prevState.workout, state.round);
                if(activatedWorkout) {
                    const activeGoalValue = workoutProcessor.getActiveTimeGoal(activatedWorkout);
                    const seconds = intervals.resolveTimeValue(activeGoalValue);
                    const index = state.setNum + 1;
                    const activeIndex = workoutProcessor.getActiveMovementIndex(activatedWorkout);
                    
                    const roundNum = state.round + (activeIndex ? 0 : 1);
                    return {...prevState, workout: activatedWorkout, timerVisible: true, time: seconds, left: seconds, isCountdown: activeGoalValue !== void 0, live: true, ready: true, setNum: index, round: roundNum};
                } else {
                    const activeGoalValue = workoutProcessor.getActiveTimeGoal(workoutProcessor.activateNextMovement(prevState.workout));
                    const seconds = intervals.resolveTimeValue(activeGoalValue);
                    return {...prevState, live: void 0, time: seconds, ready: void 0, done: true, setNum: void 0, left: 0, isCountdown: activeGoalValue !== void 0, round: void 0, delayLeft: prevState.delay};
                }
            }
        }
    );

    const delayTimeflowReducer = delayTimeflow.map(state => {
        return (prevState?) => {
            return {...prevState, delayLeft: state.delayLeft - tick};
        }
    });
    const delayIsUpReducer = delayIsUpAction.map(state => {
        return (prevState?) => {
            return {...prevState, ready: true};
        }
    });
    const resetTimerReducer = resetTimerAction.map(state => {
        return (prevState?) => {
            return {...prevState, left: state.time};
        }
    });
    const sliderChangeReducer = sliderChangeAction.map(target => {
        return (prevState?) => {
            return {...prevState, command: '', delay: target.value};
        }
    });
    const showPmPickerReducer = showPmPickerAction.map(target => {
        return (prevState?) => {
            return {...prevState, workout: togglePmSlider(prevState.workout, target)};
        }
    });
    const pmPickerReducer = pmPickerAction.map(target => {
        return (prevState?) => {
            return {...prevState, workout: setComplexKilos(prevState.workout, target, 0)};
        }
    });
    const pmPickerNextValueReducer = moreAction.map(target => {
        return (prevState?) => {
            return {...prevState, workout: setComplexKilos(prevState.workout, target, 1)};
        }
    });
    const pmPickerPrevValueReducer = lessAction.map(target => {
        return (prevState?) => {
            return {...prevState, workout: setComplexKilos(prevState.workout, target, -1)};
        }
    });
    // MAKE HTTP REQUESTS
    const programByTokenRequest = sessionCookie // throttled request
        .compose(sampleCombine(wodToken, state))
        .filter(([session, compressedProgramToken, state]) => !state.denied && !state.loading)
        .map(([session, compressedProgramToken, state]) => {
        //.map(([session, compressedProgramToken]) => {
            return {
                url: `${endpoints.program}/${compressedProgramToken}`,
                category: 'program',
                method: 'POST',
                send: {
                    session: session ? session : 'no'
                }
            };
        });

    const programByTokenRequestReducer = programByTokenRequest.map(target => {
        return (prevState?) => {
            return {...prevState, loading: true};
        }
    });

    return {
        DOM: view(xs.combine(header.DOM, componentNavigation.DOM, componentNavigationShort.DOM, wodToken, state)),
        cookie: xs.merge(header.cookie, readSessionCookieAction),
        state: xs.merge(header.state, externalNavigationReducer, 
            receivedTokenReducer, qrCodeImageReducer, qrCodeDropReducer, showTimerReducer,
            hideTimerReducer, startTimerReducer, resumeTimerReducer, stopTimerReducer, timeflowReducer, 
            timeIsUpReducer, resetTimerReducer, resultingWodReducer, switchMovementReducer, 
            sliderChangeReducer, delayTimeflowReducer, delayIsUpReducer, saveTimerReducer,
            showPmPickerReducer, pmPickerReducer, pmPickerNextValueReducer, pmPickerPrevValueReducer,
            accessDeniedReducer, programByTokenRequestReducer, isPublicReducer, isOwnerReducer
        ),
        history: xs.merge(termsRedirectAction, historyOutput, editRedirectAction),
        SpeechFlow: xs.merge(firstMovementAnnounce, nextMovementAnnounce),
        decompressor: compressedWorkout,
        HTTP: programByTokenRequest,
        share: shareAction,
        QR: qrCodeMakeAction,
        scanQR: qrCodeScanAction,
        wad: beeps,
        fullscreen: header.fullscreen,
        hardReload: xs.empty(),
    };
}

function view(input): Stream<VNode> {
    return input.map(([header, navigation, navigationShort, wodToken, state]) => {
        const wod = state.workout;
        const index = state.nav ? state.nav.index : 0;
        const componentNavigation = state.owner ? ( wod ? navigation : void 0) : (state.public && wod ? navigationShort : void 0);
        
        const workoutBody = 
            state.loading 
            ? div(`.body.coming-soon`, [ 
                div(`.prime`),
                div('#scan-label', textLabels.action.loading)
            ])
            : wod
                ? getCurrentScreenTab(index, wod, state.QR) 
                :   state.denied 
                    ? div(`.body.coming-soon`, [ 
                        div(`.prime`),
                        div('#scan-label', textLabels.statusses.denied)
                    ]) 
                    : div(`.body.coming-soon${wodToken ? '' : '.scaner'}`, [ 
                        div(`${wodToken ? '' : '#scaner'}.prime`),
                        canvas('#canvas', {attrs: {hidden: 'hidden'}}),
                        div('#scan-label', wodToken ? textLabels.action.loading: textLabels.screenDeafult.workout)
                    ]);

        return div('.wrap', [header, componentNavigation, state.timerVisible ? getTimer(state) : workoutBody]); 
    });
}
///////////////////////////////////////////////////////////

function setComplexKilos(workout: ProgramInstance, target, shift) {
    const payload = target.dataset;
    workout.program.map((complex: ComplexInstance) => {
        if(complex.id == payload.id) {
            complex.weightBaseKilos = shift ? ((complex.weightBaseKilos != void 0 ? +complex.weightBaseKilos : 0) + shift) : target.value;
        }
    });

    return workout;
}

function togglePmSlider(builder, payload) { // set the default or preset value
   
    builder.program.map(complex => {
        complex.blocks.map(block => {
            block.movements.map((config: MovementConfigInstance) => {
                config.showPmPicker = (config.id == payload.id) ? !config.showPmPicker : false;
            });
        });
    });

    return builder;
} 

///////////////////////////////////////////////////////////

function getTimer(state) {
    return div(`#timer.show-timer`, [
        div('.time', {attrs: {style: `height:${state.done ? 100 : (state.left/state.time)*100}%`}})
    ].concat(state.workout.program.map((complex: ComplexInstance, index) => complex.onAir ? getComplexTimer(state, complex, index+1) : void 0)));
}

function getComplexTimer(state, complex: ComplexInstance, index) {
    const live = state.live || !state.live && state.delayLeft == 0 && state.left > 0;
    const activeMovement = workoutProcessor.getActiveMovement(complex);
    return div('.complex-timer-wrap', [
        div(`.complex-timer-header${state.live && state.ready === false ? '.ready': ''}`, [
            div('.complex-header', [
                div('.index', index),
                div('.complex-title', complex.name)
            ]),
            div('.cross', utils.SVGContent(svg.crossWhite)),
        ]),
        div(`#timer-settings${live ?'.live':''}${state.ready === false ?'.ready':''}`, [
            !state.live || state.live && state.ready 
                ? div('#start', [
                    div('.action', state.live 
                        ? textLabels.action.pause 
                        : (state.left == 0 && state.isCountdown) 
                            ? textLabels.action.restart 
                            : (state.left > 0 && state.delayLeft == 0) 
                                ? textLabels.action.resume 
                                : textLabels.action.start
                    ),
                    div('.counter', state.left >= 0 ? `${Math.floor(state.left/60)}:${state.left%60 > 9 ? '':'0'}${state.left%60}` : 0)
                ])
                : div('#start', [
                    div('.counter', state.delayLeft)
                ]),
            div('#delay', [
                div('.action', textLabels.screenDeafult.delay),
                div('.counter', `${state.delay ? state.delay : 0} ${textLabels.screenDeafult.sec}`)
            ])
        ]),
        state.live && !state.isCountdown 
            ? div(`#stop${live ?'.live':''}${state.ready === false ?'.ready':''}`, [
                div('.action', textLabels.action.next),
                //TODO: activeMovement !== void 0 ? div('.action', JSON.stringify(activeMovement.result)) : void 0
            ])
            : void 0,
        div(`.complex-timer${state.live && state.ready === false ? '.ready': ''}`, 
            [div('.movement-title', {dataset: {blockId: workoutProcessor.getActiveBlockId(complex), configId: workoutProcessor.getActiveMovementId(complex)}}, (live && state.round != void 0 ? utils.capitalize(textLabels.action.round) + ' ' + (state.round+1) + ' : ' : '') + workoutProcessor.getActiveMovementTitle(complex))]
            .concat(live ? [] : complex.blocks.map((block: BlockInstance, index) => getBlockTimer(block, index, complex.blocks.length > 1)))
            .concat([
                div(`.slider${live ?'.live':''}`, [
                    input('.range.timer', {attrs: {type: 'range', min: 3, max: 30, value: state.delay ? state.delay : 0}}),
                ]),
            ])
        )
    ]);
}

function getBlockTimer(block: BlockInstance, index, showLabel) {
    return div('.block-timer-wrap', [
        showLabel 
        ? div('.block-timer-label', [
            div('.block-index', `${utils.getLetter(index)}`)
        ])
        : void 0,
        div('.block-timer-body', block.movements.map((config: MovementConfigInstance, index) => getMovementTimer(block.id, config, index)))
    ]);
}

function getMovementTimer(blockId, config: MovementConfigInstance, index) {
    return div(`.movement-timer-trigger${config.onAir ? '.active':''}`, {dataset: {blockId: blockId, configId: config.id}}, index+1);
}

function getCurrentScreenTab(index, workout: ProgramInstance, qrCodeImage) {
    const program = workout.program ? workout.program : [];

    switch(index) {
        case 0: // workout share action in header 
        case 1: // edit program action in header
            return !qrCodeImage 
                ? div(`.body`, [
                    workout.title && workout.title != textLabels.blank.programTitle  ? div('.program-title', workout.title) : void 0
                ].concat(
                        program.map((complex: ComplexInstance, ind) => {
                            const orderNum = ind+1;
                            const colorClass = `.${utils.outOfClassIndex(orderNum)}`;
                            
                            const complexHeaderDOM = getComplexHeader(complex, colorClass, orderNum);
                            const complexBodyDOM = getComplexBody(complex.blocks, colorClass, complex);
                            const complexFooterDOM = complex.info && complex.info != textLabels.blank.complexInfo ? getComplexFooter(complex, colorClass) : void 0;
                            
                            return div(
                                `.complex${colorClass}`, 
                                {dataset: {id: complex.id}}, 
                                complexHeaderDOM.concat(complexBodyDOM).concat(complexFooterDOM)
                            );
                        })
                    )
                )
                : renderQRCode(qrCodeImage);
        case 2: // result share action in header
            return div(`.body.coming-soon`, [ 
                div('.prime'),
                div(textLabels.screenDeafult.wodbook)
            ]);
        default:
            return div(`.body.coming-soon`, div(textLabels.alerts.unexpectedIndex));
    }
}

function renderQRCode(qrCode) {
    return div('.body', div('.coming-soon.qr', [ 
        div('#qr', {style: {'background-image': `url(${qrCode.image})`}, dataset: {title: 'OpenCoach WOD', url: qrCode.payload}}),
        div('.share-label', textLabels.action.share)
    ]));
}

function getComplexHeader(complex: ComplexInstance, colorClass, orderNum) {
    return [
        div('.complex-header', 
            [
                div('.complex-label', [
                    div(`.index${colorClass}`, {dataset: {id: complex.id}}, orderNum),
                    div('.complex-title', complex.name)
                ]), 
                complex.type && complex.type != ComplexType.NONE
                ? div('.complex-details', [
                    div('.complex-details-tools', [
                        div(`.type-config.type`, [
                            div('.value', textLabels.values[complex.type])
                        ]),
                        div(`.type-config.value`, [
                            div(`.icon .${complex.value}`, utils.SVGContent(iconsResolver.byComplexType(complex.type))),
                            div('.value', utils.isNum(complex.value) ? complex.value : textLabels.values[complex.value])
                        ])
                    ])
                ])
                : void 0
            ]
        ),
    ];
}

function getComplexBody(blocks: Block[], colorClass, complex: ComplexInstance) {
    return blocks.map((block: Block, ind) => {
        const blockHeaderDOM = blocks.length > 1 || (blocks.length == 1 && block.type != void 0 && block.type != ComplexType.NONE) ? getBlockHeader(block, colorClass, ind) : [];
        const blockBodyDOM = getBlockBody(block.movements, colorClass, complex);
        const blockFooterDOM = block.info && block.info != textLabels.blank.blockInfo ? getBlockFooter(block, colorClass) : void 0;

        return div(
            `.block`, 
            {dataset: {id: block.id}}, 
            blockHeaderDOM.concat(blockBodyDOM).concat(blockFooterDOM)
        );
    });
}

function getComplexFooter(complex: Complex, colorClass) {
    return [
        div(`.complex-info${colorClass}`, 
            div('.info-label', {dataset: {id: complex.id}}, complex.info)
        )
    ];
}

//// BLOCK //////////////////////////////////////////////////////////////////////////////////////

function getBlockHeader(block: Block, colorClass, index) {
    return [
        div(`.block-header`, 
            [
                div(`.block-index${colorClass}`, `${utils.capitalize(textLabels.action.block)} ${utils.getLetter(index)}`),
                block.type && block.type != ComplexType.NONE  
                ? div('.block-details.slider-trigger', {dataset: {id: block.id}}, [
                    div(`.type-config.type`, [
                        div('.value', textLabels.values[block.type])
                    ]),
                    div(`.type-config.value`, [
                        div('.icon', utils.SVGContent(iconsResolver.byBlockType(block.type))),
                        div('.value', utils.isNum(block.value) ? block.value : textLabels.values[block.value])
                    ])
                ])
                : void 0
            ]
        )
    ];
}

function getBlockBody(movements: MovementConfig[], colorClass, complex: ComplexInstance) {
    return movements.map((config: MovementConfigInstance) =>
        div(`.movement${colorClass}`, {dataset: {id: config.id}}, [
            getMovementHeader(config, colorClass, complex), 
            config.info && config.info != textLabels.blank.movementInfo ? setMovementInfo(config, colorClass) : void 0,
            config.showPmPicker ? getMovementPmPicker(config, colorClass, complex) : void 0
        ])
    );
}

function getBlockFooter(block: Block, colorClass) {
    return [
        div(`.block-info${colorClass}`, 
            div('.info-label', {dataset: {id: block.id}}, [
                div(block.info)
            ])
        )
    ];
}

//// MOVEMENT //////////////////////////////////////////////////////////////////////////////////////

function getMovementHeader(config: MovementConfigInstance, colorClass, complex: ComplexInstance) {
    const shortCC = colorClass.substring(1, colorClass.length);
    return div('.movement-header', 
        [
            div('.movement-parameters', [
                div('.movement-label.name-trigger', {dataset: {id: config.id}}, [
                    div(`.before${colorClass}`),
                    div('.movement-name', config.movement.name || config.movement.id),
                    config.movement.url ? getMovementVideo(config, colorClass) : void 0
                ]), 
                config.load && config.load.length && (config.load[0].maleValue != textLabels.blank.load || config.load[0].maleValue != textLabels.blank.load) 
                ? getMovementLoad(config, shortCC, complex) 
                : void 0
            ]),
            getMovementGoal(config, shortCC)
        ]
    )
}

function getMovementPmPicker(config: MovementConfigInstance, colorClass, complex: ComplexInstance) {
    const type = ParameterType.Value;
    const max = 300; // max pm
    
    return div(`.slider.${type}`, [
        div('.descrease', {dataset: {id: complex.id}}, [utils.SVGContent(utils.getMinusIcon(colorClass))]),
        div('.label', `${complex.weightBaseKilos && complex.weightBaseKilos > 0 ? complex.weightBaseKilos + ' ' + textLabels.measurement.kilos : utils.capitalize(textLabels.action.pm)}`),
        input(`.range.pm-picker.${type}`, {attrs: {type: 'range', min: 0, max: max, value: complex.weightBaseKilos ? complex.weightBaseKilos : 0}, dataset: {id: complex.id}}),
        div('.increase', {dataset: {id: complex.id}}, [utils.SVGContent(utils.getPlusIcon(colorClass))])
    ]);
}

function getMovementGoal(config: MovementConfig, colorClass) {
    const hardcodedGoal = config.goal.values == void 0 && config.goal.maleValue != void 0;
    const lastValueIndex = config.goal.values && utils.getLastSetValueIndex(config.goal.values, config.goal.type);
    const multipleGoals = config.goal.values && config.goal.values && config.goal.values.length > 1 && lastValueIndex >= forSliders.maxOtherSliders-1;
    
    return div('.movement-details', [        
        div(`.goal-config.${config.goal.type}`, [
            div('.icon', utils.SVGContent(iconsResolver.byConfigGoalType(config.goal.type, colorClass))),
            hardcodedGoal
            ?
                div(`.value${config.goal.femaleValue?'.column':''}`, 
                    config.goal.femaleValue != config.goal.type
                    ?   [
                            div('.main', utils.getGoalValue(config.goal.maleValue)),  
                        ].concat([
                            div('.sub', utils.getGoalValue(config.goal.femaleValue))
                        ])
                    : utils.getGoalValue(config.goal.maleValue)
                )
            :
            div(`.value${multipleGoals?'.column':''}`,
                multipleGoals
                ?   
                    config.goal.type == GoalType.Reps || config.goal.type == GoalType.Calories || config.goal.type == GoalType.Combo
                    ?
                        config.goal.type == GoalType.Combo
                        ?
                        [
                            div('.main', config.goal.values.filter((value, index) => value != config.goal.type && index <= lastValueIndex && index < (forSliders.maxComboSliders-1)).map(value => value.substring(0, value.indexOf(' '))).join('+')),  
                        ].concat([
                            div('.sub', lastValueIndex == (forSliders.maxComboSliders-1)
                                ? utils.getGoalValue(config.goal.values[lastValueIndex])
                                : utils.getGoalValue(config.goal.values[lastValueIndex]).substring(utils.getGoalValue(config.goal.values[lastValueIndex]).indexOf(' ')+1, utils.getGoalValue(config.goal.values[lastValueIndex]).length)     
                            )
                        ])
                        :
                        [
                            div('.main', config.goal.values.filter(value => value != config.goal.type).map(value => value.substring(0, value.indexOf(' '))).join('/')),  
                        ].concat([
                            div('.sub', utils.getGoalValue(config.goal.values[0]).substring(utils.getGoalValue(config.goal.values[0]).indexOf(' ')+1, utils.getGoalValue(config.goal.values[0]).length))
                        ])
                    :
                    config.goal.values.filter(value => value != config.goal.type).map(value => div('.main', utils.getGoalValue(value)))
                : utils.getGoalValue(config.goal.values[0])
            )
        ])
    ]);
}

function getMovementLoad(config: MovementConfig, colorClass, complex: ComplexInstance) {
    return div('.movement-load', [
        div('.loads', config.load.map((load, index) => setMovementLoadConfig(load, colorClass, config.id, complex)))
    ]);
}

function setMovementLoadConfig(load: Load, colorClass, configId, complex: ComplexInstance) {
    const maleLoad = utils.getGoalValue(load.maleValue);
    const femaleLoad = (load.femaleValue != load.type) ? utils.getGoalValue(load.femaleValue) : void 0;
    const percentType = load.type == LoadType.WeightPercent;
    const calcPM = percentType && complex.weightBaseKilos && complex.weightBaseKilos > 0;

    return load.type != LoadType.None 
        ? div(`.load-config.${percentType && !calcPM ? 'weight-percent' : load.type}${calcPM ? 'calc-pm':''}`, {dataset: {id: configId}}, [
            div('.icon', utils.SVGContent(iconsResolver.byConfigLoadType(load.type, colorClass))),
            div(`.value.${colorClass}`, femaleLoad 
            ? `${maleLoad}${femaleLoad ? ' / ' + femaleLoad : ''}`
            : 
                calcPM 
                ? [div('.calc-result',`${Math.round(complex.weightBaseKilos * (maleLoad/100))}${textLabels.measurement.kilos}`),div('.calc-details', ` (${maleLoad}% ${textLabels.blank.of} ${complex.weightBaseKilos}${textLabels.measurement.kilos})`)]
                : maleLoad // support of old cofiguration need to be romoved after a while 26.08.2020
        )])
        : void 0;
}

function setMovementInfo(config: MovementConfig, colorClass) {
    return div(`.movement-info`, [
        div('.info-label', {dataset: {id: config.id}}, config.info)
    ]);
}
function getMovementVideo(config: MovementConfig, colorClass) {
    var videoIcon = svg.onePlay; if(colorClass == '.two') {videoIcon = svg.twoPlay;} else if(colorClass == '.three') {videoIcon = svg.threePlay;}
    return a('.video-link', {attrs: {target: '_blank', href: config.movement.url}}, [div(`.icon.video`, [utils.SVGContent(videoIcon)])]);
}