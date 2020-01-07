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
            console.log('x0', d.x0);
            console.log('val', d[0].val);
            return "translate(" + x(d.x0) + "," + y(d[0].val) + ")"; })
        // .attr("width", function(d) { return x(d.x1) - x(d.x0) - 1; })
        .attr("width", function(d) { return x(d.x0); })
        // .attr("height", function(d) { return height - y(d[0].val); });
        .attr("height", function(d) { return y(d[0].val); });

    // add the x Axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // add the y Axis
    svg.append("g")
        .call(d3.axisLeft(y));
};

d3.csv("data/Gender_StatsData.csv").then(function(data) {
    // console.log(data);
    var testData = data.filter(function(dataPoint) {
        return dataPoint["Country Code"] == "EST" && dataPoint["Indicator Code"] == "SL.EMP.SELF.FE.ZS";
    });
    testData = toArray(testData[0]);
    console.log('Data', testData);
    createHistogram(testData);
});