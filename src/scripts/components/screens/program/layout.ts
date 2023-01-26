import xs from 'xstream';
import sampleCombine from 'xstream/extra/sampleCombine';
import throttle from 'xstream/extra/throttle';
import {input, div, textarea, VNode, label, canvas, section} from '@cycle/dom';
import isolate from '@cycle/isolate';
import {Sources, Sinks, Screen, Sports, RestrictionType} from '../../../models/general';
import {LoadType, ParameterType, ElementType, ComplexType, GoalType} from '../../../models/values';
import {utils, converter, copier} from '../../../utils/utils';
import {SharePayload} from '../../../utils/interfaces';
import {HeaderLayout} from '../../generic/header';
import {ComponentNavigation} from '../../generic/componentNavigation';
import {svg} from '../../../utils/svg';
import {VoiceCommands as commands} from '../../../utils/voiceCommands';
import {ProgramInstance, ComplexInstance, BlockInstance, MovementConfigInstance, LoadInstance} from '../../../models/blankProgram';
import {sliderResolver} from '../../../resolvers/slider';
import {iconsResolver} from '../../../resolvers/icons';
import {textLabels} from '../../../utils/labels';
import {appDomain, endpoints, forSliders, forTextareas, programLimits} from '../../../utils/const';
import {SportsRestrictions} from '../../../utils/sportsTypesRestrictions';

const childOptions = {type: Screen.Program};
const cmd = commands[childOptions.type];
const BUILDER = 'builder';
const TOKEN = 'token';

const EDIT = 'edit';

export function ProgramLayout(sources: Sources): Sinks {
    const state = sources.state.stream;

    const programShortenResponse = sources.HTTP.select('program').flatten(); // pick only latest responce
    const programForEditResponse = sources.HTTP.select('program-for-edit').flatten(); // pick only latest responce
  
    const compressedWorkout = programForEditResponse.filter(response => !!response.body.compressed).map(response => ({selector: EDIT, compressed: response.body.compressed}));

    const accessDenied = programForEditResponse.filter(response => !!response.body.error && response.body.error == 'denied');

    // COMPONENTS SETUP ////////////////////////////////////////////
    const header = isolate(HeaderLayout, 'header')({...sources}, childOptions);
    const componentNavigation = isolate(ComponentNavigation, 'nav')({...sources}, childOptions);

    // HISTORY INPUTS ////////////////////////////////////////////
    const externalWorkoutToken = state.filter(state => state.external && state.external.editToken).map(state => state.external.editToken).compose(throttle(3000)).startWith(null);
    
    const decompressedWod = sources.decompressor.filter(result => result.selector == EDIT && result.decompressed).map(result => converter.setIds(JSON.parse(result.decompressed) as ProgramInstance)).startWith(null);

    const comressedLocallyStoredWod = sources.storageRead.filter(item => !!item && !!item.key && !!item.value && item.key == BUILDER).map(item => ({selector: EDIT, compressed: item.value}));
    const locallyStoredUpdateToken = sources.storageRead.filter(item => !!item && !!item.key && !!item.value && item.key == TOKEN).map(item => item.value);

    // USER ACTIONS ////////////////////////////////////////////
    const addElementAction = sources.DOM.select(".add-element").events("click").map(e => e.ownerTarget.dataset);
    const copyElementAction = sources.DOM.select(".copy-element").events("click").map(e => e.ownerTarget.dataset);
    const createProgramAction = sources.DOM.select(".sport-picker").events("click").map(e => ({command: e.ownerTarget.dataset.sport}));//{command: e.ownerTarget.dataset.sport});

    const sliderTriggerAction = sources.DOM.select(".slider-trigger").events("click").map(e => e.ownerTarget.dataset);
    const sliderChangeAction  = sources.DOM.select("input.range").events("change").map(e => e.ownerTarget);

    const scrollerChangeAction  = sources.DOM.select(".scroll-element").events("click").map(e => e.ownerTarget);

    const addLoadAction = sources.DOM.select(".more").events("click", {useCapture: true}).map(e => e.ownerTarget.dataset);
    const removeAction  = sources.DOM.select(".remove").events("click", {useCapture: true}).map(e => e.ownerTarget.dataset);
    
    const nameInputTriggerAction = sources.DOM.select(".name-trigger").events("click").map(e => e.ownerTarget.dataset);
    const addNameAction = sources.DOM.select("textarea.name").events("blur").map(e => e.ownerTarget);
    
    const infoTextareaTriggerAction = sources.DOM.select(".info-label").events("click").map(e => e.ownerTarget.dataset);
    const addInfoAction = sources.DOM.select("textarea.info").events("blur").map(e => e.ownerTarget);

    const videoTextareaTriggerAction = sources.DOM.select(".video-trigger").events("click").map(e => e.ownerTarget.dataset);
    const addVideoAction = sources.DOM.select("textarea.video").events("blur").map(e => e.ownerTarget);

    const passwordInputTriggerAction = sources.DOM.select(".password-trigger").events("click").map(e => e.ownerTarget.dataset);
    const addPasswordAction = sources.DOM.select("textarea.password").events("blur").map(e => e.ownerTarget);
    const checkPasswordAction = sources.DOM.select("textarea.access").events("blur").map(e => e.ownerTarget);

    const publicAccessAction = sources.DOM.select("input.custom-checkbox").events("change").map(e => e.ownerTarget);

    const textareaFocusAction = sources.DOM.select("textarea").events("focus").map(e => e.ownerTarget.dataset);
    const textareaBlurAction = xs.merge(addNameAction, addInfoAction, addVideoAction, addPasswordAction, publicAccessAction).mapTo(false);

    const shareAction = sources.DOM.select('#qr').events('click').map(e => e.ownerTarget.dataset as SharePayload);
    
    const moreAction = sources.DOM.select('.increase').events('click').map(e => e.ownerTarget);
    const lessAction = sources.DOM.select('.descrease').events('click').map(e => e.ownerTarget);

    const programShareAction = componentNavigation.clickCommand.filter(command => command == textLabels.nav[childOptions.type][cmd.GetQRCode]).mapTo(true);

    const manualDraftRemoveAction = componentNavigation.clickCommand.filter(command => command == textLabels.nav[childOptions.type][cmd.Clear]);

    const newVoiceCommandFromState = state.filter(state => !!state.command && state.command != textLabels.nav[childOptions.type][cmd.GetQRCode] && state.command != textLabels.nav[childOptions.type][cmd.Clear]);

    const compressAction = programShareAction.compose(sampleCombine(state)).filter(([e, state]) => converter.isProgramComplete(state.builder)).map(([e, state]) => converter.convertProgramBuilder(state.builder));
    const qrCodeAction = programShortenResponse.map(response => `${appDomain}/workout/z/${response.body.pathname}`);

    const alertAction = programShareAction.compose(sampleCombine(state)).filter(([e, state]) => !converter.isProgramComplete(state.builder)).mapTo(textLabels.alerts.empty);

    const passwordProvided = checkPasswordAction.compose(sampleCombine(state)).filter(([target, state]) => !!state.updateToken && target.value === state.builder.password); 
    
    const storeBuilderAction = state.filter(state => !!state && !!state.builder && !state.updateToken && !state.QR).map(state => ({type: BUILDER, value: state.builder}));
    
    const removeDraftAction = xs.merge(programShortenResponse, manualDraftRemoveAction);

    const fromRootTrigger = state.filter(state => !!state && state.redirected);

    const notNewProgramReload = fromRootTrigger.compose(sampleCombine(state)).filter(([_, state]) => !!state.updateToken);

    const clearBuilderAction = xs.merge(notNewProgramReload, programForEditResponse, removeDraftAction).mapTo(({type: BUILDER}));

    const programChangeAction = xs.merge(textareaBlurAction, sliderChangeAction, scrollerChangeAction, moreAction, lessAction);

    const storeBuilderTrigger = programChangeAction.compose(sampleCombine(storeBuilderAction)).map(([_, payload]) => payload);
   
    const noProgramToEdit = state.filter(state => !!state && !state.builder).mapTo(BUILDER);

    // REDUCERS ///////////////////////////////////////////////////////
    const externalNavigationReducer = decompressedWod.map(wod => {
        return (prevState?) => {
            return {...prevState, external: {...prevState.external, editToken: void 0}, QR: void 0};
        }
    });
    const accessDeniedReducer = accessDenied.map(_ => {
        return (prevState?) => {
            return {...prevState, workout: void 0, denied: true, loading: void 0};
        }
    })

    const externalWodReducer = decompressedWod
        .map(wod => {
            return (prevState?) => {
                return {...prevState, builder: wod, loading: void 0};
            }
        });

    const receivedTokenReducer = xs.merge(locallyStoredUpdateToken, externalWorkoutToken).filter(token => token != null).map(receivedToken => {
        return (prevState?) => {
            return {...prevState, updateToken: receivedToken, verified: false};
        }
    });
    const passwordProvidedReducer = xs.merge(createProgramAction, passwordProvided).map(_ => {
        return (prevState?) => {
            return {...prevState, verified: true};
        }
    });
    const newProgramReducer = createProgramAction.map(_ => {
        return (prevState?) => {
            return {...prevState, updateToken: void 0};
        }
    });
    const qrCodeDropReducer = xs.merge(fromRootTrigger).map(_ => {
        return (prevState?) => {
            return {...prevState, QR: void 0, builder: void 0, redirected: void 0, denied: void 0};
        }
    });

    // PROGRAM ///////////////////////////////////////////////////////
    const removeDraftReducer = removeDraftAction.map(_ => {
        return (prevState?) => {
            return {...prevState, builder: void 0, loading: void 0, updateToken: void 0};
        }
    });

    // STATE MANAGEMENT ///////////////////////////////////////////////////////////////////////
    const initReducer = xs.of(_ => ({ command: '', header: {menu: false}, dest: 'Program initReducer'}));
    const newCommandReducer = xs.merge(newVoiceCommandFromState, createProgramAction).map(newState => {
        return (prevState?) => {
            const programDraft = prevState && utils.isNotEmpty(prevState.builder) ? prevState.builder : void 0;
            return {...prevState, command: '', QR: void 0, builder: updateProgram(newState.command, programDraft), feedback: `Ok. What's next?`, dest: 'newCommandReducer'};
        }
    });
    const programShortenReducer = sources.QR.map(qrCode => {
        return (prevState?) => {
            return {...prevState, QR: qrCode, command: '', feedback: `Ok. What's next?`, dest: 'programShareReducer'};
        }
    });
    const addElementReducer = addElementAction.map(payload => {
        return (prevState?) => {
            return {...prevState, command: '', QR: void 0, builder: addElement(prevState.builder, payload, false), feedback: `Ok. What's next?`, dest: 'addElementReducer'};
        }
    });
    const copyElementReducer = copyElementAction.map(payload => {
        return (prevState?) => {
            return {...prevState, command: '', QR: void 0, builder: addElement(prevState.builder, payload, true), feedback: `Ok. What's next?`, dest: 'addElementReducer'};
        }
    });
    const addLoadReducer = addLoadAction.map(payload => {
        return (prevState?) => {
            return {...prevState, command: '', QR: void 0, builder: addLoadConfig(prevState.builder, payload), feedback: `Ok. What's next?`, dest: 'addLoadReducer'};
        }
    });
    const removeReducer = removeAction.map(payload => {
        return (prevState?) => {
            return {...prevState, command: '', QR: void 0, builder: removeElement(prevState.builder, payload), feedback: `Ok. What's next?`, dest: 'removeReducer'};
        }
    });
    const addInfoReducer = addInfoAction.map(target => {
        return (prevState?) => {
            return {...prevState, command: '', QR: void 0, builder: addElementInfo(prevState.builder, target), feedback: `Ok. What's next?`, dest: 'addInfoReducer'};
        }
    });
    const addNameReducer = addNameAction.map(target => {
        return (prevState?) => {
            return {...prevState, command: '', QR: void 0, builder: addElementName(prevState.builder, target), feedback: `Ok. What's next?`, dest: 'addNameReducer'};
        }
    });
    const addPasswordReducer = addPasswordAction.map(target => {
        return (prevState?) => {
            return {...prevState, command: '', QR: void 0, builder: addProgramPassword(prevState.builder, target), feedback: `Ok. What's next?`, dest: 'addPasswordReducer'};
        }
    });
    const publicAccessReducer = publicAccessAction.map(target => {
        return (prevState?) => {
            return {...prevState, command: '', QR: void 0, builder: changeAccess(prevState.builder, target), feedback: `Ok. What's next?`, dest: 'publicAccessReducer'};
        }
    });
    const addVideoReducer = addVideoAction.map(target => {
        return (prevState?) => {
            return {...prevState, command: '', QR: void 0, builder: addElementVideo(prevState.builder, target), feedback: `Ok. What's next?`, dest: 'addVideoReducer'};
        }
    });
    const sliderTriggerReducer = sliderTriggerAction.map(payload => {
        return (prevState?) => {
            return {...prevState, command: '', QR: void 0, builder: toggleSlider(prevState.builder, payload), feedback: `Ok. What's next?`, dest: 'aggregatedSelectReducer'};
        }
    });
    const nameInputReducer = nameInputTriggerAction.map(payload => {
        return (prevState?) => {
            return {...prevState, command: '', QR: void 0, builder: toggleNameInput(prevState.builder, payload), feedback: `Ok. What's next?`, dest: 'nameInputReducer'};
        }
    });
    const infoTextareaReducer = infoTextareaTriggerAction.map(payload => {
        return (prevState?) => {
            return {...prevState, command: '', QR: void 0, builder: toggleInfoTextarea(prevState.builder, payload), feedback: `Ok. What's next?`, dest: 'infoTextareaReducer'};
        }
    });
    const videoTextareaReducer = videoTextareaTriggerAction.map(payload => {
        return (prevState?) => {
            return {...prevState, command: '', QR: void 0, builder: toggleVideoTextarea(prevState.builder, payload), feedback: `Ok. What's next?`, dest: 'infoTextareaReducer'};
        }
    });
    const passwordTextareaReducer = passwordInputTriggerAction.map(payload => {
        return (prevState?) => {
            return {...prevState, command: '', QR: void 0, builder: togglePasswordTextarea(prevState.builder, payload), feedback: `Ok. What's next?`, dest: 'infoTextareaReducer'};
        }
    });
    const sliderChangeReducer = xs.merge(sliderChangeAction, scrollerChangeAction).map(target => {
        return (prevState?) => {
            return {...prevState, command: '', builder: setSliderValue(prevState.builder, target, 0), feedback: `Ok. What's next?`, dest: 'sliderChangeReducer'};
        }
    });
    const sliderNextValueReducer = moreAction.map(target => {
        return (prevState?) => {
            return {...prevState, command: '', builder: setSliderValue(prevState.builder, target, 1), feedback: `Ok. What's next?`, dest: 'sliderNextValueReducer'};
        }
    });
    const sliderPrevValueReducer = lessAction.map(target => {
        return (prevState?) => {
            return {...prevState, command: '', builder: setSliderValue(prevState.builder, target, -1), feedback: `Ok. What's next?`, dest: 'sliderPrevValueReducer'};
        }
    });
    
    // MAKE HTTP REQUESTS /////////////////////////////////////////////
    const programShortenRequest = sources.compressor.compose(sampleCombine(state.filter(state => !!state.header)))
        .map(([compressedProgram, state]) => {
            return {
                url: endpoints.shorten,
                category: 'program',
                method: 'POST',
                send: {
                    name: state.builder.title, 
                    program: compressedProgram, 
                    token: state.updateToken, 
                    session: state.header.session,
                    isPublic: !!state.builder.public ? true : false
                }
            };
        });

    const programForEditRequest = externalWorkoutToken // throttled request
        .compose(sampleCombine(state.filter(state => !!state.header && !state.builder && !state.denied && !state.loading)))
        .map(([compressedProgramToken, state]) => {
            return {
                url: `${endpoints.program}/${compressedProgramToken}`,
                category: 'program-for-edit',
                method: 'POST',
                send: {
                    session: state.header.session ? state.header.session : 'no'
                }
            };
        });

    const loadingOnReducer = xs.merge(programForEditRequest, programShortenRequest).map(target => {
            return (prevState?) => {
                return {...prevState, loading: true};
            }
        });

    return {
        DOM: view(xs.combine(state, header.DOM, componentNavigation.DOM)),
        state: xs.merge(
            initReducer, newCommandReducer, addElementReducer, copyElementReducer, sliderTriggerReducer, programShortenReducer,
            sliderChangeReducer, sliderNextValueReducer, addLoadReducer, sliderPrevValueReducer, removeReducer, 
            addInfoReducer, addNameReducer, addVideoReducer, nameInputReducer, infoTextareaReducer, 
            videoTextareaReducer, header.state, externalNavigationReducer,
            receivedTokenReducer, passwordTextareaReducer, addPasswordReducer, publicAccessReducer,
            passwordProvidedReducer, removeDraftReducer, qrCodeDropReducer, externalWodReducer, newProgramReducer,
            accessDeniedReducer, loadingOnReducer
        ),
        cookie: xs.merge(header.cookie),
        HTTP: xs.merge(programForEditRequest, programShortenRequest),
        micOn: textareaFocusAction,
        micOff: textareaBlurAction,
        SpeechFlow: xs.merge(alertAction),//state.map(state => state.feedback);
        decompressor: xs.merge(comressedLocallyStoredWod, compressedWorkout),
        share: shareAction,
        compressor: compressAction.compose(throttle(500)),
        QR: qrCodeAction,
        fullscreen: header.fullscreen,
        storageRead: noProgramToEdit,// read triggers stream
        storageWrite: xs.merge(storeBuilderTrigger, clearBuilderAction),
        hardReload: xs.empty(),
    };
}

function view(input) {
    return input.map(([state, header, navigation]) => {
        const command = state && state.command;
        const primeFeedback = state && state.feedback; // flag to show feedback instead of command options if any
        const componentNavigation = state && state.builder && state.builder.program 
            ? (state && state.header && state.header.microphone // there is no mic flag there anymore - TODO: refactor
            ? div(`#${childOptions.type}-nav.recog-fb`, div(`.content${primeFeedback || !command ? '.blue':''}`, command ? command : (primeFeedback ? primeFeedback : 'Wiating for the voice command'))) 
            : navigation)
            : void 0;

        const body = 
            state.loading
            ? div(`.body.coming-soon.denied`, [ 
                div(`.prime`),
                div('#scan-label', textLabels.action.loading)
            ])
            : state.denied 
                ? div(`.body.coming-soon.denied`, [ 
                    div(`.prime`),
                    div('#scan-label', textLabels.statusses.denied)
                ])
                : !state.QR 
                    ? outOfVoiceCommand(state) 
                    : renderQRCode(state.QR);

        return div(`.wrap`, [header, componentNavigation, body])
    });
}

function outOfVoiceCommand(state): VNode {
    const builder = state.builder as ProgramInstance;
    const hasPassword = builder && builder.password;
    const showBuilder = !state.updateToken || (state.updateToken && (state.verified || !hasPassword));
    const passRequest = state.updateToken && !state.verified && hasPassword;
   
    const program = builder && builder.program;

    if(utils.isNotEmpty(program)) { 
        return div('.body', [
                showBuilder 
                    ? builder.showTitleInput 
                        ? div('.editable.pt.wod-title', [ 
                            textarea(`.name${true?'.active':''}`, {attrs: {
                                maxlength: forTextareas.maxTitleLength, 
                                placeholder: builder.title && ~builder.title.indexOf(textLabels.blank.programTitle) ? builder.title : '',
                                rows: 2
                            }}, (builder.title && ~builder.title.indexOf(textLabels.blank.programTitle) ?  void 0 : builder.title)),
                            div('.icon.apply', utils.SVGContent(svg.check))
                        ])
                        : div('.program-title.name-trigger', builder.title || builder.id)
                    : void 0,
            ].concat(
                showBuilder  
                    ? program.map((complex: ComplexInstance, ind) => {
                        const orderNum = ind+1;
                        const colorClass = `.${utils.outOfClassIndex(orderNum)}`;
                        
                        const complexHeaderDOM = getComplexHeader(complex, colorClass, orderNum, builder.sport);
                        const complexBodyDOM = getComplexBody(complex.blocks, colorClass, builder.sport);
                        const complexFooterDOM = getComplexFooter(complex, colorClass, program.length > 1, program.length < programLimits[ElementType.Complex]);
                        
                        return div(
                            `.complex${colorClass}`, 
                            {dataset: {id: complex.id}}, 
                            complexHeaderDOM.concat(complexBodyDOM).concat(complexFooterDOM)
                        );
                    }).concat([
                        builder.showPasswordInput 
                            ? div('.editable.pt', [ 
                                textarea(`.password${true?'.active':''}`, {attrs: {
                                    maxlength: forTextareas.maxPasswordLength, 
                                    placeholder: !builder.password || builder.password && ~builder.password.indexOf(textLabels.blank.password) ? '' : builder.password,
                                    rows: 2
                                }}, !builder.password || builder.password && ~builder.password.indexOf(textLabels.blank.password) ? void 0 : builder.password),
                                div('.icon.apply', utils.SVGContent(svg.check))
                            ])
                            : div('.program-password.password-trigger', builder.password || textLabels.blank.password)
                    ]).concat([
                        div('.is-public', [
                            input('.custom-checkbox', {attrs: {type: 'checkbox', checked: builder.public ? 'checked' : void 0}}),
                            label(textLabels.labels.public)
                        ])
                    ])
                    : [div('.editable.pt', [ 
                        textarea(`.access${true?'.active':''}`, {attrs: {
                            maxlength: forTextareas.maxPasswordLength, 
                            placeholder: !passRequest && builder.password && ~builder.password.indexOf(textLabels.blank.password) 
                                ? builder.password 
                                : passRequest 
                                    ? textLabels.blank.passwordRequired
                                    : '',
                            rows: 2
                        }}, (passRequest || builder.password && ~builder.password.indexOf(textLabels.blank.password) ? void 0 : builder.password)),
                        div('.icon.apply', utils.SVGContent(svg.check))
                    ])]
            )
        );  
    } else {
        return getDefaultContent();
    }
}

function getDefaultContent() {
    return div('.body', div('.coming-soon.create-program', 
        [ 
            div('.prime'),
            div('.info', textLabels.screenDeafult.program)
        ].concat(
            Object.keys(SportsRestrictions).map(key => div('.sport-picker', {dataset: {sport: key}}, textLabels.values[key]))
        )
    ));
}

function renderQRCode(qrCode) {
    return div('.body', div('.coming-soon.qr', [ 
        div('#qr', {style: {'background-image': `url(${qrCode.image})`}, dataset: {title: 'OpenCoach WOD', url: qrCode.payload}}),
        div('.share-label', textLabels.action.share)
    ]));
}

function updateProgram(newCommand, programDraft: ProgramInstance) {
    switch(newCommand) {
        case Sports.Crossfit:
        case Sports.Weightlifting:
            return new ProgramInstance(newCommand);
        default:
            return fillTextarea(newCommand, programDraft);
    }
}

function fillTextarea(newCommand, builder) {
    if(builder.showTitleInput) {builder.title = builder.title ? builder.title.replace(textLabels.blank.programTitle,'') : ''; builder.title += `${newCommand} `; return builder;}
    builder.program.map(complex => {
        if(complex.showNameInput) {complex.name = complex.name.replace(textLabels.blank.complexName,''); complex.name += `${newCommand} `; return;}
        if(complex.showInfoTextarea) {complex.info = complex.info ? complex.info.replace(textLabels.blank.complexInfo,'') : ''; complex.info += `${newCommand} `; return;}
        complex.blocks.map(block => {
            if(block.showInfoTextarea) {block.info = block.info ? block.info.replace(textLabels.blank.blockInfo,'') : ''; block.info += `${newCommand} `; return;}
            block.movements.map((config: MovementConfigInstance) => {
                if(config.showNameInput) {config.movement.name = config.movement.name.replace(textLabels.blank.movementName, ''); config.movement.name += `${newCommand} `; return;}
                if(config.showInfoTextarea) {config.info = config.info ? config.info.replace(textLabels.blank.movementInfo,'') : ''; config.info += `${newCommand} `; return;}
                if(config.showVideoTextarea) {config.movement.url = config.movement ? config.movement.url.replace(textLabels.blank.movementURL,'') : ''; config.movement.url += `${newCommand} `; return;}
            });
        });
    });

    return builder;
}

function addLoadConfig(builder, payload) {
    builder.program.map(complex => {
        complex.blocks.map(block => {
            block.movements.map(config => {
                if(config.id == payload.id) {
                    config.load.push(new LoadInstance());
                }
            });
        });
    });

    return builder;
} 

function addElement(builder, payload, copy) {
    builder.program.map((complex, ci) => {
        if(complex.id == payload.id) {
            builder.program.splice(ci + 1, 0, new ComplexInstance());
        } else {
            complex.blocks.map((block, bi) => {
                if(block.id == payload.id) {
                    complex.blocks.splice(bi + 1, 0,  copy ? copier.block(block) : new BlockInstance());
                } else {
                    block.movements.map((config, mi) => {
                        if(config.id == payload.id) {
                            block.movements.splice(mi + 1, 0, copy ? copier.movementConfig(config) : new MovementConfigInstance());
                        } 
                    });
                }
            });
        }
    });

    return builder;
} 

function removeElement(builder, payload) {
    builder.program.map((complex, ci) => {
        if(complex.id == payload.id && builder.program.length > 1) {
            builder.program.splice(ci, 1);
        } else {
            complex.blocks.map((block, bi) => {
                if(block.id == payload.id && complex.blocks.length > 1) {
                    complex.blocks.splice(bi, 1);
                } else {
                    block.movements.map((config, mi) => {
                        if(config.id == payload.id && block.movements.length > 1) {
                            block.movements.splice(mi, 1);
                        } 
                    });
                }
            });
        }
    });

    return builder;
} 

function addElementInfo(builder, target) {
    const payload = target.dataset;
    builder.program.map(complex => {
        if(complex.id == payload.id) {
            complex.info = target.value ? utils.capitalize(target.value) : textLabels.blank.complexInfo;
            complex.showNameInput = false; complex.showInfoTextarea = false;
        } else {
            complex.blocks.map(block => {
                if(block.id == payload.id) {
                    block.info = target.value ? utils.capitalize(target.value) : textLabels.blank.blockInfo;
                    block.showInfoTextarea = false;
                } else {
                    block.movements.map((config, mi) => {
                        if(config.id == payload.id) {
                            config.info = target.value ? utils.capitalize(target.value) : textLabels.blank.movementInfo;
                            config.showNameInput = false; config.showInfoTextarea = false; config.showVideoTextarea = false;
                        } 
                    });
                }
            });
        }
    });

    return builder;
} 

function addElementName(builder, target) {
    const payload = target.dataset;

    if(!payload.id) {
        builder.title = target.value ? utils.capitalize(target.value) : textLabels.blank.programTitle;
        builder.showTitleInput = false;
        builder.showPasswordInput = false;
    } else {
        builder.program.map(complex => {
            if(complex.id == payload.id) {
                complex.name = target.value ? utils.capitalize(target.value) : textLabels.blank.complexName;
                complex.showNameInput = false; complex.showInfoTextarea = false;
            } else {
                complex.blocks.map(block => {
                    block.movements.map((config, mi) => {
                        if(config.id == payload.id) {
                            config.movement.name = target.value ? utils.capitalize(target.value) : textLabels.blank.movementName;
                            config.showNameInput = false; config.showInfoTextarea = false; config.showVideoTextarea = false;
                        } 
                    });
                });
            }
        });
    }

    return builder;
} 

function addProgramPassword(builder, target) {
    
    builder.password = target.value ? target.value : textLabels.blank.password;
    builder.showPasswordInput = false;

    return builder;
} 

function changeAccess(builder, target) {
    builder.public = target.checked;

    return builder;
} 

function addElementVideo(builder, target) {
    const payload = target.dataset;
    builder.program.map(complex => {
        complex.blocks.map(block => {
            block.movements.map((config, mi) => {
                if(config.id == payload.id) {
                    config.movement.url = target.value ? target.value : textLabels.blank.movementURL;
                    config.showNameInput = false; config.showInfoTextarea = false; config.showVideoTextarea = false;
                } 
            });
        });
    });

    return builder;
}

function toggleSlider(builder, payload) { // set the default or preset value
    builder.showTitleInput = false;
    builder.showPasswordInput = false;

    builder.program.map(complex => {
        complex.showSlider = complex.id == payload.id ? !complex.showSlider : false;
        complex.showNameInput = false; complex.showInfoTextarea = false;

        complex.blocks.map(block => {
            block.showSlider = block.id == payload.id ? !block.showSlider : false;
            block.showInfoTextarea = false;

            block.movements.map(config => {
                if(config.id == payload.id) {
                    if(payload.type == ParameterType.Goal) {
                        config.showGoalSlider = !config.showGoalSlider;
                        config.showLoadSlider = false;        
                    } else if(payload.type == ParameterType.Load) {
                        config.showGoalSlider = false;
                        config.showLoadSlider = !config.showLoadSlider;        
                    }
                } else {
                    config.showGoalSlider = false;
                    config.showLoadSlider = false; 
                }
                config.loadIndex = config.id == payload.id && payload.index ? payload.index : 0;
                config.showNameInput = false; config.showInfoTextarea = false; config.showVideoTextarea = false;
            });
        });
    });

    return builder;
} 

function toggleNameInput(builder, payload) { // set the default or preset value
    builder.showTitleInput = !payload.id ? !builder.showTitleInput : false;
    
    builder.program.map(complex => {
        complex.showNameInput = complex.id == payload.id ? !complex.showNameInput : false;
        complex.showInfoTextarea = false;
        complex.showSlider = false;

        complex.blocks.map(block => {
            block.showInfoTextarea = false;
            block.showSlider = false;

            block.movements.map(config => {
                config.showNameInput = config.id == payload.id ? !config.showNameInput : false;
                config.showInfoTextarea = false;
                config.showVideoTextarea = false;
                config.showGoalSlider = false;
                config.showLoadSlider = false;
            });
        });
    });

    return builder;
} 

function toggleInfoTextarea(builder, payload) { // set the default or preset value
    builder.showTitleInput = false;
    builder.showPasswordInput = false;

    builder.program.map((complex: ComplexInstance) => {
        complex.showInfoTextarea = complex.id == payload.id ? !complex.showInfoTextarea : false;
        complex.showNameInput = false;
        complex.showSlider = false;
    
        complex.blocks.map((block: BlockInstance) => {
            block.showInfoTextarea = block.id == payload.id ? !block.showInfoTextarea : false;
            block.showSlider = false;
    
            block.movements.map((config: MovementConfigInstance) => {
                config.showInfoTextarea = config.id == payload.id ? !config.showInfoTextarea : false;
                config.showNameInput = false;
                config.showVideoTextarea = false;
                config.showGoalSlider = false;
                config.showLoadSlider = false;
            });
        });
    });

    return builder;
} 

function toggleVideoTextarea(builder, payload) { // set the default or preset value
    builder.showTitleInput = false;
    builder.showPasswordInput = false;

    builder.program.map((complex: ComplexInstance) => {
        complex.showInfoTextarea = false;
        complex.showNameInput = false;
        complex.showSlider = false;
    
        complex.blocks.map((block: BlockInstance) => {
            block.showInfoTextarea = false;
            block.showSlider = false;
    
            block.movements.map((config: MovementConfigInstance) => {
                config.showVideoTextarea = config.id == payload.id ? !config.showVideoTextarea : false;
                config.showNameInput = false;
                config.showInfoTextarea = false;
                config.showGoalSlider = false;
                config.showLoadSlider = false;
            });
        });
    });

    return builder;
} 

function togglePasswordTextarea(builder, payload) { // set the default or preset value
    builder.showTitleInput = false;
    builder.showPasswordInput = !builder.showPasswordInput;

    builder.program.map((complex: ComplexInstance) => {
        complex.showInfoTextarea = false;
        complex.showNameInput = false;
        complex.showSlider = false;
    
        complex.blocks.map((block: BlockInstance) => {
            block.showInfoTextarea = false;
            block.showSlider = false;
    
            block.movements.map((config: MovementConfigInstance) => {
                config.showVideoTextarea = false;
                config.showNameInput = false;
                config.showInfoTextarea = false;
                config.showGoalSlider = false;
                config.showLoadSlider = false;
            });
        });
    });

    return builder;
} 


function setSliderValue(builder: ProgramInstance, target, shift) {
    const payload = target.dataset;
    const value = target.value != void 0 ? target.value : payload.index;

    builder.program.map(complex => {
        if(complex.id == payload.id) {
            complex[payload.type] = (shift == 0) 
                ? sliderResolver.complexParameterByIndexAndType(payload.type, complex.type, value, builder.sport) 
                : sliderResolver.resolveComplexValueShift(payload.type, complex.type, complex[payload.type], shift, builder.sport);

            if(payload.type == 'type') {
                if(!complex[payload.type]) {
                    complex[payload.type] = ComplexType.NONE;
                } 
                complex.value = '';
            }
            return;
        }

        complex.blocks.map(block => {
            if(block.id == payload.id) {
                block[payload.type] = (shift == 0) 
                    ? sliderResolver.complexParameterByIndexAndType(payload.type, block.type, value, builder.sport)
                    : sliderResolver.resolveComplexValueShift(payload.type, block.type, block[payload.type], shift, builder.sport);
                
                if(payload.type == 'type') {
                    if(!block[payload.type]) {
                        block[payload.type] = ComplexType.NONE;
                    } 
                    block.value = '';
                }
                return;
            }
            
            block.movements.map(config => {
                if(config.id == payload.id) {
                    if(payload.type == ParameterType.Value) {
                        if(payload.subtype == ParameterType.Load) {
                            config.load[payload.loadIndex || 0][payload.female ? 'femaleValue': 'maleValue'] = (shift == 0) 
                                ? sliderResolver.movementParameterByIndexAndType(payload.type, payload.subtype, null, config.load[payload.loadIndex || 0].type, value) 
                                : sliderResolver.resolveMovementValueShift(payload.type, payload.subtype, null, config.load[payload.loadIndex || 0].type, config.load[payload.loadIndex || 0][payload.female ? 'femaleValue': 'maleValue'], shift);

                            if(payload.female && config.load[payload.loadIndex || 0]['maleValue'] == config.load[payload.loadIndex || 0].type) { // if maveValue unset
                                config.load[payload.loadIndex || 0]['maleValue'] = config.load[payload.loadIndex || 0]['femaleValue'];
                            }

                            if(config.load[payload.loadIndex || 0][payload.female ? 'femaleValue': 'maleValue'] == ParameterType.Value) {
                                config.load[payload.loadIndex || 0][payload.female ? 'femaleValue': 'maleValue'] = config.load[payload.loadIndex || 0].type;
                            }
                        } else if(payload.subtype == ParameterType.Goal) {
                            config.goal.values[payload.index-1] = (shift == 0) 
                                ? sliderResolver.movementParameterByIndexAndType(payload.type, payload.subtype, config.goal.type, null, value)
                                : sliderResolver.resolveMovementValueShift(payload.type, payload.subtype, config.goal.type, null, config.goal.values[payload.index-1], shift);

                            if(!config.goal.type) {
                                config.goal.type = GoalType.None; 
                            }

                            if(payload.index == config.goal.values.length && config.goal.values.length < forSliders.maxOtherSliders) {
                                config.goal.values.push(config.goal.type);
                            }

                            if(config.goal.values[payload.index-1] == ParameterType.Value) {
                                config.goal.values[payload.index-1] = config.goal.type;

                                if(config.goal.type != GoalType.Combo) {
                                    config.goal.values = config.goal.values.splice(0, payload.index);
                                }
                            }
                        }    
                    } else {
                        if(payload.type == ParameterType.Load) {
                            config.load[payload.loadIndex || 0].type = (shift == 0) 
                                ? sliderResolver.movementParameterByIndexAndType(payload.type, payload.subtype, null, config.load[payload.loadIndex || 0].type, value, builder.sport)
                                : sliderResolver.resolveMovementValueShift(payload.type, payload.subtype, null, config.load.type, config.load[payload.loadIndex || 0].type, shift, builder.sport);
                            config.load[payload.loadIndex || 0]['maleValue'] = config.load[payload.loadIndex || 0].type; // just to visually indicate type change
                            config.load[payload.loadIndex || 0]['femaleValue'] = config.load[payload.loadIndex || 0].type; // just to visually indicate type change 
                        
                            if(!config.load[payload.loadIndex || 0].type) {
                                config.load[payload.loadIndex || 0].type = LoadType.None; 
                            }
                        } else if(payload.type == ParameterType.Goal) {
                            config.goal.type = (shift == 0) 
                                ? sliderResolver.movementParameterByIndexAndType(payload.type, payload.subtype, config.goal.type, null, value, builder.sport)
                                : sliderResolver.resolveMovementValueShift(payload.type, payload.subtype, config.goal.type, null, config.goal.type, shift, builder.sport);  
                            
                            if(!config.goal.type) {
                                config.goal.type = GoalType.None; 
                            } 

                            config.goal.values = [];
                                
                            for(let i=0; i < ((config.goal.type == GoalType.Combo) ? forSliders.maxComboSliders : 1); i++) {
                                config.goal.values.push(config.goal.type);    
                            }
                        }
                    }
                    return;
                }
            });
        });
    });
    
    return builder;
}

//// COMPLEX //////////////////////////////////////////////////////////////////////////////////////

function getComplexHeader(complex: ComplexInstance, colorClass, orderNum, sport: Sports) {
    return [
        div('.complex-header', 
            complex.showNameInput 
            ? div('.editable', [ 
                textarea(`.name${true?'.active':''}`, {attrs: {
                    maxlength: forTextareas.maxTitleLength, 
                    placeholder: complex.name && ~complex.name.indexOf(textLabels.blank.complexName) ? complex.name : textLabels.blank.complexName,
                    rows: 2
                }, dataset: {id: complex.id}}, (complex.name && ~complex.name.indexOf(textLabels.blank.complexName) ?  '' : complex.name)),
                div('.icon.apply', utils.SVGContent(svg.check))
            ])
            : [
                    div('.complex-label', [
                    div(`.index${colorClass}`, orderNum),
                    div('.complex-title.name-trigger', {dataset: {id: complex.id}}, complex.name || complex.id)
                ]), 
                div('.complex-details', [
                    div('.complex-details-tools.slider-trigger', {dataset: {id: complex.id, type: ParameterType.Type}}, [
                        setComplexParameterInfo(complex, ParameterType.Type),
                        complex.showSlider || complex.type ? setComplexParameterInfo(complex, ParameterType.Value) : void 0
                    ])
                ])
            ]
        ),
        complex.showSlider ? getComplexScrollSlider(complex, ParameterType.Type, colorClass, sport) : void 0,
        complex.showSlider ? div('.complex-sliders', [
            //getComplexSlider(complex, ParameterType.Type, colorClass, sport),
            getComplexSlider(complex, ParameterType.Value, colorClass, sport),
        ]) : void 0
    ];
}

function getComplexBody(blocks: BlockInstance[], colorClass, sport: Sports) {
    return blocks.map((block: BlockInstance, ind) => {
        const blockHeaderDOM = getBlockHeader(block, colorClass, ind, sport);
        const blockBodyDOM = getBlockBody(block.movements, colorClass, sport);
        const blockFooterDOM = getBlockFooter(block, colorClass, blocks.length > 1, blocks.length < programLimits[ElementType.Block]);

        return div(
            `.block`, 
            {dataset: {id: block.id}}, 
            blockHeaderDOM.concat(blockBodyDOM).concat(blockFooterDOM)
        );
    });
}

function getComplexFooter(complex: ComplexInstance, colorClass, allowRemove, allowAdd) {
    return [
        div(`.complex-info${colorClass}`, 
            complex.showInfoTextarea 
            ? div(`.editable`, [ 
                textarea(`.info${true?'.active':''}`, {attrs: {
                    maxlength: forTextareas.maxInfoLength, 
                    placeholder: complex.info && ~complex.info.indexOf(textLabels.blank.complexInfo) ? complex.info : textLabels.blank.complexInfo,
                    rows: 5
                }, dataset: {id: complex.id}}, (complex.info && ~complex.info.indexOf(textLabels.blank.complexInfo) ?  '' : complex.info)),
                div('.icon.apply', utils.SVGContent(svg.checkWhite))
            ])
            :
            div('.info-label', {dataset: {id: complex.id}}, complex.info ? complex.info : textLabels.blank.complexInfo),
            
        ),
        div('.e-footer', [
            allowAdd ? div(`.add-element.e-action`, {dataset: {id: complex.id}}, [utils.SVGContent(utils.getPlusIcon(colorClass)), div('.action-label', textLabels.action.complex)]) : void 0,
            allowRemove ? div('.remove.e-action', {dataset: {id: complex.id}}, [utils.SVGContent(svg.cross), div('.action-label', textLabels.action.complex)]) : void 0
        ])
    ];
}

function setComplexParameterInfo(complex: ComplexInstance, type: ParameterType) {
    return div(`.type-config.${type}`, [
        (type == ParameterType.Value && complex.value || type == ParameterType.Type && !complex.value) ? div(`.icon .${complex.value}`, utils.SVGContent(iconsResolver.byComplexType(complex.type))) : void 0,
        complex[type] ? div('.value', utils.isNum(complex[type]) ? complex[type] : textLabels.values[complex[type]]) : (type == ParameterType.Type) ? div('.value', utils.capitalize(utils.isNum(type) ? type : textLabels.values[type].toUpperCase())) : void 0

    ]);
}

function getComplexSlider(complex: ComplexInstance, type: ParameterType, colorClass, sport: Sports) {
    const max = sliderResolver.maxValueByType(type, complex.type, null, null, sport);
    const value = sliderResolver.resolveCurrentValueIndex(type, complex.type, null, null, type == ParameterType.Type ? complex.type : complex.value, sport);
    return div(`.slider.${max==0?'disabled':''}.${type}`, [
        div('.descrease', {dataset: {id: complex.id, type: type}}, [utils.SVGContent(utils.getMinusIcon(colorClass))]),
        div('.label', utils.capitalize(textLabels.values[type])),
        input(`.range.${type}`, {attrs: {type: 'range', min: 0, max: max, value: value}, dataset: {id: complex.id, type: type}}),
        div('.increase', {dataset: {id: complex.id, type: type}}, [utils.SVGContent(utils.getPlusIcon(colorClass))])
    ]);
}

function getComplexScrollSlider(complex: ComplexInstance, type: ParameterType, colorClass, sport: Sports) {
    const sliderRibbon = !sport ? Object.keys(ComplexType) : Object.keys(SportsRestrictions[sport][RestrictionType.ComplexType]);

    return div(`.complex-scroll-slider${sliderRibbon.length==0?'.disabled':''}.${type}.${sport}`, 
        sliderRibbon.map((next, index) => {
            return section(`.scroll-element.${type}${ComplexType[next]==complex.type? '.selected': ''}`, {dataset: {id: complex.id, type: type, key: next, index: index}}, next == ComplexType.NONE ? '—' : textLabels.values[ComplexType[next]]);
        })
    );
}

//// BLOCK //////////////////////////////////////////////////////////////////////////////////////

function getBlockHeader(block: BlockInstance, colorClass, index, sport: Sports) {
    return [
        div(`.block-header`, 
            [
                div(`.block-index${colorClass}`, `${utils.capitalize(textLabels.action.block)} ${utils.getLetter(index)}`),
                div('.block-details.slider-trigger', {dataset: {id: block.id, type: ParameterType.Type}}, [
                    setBlockParameterInfo(block, ParameterType.Type),
                    block.type != ComplexType.NONE ? setBlockParameterInfo(block, ParameterType.Value) : void 0
                ])
            ]
        ),
        block.showSlider ? getBlockScrollSlider(block, ParameterType.Type, colorClass, sport) : void 0,
        block.showSlider ? div('.block-sliders', [
            getBlockSlider(block, ParameterType.Value, colorClass, sport),
        ]) : void 0
    ];
}

function getBlockBody(movements: MovementConfigInstance[], colorClass, sport: Sports) {
    const allowAdd = movements.length < programLimits[ElementType.Movement];
    return movements.map((config: MovementConfigInstance) =>
        div(
            `.movement${colorClass}`, 
            {dataset: {id: config.id}},
            [
                getMovementHeader(config, colorClass), 
                config.showGoalSlider ? getMovementGoalSliders(config, colorClass, sport) : void 0,
                config.showLoadSlider ? getMovementLoadSliders(config, colorClass, sport) : void 0,
                config.showNameInput || config.showGoalSlider || config.showLoadSlider ? void 0 : setMovementInfo(config),
                div('.e-footer', [
                    allowAdd ? div(`.add-element.e-action`, {dataset: {id: config.id}}, [utils.SVGContent(utils.getPlusIcon(colorClass)), div('.action-label', textLabels.action.movement)]) : void 0,
                    allowAdd ? div(`.copy-element.e-action`, {dataset: {id: config.id}}, [utils.SVGContent(utils.getDotIcon(colorClass)), movements.length == 1 ? div('.action-label', textLabels.action.copy) : void 0]) : void 0,
                    movements.length > 1 ? div('.remove.e-action', {dataset: {id: config.id}}, [utils.SVGContent(svg.cross), div('.action-label', textLabels.action.movement)]) : void 0
                ])
            ]
        )
    );
}

function getBlockFooter(block: BlockInstance, colorClass, allowRemove, allowAdd) {
    return [
        div(`.block-info${colorClass}`, 
        block.showInfoTextarea 
        ? div(`.editable`, [ 
            textarea(`.info${true?'.active':''}`, {attrs: {
                maxlength: forTextareas.maxInfoLength,  
                placeholder: block.info && ~block.info.indexOf(textLabels.blank.blockInfo) ? block.info : textLabels.blank.blockInfo,
                rows: 5
            }, dataset: {id: block.id}}, (block.info && ~block.info.indexOf(textLabels.blank.blockInfo) ? '' : block.info)),
            div('.icon.apply', utils.SVGContent(svg.check))
        ])
        :
        div('.info-label', {dataset: {id: block.id}}, block.info ? block.info : textLabels.blank.complexInfo)),
        div('.e-footer', [
            allowAdd ? div(`.add-element.e-action`, {dataset: {id: block.id}}, [utils.SVGContent(utils.getPlusIcon(colorClass)), div('.action-label', textLabels.action.block)]) : void 0,
            allowAdd ? div(`.copy-element.e-action`, {dataset: {id: block.id}}, [utils.SVGContent(utils.getDotIcon(colorClass)), !allowRemove ? div('.action-label', textLabels.action.copy) : void 0]) : void 0,
            allowRemove ? div('.remove.e-action', {dataset: {id: block.id}}, [utils.SVGContent(svg.cross), div('.action-label', textLabels.action.block)]) : void 0
        ])
    ];
}

function setBlockParameterInfo(block: BlockInstance, type: ParameterType) {
    return div(`.type-config.${type}`, [
        (type == ParameterType.Value && block.value != '-' && block.type) ? div('.icon', utils.SVGContent(iconsResolver.byBlockType(block.type))) : void 0,
        block[type] ? div('.value', utils.isNum(block[type]) ? block[type] : textLabels.values[block[type]]) : (type == ParameterType.Type) ? div('.value', utils.capitalize(utils.isNum(type) ? type : textLabels.values[type].toUpperCase())) : void 0
    ]);
}

function getBlockSlider(block: BlockInstance, type: ParameterType, colorClass, sport) {
    const max = sliderResolver.maxValueByType(type, block.type, null, null, sport);
    const currentIndex = sliderResolver.resolveCurrentValueIndex(type, block.type, null, null, type == ParameterType.Type ? block.type : block.value, sport);
    return div(`.slider.${max==0?'disabled':''}.${type}`, [
        div('.descrease', {dataset: {id: block.id, type: type}}, [utils.SVGContent(utils.getMinusIcon(colorClass))]),
        div('.label', utils.capitalize(textLabels.values[type])),
        input(`.range.${type}`, {attrs: {type: 'range', min: 0, max: max, value: currentIndex}, dataset: {id: block.id, type: type}}),
        div('.increase', {dataset: {id: block.id, type: type}}, [utils.SVGContent(utils.getPlusIcon(colorClass))])
    ]);
}

function getBlockScrollSlider(block: BlockInstance, type: ParameterType, colorClass, sport: Sports) {
    const sliderRibbon = !sport ? Object.keys(ComplexType) : Object.keys(SportsRestrictions[sport][RestrictionType.ComplexType]); 
    
    return div(`.complex-scroll-slider${sliderRibbon.length==0?'.disabled':''}.${type}.${sport}`, 
        sliderRibbon.map((next, index) => {
            return section(`.scroll-element.${type}${ComplexType[next]==block.type? '.selected': ''}`, {dataset: {id: block.id, type: type, key: next, index: index}}, next == ComplexType.NONE ? '—' : textLabels.values[ComplexType[next]]);
        })
    );
}
//// MOVEMENT //////////////////////////////////////////////////////////////////////////////////////

function getMovementHeader(config: MovementConfigInstance, colorClass) {
    const shortCC = colorClass.substring(1, colorClass.length);
    return div('.movement-header', 
        config.showNameInput 
        ? div('.editable', [ 
            textarea(`.name${true?'.active':''}`, {attrs: {
                maxlength: forTextareas.maxTitleLength, 
                placeholder: config.movement.name && ~config.movement.name.indexOf(textLabels.blank.movementName) ? config.movement.name : textLabels.blank.movementName,
                rows: 2
            }, dataset: {id: config.id}}, (config.movement.name && ~config.movement.name.indexOf(textLabels.blank.movementName) ?  '' : config.movement.name)),
            div('.icon.apply', utils.SVGContent(svg.check))
        ])
        : (
            config.showVideoTextarea 
            ? div(`.editable`, [ 
                textarea(`.video${true?'.active':''}`, {attrs: {
                    maxlength: forTextareas.maxTitleLength, 
                    placeholder: config.movement.url && ~config.movement.url.indexOf(textLabels.blank.movementURL) ? config.movement.url : textLabels.blank.movementURL,
                    rows: 2
                }, dataset: {id: config.id}}, (!config.movement.url || config.movement.url && ~config.movement.url.indexOf(textLabels.blank.movementURL) ?  '' : config.movement.url)),
                div('.icon.apply', utils.SVGContent(svg.check))
            ]) 
            : [
                div('.movement-parameters', [
                    div('.movement-label', [
                        div(`.before${colorClass}`),
                        div('.movement-name.name-trigger', {dataset: {id: config.id}}, config.movement.name || config.movement.id),
                        getMovementVideo(config, colorClass)
                    ]), 
                    getMovementLoad(config, shortCC)
                ]),
                getMovementGoal(config, shortCC)
            ]
        ) 
    )
}

function getMovementGoal(config: MovementConfigInstance, colorClass) {
    const noValues = config.goal.values && (config.goal.values.length == 0 || (config.goal.values.length == 1 && config.goal.values[0] == config.goal.type));
    const lastValueIndex = config.goal.values && utils.getLastSetValueIndex(config.goal.values, config.goal.type);
    const multipleGoals = config.goal.values && config.goal.values && config.goal.values.length > 1 && lastValueIndex >= forSliders.maxOtherSliders-1;
    
    const type = ParameterType.Goal;
    return div('.movement-details', [        
        div(`.goal-config.slider-trigger.${config.goal.type}`, {dataset: {id: config.id, type: type, subtype: type}}, [
            div('.icon', utils.SVGContent(iconsResolver.byConfigGoalType(config.goal.type, colorClass))),
            div(`.value${multipleGoals?'.column':''}`, 
                !noValues && config.goal.values
                ? ( 
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
                : config.goal.type && config.goal.type != GoalType.None ? textLabels.values[config.goal.type] : textLabels.blank.goal

            )
        ])
    ]);
}

function getMovementLoad(config: MovementConfigInstance, colorClass) {
    return div('.movement-load', [
        div('.loads', config.load.map((load, index) => 
            setMovementLoadConfig(config, load, index, colorClass)).concat(
                config.showGoalSlider || config.showLoadSlider || config.load.length >= programLimits[ParameterType.Load] ? void 0 : div('.more', {dataset: {id: config.id}}, [utils.SVGContent(utils.getPlusIcon(colorClass))])
            )
        )
    ]);
}

function setMovementLoadConfig(config: MovementConfigInstance, load: LoadInstance, index, colorClass) {
    const maleLoad = load.maleValue ? utils.getGoalValue(load.maleValue) : (load.type && load.type != LoadType.None ? textLabels.values[load.type] : textLabels.blank.load);
    const femaleLoad = (load.femaleValue != load.type) ? utils.getGoalValue(load.femaleValue) : void 0;
    
    return div(`.load-config.slider-trigger.${load.type == LoadType.WeightPercent || load.type == LoadType.AddPercent ? 'weight-percent' : load.type}`, 
        {dataset: {id: config.id, type: ParameterType.Load, subtype: load.type, index: index}}, [
        div('.icon', utils.SVGContent(iconsResolver.byConfigLoadType(load.type, colorClass))),
        div(`.value.${colorClass}`, `${maleLoad}${femaleLoad ? ' / ' + femaleLoad : ''}`)
    ]);
}

function getMovementGoalSliders(config: MovementConfigInstance, colorClass, sport: Sports) {
    return div('.movement-sliders',  [
        getMovementGoalTypeScrollSlider(config, colorClass, sport)].concat(
            config.goal.values
                .filter(value => config.goal.type != GoalType.MaxCal && config.goal.type != GoalType.MaxReps && config.goal.type != GoalType.MaxTime && config.goal.type != GoalType.PercentMaxReps)
                .map((value, index) => getMovementGoalValueSlider(config, colorClass, index))
        )
    );
}

function getMovementLoadSliders(config: MovementConfigInstance, colorClass, sport: Sports) {
    return div('.movement-sliders', [
        getMovementLoadTypeScrollSlider(config, colorClass, sport), 
        getMovementLoadValueSlider(config, colorClass, false),
        (
            config.load[config.loadIndex] && 
            config.load[config.loadIndex].maleValue != config.load[config.loadIndex].type && 
            (config.load[config.loadIndex].type == LoadType.Weight || config.load[config.loadIndex].type == LoadType.Deficit || config.load[config.loadIndex].type == LoadType.Height)
        )
        ? getMovementLoadValueSlider(config, colorClass, true)
        : void 0
    ]);
}

function getMovementGoalTypeScrollSlider(config: MovementConfigInstance, colorClass, sport: Sports) {
    const sliderRibbon = !sport ? Object.keys(GoalType) : Object.keys(SportsRestrictions[sport][RestrictionType.GoalType]);
   
    return div(`.goal-scroll-slider${sliderRibbon.length==0?'.disabled':''}.${sport}`, 
        sliderRibbon.map((next, index) => {
            return section(`.scroll-element.${GoalType[next]==config.goal.type? '.selected': ''}`, {dataset: {id: config.id, type: ParameterType.Goal, key: next, index: index}}, next == GoalType.None ? '—' : textLabels.values[GoalType[next]]);
        })
    );
}

function getMovementGoalValueSlider(config: MovementConfigInstance, colorClass, valueIndex: number) {
    valueIndex += 1;
    const type = ParameterType.Value;
    const subtype = ParameterType.Goal;
    const max = sliderResolver.maxValueByType(type, null, config.goal.type, null, null);
    const currentIndex = sliderResolver.resolveCurrentValueIndex(type, null, config.goal.type, null, config.goal.values[valueIndex-1], null);
    
    return div(`.slider.${max==0?'disabled':''}.${type}`, [
        div('.descrease', {dataset: {id: config.id, type: type, subtype: subtype, index: valueIndex}}, [utils.SVGContent(utils.getMinusIcon(colorClass))]),
        div('.label', `${utils.capitalize(textLabels.values[type])} ${valueIndex}`),
        input(`.range.${type}${colorClass}`, {attrs: {type: 'range', min: 0, max: max, value: currentIndex}, dataset: {id: config.id, type: type, subtype: subtype, index: valueIndex}}),
        div('.increase', {dataset: {id: config.id, type: type, subtype: subtype, index: valueIndex}}, [utils.SVGContent(utils.getPlusIcon(colorClass))])
    ]);
}

function getMovementLoadTypeScrollSlider(config: MovementConfigInstance, colorClass, sport: Sports) {
    const sliderRibbon = !sport ? Object.keys(LoadType) : Object.keys(SportsRestrictions[sport][RestrictionType.LoadType]);
   
    return div(`.load-scroll-slider${sliderRibbon.length==0?'.disabled':''}.${sport}`, 
        sliderRibbon.map((next, index) => {
            return section(`.scroll-element.${LoadType[next]==config.load[config.loadIndex].type ? '.selected': ''}`, {dataset: {id: config.id, type: ParameterType.Load, key: next, loadIndex: config.loadIndex, index: index}}, next == LoadType.None ? '—' : textLabels.values[LoadType[next]]+ ((LoadType[next]==LoadType.WeightPercent || LoadType[next]==LoadType.AddPercent)? '%':''));
        })
    );
}

function getMovementLoadValueSlider(config: MovementConfigInstance, colorClass, female: boolean) {
    const type = ParameterType.Value;
    const subtype = ParameterType.Load;
    const max = sliderResolver.maxValueByType(type, null, null, config.load[config.loadIndex].type, null);
    const currentIndex = sliderResolver.resolveCurrentValueIndex(type, null, null, config.load[config.loadIndex].type, config.load[config.loadIndex][female? 'femaleValue':'maleValue'], null);
    const valueIndex = female ? ' 2': ' 1';

    return div(`.slider.${max==0?'disabled':''}.${type}`, [
        div('.descrease', {dataset: {id: config.id, type: type, subtype: subtype, female: female, index: config.loadIndex}}, [utils.SVGContent(utils.getMinusIcon(colorClass))]),
        div('.label', `${utils.capitalize(textLabels.values[type])}${valueIndex}`),
        input(`.range.${type}${colorClass}`, {attrs: {type: 'range', min: 0, max: max, value: currentIndex}, dataset: {id: config.id, type: type, subtype: subtype, female: female, loadIndex: config.loadIndex}}),
        div('.increase', {dataset: {id: config.id, type: type, subtype: subtype, female: female, index: config.loadIndex}}, [utils.SVGContent(utils.getPlusIcon(colorClass))])
    ]);
}

function setMovementInfo(config: MovementConfigInstance) {
    return div(`.movement-info`,
        config.showInfoTextarea 
        ? div(`.editable`, [ 
            textarea(`.info${true?'.active':''}`, {attrs: {
                maxlength: forTextareas.maxInfoLength, 
                placeholder: config.info && ~config.info.indexOf(textLabels.blank.movementInfo) ? config.info : textLabels.blank.movementInfo,
                rows: 5
            }, dataset: {id: config.id}}, (config.info && ~config.info.indexOf(textLabels.blank.movementInfo) ?  '' : config.info)),
            div('.icon.apply', utils.SVGContent(svg.check))
        ])
        : div('.info-label', {dataset: {id: config.id}}, config.info ? config.info : textLabels.blank.movementInfo)
    );
}
function getMovementVideo(config: MovementConfigInstance, colorClass) {
    var videoIcon = svg.onePlay; if(colorClass == '.two') {videoIcon = svg.twoPlay;} else if(colorClass == '.three') {videoIcon = svg.threePlay;}
    return div(`.icon.video-trigger`, {dataset: {id: config.id, type: ParameterType.Video}}, [utils.SVGContent(videoIcon)]);
}
