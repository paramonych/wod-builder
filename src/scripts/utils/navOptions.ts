import {Screen} from '../models/general';
import {VoiceCommands as cmd} from './voiceCommands';
import { textLabels } from './labels';

export const navOptions = {
    [Screen.Support]: [textLabels.nav[Screen.Support].iconsAndTerms],// 'Chat with us'],
    [Screen.Program]: Object.values(cmd[Screen.Program]),
    [Screen.Workout]: Object.values(cmd[Screen.Workout]),
    [`${Screen.Workout}Short`]: Object.values(cmd[`${Screen.Workout}Short`]),
    [Screen.Wodbook]: Object.values(cmd[Screen.Wodbook]),
    [Screen.Coach]: Object.values(cmd[Screen.Coach]),
    [Screen.Analyse]: [textLabels.nav[Screen.Analyse].track, textLabels.nav[Screen.Analyse].experimental]
};