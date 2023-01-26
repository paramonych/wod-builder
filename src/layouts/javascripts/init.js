var DOM = {};

(function() {
    if ($ && moment) {
        $(document).ready(init);
    }
})();

function init() {
    getDOMHandlers();
    initDayPickAction();
    initLabels();
}

function getDOMHandlers() {
    DOM.yearSlider = $('div.year');
    DOM.monthSlider = $('div.month');
    DOM.dateSlider = $('div.date');

    DOM.daysLabels = $('div.labels');

    DOM.daysContainer = $('div.days');
    DOM.days = $('div.days label.day');

    DOM.hoursContainer = $('div.hours');
    DOM.hours = $('div.hours label.hour');

    DOM.yearLabel = $('#calendarContainer-year');
    DOM.monthLabel = $('#calendarContainer-month');
}

function initDayPickAction() {

    DOM.days
        .off('click')
        .on('click', function(e) {
            DOM.daysContainer.hide();
            DOM.daysLabels.hide();

            DOM.hoursContainer.show();
            DOM.dateSlider.show();
        });

    DOM.monthLabel
        .off('click')
        .on('click', function() {
            DOM.daysContainer.show();
            DOM.daysLabels.show();

            DOM.hoursContainer.hide();
            DOM.dateSlider.hide();
        });
}

function initLabels() {
    DOM.yearLabel.html(moment().year());
    DOM.monthLabel.html(moment().format('MMMM'));
}