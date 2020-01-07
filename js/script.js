var yearFirst = 1960;
var yearLast = 2019;

var toArray = function(dataPoint) {
    var list = [];
    for (var i = yearFirst; i <= yearLast; i++) {
        var value = dataPoint["" + i];
        if (value != "") {
            list.push({"year": i, "val": value});
        }
    }
    return list;
};

// FIXME
var createHistogram = function(data) {
    var margin = {top: 10, right: 30, bottom: 30, left: 30},
        width = 760 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    var x = d3.scaleLinear()
        .domain([d3.min(data, function(d) { return d.year; }), d3.max(data, function(d) { return d.year; })])
        .range([0, width]);

    var y = d3.scaleLinear()
        .domain([0, d3.max(data, function(d) { return d.val; })])
        .range([height, 0]);

    var histogram = d3.histogram()
        .value(function(d) { return d.year; })
        .domain(x.domain())
        .thresholds(x.ticks(29));

    var bins = histogram(data);

    var svg = d3.select("#histogram-div").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.selectAll("rect")
        .data(bins)
      .enter().append("rect")
        .attr("class", "bar")
        .attr("x", 1)
        .attr("transform", function(d) {
            // console.log('x0', d.x0);
            // console.log('val', d[0].val);
            return "translate(" + x(d.x0) + "," + y(d[0].val) + ")"; })
        // .attr("width", function(d) { return x(d.x1) - x(d.x0) - 1; })
        .attr("width", function(d) { return x(d.x0); })
        // .attr("height", function(d) { return height - y(d[0].val); });
        .attr("height", function(d) { return y(d[0].val); });

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    svg.append("g")
        .call(d3.axisLeft(y));
};

var lineChart = function(data) {
    var margin = {top: 50, right: 50, bottom: 50, left: 50}
        , width = window.innerWidth - margin.left - margin.right
        , height = window.innerHeight - margin.top - margin.bottom;

    var xScale = d3.scaleLinear()
        .domain([d3.min(data, function(d) { return d.year; }), d3.max(data, function(d) { return d.year; })])
        .range([0, width]);

    var yScale = d3.scaleLinear()
        .domain([d3.min(data, function(d) { return d.val; }), d3.max(data, function(d) { return d.val; })])
        .range([height, 0]);

    var line = d3.line()
        .x(function(d) { return xScale(d.year); })
        .y(function(d) { return yScale(d.val); })
        .curve(d3.curveMonotoneX); // Apply smoothing to the line

    var svg = d3.select("#line-chart-div").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(yScale));

    svg.append("path")
        .datum(data) // Bind the data to the line
        .attr("class", "line") // Assign a class for styling
        .attr("d", line); // Call the line generator

    // Append a circle for each datapoint
    svg.selectAll(".dot")
        .data(data)
      .enter().append("circle")
        .attr("class", "dot") // Class for styling
        .attr("cx", function(d) { return xScale(d.year) })
        .attr("cy", function(d) { return yScale(d.val) })
        .attr("r", 5)
            .on("mouseover", function(a, b, c) {
                console.log(a);
                this.attr('class', 'focus');
            })
            .on("mouseout", function() {  });
          // .on("mousemove", mousemove);

  var focus = svg.append("g")
      .attr("class", "focus")
      .style("display", "none");

  focus.append("circle")
      .attr("r", 4.5);

  focus.append("text")
      .attr("x", 9)
      .attr("dy", ".35em");

  svg.append("rect")
      .attr("class", "overlay")
      .attr("width", width)
      .attr("height", height)
      .on("mouseover", function() { focus.style("display", null); })
      .on("mouseout", function() { focus.style("display", "none"); })
      // .on("mousemove", mousemove);

  function mousemove() {
    var x0 = x.invert(d3.mouse(this)[0]),
        i = bisectDate(data, x0, 1),
        d0 = data[i - 1],
        d1 = data[i],
        d = x0 - d0.date > d1.date - x0 ? d1 : d0;
    focus.attr("transform", "translate(" + x(d.date) + "," + y(d.close) + ")");
    focus.select("text").text(d);
  }
};

// TODO
var parallelCoords = function(data) {
    var margin = {top: 30, right: 10, bottom: 10, left: 10},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    var x = d3.scale.ordinal().rangePoints([0, width], 1),
        y = {},
        dragging = {};

    var line = d3.svg.line(),
        axis = d3.svg.axis().orient("left"),
        background,
        foreground;

    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.csv("cars.csv", function(error, cars) {

        // Extract the list of dimensions and create a scale for each.
        x.domain(dimensions = d3.keys(cars[0]).filter(function(d) {
            return d != "name" && (y[d] = d3.scale.linear()
                .domain(d3.extent(cars, function(p) { return +p[d]; }))
                .range([height, 0]));
        }));

        // Add grey background lines for context.
        background = svg.append("g")
            .attr("class", "background")
            .selectAll("path")
            .data(cars)
            .enter().append("path")
            .attr("d", path);

        // Add blue foreground lines for focus.
        foreground = svg.append("g")
            .attr("class", "foreground")
            .selectAll("path")
            .data(cars)
            .enter().append("path")
            .attr("d", path);

        // Add a group element for each dimension.
        var g = svg.selectAll(".dimension")
            .data(dimensions)
            .enter().append("g")
            .attr("class", "dimension")
            .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
            .call(d3.behavior.drag()
                .origin(function(d) { return {x: x(d)}; })
                .on("dragstart", function(d) {
                    dragging[d] = x(d);
                    background.attr("visibility", "hidden");
                })
                .on("drag", function(d) {
                    dragging[d] = Math.min(width, Math.max(0, d3.event.x));
                    foreground.attr("d", path);
                    dimensions.sort(function(a, b) { return position(a) - position(b); });
                    x.domain(dimensions);
                    g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
                })
                .on("dragend", function(d) {
                    delete dragging[d];
                    transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
                    transition(foreground).attr("d", path);
                    background
                        .attr("d", path)
                        .transition()
                        .delay(500)
                        .duration(0)
                        .attr("visibility", null);
                }));

        // Add an axis and title.
        g.append("g")
            .attr("class", "axis")
            .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
            .append("text")
            .style("text-anchor", "middle")
            .attr("y", -9)
            .text(function(d) { return d; });

        // Add and store a brush for each axis.
        g.append("g")
            .attr("class", "brush")
            .each(function(d) {
                d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brushstart", brushstart).on("brush", brush));
            })
            .selectAll("rect")
            .attr("x", -8)
            .attr("width", 16);
    });
};

d3.csv("data/Gender_StatsData.csv").then(function(data) {
    // console.log(data);
    var testData = data.filter(function(dataPoint) {
        return dataPoint["Country Code"] == "EST" && dataPoint["Indicator Code"] == "SL.EMP.SELF.FE.ZS";
    });
    testData = toArray(testData[0]);
    console.log('Data', testData);
    createHistogram(testData);
    lineChart(testData);
});