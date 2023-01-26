import xs from 'xstream';
import {div} from '@cycle/dom';
import {Sources, Sinks} from '../../../../models/general';
import {utils} from '../../../../utils/utils';

export function ExperimentalLayer(sources: Sources): Sinks {
    const state = sources.state.stream;

    const initReducer = xs.of((prev?) => ({test: 5, some: 5}));

    const next = sources.DOM.select("#def.json").events("click").map(_ => utils.random());

    const indexReducer = next.map(newIndex => {
        return (prevState) => ({...prevState, test: newIndex, some: utils.random()})
    });

    return {
        DOM: view(state),
        state: xs.merge(initReducer, indexReducer)
    };
}

function view(state) {
    return state.map(state => div('#def.json', JSON.stringify(state)));
}