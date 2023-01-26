import xs, {Stream} from 'xstream';
import {input, div, button, p} from '@cycle/dom';
import isolate from '@cycle/isolate';
import {Sources, Sinks, Screen} from '../../../models/general';
import {HeaderLayout} from '../../generic/header';
import {ComponentNavigation} from '../../generic/componentNavigation';
import {ExperimentalLayer} from './layers/experimental';
import {utils} from '../../../utils/utils';

const childOptions = {type: Screen.Analyse};

export function AnalyseLayout(sources: Sources): Sinks {
    const state = sources.state.stream;

    const header = isolate(HeaderLayout, 'header')({...sources}, childOptions);
    const componentNavigation = isolate(ComponentNavigation, 'nav')({...sources}, childOptions);

    const exp = isolate(ExperimentalLayer, {'*': 'exp', state: {
        get: state => ({test: state.test, some: state.some}), //the is no childe state fields except that we are passing here
        set: (state, childState) => ({...state, test: childState.test, some: childState.some}) // updating only single attribute with new value from child component
    }})({...sources});

    return {
        DOM: view(xs.combine(state, header.DOM, componentNavigation.DOM, exp.DOM)),
        state: xs.merge(header.state, exp.state),
        history: xs.empty()
    };
}

function view(input) {
    return input.map(([state, header, navigation, exp]) => {
        const body = div('.body.coming-soon', exp  
        ? div('.some', [exp, div('.json', JSON.stringify(state))]) 
        : [ 
            div('.prime'),
            div('CHARTS AND PROGRESS ANALYSIS TOOLS'),
        ]);

        return div('.wrap', [header, navigation, body])
    });
}