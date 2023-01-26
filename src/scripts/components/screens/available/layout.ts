import xs from 'xstream';
import {div, canvas} from '@cycle/dom';
import isolate from '@cycle/isolate';
import {Sources, Sinks, Screen} from '../../../models/general';
import {HeaderLayout} from '../../generic/header';
import {textLabels} from '../../../utils/labels';
import {endpoints} from '../../../utils/const';
import throttle from 'xstream/extra/throttle';
import { utils } from '../../../utils/utils';
import { svg } from '../../../utils/svg';
import sampleCombine from 'xstream/extra/sampleCombine';

const childOptions = {type: Screen.Available};

export function AvailableLayout(sources: Sources): Sinks {

    const state = sources.state.stream;

    const header = isolate(HeaderLayout, 'header')({...sources}, childOptions);

    // HTTP RESPONCES ///////////////////////////////////////////
    const resolvedProductResponse = sources.HTTP.select('getAvailableProduct').flatten().filter(res => !!res.body).map(res => res.body);

    const availableProductsListingResponse = sources.HTTP.select('listAvailableProducts').flatten().filter(res => !!res.body.available).map(res => res.body.available); 
    const availableProductsRedirectAction = sources.HTTP.select('listAvailableProducts').flatten().filter(res => !!res.body.reload).mapTo({type: 'location', location: '/board'});//.mapTo('/');

    const historyOutput = sources.scanQR.map(workoutURL => utils.extractPathname(workoutURL));

    // DOM EVENTS ///////////////////////////////////////////////
    const programClickTrigger = sources.DOM.select('.productItem .title').events('click').map(e => e.ownerTarget.dataset);
    const workoutClickTrigger = sources.DOM.select('.workoutItem .title').events('click').map(e => `/workout/z/${e.ownerTarget.dataset.path}`);
    
    const fromRootTrigger = state.filter(state => !!state && state.redirected).mapTo('redirected');

    const qrCodeScanAction = sources.DOM.select('#scaner').events('click').mapTo(true);

    // STATE EVENTS /////////////////////////////////////////////
    const productToken = state.filter(state => state.external && state.external.token && !state.receivedToken).map(state => state.external.token).compose(throttle(30000)).startWith(null);
 
    // REDUCERS /////////////////////////////////////////////////
    const availableProductsListingReducer = availableProductsListingResponse.map(available => {
        return (prevState?) => {
            return {...prevState, available: available, loading: false};
        }
    });

    const receivedTokenReducer = productToken.filter(token => token != null).map(receivedToken => {
        return (prevState?) => {
            return {...prevState, receivedToken: receivedToken, loading: false};
        }
    });

    const resolvedProductReducer = resolvedProductResponse.map(product => {
        return (prevState?) => {
            return {...prevState, external: {...prevState.external, token: void 0}, product: product, available: void 0, loading: false};
        }
    });
  
    // HTTP REQUESTS ////////////////////////////////////////////
    const productByTokenRequest = programClickTrigger 
        .compose(sampleCombine(state.filter(state => !!state && !!state.header && !!state.header.session && !state.loading && !state.product)))
        .compose(throttle(5000))
        .map(([product, state]) => {
            return {
                url: `${endpoints.product}/${product.pathname}`,
                category: 'getAvailableProduct',
                method: 'POST',
                send: {
                    session: state.header.session
                }
            };
        });

    const listAvailableProducts = fromRootTrigger
        .compose(sampleCombine(state.filter(state => !!state && !!state.header && !!state.header.session && !state.loading)))
        .compose(throttle(5000))
        .map(([_, state]) => {
            return {
                url: endpoints.listAvailableProducts,
                category: 'listAvailableProducts',
                method: 'POST',
                send: {
                    session: state.header.session
                }
            };
        });

    const fromRootReducer = listAvailableProducts.map(_ => {
        return (prevState?) => {
            return {...prevState, nav: {...prevState.nav, index: 0}, redirected: void 0};
        }
    });

    const loadingOnReducer = xs.merge(productByTokenRequest, listAvailableProducts).map(_ => {
        return (prevState?) => {
            return {...prevState, loading: true};
        }
    });

    return {
        DOM: view(xs.combine(state, header.DOM)),
        state: xs.merge(
            header.state, loadingOnReducer, receivedTokenReducer, 
            resolvedProductReducer, availableProductsListingReducer, fromRootReducer
        ),
        HTTP: xs.merge(productByTokenRequest, listAvailableProducts),
        SpeechFlow: xs.empty(),
        history: xs.merge(historyOutput, workoutClickTrigger),
        cookie: xs.merge(header.cookie),
        scanQR: qrCodeScanAction,
        fullscreen: header.fullscreen,
        hardReload: xs.merge(availableProductsRedirectAction),
    };
}

function view(input) {
    return input.map(([state, header]) => {

        const loading = state.loading;

        const body = div(`.body${loading?'.coming-soon':''}`, loading 
            ? utils.buildSpinner()
            : outOfTabName(state)
        );

        return div('.wrap', [header, body])
    });
}

function outOfTabName(state) {

    if(state && state.available) {
        return availableProductsList(state.available, state.prompted, state.header.session);
    } else if(state && state.product) {
        return workoutsList(state.product);
    } else {
        return  div('.coming-soon', [ 
            div('#scaner.prime'),
            canvas('#canvas', {attrs: {hidden: 'hidden'}}),
            div('#scan-label', textLabels.screenDeafult.workout)
        ]);
    }
}

function workoutsList(data) {
    const workoutsKeys = Object.keys(data.product.workouts);
    return div('.workoutsList', 
        workoutsKeys.map((key, index) => div('.workoutItem', [div('.title', {dataset: {path: data.product.workouts[key].path}}, [
            div('.index', `${index+1}.`),
            div('.name', data.product.workouts[key].name)
        ])]))
    );
}

function availableProductsList(collection, promptedItem, userSession) {
    return div('.productsList', 
        collection && collection.length > 0 
        ? collection.map(item => div('.productItem', [
            div(`.title${promptedItem == item.pathname ? '.confirmed':''}`, {dataset: {pathname: item.pathname}}, item.title),
            div('.actions', 
                promptedItem == item.pathname 
                ? [div('.product-item.details.cancel', textLabels.action.hide)]
                : [div('.product-item.details.prompt', {dataset: {pathname: item.pathname, session: userSession}}, utils.SVGContent(svg.ellipsis))]
            )
        ]))
        : [div('.placeholder', textLabels.labels.empty)] 
    );
}

