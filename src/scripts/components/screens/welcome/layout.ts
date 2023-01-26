import xs, {Stream} from 'xstream';
import delay from 'xstream/extra/delay'
import {input, div, form, button, p} from '@cycle/dom';
import {Sources, Sinks, PrimeSpeechBanner} from '../../../models/general';
import sampleCombine from 'xstream/extra/sampleCombine';

import {svg} from '../../../utils/svg';
import {utils} from '../../../utils/utils';
import {endpoints} from '../../../utils/const';
import { textLabels } from '../../../utils/labels';
import { templates } from '../../../utils/templates/templates';
import throttle from 'xstream/extra/throttle';

export function WelcomeLayout(sources: Sources): Sinks {
    const state = sources.state.stream;

    // RECEIVE SUSSESS AUTH RESPONCE & SET COOKIE
    const httpAuthInputFlow = sources.HTTP.select('authorizeWelcome').flatten(); // pick only the latest responce
    const httpPassRestoreInputFlow = sources.HTTP.select('restore').flatten(); 
    const httpPassChangeInputFlow = sources.HTTP.select('change').flatten(); 
    const httpResovledInviteInputFlow = sources.HTTP.select('resolveInvite').flatten().filter(res => !!res.body.invite).map(res => res.body.invite); // pick only latest responce
    const httpResovledInviteRedirectAction = sources.HTTP.select('resolveInvite').flatten().filter(res => !!res.body.reload).mapTo({type: 'location', location: '/board'});//.mapTo('/');

    // 200 RESPONSES STATUSSES
    const activeSessionResponse = xs.merge(httpAuthInputFlow, httpPassChangeInputFlow).filter(res => !!res.body.session);

    const setSession = activeSessionResponse
        .map(res => ({
            category: 'setSessionWelcome',
            action: 'set',
            params: ['app', res.body.session, {expires: 365}]
        }));

    const emailSentInputFlow = httpPassRestoreInputFlow.filter(res => !!res.body.result);

    const primeSpeechResultsBanners = xs.merge(emailSentInputFlow).map(res => ({phrase: textLabels.statusses[res.body.result]}) as PrimeSpeechBanner);
    const primeSpeechResultsPhrases = xs.merge(emailSentInputFlow).map(res => textLabels.statusses[res.body.result]);

    // 500, 501, 400 etc. RESPONSES STATUSSES
    const primeSpeechErrorsBanners = xs.merge(httpAuthInputFlow, httpPassRestoreInputFlow, httpPassChangeInputFlow).filter(res => res.error != void 0).map(res => ({phrase: textLabels.statusses[res.body.error]}) as PrimeSpeechBanner);
    const primeSpeechErrorsPhrases = xs.merge(httpAuthInputFlow, httpPassRestoreInputFlow, httpPassChangeInputFlow).filter(res => res.error != void 0).map(res => textLabels.statusses[res.body.error]);

    // HTTP INPUTS
    const authorizeRedirect = activeSessionResponse.mapTo({type: 'location', location: '/board'});//.mapTo('/');
    const expiredLinkRedirect = httpPassChangeInputFlow.filter(res => res && res.body && res.body.error == 'expired').compose(delay(1600)).mapTo({type: 'reload'});//.mapTo('/welcome');
    
    ////////////////////////////

    const loginTabClick = sources.DOM.select('#login-tab').events('click').mapTo('login');
    const signupTabClick = sources.DOM.select('#signup-tab').events('click').mapTo('signup').startWith('login');
    const navBackClick = sources.DOM.select('.navback').events('click').mapTo({type: 'location', location: '/board'});//.mapTo('/');
    const forgotPasswordClick = sources.DOM.select('.forgot').events('click');
    
    //1) PROCESS LOGIN OR SIGNUP SUBMIT
    const email = sources.DOM.select('#email').events('input').map(e => e.target.value).startWith(''); // might be useful to put the email value to the state and restore it
    const pwd = sources.DOM.select('#pwd').events('input').map(e => e.target.value).startWith('');
    const repwd = sources.DOM.select('#repwd').events('input').map(e => e.target.value).startWith('');
    
    const loginFormSubmits = sources.DOM.select('form.login-form').events('submit', {preventDefault: true}).map(e => e.target);
    const restoreFormSubmits = sources.DOM.select('form.restore-form').events('submit', {preventDefault: true}).map(e => e.target);
    const loadedSubmits = loginFormSubmits.compose(sampleCombine(state, email, pwd, repwd)).filter(([e, state, email, pwd, repwd]) => (!!email || !!state.invite && !!state.invite.email) && !!pwd && !state.loading);
    const loadedPassRestoreAction = forgotPasswordClick.compose(sampleCombine(email)).map(([_, email]) => email);
    
    const emptyRestore = loadedPassRestoreAction.filter(email => !email).mapTo(textLabels.alerts.emptyEmail);
    const emptyChangePassword = restoreFormSubmits.compose(sampleCombine(pwd, repwd)).filter(([e, pwd, repwd]) => !pwd).mapTo(textLabels.alerts.emptyNewPwd);
    const noMatchChangePassword = restoreFormSubmits.compose(sampleCombine(pwd, repwd)).filter(([e, pwd, repwd]) => !!pwd && pwd != repwd).mapTo(textLabels.alerts.matchPwd);
    const emptyEmail = loginFormSubmits.compose(sampleCombine(email, pwd, repwd, state)).filter(([e, email, pwd, repwd, state]) => !email && !state.invite).mapTo(textLabels.alerts.emptyEmail);
    const emptyLoginPassword = loginFormSubmits.compose(sampleCombine(email, pwd, repwd)).filter(([e, email, pwd, repwd]) => !!email && !pwd).mapTo(textLabels.alerts.emptyPwd);
    
    const validationWarnings = xs.merge(emptyEmail, emptyRestore, emptyLoginPassword, emptyChangePassword, noMatchChangePassword);
    const loadedPassResoreRequest = loadedPassRestoreAction.filter(email => !!email);
    const loadedPassChangeRequest = restoreFormSubmits.compose(sampleCombine(state, pwd, repwd)).filter(([e, state, pwd, repwd]) => state.external && !!state.external.restore && !!pwd && !!repwd && pwd == repwd);

    const banners = xs.merge(primeSpeechErrorsBanners, primeSpeechResultsBanners, validationWarnings.map(text => ({phrase: text}) as PrimeSpeechBanner));

    const inviteToken = state.filter(state => state.external && state.external.invite).map(state => state.external.invite);

    // REDUCERS ///////////////////////////////////////////////////////
    const loadingStatusOnReducer = xs.merge(loadedSubmits, loadedPassRestoreAction, loadedPassChangeRequest).map(_ => {
        return (prevState?) => {
            return {...prevState, loading: true, banner: void 0};
        }
    });
    const inviteReducer = inviteToken.map(_ => {
        return (prevState?) => {
            return {...prevState, tab: 'signup', loading: true, external: void 0};
        }
    });
    const resolvedInviteReducer = httpResovledInviteInputFlow.map(invite => {
        return (prevState?) => {
            return {...prevState, invite: invite, loading: false};
        }
    });
    const loadingStatusOffReducer = xs.merge(httpAuthInputFlow, httpPassRestoreInputFlow, httpPassChangeInputFlow, validationWarnings).map(_ => {
        return (prevState?) => {
            return {...prevState, loading: false};
        }
    });
    const tabActivatedReducer = xs.merge(loginTabClick, signupTabClick).map(newTab => {
        return (prevState?) => {
            return {...prevState, tab: newTab, banner: void 0};
        }
    });

    const bannersReducer = banners.map(newBanner => {
        return (prevState?) => {
            return {...prevState, banner: newBanner};
        }
    });

    //2) HTTP request
    const httpAuthFlow = loadedSubmits
        .map(([e, state, email, pwd, repwd]) => {
            return {
                url: state && state.tab ? endpoints[state.tab] : endpoints.login,
                category: 'authorizeWelcome',
                method: 'POST',
                send: {email: email || state.invite && state.invite.email, pwd: pwd, repwd: repwd, token: state.invite && state.invite.token}
            };
        });

    const httpPassRestoreFlow = loadedPassResoreRequest
        .map(email => {
            return {
                url: endpoints.restore,
                category: 'restore',
                method: 'POST',
                send: {to: email, subject: textLabels.templates.restoreSubject, html: templates.getPassRestoreEmailTemplate()}
            };
        });

    const httpPassChangeFlow = loadedPassChangeRequest
        .map(([e, state, pwd, repwd]) => {
            return {
                url: endpoints.change,
                category: 'change',
                method: 'POST',
                send: {pwd: pwd, token: state.external.restore}
            };
        });

    const httpInviteResolveFlow = inviteToken
        .compose(throttle(1500))
        .map(token => {
            return {
                url: `${endpoints.invite}/${token}`,
                category: 'resolveInvite',
                method: 'POST'
            };
        });

    return {
        DOM: view(state),
        cookie: setSession,
        state: xs.merge(
            inviteReducer, loadingStatusOnReducer, loadingStatusOffReducer, tabActivatedReducer, bannersReducer,
            resolvedInviteReducer
        ),
        HTTP: xs.merge(httpAuthFlow, httpPassRestoreFlow, httpPassChangeFlow, httpInviteResolveFlow), 
        history: xs.empty(),
        credsWrite: activeSessionResponse.map(res => res.body),
        SpeechFlow: xs.merge(primeSpeechErrorsPhrases, primeSpeechResultsPhrases, validationWarnings),
        hardReload: xs.merge(authorizeRedirect, navBackClick, httpResovledInviteRedirectAction, expiredLinkRedirect),
    };
}

function view(state: Stream<any>) {
    const dom = state.map((state) => {
        let phrase = state.banner && (state.banner as PrimeSpeechBanner).phrase || void 0;
        let tabName = state.tab || 'login';
        let loading = !!state.loading;
    
        const signupAllowed = true;
        const signup = (tabName == 'signup');
        const restore = state.external && !!state.external.restore;

        return div('#sreen.welcome', [
            div('.welcome-layer.layer', [
                div('.welcome-logo')
            ]),
            div(`.login-layer.layer`, [
                div('.icon.navback', utils.SVGContent(svg.back)),
                div('.welcome-logo'), 
                form(`${!restore ? '.login-form' : '.restore-form'}`, [
                    div('.labels', !restore 
                    ? [
                        div(`#login-tab.login${!signup?'.active':''}`, [p(textLabels.menu.login)]),
                        div('.separator'),
                        div(`#signup-tab.signup${signup?'.active':''}`, [p(textLabels.menu.signup)])
                    ]
                    : div('.restore.active', [p(textLabels.menu.restore)])),
                    signupAllowed || !signup ? div('.inputs', [
                        !restore ? input(`#email.email.c${utils.random()}`, {attrs: {value: !!state && state.invite ? state.invite.email : void 0, disabled: !!state && state.invite ? 'disabled' : void 0, name:'email', type:'email', autocomplete:'username email', placeholder: 'E-mail'}}) : void 0,
                        input(`#pwd.password.c${utils.random()}`, {attrs: {value: void 0, name:'password', type:'password', autocomplete:`${signup || restore?'new':'current'}-password`, placeholder: restore? textLabels.menu.newPassword : textLabels.menu.password, minlength: '6'}}),
                        (tabName=='signup' || restore ? input('#repwd.password', {attrs: {value: void 0, name:'password-confirm', type:'password', autocomplete:`${signup || restore?'new':'current'}-password`, placeholder: textLabels.menu.confirmPassword, minlength: '6'}}) : '')
                    ]) : void 0,
                    signupAllowed || !signup 
                        ? (loading 
                            ? div('#loginLoading', textLabels.menu.loading) 
                            : (!restore 
                                ? button(`#${tabName}Submit`, textLabels.menu[tabName]) 
                                : button(`#restoreSubmit`, textLabels.menu.reset) )
                            ) 
                        : div(`#needInvite`, textLabels.menu.invite),
                    !signup && !restore ? div('.forgot', !loading ? textLabels.blank.forgot : '') : void 0
                ])
            ]),
            (phrase ? div(`#speechBox.two.dec${utils.random()}`, div('#speechBoxText', div('.spacer', phrase))) : '')
        ]);
    });

    return dom;
}
