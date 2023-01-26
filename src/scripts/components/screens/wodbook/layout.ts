import xs from 'xstream';
import {button, div, textarea, input, canvas} from '@cycle/dom';
import isolate from '@cycle/isolate';
import {Sources, Sinks, Screen} from '../../../models/general';
import {HeaderLayout} from '../../generic/header';
import {ComponentNavigation} from '../../generic/componentNavigation';
import {textLabels} from '../../../utils/labels';
import {endpoints, forTextareas} from '../../../utils/const';
import throttle from 'xstream/extra/throttle';
import sampleCombine from 'xstream/extra/sampleCombine';
import { WodbookCommands } from '../../../utils/voiceCommands';
import { utils } from '../../../utils/utils';
import { svg } from '../../../utils/svg';
import { templates } from '../../../utils/templates/templates';
import { navOptions } from '../../../utils/navOptions';

const childOptions = {type: Screen.Wodbook};

export function WodbookLayout(sources: Sources): Sinks {

    const state = sources.state.stream;

    const header = isolate(HeaderLayout, 'header')({...sources}, childOptions);
    const componentNavigation = isolate(ComponentNavigation, 'nav')({...sources}, childOptions);

    // HTTP RESPONCES ///////////////////////////////////////////
    const resolvedProductResponse = sources.HTTP.select('getProduct').flatten().filter(res => !!res.body).map(res => res.body);

    const revokedAccessResponse = sources.HTTP.select('removeAthlete').flatten().filter(res => !!res.body && !!res.body.success).mapTo({type: 'reload'});

    const programsListingResponse = sources.HTTP.select('listPrograms').flatten().filter(res => !!res.body.programs).map(res => res.body.programs); 
    const programsLoginRedirectAction = sources.HTTP.select('listPrograms').flatten().filter(res => !!res.body.reload).mapTo({type: 'location', location: '/board'});//.mapTo('/');

    const accessListingResponse = sources.HTTP.select('listUsers').flatten().filter(res => !!res.body.athletes).map(res => res.body.athletes); 
    const accessListLoginRedirectAction = sources.HTTP.select('listUsers').flatten().filter(res => !!res.body.reload).mapTo({type: 'location', location: '/board'});//.mapTo('/');

    const updateProductResponse = sources.HTTP.select('updateProduct').flatten();

    const newInviteResponse = sources.HTTP.select('newInvite').flatten().filter(res => !!res.body.success).mapTo(true); 
    const newInviteRedirectAction = sources.HTTP.select('newInvite').flatten().filter(res => !!res.body.reload).mapTo({type: 'location', location: '/board'});//.mapTo('/');


    // DOM EVENTS ///////////////////////////////////////////////
    const productSaveClickTrigger = sources.DOM.select('#saveProduct').events('click').map(e => e.ownerTarget.dataset);

    const productUpdateAction = productSaveClickTrigger.compose(sampleCombine(state)).map(([_, state]) => state);

    const nameInputTriggerAction = sources.DOM.select(".name-trigger").events("click").map(e => e.ownerTarget.dataset);
    const nameChangedAction = sources.DOM.select("textarea.name").events("blur").map(e => e.ownerTarget);

    const workoutsSelectTriggerAction = sources.DOM.select(".content-edit-trigger").events("click").map(e => e.ownerTarget.dataset);
    const workoutsListBlurAction = sources.DOM.select(".apply").events("click").map(e => e.ownerTarget);
    const workoutsListChangedAction = sources.DOM.select(".workout-option").events("click").map(e => e.ownerTarget.dataset);
    
    const actionCancelAction = sources.DOM.select(".action.cancel,.delete.cancel").events("click");
    const sortActionPromptAction = sources.DOM.select(".workout-item.action.prompt,.workout-item.delete.prompt").events("click").map(e => e.ownerTarget.dataset.path);
    const accessActionPromptAction = sources.DOM.select(".athlete-item.action.prompt,.athlete-item.delete.prompt").events("click").map(e => `${e.ownerTarget.dataset.pathname}###${e.ownerTarget.dataset.email}`);

    const confirmedAthleteDeleteAction = sources.DOM.select(".athlete-item.delete.confirmed").events("click").map(e => e.ownerTarget.dataset);

    const sortUpAction = sources.DOM.select(".action.up").events("click").map(e => ({item: e.ownerTarget.dataset, up: true}));
    const sortDownAction = sources.DOM.select(".action.down").events("click").map(e => ({item: e.ownerTarget.dataset, up: false}));

    const inviteInputBlurAction = sources.DOM.select(".newInvite input").events("blur").map(e => e.ownerTarget);
    const sendInviteButtonClickAction = sources.DOM.select('#sendInvite').events('click').map(e => e.ownerTarget.dataset);

    const inviteSubmitAction = sendInviteButtonClickAction.compose(sampleCombine(inviteInputBlurAction)).filter(([dataset, target]) => !!dataset.session && !!target.value); 

    const sortAction = xs.merge(sortUpAction, sortDownAction);

    const tabIndex = state.filter(state => state.external && state.external.tabIndex).map(state => +state.external.tabIndex).compose(throttle(10)).startWith(null);
    const tabSwitchedAction = componentNavigation.clickCommand.mapTo(true).compose(throttle(30000)).startWith(false);

    const fromRootTrigger = state.filter(state => !!state && state.redirected).mapTo('redirected');

    // STATE EVENTS /////////////////////////////////////////////
    const productToken = state.filter(state => state.external && state.external.token && !state.receivedToken).map(state => state.external.token).compose(throttle(30000)).startWith(null);
 
    // REDUCERS /////////////////////////////////////////////////

    const tabIndexReducer = tabIndex.map(index => {
        return (prevState?) => {
            return {...prevState, nav: {...prevState.nav, externalIndex: index}}
        }
    });

    const programsListingReducer = programsListingResponse.map(programs => {
        return (prevState?) => {
            return {...prevState, allWorkouts: programs, loading: false};
        }
    });

    const accessListingReducer = accessListingResponse.map(athletes => {
        return (prevState?) => {
            return {...prevState, athletes: athletes, loading: false};//, tabChanged: false};
        }
    });

    // const tabSwitchedReducer = tabSwitchedAction.map(_ => {
    //     return (prevState?) => {
    //         return {...prevState, tabChanged: true, athletes: void 0};
    //     }
    // });

    const receivedTokenReducer = productToken.filter(token => token != null).map(receivedToken => {
        return (prevState?) => {
            return {...prevState, receivedToken: receivedToken, loading: false};
        }
    });

    const showTextareaReducer = nameInputTriggerAction.map(_ => {
        return (prevState?) => {
            return {...prevState, showTextarea: true, showMultiselect: false};
        }
    });

    const showSelectReducer = workoutsSelectTriggerAction.map(_ => {
        return (prevState?) => {
            return {...prevState, showTextarea: false, showMultiselect: true};
        }
    });

    const hideEditableAreasReducer = xs.merge(workoutsListBlurAction).map(_ => {
        return (prevState?) => {
            const selection = prevState.selection;

            Object.keys(selection).sort(function order(one, two) { 
                if (selection[one].index < selection[two].index) return -1; 
                else if (selection[one].index > selection[two].index) return +1; 
                else return 0; 
            })
            .map((key, index) => {
                selection[key].index = index+1;
            })

            return {...prevState, showTextarea: false, showMultiselect: false, selection: selection};
        }
    });

    const nameChangedReducer = nameChangedAction.map(target => {
        return (prevState?) => {
            
            const updatedProduct = prevState.product;
            updatedProduct.product.name = target.value;

            return {...prevState, showTextarea: false, showMultiselect: false, product: updatedProduct};
        }
    });

    const resolvedProductReducer = resolvedProductResponse.map(product => {
        return (prevState?) => {
            return {...prevState, external: {...prevState.external, token: void 0}, product: product, selection: product.product.workouts, loading: false};
        }
    });

    const actionPromptReducer = xs.merge(sortActionPromptAction, accessActionPromptAction).map(id => {
        return (prevState?) => {
            return {...prevState, prompted: id};
        }
    });

    const actionCancelReducer = actionCancelAction.map(_ => {
        return (prevState?) => {
            return {...prevState, prompted: void 0};
        }
    });

    const workoutsListChangedReducer = workoutsListChangedAction.map(payload => {
        return (prevState?) => {
            const newSelection = prevState.selection ? prevState.selection : {};
            
            if(newSelection[payload.path]) {
                delete newSelection[payload.path];
            } else {
                newSelection[payload.path] = {index: Object.keys(newSelection).length+1, name: payload.name, path: payload.path};
            }

            return {...prevState, selection: newSelection};
        }
    });

    const sortReducer = sortAction.map(data => {
        return (prevState?) => {
            
            const selectionPathnames = Object.keys(prevState.selection);
            const updatedSelection = {};
            
            selectionPathnames.map(key => {
                const next = prevState.selection[key];
                const currentIndex = +data.item.index;
                
                if(next.index == (currentIndex + (data.up ? -1 : 1))) { //found placeholder item to be shifted
                    next.index = currentIndex;
                }
            
                if(next.path == data.item.path && (data.up && currentIndex > 1 || !data.up && currentIndex < selectionPathnames.length)) { //found item to be shifted
                    next.index = next.index + (data.up ? -1 : 1);
                }
            
                updatedSelection[key] = next;
            });

            return {...prevState, selection: updatedSelection};
        }
    });

    const fromRootReducer = fromRootTrigger.map(_ => {
        return (prevState?) => {
            return {...prevState, nav: {...prevState.nav, index: 0}, redirected: void 0};
        }
    });

  
    // HTTP REQUESTS ////////////////////////////////////////////
    const productByTokenRequest = state 
        .filter(state => (state.receivedToken && !state.product && !state.loading && !!state.header.session))
        .map(state => {
            return {
                url: `${endpoints.product}/${state.receivedToken}`,
                category: 'getProduct',
                method: 'POST',
                send: {
                    session: state.header.session
                }
            };
        });

    const productUpdateRequest = productUpdateAction 
        .filter(state => (!!state.product && !!state.header.session && !!state.selection && !state.loading))
        .map(state => {
            return {
                url: endpoints.product,
                category: 'updateProduct',
                method: 'POST',
                send: {
                    name: state.product.product.name,
                    token: state.product.product.pathname,
                    workouts: state.selection,
                    session: state.header.session
                }
            };
        });

    const listPrograms = state // do not need to trigger loadin status due to parallel asynchronous invokation
        .filter(state => (state.receivedToken && !state.allWorkouts && !!state.header && !!state.header.session))
        .compose(throttle(5000))
        .map(state => {
            return {
                url: endpoints.listPrograms,
                category: 'listPrograms',
                method: 'POST',
                send: {
                    session: state.header.session
                }
            };
        });

    const listUsers = state
        .filter(state => !!state.header && !!state.header.session && !state.loading) // user session required
        .filter(state => state.tabChanged || state.athletes == void 0) // triggering conditions
        .filter(state => false)//state.nav && state.nav.options[state.nav.index] == WodbookCommands.ManageAccess ) // checking active tab
        .compose(throttle(5000))
        .compose(sampleCombine(tabSwitchedAction))
        .map(([state, _]) => {
            return {
                url: endpoints.listAthletesWithAccess,
                category: 'listUsers',
                method: 'POST',
                send: {
                    session: state.header.session,
                    token: state.product.product.pathname,
                }
            };
        });

    const sendInvitation = inviteSubmitAction.map(([dataset, target]) => {
            return {
                url: endpoints.invite,
                category: 'newInvite',
                method: 'POST',
                send: { 
                    email: target.value,
                    session: dataset.session,
                    pathname: dataset.pathname,
                    subject: textLabels.templates.inviteSubject, 
                    html: templates.getNewInviteEmailTemplate()
                }
            };
        });

    const removeAthleteAccess = confirmedAthleteDeleteAction.map(dataset => {
            return {
                url: `${endpoints.athlete}`,
                category: 'removeAthlete',
                method: 'DELETE',
                send: { 
                    session: dataset.session,
                    email: dataset.email,
                    pathname: dataset.pathname
                }
            };
        });

    const loadingOnReducer = xs.merge(productByTokenRequest, productUpdateRequest, listUsers, sendInvitation).map(_ => {
        return (prevState?) => {
            return {...prevState, loading: true};
        }
    });

    const loadingOffReducer = xs.merge(updateProductResponse, newInviteResponse).map(_ => {
        return (prevState?) => {
            return {...prevState, loading: false};
        }
    });

    return {
        DOM: view(xs.combine(state, header.DOM, componentNavigation.DOM)),
        state: xs.merge(programsListingReducer, /*tabSwitchedReducer,*/ workoutsListChangedReducer,
            header.state, loadingOnReducer, loadingOffReducer, receivedTokenReducer, resolvedProductReducer,
            showTextareaReducer, hideEditableAreasReducer, showSelectReducer, actionPromptReducer, actionCancelReducer,
            sortReducer, nameChangedReducer, accessListingReducer, fromRootReducer, tabIndexReducer
        ),
        HTTP: xs.merge(productByTokenRequest, productUpdateRequest, 
            listPrograms, listUsers, sendInvitation, removeAthleteAccess),
        SpeechFlow: xs.merge(
            updateProductResponse.mapTo(textLabels.responses.updated),
            newInviteResponse.mapTo(textLabels.responses.inviteSent),
        ),
        history: xs.merge(componentNavigation.history.compose(sampleCombine(state)).map(([path, state]) => `${path}/z/${state.receivedToken}`)),
        cookie: xs.merge(header.cookie),
        fullscreen: header.fullscreen,
        hardReload: xs.merge(programsLoginRedirectAction, accessListLoginRedirectAction, newInviteRedirectAction, revokedAccessResponse),
    };
}

function view(input) {
    return input.map(([state, header, navigation]) => {

        const loading = state.loading;

        const body = div(`.body${loading?'.coming-soon':''}`, loading 
            ? utils.buildSpinner()
            : outOfTabName(state, loading)
        );

        const nav = state.product 
            ? (state.product.type == 'owner' ? navigation : void 0)
            : void 0;

        return div('.wrap', [header, nav, body])
    });
}


function outOfTabName(state, loading) {
    const tabName = state.external && state.external.tabIndex && navOptions[childOptions.type][state.external.tabIndex-1] || WodbookCommands.ManageProduct;
    
    if(state && !state.available && (state.product || state.athletes)) { 
        
        switch(tabName) {
            case WodbookCommands.ManageProduct:
                return state.product ? workoutsList(state) : void 0;
            case WodbookCommands.ManageAccess:
                return state.athletes ? athletesList(state.athletes, state.prompted, state.header.session) : void 0;
            case WodbookCommands.InviteUser:
                return state.product ? newAthleteAccess(state.product.product, state.header.session, loading) : void 0; 
            default:
                return div('.placeholder', textLabels.labels.reload);           
        }
    } else {
        return div('.coming-soon', [ 
            div('.label', textLabels.labels.empty)
        ]);
    }
}

function workoutsList(state) {
    const product = state.product.product;

    return [
        state.showTextarea 
            ? div('.editable', [ 
                textarea(`.name${true?'.active':''}`, {attrs: {
                    maxlength: forTextareas.maxTitleLength, 
                    placeholder: product.name && ~product.name.indexOf(textLabels.blank.productTitle) ? product.name : '',
                    rows: 2
                }}, (product.name && ~product.name.indexOf(textLabels.blank.programTitle) ?  void 0 : product.name)),
                div('.icon.apply', utils.SVGContent(svg.check))
            ])
            : div('.product-title-wrap', [
                div('.product-title', product && product.name),
                div('.icon.name-trigger', utils.SVGContent(svg.edit))
            ]),
            div('.separator')
            ,
        state.showMultiselect && state.allWorkouts
            ? div('.editable.workouts', [ 
                div('.workouts-select', 
                    state.allWorkouts.map(item => div(`.workout-option ${state.selection && state.selection[item.path] ? '.selected':''}`, {dataset: {name: item.name, path: item.path}}, item.name))
                ),
                div('.icon.apply', utils.SVGContent(svg.check))
            ])
            : 
            div('.product-workouts-header', [ 
                div('.header-label', textLabels.blank.workouts),
                div('.icon.content-edit-trigger', utils.SVGContent(svg.edit))
            ]),
        !state.showMultiselect 
            ? div('.workoutsList', 
            state.selection
                ? Object.keys(state.selection).sort(function order(one, two) { 
                    if (state.selection[one].index < state.selection[two].index) return -1; 
                    else if (state.selection[one].index > state.selection[two].index) return +1; 
                    else return 0; 
                }).map(key => state.selection[key]).map(item => div('.workoutItem', [
                    div(`.title${state.prompted == item.path ? '.confirmed':''}`, {dataset: {path: item.path}}, item.name),
                    div('.actions', 
                        state.prompted == item.path 
                        ? [
                            div('.workout-item.action.up', {dataset: {path: item.path, index: item.index}}, textLabels.action.up),
                            div('.workout-item.action.down', {dataset: {path: item.path, index: item.index}}, textLabels.action.down),
                            div('.workout-item.action.cancel', textLabels.action.hide)
                        ]
                        : [div('.workout-item.action.prompt', {dataset: {path: item.path}}, utils.SVGContent(svg.ellipsis))]
                    )
                ]))
                : [div('.placeholder', textLabels.labels.empty)],
            )
            : void 0,
            !state.showMultiselect && state.selection 
                ? state.loading 
                    ? div('#saveLoading', textLabels.menu.loading) 
                    : div('.button-wrap', [button(`#saveProduct`, {dataset: {session: state.header.session}}, textLabels.buttons.save)])
                : void 0
    ];
}

function athletesList(collection, prompted, userSessionToken) {
    return div('.athletesList', 
        collection && collection.length > 0 
        ? collection.map(item => div('.athleteItem', [
            div(`.title${prompted == `${item.pathname}###${item.email}` ? '.confirmed':''}`, {dataset: {email: item.email}}, [
                div('.email', item.email),
                div('.date', utils.formatUTCString(item.date)),
                div('.product-title', item.title)
            ]),
            div('.actions', 
                prompted == `${item.pathname}###${item.email}` 
                ? [
                    div('.athlete-item.delete.confirmed', {dataset: {email: item.email, session: userSessionToken, pathname: item.pathname}}, textLabels.action.delete),
                    div('.athlete-item.delete.cancel', textLabels.action.hide)
                ]
                : [div('.athlete-item.delete.prompt', {dataset: {email: item.email, pathname: item.pathname}}, utils.SVGContent(svg.cross))]
            )
        ]))
        : [div('.placeholder', textLabels.labels.empty)] 
    );
}

function newAthleteAccess(product, userSessionToken, loading) {
    return div('.newInvite', [
        div('.label', `${textLabels.blank.invitePlaceholder} "${product.name}"`),
        input(`.name${true?'.active':''}`, {attrs: {
            maxlength: forTextareas.maxTitleLength, 
            placeholder: 'Email',
            type: 'email'
        }}),
        loading 
        ? div('#sendLoading', textLabels.menu.loading) 
        : button(`#sendInvite`, {dataset: {session: userSessionToken, pathname: product.pathname}}, textLabels.buttons.send)                 
    ]);
}

