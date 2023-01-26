import xs, {Stream} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';

export function makeCredentialsWriteDriver() {
    var processStatus = xs.create();

    function credentialsWriteDriver(sink: Stream<any>) {  
        sink.addListener({
            next: (user) => {
                // store credentials after getting the signup session token

                if(user && user.session && (window as any).PasswordCredential) {// || window.FederatedCredential) {
        
                    localStorage.setItem('user', user.session); // session key just received from server

                    try { 
                        const cred = new PasswordCredential({
                            id: user.email,
                            password: user.password
                        })

                        navigator.credentials.store(cred)
                        .then(_ => {
                            processStatus.shamefullySendNext('stored');
                        })
                        .catch(err => {
                            processStatus.shamefullySendNext(JSON.stringify(err));
                        });
                    } catch(e) {
                        processStatus.shamefullySendNext(JSON.stringify(e));
                    }
                } else if(user == 'logout') {
                    localStorage.removeItem('user');

                    if(navigator.credentials && navigator.credentials.preventSilentAccess) {
                        navigator.credentials.preventSilentAccess();
                    }
                }
            }
        }); 

        const source = xs.create({
            start: listener => {
                processStatus.addListener({
                    next: (type: any) => {
                        listener.next(type);
                    }
                }); 
                
            },
            stop: () => {},
          });
        
        return adapt(source);
    }
  
    return credentialsWriteDriver;
}