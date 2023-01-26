import xs from 'xstream';
import {div, button, textarea} from '@cycle/dom';
import isolate from '@cycle/isolate';
import {Sources, Sinks, Screen} from '../../../models/general';

import {utils} from '../../../utils/utils';
import {HeaderLayout} from '../../generic/header';
import {endpoints, forTextareas} from '../../../utils/const';
import {CoachCommands, VoiceCommands as commands} from '../../../utils/voiceCommands';
import sampleCombine from 'xstream/extra/sampleCombine';
import { textLabels } from '../../../utils/labels';
import { svg } from '../../../utils/svg';
import { ComponentNavigation } from '../../generic/componentNavigation';
import throttle from 'xstream/extra/throttle';
import { navOptions } from '../../../utils/navOptions';

const childOptions = {type: Screen.Coach};

export function CoachLayout(sources: Sources): Sinks {
    const state = sources.state.stream;

    const header = isolate(HeaderLayout, 'header')({...sources}, childOptions); 
    const componentNavigation = isolate(ComponentNavigation, 'nav')({...sources}, childOptions);

    // HTTP INPUTS ///////////////////////////////////////////

    const tabIndex = state.filter(state => state.external && state.external.tabIndex).map(state => +state.external.tabIndex).compose(throttle(10)).startWith(null);

    const programsListingResponse = sources.HTTP.select('listPrograms').flatten().filter(res => !!res.body.programs).map(res => res.body.programs); 
    const programsListingRedirectAction = sources.HTTP.select('listPrograms').flatten().filter(res => !!res.body.reload).mapTo({type: 'location', location: '/board'});//.mapTo('/');

    const productsListingResponse = sources.HTTP.select('listProducts').flatten().filter(res => !!res.body.products).map(res => res.body.products); 
    
    const newProductRedirect = sources.HTTP.select('newProduct').flatten().filter(res => !!res.body.pathname).map(res => `/coach/z/${res.body.pathname}`);

    const programRemoveResponse = sources.HTTP.select('removeProgram').flatten().filter(res => res.body.status && res.body.status == 'success'); 
    const productRemoveResponse = sources.HTTP.select('removeProduct').flatten().filter(res => res.body.status && res.body.status == 'success'); 

    const listingRedirectAction = xs.merge(programsListingRedirectAction).compose(throttle(1000));

    const removeSession = listingRedirectAction.map(_ => ({ 
        category: 'removeSession',
        action: 'remove',
        params: ['app', null, {expires: -1}]
    }));

    const workoutRedirectAction = sources.DOM.select(".programsList .title:not(.confirmed)").events("click").map(e => `/workout/z/${e.ownerTarget.dataset.pathname}`);
    const productRedirectAction = sources.DOM.select(".productsList .title:not(.confirmed)").events("click").map(e => `/wodbook/z/${e.ownerTarget.dataset.pathname}`);

    const deleteCancelAction = sources.DOM.select(".delete.cancel").events("click");

    const deletePromptAction = sources.DOM.select(".delete.prompt").events("click").map(e => e.ownerTarget.dataset.pathname);

    const confirmedProgramDeleteAction = sources.DOM.select(".program-item.delete.confirmed").events("click").map(e => e.ownerTarget.dataset);
    const confirmedProductDeleteAction = sources.DOM.select(".product-item.delete.confirmed").events("click").map(e => e.ownerTarget.dataset);

    const newProductNameBlurAction = sources.DOM.select(".newProgram textarea").events("blur").map(e => e.ownerTarget);
    const newProductButtonClickAction = sources.DOM.select('#createProduct').events('click').map(e => e.ownerTarget.dataset);

    const filteringChangeAction = sources.DOM.select(".filteringOptions textarea").events("blur").map(e => e.ownerTarget.value);

    const productSubmitAction = newProductButtonClickAction.compose(sampleCombine(newProductNameBlurAction)).filter(([dataset, target]) => !!dataset.session && !!target.value); 

    const tabSwitchedAction = componentNavigation.clickCommand.mapTo(true).compose(throttle(1000)).startWith(false);

    const fromRootTrigger = state.filter(state => !!state && state.redirected).mapTo('redirected');
    
    // REDUCERS //////////////////////////////////////////////////////////////////////
    const programsListingReducer = xs.merge(programsListingResponse).map(programs => {
        return (prevState?) => {
            return {...prevState, [CoachCommands.Workouts]: programs, filter: void 0, tabChanged: void 0, loading: false, redirected: void 0,};
        }
    });

    const productsListingReducer = productsListingResponse.map(products => {
        return (prevState?) => {
            return {...prevState, [CoachCommands.Products]: products, tabChanged: void 0, loading: false, redirected: void 0,};
        }
    });

    const filteringReducer = filteringChangeAction.map(value => {
        return (prevState?) => {
            return {...prevState, filter: !!value ? value : void 0}
        }
    });

    const tabIndexReducer = tabIndex.map(index => {
        return (prevState?) => {
            return {...prevState, nav: {...prevState.nav, externalIndex: index}}
        }
    });

    const programRemoevResponseReducer = programRemoveResponse.map(programs => {
        return (prevState?) => {
            return {...prevState, [CoachCommands.Workouts]: void 0, tabChanged: void 0, loading: false, redirected: void 0,};
        }
    });

    const productRemoevResponseReducer = productRemoveResponse.map(products => {
        return (prevState?) => {
            return {...prevState, [CoachCommands.Products]: void 0, tabChanged: void 0, loading: false, redirected: void 0,};
        }
    });

    const tabSwitchedReducer = tabSwitchedAction.map(_ => {
        return (prevState?) => {
            return {...prevState, tabChanged: true, filter: void 0, product: void 0, [CoachCommands.Workouts]: void 0, [CoachCommands.Products]: void 0, redirected: void 0,};
        }
    });

    const removeNavTriggerReducer = xs.merge(fromRootTrigger, listingRedirectAction).map(_ => {
        return (prevState?) => {
            return {...prevState, nav: {...prevState.nav, externalIndex: 0}, redirected: void 0, filter: void 0, product: void 0, [CoachCommands.Workouts]: void 0, [CoachCommands.Products]: void 0};
        }
    });

    const deletePromptReducer = deletePromptAction.map(path => {
        return (prevState?) => {
            return {...prevState, prompted: path};
        }
    });

    const deleteCancelReducer = deleteCancelAction.map(path => {
        return (prevState?) => {
            return {...prevState, prompted: void 0};
        }
    });

    // MAKE HTTP REQUESTS //////////////////////////////////////////////////////////////
    const listPrograms = state
        .filter(state => !!state.header && !!state.header.session && !state.loading) // user session required
        .filter(state => state.tabChanged || state[CoachCommands.Workouts] == void 0) // triggering conditions
        .filter(state => state.external && state.external.tabIndex && navOptions[childOptions.type][state.external.tabIndex-1] == CoachCommands.Workouts ) // checking active tab
        .compose(throttle(3000))
        .compose(sampleCombine(tabSwitchedAction))
        .map(([state, _]) => {
            return {
                url: endpoints.listPrograms,
                category: 'listPrograms',
                method: 'POST',
                send: {
                    session: state.header.session
                }
            };
        });

    const listProducts = state
        .filter(state => !!state.header && !!state.header.session && !state.loading) // user session required
        .filter(state => state.tabChanged || state[CoachCommands.Products] == void 0) // triggering conditions
        .filter(state => !state.external || !state.external.tabIndex || state.external && state.external.tabIndex && (navOptions[childOptions.type][state.external.tabIndex-1] == CoachCommands.Products) ) // checking active tab
        .compose(throttle(3000))
        .compose(sampleCombine(tabSwitchedAction))
        .map(([state, _]) => {
            return {
                url: endpoints.listProducts,
                category: 'listProducts',
                method: 'POST',
                send: {
                    session: state.header.session
                }
            };
        });

    const createProduct = productSubmitAction.map(([dataset, target]) => {
        return {
            url: endpoints.product,
            category: 'newProduct',
            method: 'POST',
            send: { // name, token(optional), session, workouts(optional)
                name: target.value,
                session: dataset.session
            }
        };
    });

    const removeWorkout = confirmedProgramDeleteAction.map(dataset => {
        return {
            url: `${endpoints.program}/${dataset.pathname}`,
            category: 'removeProgram',
            method: 'DELETE',
            send: { 
                session: dataset.session
            }
        };
    });
    
    const removeProduct = confirmedProductDeleteAction.map(dataset => {
        return {
            url: `${endpoints.product}/${dataset.pathname}`,
            category: 'removeProduct',
            method: 'DELETE',
            send: { 
                session: dataset.session
            }
        };
    });

    const loadinOnReducer = xs.merge(listPrograms, listProducts, createProduct).map(_ => {
        return (prevState?) => {
            return {...prevState, loading: true};
        }
    });

    const loadingOffReducer = newProductRedirect.map(_ => {
        return (prevState?) => {
            return {...prevState, loading: false, filter: void 0 };
        }
    });

    return {
        DOM: view(xs.combine(state, header.DOM, componentNavigation.DOM)),
        state: xs.merge(header.state, tabIndexReducer, tabSwitchedReducer, removeNavTriggerReducer, 
            programsListingReducer, productsListingReducer, deletePromptReducer, 
            deleteCancelReducer, loadinOnReducer, loadingOffReducer, programRemoevResponseReducer, 
            productRemoevResponseReducer, filteringReducer
        ),
        HTTP: xs.merge(listPrograms, listProducts, createProduct, removeWorkout, removeProduct),
        history: xs.merge(componentNavigation.history, workoutRedirectAction, productRedirectAction, newProductRedirect),
        cookie: xs.merge(header.cookie, removeSession),
        fullscreen: header.fullscreen,
        hardReload: xs.merge(listingRedirectAction),
    };
}

function view(input) {
    return input.map(([state, header, navigation]) => {
        const loading = state.loading;

        const body = div('.body', loading 
            ? utils.buildSpinner()
            : outOfTabName(state, loading) 
        );

        return div('.wrap', [header, navigation, body])
    });
}

function outOfTabName(state, loading) {
    const tabName = state.external && state.external.tabIndex && navOptions[childOptions.type][state.external.tabIndex-1] || CoachCommands.Products;
    
    switch(tabName) {
        case CoachCommands.Workouts:
            return state[tabName] ? workoutsList(state[tabName], state.prompted, state.header.session, state.filter) : void 0;
        case CoachCommands.Products:
            return state[tabName] ? productsList(state[tabName], state.prompted, state.header.session, state.filter) : void 0;
        case CoachCommands.CreateProduct:
            return newProduct(state.header.session, loading);            
    }
}

function workoutsList(collection, promptedItem, userSessionToken, filter) {
    return [ 
        div('.filteringOptions.editable', [
            textarea(`.name${true?'.active':''}`, {attrs: {
                maxlength: forTextareas.maxTitleLength, 
                placeholder: textLabels.blank.filter,
                rows: 1
            }}),
            div('.icon.apply', utils.SVGContent(svg.check))
        ]),
        div('.programsList', 
        collection && collection.length > 0 
        ? collection
            .filter(item => !!filter ? ~item.name.indexOf(filter) : item)
            .map(item => div('.programItem', [
            div(`.title${promptedItem == item.path ? '.confirmed':''}`, {dataset: {pathname: item.path}}, item.name),
            div('.actions', 
                promptedItem == item.path 
                ? [
                    div('.program-item.delete.confirmed', {dataset: {pathname: item.path, session: userSessionToken}}, textLabels.action.delete),
                    div('.program-item.delete.cancel', textLabels.action.hide)
                ]
                : [div('.program-item.delete.prompt', {dataset: {pathname: item.path}}, utils.SVGContent(svg.cross))]
            )
        ]))
        : [div('.placeholder', textLabels.labels.empty)] 
    )];
}

function productsList(collection, promptedItem, userSessionToken, filter) {
    return div('.productsList', 
        collection && collection.length > 0 
        ? collection
            .filter(item => !!filter ? ~item.name.indexOf(filter) : item)
            .map(item => div('.productItem', [
            div(`.title${promptedItem == item.path ? '.confirmed':''}`, {dataset: {pathname: item.path}}, item.name),
            div('.actions', 
                promptedItem == item.path 
                ? [
                    div('.product-item.delete.confirmed', {dataset: {pathname: item.path, session: userSessionToken}}, textLabels.action.delete),
                    div('.product-item.delete.cancel', textLabels.action.hide)
                ]
                : [div('.product-item.delete.prompt', {dataset: {pathname: item.path}}, utils.SVGContent(svg.cross))]
            )
        ]))
        : [div('.placeholder', textLabels.labels.empty)] 
    );
}

function newProduct(userSessionToken, loading) {
    return div('.newProgram', [
        textarea(`.name${true?'.active':''}`, {attrs: {
            maxlength: forTextareas.maxTitleLength, 
            placeholder: textLabels.blank.productTitle,
            rows: 1
        }}),
        loading 
        ? utils.buildSpinner()//div('#createLoading', textLabels.menu.loading) 
        : button(`#createProduct`, {dataset: {session: userSessionToken}}, textLabels.buttons.create) 
                               
    ]);
}