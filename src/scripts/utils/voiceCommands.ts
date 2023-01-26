import {Screen} from '../models/general';

export enum ProgramCommands {
   // NewProgram = 'blank program',
    GetQRCode = 'share program',
    Clear = 'remove draft'
}
export enum ProgramCommandsInfo {
   // NewProgram = 'creates a blank program of multiple workouts',
    GetQRCode = 'creates an acces to your program by the link',
    Clear = 'removes draft'
}

export enum WorkoutCommands {
    //PinWorkout = 'save workout',
    GetQRCode = 'share program',
    Edit = 'edit program',
    ShareResults = 'share results'
}
export enum WorkoutCommandsInfo {
    //PinWorkout = 'save workout info',
    GetQRCode = 'creates an acces to your program by the link',
    Edit = 'edit an existing program',
    ShareResults = 'share results info'
}

export enum WorkoutShortCommands {
    //PinWorkout = 'save workout',
    GetQRCode = 'share program',
    ShareResults = 'share results'
}
export enum WorkoutShortCommandsInfo {
    //PinWorkout = 'save workout info',
    GetQRCode = 'creates an acces to your program by the link',
    ShareResults = 'share results info'
}

export enum CoachCommands {
    Products = 'products',
    Workouts = 'programs',
    CreateProduct = 'create product',
}
export enum CoachCommandsInfo {
    Products = 'products list',
    Workouts = 'programs list',
    CreateProduct = 'group selected programs into the product',
}

export enum WodbookCommands {
    ManageProduct = 'save changes',
    InviteUser = 'invite user',
    ManageAccess = 'manage access',   
}
export enum WodbookCommandsInfo {
    ManageProduct = 'save product changes: title, workouts',
    InviteUser = 'invite user: give access and send the link',
    ManageAccess = 'manage access: revoke eccess to this product',
}


export const VoiceCommands = {
    [Screen.Program]: ProgramCommands,
    [Screen.Workout]: WorkoutCommands,
    [`${Screen.Workout}Short`]: WorkoutShortCommands,
    [Screen.Wodbook]: WodbookCommands,
    [Screen.Coach]: CoachCommands,
}

export const VoiceCommandsInfo = {
    [Screen.Program]: ProgramCommandsInfo,
    [Screen.Workout]: WorkoutCommandsInfo,
    [`${Screen.Workout}Short`]: WorkoutShortCommandsInfo,
    [Screen.Wodbook]: WodbookCommandsInfo,
    [Screen.Coach]: CoachCommandsInfo
}


