import xs, {Stream} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';

export function makeCredentialsReadDriver() {
    var storedCreds = xs.create();

    function credentialsReadDriver(sink: Stream<any>) {  
        sink.addListener({
            next: (sessionValue) => {
                if(window.PasswordCredential) {// || window.FederatedCredential) {
                    // Call navigator.credentials.get() to retrieve stored PasswordCredentials or FederatedCredentials.
                    navigator.credentials.get({
                        password: true,
                        mediation: 'optional'
                    }).then(passwordCred => {
                        if(passwordCred) {
                            // passwordCred.password - raw password
                            if(passwordCred.type == 'password') {
                                storedCreds.shamefullySendNext({user: {id: passwordCred.id, pwd: passwordCred.password}});
                            }
                        } else {
                            storedCreds.shamefullySendNext({});
                        }
                    }).catch(error => {
                        storedCreds.shamefullySendNext({});
                    });
                }
            }
        }); 

        const source = xs.create({
            start: listener => {
                storedCreds.addListener({
                    next: (creds: any) => {
                        listener.next(creds);
                    }
                }); 
                
            },
            stop: () => {},
          });
        
        return adapt(source);
    }
  
    return credentialsReadDriver;
}