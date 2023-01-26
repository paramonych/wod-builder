import {defaults} from '../utils/utils';
import {Screen} from '../models/general';
import { textLabels } from '../utils/labels';

const screenNames = Object.keys(Screen).map(key => Screen[key]);

export function outOfUrlLocationContext(url, prevState): Object { // redirects by url paths
    const destination: String[] = screenNames.filter(name => ~url.pathname.indexOf(name));
    
    if(destination.length > 0) {
        const subParts = url.pathname.split('/');
        const indexParts = url.pathname.split('/n/'); // /workout/n/2 - index must be > 0
        const tokenParts = url.pathname.split('/z/'); // /workout/z/13bd24199f3f5fe019adc17328c55b19 - id of the stored shortened program
        const restoreParts = url.pathname.split('/r/');
        const inviteParts = url.pathname.split('/i/'); // /welcome/r/41c5b3f01b88-11eb-9c50-55f08b030513 - password restore token

        const item = {
            tabIndex: indexParts.length > 1 ? (~indexParts[1].indexOf('/z/') ? indexParts[1].split('/z/')[0] : indexParts[1]) : void 0,
            token: tokenParts.length > 1 && destination[0] == Screen.Wodbook ? tokenParts[1] : void 0,
            editToken: tokenParts.length > 1 && destination[0] == Screen.Program ? tokenParts[1] : void 0, // key to the short living object containing the action payload
            displayToken: tokenParts.length > 1 && destination[0] == Screen.Workout ? tokenParts[1] : void 0, // key to the short living object containing the action payload
            restore: restoreParts.length > 1 ? restoreParts[1] : void 0,
            invite: inviteParts.length > 1 ? inviteParts[1] : void 0
        };

        const res =  {
            ...prevState,
            screen: destination[0], 
            menu: false, 
            external: item,
            // need to have this thing here ...prevState[destination[0]] to prevent fetched data loss after switching the screens
            [destination[0]]: {...prevState[destination[0]], ...defaults.hideMenu2, redirected: true, external: subParts.length == 3 ? {subpath: subParts[2]} : item}
        };

        return res;

    } else {
        const def = Screen.Workout;
        return {screen: [def], [def]: {header: {menu: true}}};
    } 
}