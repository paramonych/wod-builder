import {HTTPSource} from '@cycle/http';
import {TimeSource} from '@cycle/time';
import {Stream} from 'xstream';
import {VNode} from '@cycle/dom';

export interface Sources {
    DOM?: Stream<VNode>;
    cookie?: any;
    HTTP?: HTTPSource;
    Time?: TimeSource;
    history?: any;
    Mouse?: any;
    state?: any;
    SpeechSynthesis?: any;
    SpeechRecognition?: any;
    SpeechFlow?: any;
    micOn?: any;
    micOff?: any;
    clickCommand?: any;
    log?: any;
    share?: any;
    compressor?: any;
    decompressor?: any;
    QR?: any;
    scanQR?: any;
    credsWrite?: any;
    credsRead?: any;
    storageRead?: any;
    storageWrite?: any;
};

export interface Sinks {
    DOM?: Stream<VNode>;
    cookie?: any;
    HTTP?: any;
    Time?: TimeSource;
    history?: any;
    Mouse?: any;
    state?: any;
    SpeechSynthesis?: any;
    SpeechRecognition?: any;
    SpeechFlow?: any;
    micOn?: any;
    micOff?: any;
    clickCommand?: any;
    log?: any;
    share?: any;
    compressor?: any;
    decompressor?: any;
    QR?: any;
    scanQR?: any;
    wad?: any;
    credsWrite?: any;
    credsRead?: any;
    storageRead?: any;
    storageWrite?: any;
    fullscreen?: any;
    hardReload?: any;
};

export interface PrimeSpeechBanner {
    phrase?: String;
    count?: number;
    style?: String;
}

export enum Screen { 
    Account = 'account', 
    
    Welcome = 'welcome',

    Workout = 'workout', 
    Wodbook = 'wodbook',
    
    Available = 'available',
    Analyse = 'analyse',

    Coach = 'coach', 
    Program = 'program',

    Support = 'support',
    Donate = 'feedback',
}

export enum Sports {
    Crossfit = 'Crossfit',
    Weightlifting = 'Weightlifting',
    Workout = 'Street Workout',
    TrackAndField = 'Track and field'
}

export enum SportsRu {
    Crossfit = 'Crossfit',
    Weightlifting = 'Тяжелая атлетика',
    Workout = 'Street Workout',
    TrackAndField = 'Легкая атлетика'
}

export enum RestrictionType {
    ComplexType = 'ComplexType',
    GoalType = 'GoalType',
    LoadType = 'LoadType'
}

export interface WODState {
    screen: Screen;
    session: String;
    menu: boolean;
}

export interface User {
    avatar: String;
    rating: number;
    name: String;
    city: String;
}
