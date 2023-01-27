import { ElementType, ParameterType } from "../models/values";

export const appDomain = 'https://wod.opencoach.tech';
const userBase = 'https://5udat88nuf.execute-api.us-east-1.amazonaws.com/dev';
const programBase = 'https://d0ifcmrw8f.execute-api.us-east-1.amazonaws.com/dev';
const productBase = 'https://g5ws73traj.execute-api.us-east-1.amazonaws.com/dev';
const feedbackBase = 'https://51e1hy90t6.execute-api.us-east-1.amazonaws.com/dev';
const athleteBase = 'https://wjtvf8bwp1.execute-api.us-east-1.amazonaws.com/dev';


export const endpoints = {
    login: `${userBase}/login`,
    alogin: `${userBase}/alogin`,
    signup: `${userBase}/signup`,
    change: `${userBase}/change`,
    restore: `${userBase}/restore`,
    logout: `${userBase}/logout`,
    shorten: `${programBase}/shorten`,
    program: `${programBase}/program`,
    listPrograms: `${programBase}/list`,
    product: `${productBase}/product`,
    listProducts: `${productBase}/list`,
    athlete: `${athleteBase}/access`,
    invite: `${athleteBase}/invite`, // email, session, pathname OR url param token
    resolveAccess: `${athleteBase}/access`, // session, pathname
    listAthletesWithAccess: `${athleteBase}/list/athletes`, // session
    listAvailableProducts: `${athleteBase}/list/products`, // session
    availableProduct: `${athleteBase}/product`, // session
    feedback: `${feedbackBase}/feedback`,
};

export const forSliders = {
    maxComboSliders: 5,
    maxOtherSliders: 2
};

export const forTextareas = {
    maxPasswordLength: '25',
    maxTitleLength: '100',
    maxInfoLength: '250',
}

export const programLimits = {
    [ElementType.Complex]: 12,
    [ElementType.Block]: 9,
    [ElementType.Movement]: 16,
    [ParameterType.Load]: 4
};
