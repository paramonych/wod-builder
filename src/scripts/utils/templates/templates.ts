import { textLabels } from "../labels"

export const templates = {
    getPassRestoreEmailTemplate: () => {
        return `
            <!DOCTYPE html>
            <html lang="en">
                <body style="background-color: #39444d; font-family: OCSM; font-style: normal; padding: 1px;">
                    <div style="height:100%; margin:5%;">
                        <img style="width:80px;display:block;margin:auto;" src="https://wod.opencoach.tech/logo-small.56e7fab8.png"/>
                        <div style="margin-top:2rem; vertical-align:middle; font-size:1.2rem;background-color: #fff;color: #39444d;">
                            <div style="padding: 2rem;font-family:Geneva,Arial; text-align: center;">${textLabels.templates.restore}</div>
                            <div style="padding: 2rem; background-color: #f9003c; color: #fff; text-align: center;font-family:Geneva,Arial;">replace</div>
                        </div>
                        <div style="margin-top: 3rem; text-align: center;font-size: 0.75rem;color: #fff;">
                            <div style="margin:auto;font-family:Geneva,Arial;">${textLabels.templates.noreply}</div>
                            <a href="https://wod.opencoach.tech" style="font-size: 0.75rem;color: #fff; text-decoration: none;font-family:Geneva,Arial;">OpenCoach 2020</a>
                        </div>
                    </div>
                </body>
            </html>`
    },
    getNewInviteEmailTemplate: () => {
        return `
            <!DOCTYPE html>
            <html lang="en">
                <body style="background-color: #39444d; font-family: OCSM; font-style: normal; padding: 1px;">
                    <div style="height:100%; margin:5%;">
                        <img style="width:80px;display:block;margin:auto;" src="https://wod.opencoach.tech/logo-small.56e7fab8.png"/>
                        <div style="margin-top:2rem; vertical-align:middle; font-size:1.2rem;background-color: #fff;color: #39444d;">
                            <div style="padding: 2rem;font-family:Geneva,Arial; text-align: center;">${textLabels.templates.invite}</div>
                            <div style="padding: 2rem; background-color: #f9003c; color: #fff; text-align: center;font-family:Geneva,Arial;">replace</div>
                        </div>
                        <div style="margin-top: 3rem; text-align: center;font-size: 0.75rem;color: #fff;">
                            <div style="margin:auto;font-family:Geneva,Arial;">${textLabels.templates.noreply}</div>
                            <a href="https://wod.opencoach.tech" style="font-size: 0.75rem;color: #fff; text-decoration: none;font-family:Geneva,Arial;">OpenCoach 2020</a>
                        </div>
                    </div>
                </body>
            </html>`
    }
}