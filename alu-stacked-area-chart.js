(function(){

function createChartViewPort(chartWidth,chartHeight,onBrush){
	var subChartMargin = {top:10,right:50,bottom:20,left:30};
	var subChartDimension = {width:chartWidth - subChartMargin.left - subChartMargin.right,height:50 };
	var subChartX = d3.time.scale().range([0, subChartDimension.width]);
	var subChartY = d3.scale.linear().range([subChartDimension.height, 0]);
	var subChartXAxis = d3.svg.axis().scale(subChartX).orient("bottom");
	var subChartYAxis = d3.svg.axis().scale(subChartY).orient("left");//.tickFormat(formatPercent);
	var subChartArea = d3.svg.area()
	    .x(function(d) { return subChartX(d.date); }).y0(function(d) {
	     return subChartY(d.y0); 
	 	})
	    .y1(function(d) {
	     return subChartY(d.y0 + d.y); 
	 	});

	var subchartStack = d3.layout.stack()
	    .values(function(d) {
	     return d.values; 
	 });
	    var color = d3.scale.category20();
	    var parseDate = d3.time.format("%y-%b-%d").parse;

	var brush = d3.svg.brush()
    .x(subChartX);
	
	//-------------------------
	var mainChartMargin = {top:20+subChartDimension.height+subChartMargin.top,right:20,bottom:20,left:50};
	var mainChartDimension = {width:chartWidth - mainChartMargin.left - mainChartMargin.right,height:chartHeight-subChartDimension.height-subChartMargin.top-subChartMargin.bottom-mainChartMargin.top-mainChartMargin.bottom };
	var mainChartX = d3.time.scale().range([0, mainChartDimension.width]);
	var mainChartY = d3.scale.linear().range([mainChartDimension.height, 0]);
	var mainChartXAxis = d3.svg.axis().scale(mainChartX).orient("bottom");
	var mainChartYAxis = d3.svg.axis().scale(mainChartY).orient("left");//.tickFormat(formatPercent);
	var mainChartArea = d3.svg.area()
	    .x(function(d) { return mainChartX(d.date); }).y0(function(d) {
	     return mainChartY(d.y0); 
	 	})
	    .y1(function(d) {
	     return mainChartY(d.y0 + d.y); 
	 	});

	var mainChartStack = d3.layout.stack()
	    .values(function(d) {
	     return d.values; 
	 });


	var viewPort = {
		subChart:{
			margin:subChartMargin,
			dimension:subChartDimension,
			x:subChartX,
			y:subChartY,
			xAxis:subChartXAxis,
			yAxis:subChartYAxis,
			area:subChartArea,
			stack:subchartStack,
			color:color,
			parseDate:parseDate,
			brush:brush
		},
		mainChart:{
			margin:mainChartMargin,
			dimension:mainChartDimension,
			x:mainChartX,
			y:mainChartY,
			xAxis:mainChartXAxis,
			yAxis:mainChartYAxis,
			area:mainChartArea,
			stack:mainChartStack,
			color:color,
			parseDate:parseDate,
		}
	}

	return viewPort;
}

var createChartContainer = function(data){
	var svg = d3.select("body").append("svg")
    .attr("width", data.dimension.width + data.margin.left + data.margin.right)
    .attr("height", data.dimension.height + data.margin.top + data.margin.bottom);
/*	if(!data.brush){
		svg.append("defs").append("clipPath")
	    .attr("id", "clip")
	  .append("rect")
	    .attr("width", data.width)
	    .attr("height", data.height);
	}*/
  svg.append("g")
    .attr("transform", "translate(" + data.margin.left + "," + data.margin.top + ")");
  svg.append("g").attr("class","stacks")
    if(data.brush){
    	svg.attr("id","focus");
    }
/*    if(data.brush){
    	svg.append("g").attr("class", "x brush")
    	.call(data.brush)
    	.selectAll("rect")
    	.attr("y", -6)
    	.attr("height", data.dimension.height + 7);
    }*/
    return svg;
}


var applyData = function(svg,subChart){
	d3.json("data.json", function(error, data) {
  if (error) throw error;

  subChart.color.domain(d3.keys(data[0]).filter(function(key) { return key !== "date"; }));

  data.forEach(function(d) {
    d.date = subChart.parseDate(d.date);
  });

  var browsers = subChart.stack(subChart.color.domain().map(function(name) {
    return {
      name: name,
      values: data.map(function(d) {
        return {date: d.date, y: d[name] / 100};
      })
    };
  }));
subChart.browsers = browsers;
  subChart.x.domain(d3.extent(data, function(d) { return d.date; }));
  var browser = svg.select(".stacks").selectAll(".browser")
      .data(browsers)
    .enter().append("g")
      .attr("class", "browser");

  browser.append("path")
      .attr("class", "area")
      .attr("d", function(d) { return subChart.area(d.values); })
      .style("fill", function(d) { return subChart.color(d.name); });

  browser.append("text")
      .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
      .attr("transform", function(d) { return "translate(" + subChart.x(d.value.date) + "," + subChart.y(d.value.y0 + d.value.y / 2) + ")"; })
      .attr("x", -6)
      .attr("dy", ".35em")
      .text(function(d) { return d.name; });

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + subChart.dimension.height + ")")
      .call(subChart.xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(subChart.yAxis);

});

}

var wireBrushToMainChart = function(mainChartSVG,subChartSVG,subChartData,mainChartData){
	    	d3.select("#focus").append("g").attr("class", "x brush")
    	.call(subChartData.brush)
    	.selectAll("rect")
    	.attr("y", -6)
    	.attr("height", subChartData.dimension.height + 7);
    var brush = subChartData.brush;
    brush.on("brush",brushed);
    function brushed() {
	  mainChartData.x.domain(brush.empty() ? subChartData.x.domain() : subChartData.brush.extent());
	  console.log(subChartData.brush.extent());
	  subChartSVG.select(".area").attr("d", subChartData.area);
	  subChartSVG.select(".x.axis").call(subChartData.xAxis);
	  mainChartSVG.select(".x.axis").call(mainChartData.xAxis);


		    var browsers = mainChartData.browsers;
    var browser = mainChartSVG.select(".stacks").selectAll(".browser")
      .data(browsers)
    .enter().append("g")
      .attr("class", "browser");

 browser.append("path")
      .attr("class", "area")
      .attr("d", function(d) { return mainChartData.area(d.values); })
      .style("fill", function(d) { return mainChartData.color(d.name); });

  browser.append("text")
      .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
      .attr("transform", function(d) { return "translate(" + mainChartData.x(d.value.date) + "," + mainChartData.y(d.value.y0 + d.value.y / 2) + ")"; })
      .attr("x", -6)
      .attr("dy", ".35em")
      .text(function(d) { return d.name; });

  // browser.select(".x .axis").call(mainChartData.xAxis);
  

	}
}

var createGraph = function(){
	var chartData = createChartViewPort(800,500);
	var subChartSVG = createChartContainer(chartData.subChart);
	var mainChartSVG =createChartContainer(chartData.mainChart);
					wireBrushToMainChart(mainChartSVG,subChartSVG,chartData.subChart,chartData.mainChart);

	applyData(subChartSVG,chartData.subChart);
	applyData(mainChartSVG,chartData.mainChart);



}


createGraph();




































})();