// Shorthand for $( document ).ready()
$(function () {
    // let's get started

    var width = 800;
    var height = 200;
    var margin = {
        left: 30,
        right: 0,
        top: 20,
        bottom: 40
    };

    var svg = d3.select("#myfigure").
        append("svg").
        attr('width', width).
        attr('height', height);

    var tooltip = d3.select('body').
        append('div').
        attr('id', 'tooltip').
        style('opacity', 0);

    d3.csv("static/data/data.csv", function (e, data) {
        var dates = data.map(function (d) {
            return moment(d.Date, "M/D/YYYY");
        });

        var values = data.map(function (d) {
            return parseFloat(d.Total);
        });

        var maxWeek = d3.max(dates, function (d) { return d.week(); });

        var xScale = d3.scaleLinear().
            domain([1, maxWeek]).
            range([margin.left, width - margin.right - margin.left]).nice();

        var yScale = d3.scaleLinear().
            domain([0, 6]).
            range([height - margin.top - margin.bottom, margin.top]);

        var recth = xScale(1) - xScale(0);
        var rectw = recth;

        var max = d3.max(values);

        svg.selectAll('rect').
            data(data).
            enter().
            append('rect').
            attr('class', 'day').
            attr('width', rectw).
            attr('height', recth).
            attr('fill', 'red').
            attr('opacity', function (d, i) {
                return values[i] / max;
            }).
            attr('x', function (d, i) {
                var w = dates[i].week();

                // weeks # is cyclical, if we restart in last week of year use the last
                // week number of 2019
                if (dates[i].month() == 11 && w == 1) {
                    w = 53;
                }

                return xScale(w);
            }).
            attr('y', function (d, i) {
                var d = dates[i].day();
                var res = yScale(d);

                return res + margin.top;
            }).on('mouseover', function (d, i) {
                // move to target
                tooltip.style('left', d3.event.pageX + 10 + 'px').
                    style('top', d3.event.pageY + 10 + 'px');

                // set content
                var amount = parseFloat(d.Total)
                tooltip.html('$' + amount.toFixed(2));

                // animate opacity to show
                tooltip.transition().
                    duration(50).
                    style('opacity', 0.9);
            }).on('mouseout', function (d, i) {
                // fade out
                tooltip.transition().
                    duration(50).
                    style('opacity', 0);
            });

        var xAxis = d3.axisBottom(xScale).
            ticks(maxWeek).
            tickFormat(function (week) {
                if (week == 0) {
                    return '';
                }

                var startOfWeek = moment(week + '/2019', 'w/YYYY');
                var endOfWeek = moment(startOfWeek).add(6, 'days');

                if (!endOfWeek.isValid()) {
                    // do not display anything on right outertick
                    return '';
                }

                // add label if changing months
                if (startOfWeek.month() != endOfWeek.month()) {
                    return endOfWeek.format('MMM');
                }

                // add label if we start on the first day of the month
                if (startOfWeek.date() == 1) {
                    return endOfWeek.format('MMM');
                }

                return '';
            });

        var axis = svg.append("g").
            attr("transform", function (d) {
                return "translate(" + (rectw / 2) + "," + (height - margin.bottom + recth) + ")"
            }).
            call(xAxis).
            attr('class', 'xaxis');

        axis.selectAll('text').
            on('mouseover', function (week) {
                var month = d3.select(this).text();
                var firstOfMonth = moment(month + '/1/2019', 'MMM/D/YYYY');
                var lastOfMonth = firstOfMonth.clone().endOf('month');
                var lastWeekOfMonth = lastOfMonth.week();

                if (lastOfMonth.month() == 11 && lastOfMonth.week() == 1) {
                    lastWeekOfMonth = 53;
                }

                var points = [
                    [
                        xScale(firstOfMonth.week()) + rectw,
                        yScale(firstOfMonth.day()) + margin.top + recth,
                    ],
                    [
                        xScale(firstOfMonth.week()),
                        yScale(firstOfMonth.day()) + margin.top + recth,
                    ],
                    [
                        xScale(firstOfMonth.week()),
                        yScale(firstOfMonth.clone().add(1, 'week').endOf('week').day()) + margin.top,
                    ],
                    [
                        xScale(lastWeekOfMonth),
                        yScale(firstOfMonth.clone().add(1, 'week').endOf('week').day()) + margin.top,
                    ],
                    [
                        xScale(lastWeekOfMonth),
                        yScale(lastOfMonth.day()) + margin.top,
                    ],
                    [
                        xScale(lastWeekOfMonth) + rectw,
                        yScale(lastOfMonth.day()) + margin.top,
                    ],
                    [
                        xScale(lastWeekOfMonth) + rectw,
                        yScale(lastOfMonth.clone().startOf('week').day()) + margin.top + recth,
                    ],
                    [
                        xScale(firstOfMonth.week()) + rectw,
                        yScale(lastOfMonth.clone().startOf('week').day()) + margin.top + recth,
                    ],
                    [
                        xScale(firstOfMonth.week()) + rectw,
                        yScale(firstOfMonth.day()) + margin.top + recth,
                    ]
                ];

                var overlay = svg.selectAll('g.month-overlay').
                    data([points]).
                    enter().
                    append('g').
                    attr('class', 'month-overlay');

                var polygon = overlay.
                    append('polygon').
                    attr('fill', 'gray').
                    attr('opacity', '.2').
                    attr('points', function (d) {
                        return d.map(function (d) {
                            return d.join(',');
                        }).join(' ');
                    });

                var total = 0.0;
                for (var i = 0; i < data.length; i++) {
                    if (dates[i].month() === firstOfMonth.month()) {
                        total += values[i];
                    }
                }

                overlay.
                    append('text').
                    attr('text-anchor', 'middle').
                    attr('class', 'total').
                    attr('fill', '#444').
                    attr('alignment-baseline', 'central').
                    attr('x', function (d) { return d3.polygonCentroid(points)[0]; }).
                    attr('y', function (d) { return d3.polygonCentroid(points)[1]; }).
                    text('$' + total.toFixed(2));
            }).on('mouseout', function (d) {
                svg.selectAll('g.month-overlay').remove();
            });

        var yAxis = d3.axisLeft(yScale).
            ticks(7).
            tickFormat(function (d, i) {
                return moment(i, 'e').format('ddd');
            });

        svg.append('g').
            attr('transform', function (d) {
                return 'translate(' + margin.left + ', ' + (margin.top + (recth / 2)) + ')';
            }).
            call(yAxis);
    });
});
