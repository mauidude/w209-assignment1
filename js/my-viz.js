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

    d3.csv("data/data.csv", function (e, d) {
        var dates = d.map(function (d) {
            return moment(d.Date, "M/D/YYYY");
        });

        var values = d.map(function (d) {
            return parseFloat(d.Total);
        })

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
            data(d).
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
                var res = xScale(w);

                return res;
            }).
            attr('y', function (d, i) {
                var d = dates[i].day();
                var res = yScale(d);

                return res + margin.top;
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

        svg.append("g").
            attr("transform", function (d) {
                return "translate(" + (rectw / 2) + "," + (height - margin.bottom + recth) + ")"
            }).
            call(xAxis);


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
