
// unique node identifier
var uniq = 1;

// zoom params
var new_x = 0, new_y = 0;

// initialise default search
var searchtype = "people";

//random flower photos when people don't have pictures
//flowers = ["https://cdn.pixabay.com/photo/2018/01/29/07/11/flower-3115353_150.jpg"];
flowers = [];
$.getJSON('https://pixabay.com/api/?key=27453113-803f85bdee2b8a7aeae77ca2a&q=flowers&image_type=photo', function (data) {
    data["hits"].forEach(function (obj) {
        var f = obj.previewURL;
        flowers.push(f);
    });
});
flower_iterator = 0;

function getFlower() {
    // grab a random flower incase no url
    flower = flowers[flower_iterator % flowers.length];
    flower_iterator++;
    return flower;
}

// quick tooltip for text
var text_tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("rx", 10)
    .style("ry", 10)
    .style('font-size', "16px")
    .style("padding", "20px")
    .style("visibility", "hidden")
    .style("background", "white")
    .attr("class", "customTooltip")
    .text("");


// colour scheme for team boxes
var palette = ["#72b8b5", "#b87274", "#c80678", "#86b872", "#218380", "#7188DD", "#fbb13c", "#eb8eb7", "#f2cea3", "#9370db", "#73d2de", "#3a9cbb", "#9a9a9a"]
var palette_iterator = 0;

// civil service data and setup
var params = {
    selector: "#svgChart",
    orgtype: "cs",
    dataLoadUrl: "/api/file/cs_json.json",
    chartWidth: window.innerWidth - 80,
    chartHeight: window.innerHeight - 10,
    funcs: {
        showTeams: null,
        search: null,
        refresh: null,
        closeSearchBox: null,
        clearResult: null,
        findInTree: null,
        departmentClick: null,
        back: null,
        toggleFullScreen: null,
        expandAll: null,
        collapseAll: null,
        locate: null
    },
    data: null
}

// political data and setup
var paramsp = {
    selector: "#svgChartP",
    orgtype: "p",
    dataLoadUrl: "/api/file/p_json.json",
    chartWidth: window.innerWidth - 80,
    chartHeight: window.innerHeight - 40,
    funcs: {
        showTeams: null,
        search: null,
        refresh: null,
        closeSearchBox: null,
        clearResult: null,
        findInTree: null,
        departmentClick: null,
        back: null,
        toggleFullScreen: null,
        expandAll: null,
        collapseAll: null,
        locate: null
    },
    data: null
}


// hold teams data 
var paramst = {
    selector: "#teamChart",
    orgtype: "t",
    dataLoadUrl: "",
    chartWidth: window.innerWidth - 80,
    chartHeight: window.innerHeight - 40,
    funcs: {
        showTeams: null,
        search: null,
        refresh: null,
        closeSearchBox: null,
        clearResult: null,
        findInTree: null,
        departmentClick: null,
        back: null,
        toggleFullScreen: null,
        expandAll: null,
        collapseAll: null,
        locate: null
    },
    data: null
}

// is everything expanded?
var expanded = false;

// define a sleep
const sleep = ms => new Promise(r => setTimeout(r, ms));

// list of teams
var team_dictionary = {};
// read from file
d3.json("/api/file/teams.json", function (data) {
    data = JSON.parse(data);
    for (var i = 0; i < data.length; i++) {
        team_dictionary[data[i].tag] = data[i];
    };
});



//cs chart
d3.json(params.dataLoadUrl, function (data) {
    params.data = data;
    params.pristinaData = JSON.parse(JSON.stringify(data));

    // draw
    drawOrganizationChart(params);

})

//political chart
d3.json(paramsp.dataLoadUrl, function (data) {
    paramsp.data = data;
    paramsp.pristinaData = JSON.parse(JSON.stringify(data));

    // draw 
    drawOrganizationChart(paramsp);

})

// select which chart to view
$(".title_text").click(function () {

    // selector
    $(".title_text").removeClass("selected");
    $(this).addClass("selected");

    // show chart
    $(".svgChart").hide();
    $("#" + $(this).data("chart")).show();
    $(".btn-expand").removeClass("btn-disabled");
    $(".btn-collapse").removeClass("btn-disabled");
    $(".level-0").removeClass("level-fake");

    if (params.attrs.teamboxesvisible) {
        if ($('#svgChart').is(':visible')) boxTeams("cs");
        else if ($('#svgChartP').is(':visible')) boxTeams("p");
    }
});


var tooltip = d3.select('body')
    .append('div')
    .attr('class', 'customTooltip-wrapper');

// symbols
var EXPAND_SYMBOL = '\uf067',
    COLLAPSE_SYMBOL = '\uf068';

// save svgs generated to a list for ease
var svgs = [];
function drawOrganizationChart(params, teamflag) {
    listen();

    params.funcs.showTeams = showTeams;
    params.funcs.expandAll = expandAll;
    params.funcs.collapseAll = collapseAll;
    //params.funcs.searchPeople = searchPeople;
    // params.funcs.refresh = reDraw;
    //params.funcs.closeSearchBox = closeSearchBox;
    params.funcs.findInTree = findInTree;
    params.funcs.clearResult = clearResult;
    // params.funcs.reflectResults = reflectResults;
    params.funcs.departmentClick = departmentClick;
    params.funcs.back = back;
    params.funcs.toggleFullScreen = toggleFullScreen;
    params.funcs.locate = locate;
    params.funcs.update = update;

    params.attrs = {
        selector: params.selector,
        root: params.data,
        width: params.chartWidth,
        height: params.chartHeight,
        index: 0,
        nodePadding: 10,
        collapseCircleRadius: 18,
        nodeHeight: 300,  //120
        nodeWidth: 210, //250
        duration: 750,
        rootNodeTopMargin: 20,
        minMaxZoomProportions: [0.05, 3],
        // allow more horizontal spage
        linkLineSize: 500,
        collapsibleFontSize: '16px',
        userIcon: '\uf007',
        usersIcon: '\uf0c0',
        vacantIcon: '\uf6c0',
        nodeStroke: "#ccc",
        nodeStrokeWidth: '5px',
        teamboxesvisible: false
    }

    var dynamic = {}
    dynamic.nodeImageWidth = params.attrs.nodeWidth * 4.2 / 5;
    dynamic.nodeImageHeight = params.attrs.nodeHeight / 2 - params.attrs.nodePadding;
    dynamic.nodeTextLeftMargin = params.attrs.nodePadding * 2;
    dynamic.nodePositionNameTopMargin = dynamic.nodeImageHeight;
    dynamic.nodeTextTopMargin = dynamic.nodeImageHeight + params.attrs.nodePadding;
    dynamic.rootNodeLeftMargin = params.attrs.width / 2;


    var tree = d3.layout.tree().nodeSize([params.attrs.nodeWidth + 80, params.attrs.nodeHeight]);
    var diagonal = d3.svg.diagonal()
        .projection(function (d) {
            return [d.x + params.attrs.nodeWidth / 2, d.y + params.attrs.nodeHeight / 2];
        });

    var zoomBehaviours = d3.behavior
        .zoom()
        .scaleExtent(params.attrs.minMaxZoomProportions)
        .on("zoom", redraw);

    //initial expansion

    // 2 levels

    if (typeof teamflag != 'undefined') {
        expand(params.attrs.root);
        var childcount = 10;
    }

    // 2 levels - P
    else if (params.selector == "#svgChartP") {

        expand(params.attrs.root);
        var childcount = 0;
        if (params.attrs.root.children) expand(params.attrs.root.children);
        if (params.attrs.root.children) {
            for (var i = 0; i < params.attrs.root.children.length; i++) {
                if (params.attrs.root.children[i].children) {
                    childcount += params.attrs.root.children[i].children.length;
                }
            }
        }

    }

    //1 level - CS

    else {
        expand(params.attrs.root);
        var childcount = 0;
        if (params.attrs.root.children) {
            params.attrs.root.children.forEach(collapse);
            childcount += params.attrs.root.children.length;
        };
    }




    if (childcount < 5) childcound = 5; if (childcount > 16) childcount = 16;


    var start_trans_x = (params.attrs.width / 2 - params.attrs.nodeWidth / 2) + 20;
    var start_trans_y = params.attrs.nodeHeight / 2;
    if (typeof teamflag != 'undefined') start_trans_y = start_trans_y - params.attrs.nodeHeight / 2;
    var start_zoom = 1 / childcount * 4;
    if (typeof teamflag == 'undefined') {
        if (start_zoom < 0.4) start_zoom = 0.4;
        else if (start_zoom > 1) start_zoom = 1;
    } else {
        start_zoom = 1 / childcount * 3.5;
    }

    var svg = d3.select(params.attrs.selector)
        .append("svg")
        .attr("width", params.attrs.width)
        .attr("height", params.attrs.height)
        .call(zoomBehaviours)
        .append("g")
        .attr("transform", "translate(" + start_trans_x + "," + start_trans_y + ")" + " scale(" + start_zoom + ")");

    // getting a bit messy. save the svg.
    svgs[params.orgtype] = svg;

    //necessary so that zoom knows where to zoom and unzoom from
    zoomBehaviours.translate([start_trans_x, start_trans_y]);
    zoomBehaviours.scale(start_zoom);
    svg.call(zoomBehaviours.event);

    params.attrs.root.x0 = 0;
    params.attrs.root.y0 = dynamic.rootNodeLeftMargin;

    if (params.mode != 'department') {
        // adding unique values to each node recursively
        addPropertyRecursive('uniqueIdentifier', function (v) {
            return uniq++;
        }, params.attrs.root);

    }

    // https://github.com/wbkd/d3-extended
    //quick reordering fn
    d3.selection.prototype.moveToFront = function () {
        return this.each(function () {
            this.parentNode.appendChild(this);
        });
    };
    d3.selection.prototype.moveToBack = function () {
        return this.each(function () {
            var firstChild = this.parentNode.firstChild;
            if (firstChild) {
                this.parentNode.insertBefore(this, firstChild);
            }
        });
    };

    update(params.attrs.root);

    d3.select(params.attrs.selector).style("height", params.attrs.height);

    //DRAWING FN ////////////////////////////////////////////////////////////////////////////////

    function update(source, par) {

        // Compute the new tree layout.
        var nodes = tree.nodes(params.attrs.root).reverse();

        // create links
        var links = tree.links(nodes);

        // Normalize for fixed-depth.
        nodes.forEach(function (d) {
            d.y = d.depth * params.attrs.linkLineSize;
        });

        // Update the nodes…
        var node = svg.selectAll("g.node")
            .data(nodes, function (d) {
                return d.id || (d.id = ++params.attrs.index);
            });


        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", function (d) {
                return "translate(" + source.x0 + "," + source.y0 + ")";
            })

        var nodeGroup = nodeEnter.append("g")
            .attr("class", function (d) {
                var cls = 'node-group level-' + d.depth;
                return cls
            })

        nodeGroup.append("rect")
            .attr("width", params.attrs.nodeWidth)
            .attr("height", params.attrs.nodeHeight)
            // add a data class for grouping teams 
            .attr('data-class-team', function (d) {
                team = teamNameGen(d);
                return team;
            })
            .attr("data-node-group-id", function (d) {
                return d.uniqueIdentifier;
            })
            .attr("class", function (d) {
                var res = "";
                if (d.isLoggedUser) res += 'nodeRepresentsCurrentUser ';
                if ((d.children && d.children.length == 0) && (d._children && d._children.length == 0)) delete d.children;
                res += d._children || d.children ? "nodeHasChildren" : "nodeDoesNotHaveChildren";
                if (d.Name.toLowerCase().includes("vacan")) {
                    res += " vacant";
                    if (show_vacancies) res += " vacant-highlight";
                }
                return res;
            });

        var collapsiblesWrapper =
            nodeEnter.append('g')
                .attr('class', function (v) {
                    return 'level-' + v.depth
                })
                .attr('data-id', function (v) {
                    return v.uniqueIdentifier;
                });

        var collapsibleRects = collapsiblesWrapper.append("rect")
            .attr('class', 'node-collapse-right-rect')
            .attr('height', params.attrs.collapseCircleRadius)
            .attr('fill', 'black')
            .attr('x', params.attrs.nodeWidth - params.attrs.collapseCircleRadius)
            .attr('y', params.attrs.nodeHeight - params.attrs.collapseCircleRadius)
            .attr("width", function (d) {
                if (d.children || d._children) return params.attrs.collapseCircleRadius;
                return 0;
            });

        var collapsibles =
            collapsiblesWrapper.append("circle")
                .attr('class', 'node-collapse')
                .attr('cx', params.attrs.nodeWidth - params.attrs.collapseCircleRadius)
                .attr('cy', params.attrs.nodeHeight - params.attrs.collapseCircleRadius)
                .attr('fill', '#72b8b5')
                .attr("", setCollapsibleSymbolProperty);

        //hide collapse rect when node does not have children
        collapsibles.attr("r", function (d) {
            if (d.children || d._children) return params.attrs.collapseCircleRadius;
            return 0;
        })
            .attr("height", params.attrs.collapseCircleRadius)

        collapsiblesWrapper.append("text")
            .attr('class', 'text-collapse')
            .attr("x", params.attrs.nodeWidth - params.attrs.collapseCircleRadius)
            .attr('y', params.attrs.nodeHeight - params.attrs.collapseCircleRadius / 2 - 4)
            .attr('width', params.attrs.collapseCircleRadius)
            .attr('height', params.attrs.collapseCircleRadius)
            .style('font-size', params.attrs.collapsibleFontSize)
            .attr("text-anchor", "middle")
            .style('font-family', 'FontAwesome')
            .text(function (d) {
                return d.collapseText;
            })

        collapsiblesWrapper.on("click", click_child_expand);

        nodeGroup.append("rect")
            .attr("width", params.attrs.nodeWidth)
            .attr("height", "20px")
            .attr('rx', 10)
            .attr('ry', 10)
            .attr("class", "banner banner-name")
            .attr('fill', function (d) {
                if (d.colour) return d.colour;
                else return "#000000";
            });

        nodeGroup.append("text")
            .attr("x", params.attrs.nodeWidth / 2)
            .attr("y", params.attrs.nodePadding + 5)
            .attr("width", params.attrs.nodeWidth)
            .attr("class", "banner banner-name")
            .attr("text-anchor", "middle")
            .text(function (d) {
                if (d.Grade) return d.Grade.trim();
                else return "Unknown";
            })
            .attr('fill', "white");

        nodeGroup.append("text")
            .attr("x", dynamic.nodeTextLeftMargin)
            .attr("y", dynamic.nodeTextTopMargin + params.attrs.nodePadding + 25)
            .attr('class', 'emp-name')
            .attr("text-anchor", "left")
            .text(function (d) {
                return d.Name.trim();
            })
            .call(wrap, params.attrs.nodeWidth);

        nodeGroup.append("text")
            .attr("x", dynamic.nodeTextLeftMargin)
            .attr("y", dynamic.nodeTextTopMargin + params.attrs.nodePadding + 40)
            .attr('class', 'emp-position-name')
            .attr("dy", ".35em")
            .attr("text-anchor", "left")
            .text(function (d) {
                var position = d.Position_Title.substring(0, 27);
                if (position.length < d.Position_Title.length) {
                    position = position.substring(0, 24) + '...'
                }
                return position;
            })

        nodeGroup.append("text")
            .attr("x", dynamic.nodeTextLeftMargin)
            .attr("y", dynamic.nodeTextTopMargin + params.attrs.nodePadding + 65)
            .attr('class', 'emp-area-2')
            .attr("dy", ".35em")
            .attr("text-anchor", "left")
            .text(function (d) {
                var b = d.Business_Unit;
                if (b.length > 32) b = b.substring(0, 30) + "...";
                return b;
            })

        nodeGroup.append("text")
            .attr("x", dynamic.nodeTextLeftMargin)
            .attr("y", dynamic.nodeTextTopMargin + params.attrs.nodePadding + 80)
            .attr('class', 'emp-area-1')
            .attr("dy", ".35em")
            .attr("text-anchor", "left")
            .text(function (d) {
                var b = d.Sub_Unit;
                if (b.length > 32) b = b.substring(0, 30) + "...";
                return b;
            })

        nodeGroup.append("text")
            .attr("x", dynamic.nodeTextLeftMargin)
            .attr("y", dynamic.nodeTextTopMargin + params.attrs.nodePadding + 95)
            .attr('class', 'emp-area')
            .attr("dy", ".35em")
            .attr("text-anchor", "left")
            .text(function (d) {
                // don't print if same as subunit
                if (d.Team == d.Sub_Unit) return "";
                var b = d.Team;
                if (b.length > 32) b = b.substring(0, 30) + "...";
                return b;;
            })

        // number of direct reports
        nodeGroup.append("text")
            .attr("x", dynamic.nodeTextLeftMargin)
            .attr("y", dynamic.nodeTextTopMargin + params.attrs.nodePadding + 130)
            .attr('class', 'emp-count-icon')
            .attr("text-anchor", "left")
            .style('font-family', 'FontAwesome')
            .text(function (d) {
                if (d.children || d._children) return params.attrs.userIcon;
            })
            .on("mouseover", function (d) {
                if (d.children) nokids = d.children.length;
                else nokids = d._children.length;
                text_tooltip.html("Number of direct reports (including vacancies): " + nokids); return text_tooltip.style("visibility", "visible");
            })
            .on("mousemove", function () { return text_tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px"); })
            .on("mouseout", function () { return text_tooltip.style("visibility", "hidden"); });


        nodeGroup.append("text")
            .attr("x", dynamic.nodeTextLeftMargin + 15)
            .attr("y", dynamic.nodeTextTopMargin + params.attrs.nodePadding + 120)
            .attr('class', 'emp-count')
            .attr("text-anchor", "left")
            .text(function (d) {
                if (d.children) return d.children.length;
                if (d._children) return d._children.length;
                return;
            })
            .on("mouseover", function (d) {
                if (d.children) nokids = d.children.length;
                else nokids = d._children.length;
                text_tooltip.html("Number of direct reports (including vacancies): " + nokids); return text_tooltip.style("visibility", "visible");
            })
            .on("mousemove", function () { return text_tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px"); })
            .on("mouseout", function () { return text_tooltip.style("visibility", "hidden"); });

        // number of indirect reports
        nodeGroup.append("text")
            .attr("x", dynamic.nodeTextLeftMargin + 35)
            .attr("y", dynamic.nodeTextTopMargin + params.attrs.nodePadding + 130)
            .attr('class', 'emp-count-icon')
            .attr("text-anchor", "left")
            .style('font-family', 'FontAwesome')
            .text(function (d) {
                if (d.children || d._children) return params.attrs.usersIcon;
            })
            .on("mouseover", function (d) {
                nokids = findInTree(d,"").length - 1;
                text_tooltip.html("Number of direct reports (including vacancies): " + nokids); return text_tooltip.style("visibility", "visible");
            })
            .on("mousemove", function () { return text_tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px"); })
            .on("mouseout", function () { return text_tooltip.style("visibility", "hidden"); });


        nodeGroup.append("text")
            .attr("x", dynamic.nodeTextLeftMargin + 22 + 35)
            .attr("y", dynamic.nodeTextTopMargin + params.attrs.nodePadding + 120)
            .attr('class', 'emp-count')
            .attr("text-anchor", "left")
            .text(function (d) {
                nokids = findInTree(d,"").length - 1;
                if (nokids>0) return nokids;
            })
            .on("mouseover", function (d) {
                nokids = findInTree(d,"").length;
                text_tooltip.html("Number of total reports (including vacancies): " + nokids); return text_tooltip.style("visibility", "visible");
            })
            .on("mousemove", function () { return text_tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px"); })
            .on("mouseout", function () { return text_tooltip.style("visibility", "hidden"); });

        // number of vacancies
        var cls = "emp-count-icon vacant-count";
        if (!show_vacancies) cls += " vacant-count-hide";
        nodeGroup.append("text")
            .attr("x", dynamic.nodeTextLeftMargin + 110)
            .attr("y", dynamic.nodeTextTopMargin + params.attrs.nodePadding + 130)
            .attr('class', cls)
            .attr("text-anchor", "left")
            .style('font-family', 'FontAwesome')
            .text(function (d) {
                novacs = findInTree(d,"vacan").length;
                // if I am vacant we need to remove 1
                if (d.Name.toLowerCase().includes("vacan")) novacs = novacs-1;
                if (d.children || d._children && novacs>0) return params.attrs.vacantIcon;
            })
            .on("mouseover", function (d) {
                novacs = findInTree(d,"vacan").length;
                // if I am vacant we need to remove 1
                if (d.Name.toLowerCase().includes("vacan")) novacs = novacs-1;
                text_tooltip.html("Number of vacancies: " + novacs); return text_tooltip.style("visibility", "visible");
            })
            .on("mousemove", function () { return text_tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px"); })
            .on("mouseout", function () { return text_tooltip.style("visibility", "hidden"); });

        var cls = "emp-count vacant-count";
        if (!show_vacancies) cls += " vacant-count-hide";
        nodeGroup.append("text")
            .attr("x", dynamic.nodeTextLeftMargin + 15 + 110)
            .attr("y", dynamic.nodeTextTopMargin + params.attrs.nodePadding + 120)
            .attr('class', cls)
            .attr("text-anchor", "left")
            .text(function (d) {
                // if I am vacant we need to remove 1
                novacs = findInTree(d,"vacan").length;
                if (d.Name.toLowerCase().includes("vacan")) novacs = novacs-1;
                if (d.children || d._children && novacs>0) return (novacs);
            })
            .on("mouseover", function (d) {
                // if I am vacant we need to remove 1
                novacs = findInTree(d,"vacan").length;
                if (d.Name.toLowerCase().includes("vacan")) novacs = novacs-1;
                text_tooltip.html("Number of direct vacancies: " + novacs); return text_tooltip.style("visibility", "visible");
            })
            .on("mousemove", function () { return text_tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px"); })
            .on("mouseout", function () { return text_tooltip.style("visibility", "hidden"); });


        nodeGroup.append("defs").append("svg:clipPath")
            .attr("id", "clip")
            .append("svg:rect")
            .attr("id", "clip-rect")
            .attr("rx", 3)
            .attr('x', params.attrs.nodePadding)
            .attr('y', 16 + params.attrs.nodePadding)
            .attr('width', dynamic.nodeImageWidth)
            .attr('fill', 'none')
            .attr('height', dynamic.nodeImageHeight - 4)

        nodeGroup.append("svg:image")
            .attr('y', 14 + params.attrs.nodePadding)
            .attr('x', 20 + params.attrs.nodePadding / 2)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .attr('width', dynamic.nodeImageWidth)
            .attr('height', dynamic.nodeImageHeight - 4)
            .attr('clip-path', "url(#clip)")
            .attr("xlink:href", function (v) {
                if (v.imgUrl == '') v.imgUrl = getFlower();
                return v.imgUrl;
            })

        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
            .duration(params.attrs.duration)
            .attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            })

        nodeUpdate.select("rect")
            .attr("width", params.attrs.nodeWidth)
            .attr("height", params.attrs.nodeHeight)
            .attr('rx', 10)
            .attr('ry', 10)
            .attr("stroke", function (d) {
                if (par && d.uniqueIdentifier == par.locate) {
                    return '#a1ceed'
                }
                return params.attrs.nodeStroke;
            })
            .attr('stroke-width', function (d) {
                if (par && d.uniqueIdentifier == par.locate) {
                    return 6;
                }
                return params.attrs.nodeStrokeWidth
            })

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(params.attrs.duration)
            .attr("transform", function (d) {
                return "translate(" + source.x + "," + source.y + ")";
            })
            .remove();

        nodeExit.select("rect")
            .attr("width", params.attrs.nodeWidth)
            .attr("height", params.attrs.nodeHeight)

        // Update the links
        var link = svg.selectAll("path.link")
            .data(links, function (d) {
                return d.target.id;
            });

        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", function (d) {
                return 'link level-' + d.source.depth
            })
            .attr("x", params.attrs.nodeWidth / 2)
            .attr("y", params.attrs.nodeHeight / 2)
            .attr("d", function (d) {
                var o = {
                    x: source.x0,
                    y: source.y0
                };
                return diagonal({
                    source: o,
                    target: o
                });
            });

        // Transition links to their new position.
        link.transition()
            .duration(params.attrs.duration)
            .attr("d", diagonal)
            ;

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(params.attrs.duration)
            .attr("d", function (d) {
                var o = {
                    x: source.x,
                    y: source.y
                };
                return diagonal({
                    source: o,
                    target: o
                });
            })
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function (d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });

        if (par && par.locate) {
            var x;
            var y;

            nodes.forEach(function (d) {
                if (d.uniqueIdentifier == par.locate) {
                    x = d.x;
                    y = d.y;
                }
            });


            // normalize for width/height
            new_x = -x * start_zoom + window.innerWidth / 2 - params.attrs.nodeWidth * start_zoom / 2 - 180 / 2;
            new_y = -y * start_zoom + window.innerHeight / 2 - params.attrs.nodeHeight * start_zoom / 2 + 50;

            zoomBehaviours.translate([new_x, new_y]);
            zoomBehaviours.scale(start_zoom);
            svg.call(zoomBehaviours.event);
        }

        if (par && par.centerMySelf) {
            var x;
            var y;

            nodes.forEach(function (d) {
                if (d.isLoggedUser) {
                    x = d.x;
                    y = d.y;
                }

            });

            // normalize for width/height
            new_x = -x * start_zoom + window.innerWidth / 2 - params.attrs.nodeWidth * start_zoom / 2 - 180 / 2;
            new_y = -y * start_zoom + window.innerHeight / 2 - params.attrs.nodeHeight * start_zoom / 2 + 50;

            zoomBehaviours.translate([new_x, new_y]);
            zoomBehaviours.scale(start_zoom);
            svg.call(zoomBehaviours.event);
        }

        // call boxes around teams - incase we are clicking to update children      
        if (params.attrs.teamboxesvisible) {
            if ($('#svgChart').is(':visible')) boxTeams("cs");
            else if ($('#svgChartP').is(':visible')) boxTeams("p");
            else if ($('#teamChart').is(':visible')) boxTeams("t");
        }

        /*################  TOOLTIP  #############################*/

        function getTagsFromCommaSeparatedStrings(tags) {
            return tags.split(',').map(function (v) {
                return '<li><div class="tag">' + v + '</div></li>  '
            }).join('');
        }

        function getTags(tags) {
            return tags.map(function (v) {
                return '<li><div class="tag">' + v + '</div></li>  '
            }).join('');
        }

        // detailed click tooltip for people
        function tooltipContent(item) {

            if (typeof item.imgUrl == 'undefined') item.imgUrl = getFlower();
            if (typeof item.profileUrl == 'undefined') item.profileUrl = "";

            var strVar = "";
            if (item.skills != "") strVar += "  <div class=\"customTooltip\" style=\"width:500px\">";
            else strVar += "  <div class=\"customTooltip\" style=\"width:300px\">";
            if (item.Position_Title) {
                strVar += "    <div class=\"banner-tool banner-name\" style=\"background-color:" + item.colour + "\">" + item.Grade + "<\/div>";
            }
            strVar += "    <div class=\"profile-image-wrapper\" style='background-image: url(" + item.imgUrl + ")'><\/div>";
            strVar += "    <div class=\"tooltip-hr\"><\/div>";
            strVar += "    <div class=\"tooltip-desc\">";

            if (item.profileUrl != "") strVar += "      <a class=\"name name_href\" href='" + item.profileUrl + "' target=\"_blank\"> " + item.Name + "<\/a>";
            else strVar += "<div  class=\"name\">" + item.Name + "</div>";

            strVar += "      <p class=\"position\">" + item.Position_Title + " <\/p>";
            strVar += "      <p class=\"area\">" + item.Business_Unit + " <\/p>";
            strVar += "      <p class=\"office\">" + item.Sub_Unit + "<\/p>";
            var it = item.team;
            if (item.Team == item.Sub_Unit) it = "";
            strVar += "      <p class=\"office\">" + it + "<\/p>";
            
            if (item.profession != "") strVar += "      <p class=\"tags-wrapper\">  <span class=\"title\"><i class=\"fa fa-certificate\" aria-hidden=\"true\"><\/i>  <\/span> <ul class=\"profession\">" + item.profession + "<\/ul> <\/p> ";
           
            if (item.skills != "") strVar += "      <p class=\"tags-wrapper\">  <span class=\"title\"><i class=\"fa fa-tags\" aria-hidden=\"true\"><\/i>             <\/span> <ul class=\"tags\">" + getTags(item.skills) + "<\/ul>  <\/p> ";
                   
            strVar += "    <\/div>";
            strVar += "  <\/div>";
            strVar += "";

            return strVar;

        }

        function tooltipHoverHandler(d) {

            var content = tooltipContent(d);
            tooltip.html(content);

            tooltip.transition()
                .duration(200).style("opacity", "1").style('display', 'block');
            d3.select(this).attr('cursor', 'pointer').attr("stroke-width", 50);

            var y = d3.event.pageY;
            var x = d3.event.pageX;

            //restrict tooltip to fit in borders
            if (y < 220) {
                y += 220 - y;
                x += 130;
            }

            if (y > params.attrs.height - 300) {
                y -= 300 - (params.attrs.height - y);
            }

            tooltip.style('top', (y - 300) + 'px')
                .style('left', (x - 470) + 'px');
        }

        function tooltipOutHandler() {
            tooltip.transition()
                .duration(200)
                .style('opacity', '0').style('display', 'none');
            d3.select(this).attr("stroke-width", 5);

        }

        nodeGroup.on('click', tooltipHoverHandler);
        nodeGroup.on('dblclick', tooltipOutHandler);

        function equalToEventTarget() {
            return this == d3.event.target;
        }

        d3.select("body").on("click", function () {
            var outside = tooltip.filter(equalToEventTarget).empty();
            if (outside) {
                tooltip.style('opacity', '0').style('display', 'none');
            }
        });
    }

    // Toggle children on click.
    function click_child_expand(d) {

        d3.select(this).select("text").text(function (dv) {

            if (dv.collapseText == EXPAND_SYMBOL) {
                dv.collapseText = COLLAPSE_SYMBOL
            } else {
                if (dv.children) {
                    dv.collapseText = EXPAND_SYMBOL
                }
            }
            return dv.collapseText;

        })

        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }

        update(d);

    }

    //########################################################

    //Redraw for zoom
    function redraw() {
        console.log("redraw");
        svg.attr("transform",
            "translate(" + d3.event.translate[0] + ","
            + d3.event.translate[1] + ")" +
            " scale(" + d3.event.scale + ")");

    }

    // #############################   Function Area #######################
    function wrap(text, width) {

        text.each(function () {
            var text = d3.select(this),
                words = text.text().split(/\s+/).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 1.1, // ems
                x = text.attr("x"),
                y = text.attr("y"),
                dy = 0,
                tspan = text.text(null)
                    .append("tspan")
                    .attr("x", x)
                    .attr("y", y)
                    .attr("dy", dy + "em");
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan")
                        .attr("x", x)
                        .attr("y", y)
                        .attr("dy", ++lineNumber * lineHeight + dy + "em")
                        .text(word);
                }
            }
        });
    }

    function addPropertyRecursive(propertyName, propertyValueFunction, element) {
        if (element[propertyName]) {
            element[propertyName] = element[propertyName] + ' ' + propertyValueFunction(element);
        } else {
            element[propertyName] = propertyValueFunction(element);
        }
        if (element.children) {
            element.children.forEach(function (v) {
                addPropertyRecursive(propertyName, propertyValueFunction, v)
            })
        }
        if (element._children) {
            element._children.forEach(function (v) {
                addPropertyRecursive(propertyName, propertyValueFunction, v)
            })
        }
    }

    function departmentClick(item) {
        hide(['.customTooltip-wrapper']);

        if (item.type == 'department' && params.mode != 'department') {
            //find third level department head user
            var found = false;
            var secondLevelChildren = params.pristinaData.children;
            parentLoop:
            for (var i = 0; i < secondLevelChildren.length; i++) {
                var secondLevelChild = secondLevelChildren[i];
                var thirdLevelChildren = secondLevelChild.children ? secondLevelChild.children : secondLevelChild._children;

                for (var j = 0; j < thirdLevelChildren.length; j++) {
                    var thirdLevelChild = thirdLevelChildren[j];
                    if (thirdLevelChild.Team.value.trim() == item.value.trim()) {
                        clear(params.selector);

                        hide(['.btn-action']);
                        show(['.btn-action.btn-back', '.btn-action.btn-fullscreen', '.department-information']);
                        set('.dept-name', item.value);

                        set('.dept-emp-count', "Employees Quantity - " + getEmployeesCount(thirdLevelChild));
                        set('.dept-description', thirdLevelChild.unit.desc);

                        params.oldData = params.data;

                        params.data = deepClone(thirdLevelChild);
                        found = true;
                        break parentLoop;
                    }
                }
            }
            if (found) {
                params.mode = "department";
                params.funcs.closeSearchBox();
                drawOrganizationChart(params);

            }

        }
    }

    function getEmployeesCount(node) {
        var count = 1;
        countChilds(node);
        return count;

        function countChilds(node) {
            var childs = node.children ? node.children : node._children;
            if (childs) {
                childs.forEach(function (v) {
                    count++;
                    countChilds(v);
                })
            }
        }
    }


    function back() {

        show(['.btn-action']);
        hide(['.customTooltip-wrapper', '.btn-action.btn-back', '.department-information'])
        clear(params.selector);

        params.mode = "full";
        params.data = deepClone(params.pristinaData)
        drawOrganizationChart(params);

    }

    function expandAll() {
        expand(params.attrs.root);
        update(params.attrs.root);
    }

    function collapseAll() {
        collapse(params.attrs.root);
        expand(params.attrs.root);
        if (params.attrs.root.children) {
            params.attrs.root.children.forEach(collapse);
        }
        update(params.attrs.root);
    }

}


function expand(d) {
    if (d.children) {
        d.children.forEach(expand);
    }

    if (d._children) {
        d.children = d._children;
        d.children.forEach(expand);
        d._children = null;
    }

    if (d.children) {
        // if node has children and it's expanded, then  display -
        setToggleSymbol(d, COLLAPSE_SYMBOL);
    }
}



//########################################################
// IDENTIFY TEAMS lmg

async function boxTeams(csorps) {

    let promise = new Promise((resolve, reject) => {
        setTimeout(() => resolve(boxTeamsAsync(csorps)), 1000)
    });

    let result = await promise; // wait until the promise resolves (*)

}

//find team elements, translate box around them
async function boxTeamsAsync(csorps) {
    console.log("calling boxteams with " + csorps);

    SVG = svgs[csorps];
    console.log(SVG);

    if (csorps == "t") p = paramst;
    else if (csorps == "cs") p = params;
    else p = paramp;

    // wait for screen to reset so sizes right. Hide meanwhile
    SVG.selectAll('.bounding-rect').style("display", "none");
    SVG.selectAll('.bounding-rect-text').style("display", "none");

    // team - separate for p and cs
    Object.keys(team_dictionary).forEach(function (team) {

        // hide top fake level? not used
        if (team == "fakefakefake") return;

        var allTeamNodes = SVG.selectAll('rect').filter(function (d) {
            return d3.select(this).attr("data-class-team") == team; // filter by single attribute
        });

        // messy - could not get d3.min to work somehow - mix of bounding widths and x,y relative to positioning
        var x_array = [], y_array = [];
        allTeamNodes.each(function (d, i) {
            var pr = d3.select(this).node().getBBox()
            x_array.push(d.x);
            x_array.push(d.x + pr.width);
            y_array.push(d.y);
            y_array.push(d.y + pr.height);
        });

        //team not found
        if (x_array.length == 0) return;

        var space = 30, x = d3.min(x_array) - space, x_max = d3.max(x_array) + space,
            y = d3.min(y_array) - space, y_max = d3.max(y_array) + space,
            // WIDTH AND HEIGHT of final box
            width = x_max - x,
            height = y_max - y;

        // take a colour
        var colour = palette[palette_iterator % palette.length];
        palette_iterator++;

        // this one doesn't exist - create
        if (SVG.selectAll('.bounding-rect').filter(function () {
            return found = d3.select(this).attr("data-team") == team && d3.select(this).attr("data-csorps") == csorps;
        }).size() == 0) {
            var br = SVG.append("rect").attr("class", 'bounding-rect')
                .attr('x', x)
                .attr('y', y)
                .attr('rx', 10)
                .attr('ry', 10)
                .attr('width', width)
                .attr('height', height)
                .attr('stroke-width', 5)
                .attr('stroke', colour)
                .attr('fill', colour)
                .attr('fill-opacity', "0.2")
                .attr("data-team", team)
                .attr("data-csorps", csorps)
            if (p.attrs.teamboxesvisible && width > 0) br.style("display", "block");
            else br.style("display", "none");
            br.moveToBack();

            var t = team_dictionary[team].team;
            var team_objectives = "Team information: <i>To be completed</i>"
            if (t.length > 24) t = t.substring(0, 22) + "...";
            text = SVG.append('text').attr("class", 'bounding-rect-text')
                .text(t)
                .attr("data-team", team)
                .attr("data-csorps", csorps)
                .attr('x', x + space / 2)
                .attr('y', y + space * 3 / 4 + 3)
                .attr('fill', 'black');
            if (p.attrs.teamboxesvisible && width > 0) text.style("display", "block");
            else text.style("display", "none");
            text.on("mouseover", function () {
                text_tooltip.html(
                    "<b>Business Unit: " + team_dictionary[team].business_unit + "<br>Sub Unit: " + team_dictionary[team].sub_unit + "<br>Team: " + team_dictionary[team].team +
                    "<\/b><p class='objectives'>" + team_objectives + "<\/p>"
                ); return text_tooltip.style("visibility", "visible");
            })
                .on("mousemove", function () { return text_tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px"); })
                .on("mouseout", function () { return text_tooltip.style("visibility", "hidden"); });
            ;
        }

        else {
            // UPDATE THE ATTRS FOR THE RECT
            var s = SVG.selectAll('.bounding-rect').filter(function () {
                return found = d3.select(this).attr("data-team") == team && d3.select(this).attr("data-csorps") == csorps;
            });
            s.attr('x', x)
                .attr('y', y)
                .attr('width', width)
                .attr('height', height);
            if (p.attrs.teamboxesvisible && width > 0) s.style("display", "block");

            // text is trickier - teams are not removed when reduced
            var s = SVG.selectAll('.bounding-rect-text').filter(function () {
                return found = d3.select(this).attr("data-team") == team && d3.select(this).attr("data-csorps") == csorps;
            });
            s.attr('x', x + space / 2)
                .attr('y', y + space * 3 / 4);
            if (p.attrs.teamboxesvisible && width > 0) s.style("display", "block");

        }
    });

};

async function showTeams() {
    // the first two toggle together
    if ($('#svgChart').is(':visible')) {
        console.log("cs page");
        p = params; p2 = paramsp
    }
    else if ($('#svgChartP').is(':visible')) {
        console.log("cp page");
        p = paramsp; p2 = params
    }
    else if ($('#teamChart').is(':visible')) {
        console.log("t page");
        p = paramst; p2 = null
    }

    if (!p.attrs.teamboxesvisible) {

        for (const [key, s] of Object.entries(svgs)) {
            svgs[key].selectAll('.bounding-rect').style("display", "block");
            svgs[key].selectAll('.bounding-rect-text').style("display", "block");
        }

        if ($('#svgChart').is(':visible')) boxTeams("cs");
        else if ($('#svgChartP').is(':visible')) boxTeams("p");
        else if ($('#teamChart').is(':visible')) boxTeams("t");

        $(".btn-show-teams").html("Hide Teams <span class='icon' /> <i class=\"fa fa-users\" aria-hidden=\"true\"></i></span>");

        p.attrs.teamboxesvisible = true;
        if (p2 != null) p2.attrs.teamboxesvisible = true;
    }
    else {
        for (const [key, s] of Object.entries(svgs)) {
            svgs[key].selectAll('.bounding-rect').style("display", "none");
            svgs[key].selectAll('.bounding-rect-text').style("display", "none");
        }

        $(".btn-show-teams").html("Show Teams <span class='icon' /> <i class=\"fa fa-users\" aria-hidden=\"true\"></i></span>");

        p.attrs.teamboxesvisible = false;
        if (p2 != null) p2.attrs.teamboxesvisible = false;

    }
}

// general page functions

function masterExpand() {
    params.funcs.expandAll();
    paramsp.funcs.expandAll()
}
function masterCollapse() {
    params.funcs.collapseAll();
    paramsp.funcs.collapseAll()
}


function searchPeople() {
    searchtype = "people";
    d3.selectAll('.user-search-box')
        .transition()
        .duration(250)
        .style('width', '320px')
        .style('border', '1px solid #c7dddb')

    $('#searchhint').html("By Firstname, Lastname or Skills");
}

function closeSearchBox() {
    d3.selectAll('.user-search-box')
        .transition()
        .duration(250)
        .style('width', '0px')
        .style('border', '0px')
        .each("end", function () {
            params.funcs.clearResult();
            clear('.search-input');
        });

}

function searchTeam() {

    searchtype = "team";
    d3.selectAll('.user-search-box')
        .transition()
        .duration(250)
        .style('width', '320px')
        .style('border', '1px solid #c7dddb')
    $('#searchhint').html("By Business Unit, Sub-Unit, Team Name");
}

// find people in trees
function findInTree(rootElement, searchText) {
    var result = [];
    // use regex to achieve case insensitive search and avoid string creation using toLowerCase method
    var regexSearchWord = new RegExp(searchText, "i");

    recursivelyFindIn(rootElement, searchText);

    return result;

    function recursivelyFindIn(user) {
        if (user.Name.match(regexSearchWord)) {
            result.push(user)
        }
        else if (user.skills && user.skills.length>0 && user.skills.toString().match(regexSearchWord)) {
            result.push(user)
        }

        var childUsers = user.children ? user.children : user._children;
        if (childUsers) {
            childUsers.forEach(function (childUser) {
                recursivelyFindIn(childUser, searchText)
            })
        }
    };
}

// find teams in tree
function findTeamInTree(rootElement, searchText) {
    var result = [];
    // use regex to achieve case insensitive search and avoid string creation using toLowerCase method
    //var regexSearchWord = new RegExp(searchText, "i");
    var found = false;

    recursivelyFindIn(rootElement, searchText);

    return result;

    function recursivelyFindIn(user) {
        // hack here = reset all the ids otherwise it might mess up org chart
        delete user.id;

        // match to team string
        var team = teamNameGen(user);

        // we need to put only the TEAM LEADER or we will keep repeating
        if (team == searchText.toLowerCase()) {
            // the rest of the team should fall under this person?? if we have 2 equal leaders there is a problem
            result.push(user);
            user["show"] = true;
            return result;
        }
        else user["show"] = false;

        var childUsers = user.children ? user.children : user._children;
        if (childUsers) {
            childUsers.forEach(function (childUser) {
                recursivelyFindIn(childUser, searchText)
            })
        }
    };
}


// find teams in tree that match, flag each person as show or hide
function hideTeamChildren(rootElement, searchText) {

    recursivelyFindIn(rootElement, searchText, null);

    function recursivelyFindIn(user, searchText, parent) {

        // match to team string
        var team = teamNameGen(user);

        if (team == searchText.toLowerCase() || user.Team == "Fake") {
            user["show"] = true;

            // if the parent is hidden we are going to need to pick this up and put it under 
            // the fake leader

            if (parent != null && !parent["show"]) {
                rootElement.children.push(user);
            }

        }
        else {
            user["show"] = false;

        }

        var childUsers = user.children ? user.children : user._children;
        if (childUsers) {
            childUsers.forEach(function (childUser) {
                //need the parent for deletion
                recursivelyFindIn(childUser, searchText, user)
            })
        }
    };
    rootElement = adjustTeamChildren(rootElement);
    return rootElement;
}

// rnow delete all of the children that should not be shown
function adjustTeamChildren(rootElement) {

    recursivelyFindIn(rootElement, null);

    function recursivelyFindIn(user, parent) {

        if (parent != null && !user["show"]) {

            // delete users without this team from parents
            var childUsers = parent.children;
            if (childUsers == null || childUsers.length == 0) childUsers = parent._children;
            if (user["_id"] != 0 && childUsers != null) {
                var nodeToDelete = _.where(childUsers, { "_id": user["_id"] });
                if (nodeToDelete) {
                    parent.children = _.without(parent.children, nodeToDelete[0]);
                    parent._children = _.without(parent._children, nodeToDelete[0]);
                }
            }
        }

        var childUsers = user.children ? user.children : user._children;
        if (childUsers) {
            childUsers.forEach(function (childUser) {
                //need the parent for deletion
                recursivelyFindIn(childUser, user)
            })
        }
    };
    return rootElement;
}


function reflectResults(results) {
    var htmlStringArray = results.map(function (result) {
        if (typeof result.imgUrl == 'undefined' || result.imgUrl == "") result.imgUrl = getFlower();
        if (typeof result.profileUrl == 'undefined' || result.profileUrl == "") result.profileUrl = "";

        var strVar = "";
        strVar += "         <div class=\"list-item list-item-people\">";
        strVar += "          <a >";
        if (result.level) {
            strVar += "            <div class=\"banner\" style=\"background-color:" + result.colour + "\">" + result.level + "<\/div>";
        }
        strVar += "            <div class=\"image-wrapper\">";
        strVar += "              <img class=\"image\" src=\"" + result.imgUrl + "\"\/>";
        if (result.profileUrl !== "")
            strVar += "              <a target='_blank' href='" + result.profileUrl + "'><button class='btn-search-box btn-profile'>View Profile<\/button><\/a>";

        strVar += "            <\/div>";
        strVar += "            <div class=\"description\">";
        strVar += "              <p class=\"name\">" + result.Name + "<\/p>";
        strVar += "               <p class=\"position-name\">" + result.Position_Title + "<\/p>";
        strVar += "               <p class=\"area\">" + result.Business_Unit + "<\/p>";
        strVar += "               <p class=\"area\">" + result.Sub_Unit + "<\/p>";
        strVar += "               <p class=\"area\">" + result.Team + "<\/p>";
        strVar += "            <\/div>";
        strVar += "            <div class=\"buttons\">";
        strVar += "              <button class='btn-search-box btn-locate' onclick='locate(" + result.uniqueIdentifier + ",\"" + result.csorps + "\"" + ")'>Show <\/button>";
        strVar += "            <\/div>";
        strVar += "          <\/a>";
        strVar += "        <\/div>";
        return strVar;

    })

    var htmlString = htmlStringArray.join('');
    params.funcs.clearResult();

    var parentElement = get('.result-list');
    var old = parentElement.innerHTML;
    var newElement = htmlString + old;
    parentElement.innerHTML = newElement;
    set('.user-search-box .result-header', "RESULT - " + htmlStringArray.length);
}

function reflectTeamResults(results) {
    var htmlStringArray = results.map(function (result) {
        var strVar = "";
        strVar += "         <div class=\"list-item list-item-team\">";
        strVar += "            <div class=\"description\"><pre>";
        strVar += "              Business Unit: " + result.business_unit + "<br\/>";
        strVar += "              Sub Unit: " + result.sub_unit + "<br\/>";
        strVar += "              Team: " + result.team + "<br\/>";
        strVar += "            <div class=\"buttons\">";
        strVar += "              <button class='btn-search-box btn-locate' onclick='displayTeam(\"" + result.key + "\")'>Show <\/button>";
        strVar += "            <\/div>";
        strVar += "            <\/pre><\/div>";
        strVar += "        <\/div>";
        return strVar;

    })

    var htmlString = htmlStringArray.join('');
    params.funcs.clearResult();

    var parentElement = get('.result-list');
    var old = parentElement.innerHTML;
    var newElement = htmlString + old;
    parentElement.innerHTML = newElement;
    set('.user-search-box .result-header', "RESULT - " + htmlStringArray.length);

}

function clearResult() {
    set('.result-list', '<div class="buffer" ></div>');
    set('.user-search-box .result-header', "RESULT");
}

function listen() {
    var input = get('.user-search-box .search-input');

    input.addEventListener('input', function () {

        var value = input.value ? input.value.trim() : '';
        if (value.length < 3) {
            params.funcs.clearResult();
            paramsp.funcs.clearResult();
        } else {

            //searching people
            if (searchtype == "people") {
                var searchResult = params.funcs.findInTree(params.data, value);
                searchResult.forEach(function (s) { s.csorps = "cs"; });
                var searchResult2 = (paramsp.funcs.findInTree(paramsp.data, value));
                searchResult2.forEach(function (s) { s.csorps = "p"; });
                searchResult = searchResult.concat(searchResult2);
                reflectResults(searchResult);
            }

            //searching team
            else {
                var searchResult = [];
                Object.keys(team_dictionary).forEach(function (key) {
                    team = team_dictionary[key];
                    team.key = key;
                    if (team.business_unit.toLowerCase().indexOf(value) >= 0 ||
                        team.sub_unit.toLowerCase().indexOf(value) >= 0 ||
                        team.team.toLowerCase().indexOf(value) >= 0) {
                        searchResult.push(team);
                    }
                });
                reflectTeamResults(searchResult);
            }
        }
    });

}


// remove parent elements to stop data being circular
function cleanParents(rootElement) {

    recursivelyClean(rootElement);

    return rootElement;

    function recursivelyClean(user) {
        if (user.parent) {
            console.log("parent");
            delete user.parent;
        }


        var childUsers = user.children ? user.children : user._children;
        if (childUsers) {
            childUsers.forEach(function (childUser) {
                recursivelyClean(childUser)
            })
        }
    }
};


function displayTeam(team) {

    // remove button highlight
    $(".title_text").removeClass("selected");
    // disable expand and collapse all
    $(".btn-expand").addClass("btn-disabled");
    $(".btn-collapse").addClass("btn-disabled");

    // reset the parents - parents make it "circular" and stringify fails
    params.data = cleanParents(params.data)
    paramsp.data = cleanParents(paramsp.data)

    console.log(params.data);
    $("#teamChart").empty();

    // hide existing chart
    $(".svgChart").hide();
    $("#teamChart").show();

    // find the right data
    csteam = findTeamInTree(deepClone(params.data), team);
    pteam = findTeamInTree(deepClone(paramsp.data), team);
    // we have to make a copy or we will ruin the data - but these dom elements are circular
    // so json cannot handle
    children = csteam.concat(pteam);
    console.log(children);

    // we need to make a fake parent
    var fakeparent = {
        "Business_Unit": "Fake",
        "Sub_Unit": "Fake",
        "Team": "Fake",
        "Name": "Fake",
        "Position_Title": "Fake",
        "children": children,
        "_id": 0
    }

    // mark to hide reports from other teams
    hideTeamChildren(fakeparent, team);

    // create new params
    paramst.data = fakeparent;
    drawOrganizationChart(paramst, "team");

    // hide fake parent
    $(".level-0").addClass("level-fake");

    // show teams default on (so start off!)
    paramst.attrs.teamboxesvisible = false;
    showTeams();
}


//locate
function locate(id, csorps) {
    // might need to flip tab 

    $(".title_text").removeClass("selected");
    $(".svgChart").hide();

    if (csorps == "cs") {
        p = params;
        $("#title_text").addClass("selected");
        $("#svgChart").show();
        //reset box view if they are on - otherwise the calculations will continue with elements invisible
        if (p.attrs.teamboxesvisible) boxTeams("cs");
    }
    else {
        p = paramsp;
        $("#title_text_p").addClass("selected");
        $("#svgChartP").show();
        //reset box view if they are on - otherwise the calculations will continue with elements invisible
        if (p.attrs.teamboxesvisible) boxTeams("p");
    }

    /* collapse all and expand logged user nodes */
    if (!p.attrs.root.children) {
        if (!p.attrs.root.uniqueIdentifier == id) {
            p.attrs.root.children = p.attrs.root._children;
        }
    }
    if (p.attrs.root.children) {
        p.attrs.root.children.forEach(collapse);
        p.attrs.root.children.forEach(function (ch) {
            locateRecursive(ch, id)
        });
    }

    p.funcs.update(p.attrs.root, { locate: id });
}


function deepClone(item) {
    return JSON.parse(JSON.stringify(item));
}

function show(selectors) {
    display(selectors, 'initial')
}

function hide(selectors) {
    display(selectors, 'none')
}

function display(selectors, displayProp) {
    selectors.forEach(function (selector) {
        var elements = getAll(selector);
        elements.forEach(function (element) {
            element.style.display = displayProp;
        })
    });
}

function set(selector, value) {
    var elements = getAll(selector);
    elements.forEach(function (element) {
        element.innerHTML = value;
        element.value = value;
    })
}

function clear(selector) {
    set(selector, '');
}

function get(selector) {
    return document.querySelector(selector);
}

function getAll(selector) {
    return document.querySelectorAll(selector);
}


function collapse(d) {
    if (d._children) {
        d._children.forEach(collapse);
    }
    if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
    }

    if (d._children) {
        // if node has children and it's collapsed, then  display +
        setToggleSymbol(d, EXPAND_SYMBOL);
    }
}

function setCollapsibleSymbolProperty(d) {
    if (d._children) {
        d.collapseText = EXPAND_SYMBOL;
    } else if (d.children) {
        d.collapseText = COLLAPSE_SYMBOL;
    }
}

function setToggleSymbol(d, symbol) {
    d.collapseText = symbol;
    d3.select("*[data-id='" + d.uniqueIdentifier + "']").select('text').text(symbol);
}

function locateRecursive(d, id) {
    if (d.uniqueIdentifier == id) {
        expandParents(d);
    } else if (d._children) {
        d._children.forEach(function (ch) {
            ch.parent = d;
            locateRecursive(ch, id);
        })
    } else if (d.children) {
        d.children.forEach(function (ch) {
            ch.parent = d;
            locateRecursive(ch, id);
        });
    };

}

/* expand current nodes collapsed parents */
function expandParents(d) {
    while (d.parent) {
        d = d.parent;
        if (!d.children) {
            d.children = d._children;
            d._children = null;
            setToggleSymbol(d, COLLAPSE_SYMBOL);
        }

    }
}

function toggleFullScreen() {

    if ((document.fullScreenElement && document.fullScreenElement !== null) ||
        (!document.mozFullScreen && !document.webkitIsFullScreen)) {

        $(".btn-fullscreen").html("Exit Full Screen <span class='icon' /> <i class=\"fa fa-compress\" aria-hidden=\"true\"></i></span>");

        if (document.documentElement.requestFullScreen) {
            document.documentElement.requestFullScreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullScreen) {
            document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
        }
        d3.select(params.selector + ' svg').attr('width', screen.width).attr('height', screen.height);

    } else {

        $(".btn-fullscreen").html("Full Screen (Recommended) <span class='icon' /> <i class=\"fa fa-expand\" aria-hidden=\"true\"></i></span>");

        if (document.cancelFullScreen) {
            document.cancelFullScreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
        }
        d3.select(params.selector + ' svg').attr('width', params.chartWidth).attr('height', params.chartHeight);
    }

}



// reset the entire page for if it all gets too much!
function refresh() {
    //empty svgs
    $(params.selector).empty();
    $(paramsp.selector).empty();
    $(paramst.selector).empty();

    // resize svgs
    params.chartWidth = window.innerWidth - 80;
    params.chartHeight = window.innerHeight - 10;
    d3.select(params.selector + ' svg').attr('width', params.chartWidth).attr('height', params.chartHeight);

    paramsp.chartWidth = window.innerWidth - 80;
    paramsp.chartHeight = window.innerHeight - 10;
    d3.select(paramsp.selector + ' svg').attr('width', paramsp.chartWidth).attr('height', paramsp.chartHeight);

    paramst.chartWidth = window.innerWidth - 80;
    paramst.chartHeight = window.innerHeight - 10;
    d3.select(paramst.selector + ' svg').attr('width', paramst.chartWidth).attr('height', paramst.chartHeight);

    // reset zoom

    // redraw
    drawOrganizationChart(params);
    drawOrganizationChart(paramsp);

}

// highlight vacant seats, and put a vacancy counter in line managers tag
show_vacancies = false;
function showVacancies() {
    if (!show_vacancies) {
        $(".vacant").addClass("vacant-highlight");
        $(".vacant-count").removeClass("vacant-count-hide");
        $(".btn-vacant").html('Hide Vacancies <span class="icon"/> <i class="fa fa-chair" aria-hidden="true"></i></span>');
        show_vacancies = true;
    } else {
        $(".vacant").removeClass("vacant-highlight");
        $(".vacant-count").addClass("vacant-count-hide");
        $(".btn-vacant").html('Show Vacancies <span class="icon"/> <i class="fa fa-chair" aria-hidden="true"></i></span>');
        show_vacancies = false;
    }
}

// make a tag for matchin with BU, SU and Team Name blended
function teamNameGen(d) {
    var team = (d.Team + d.Sub_Unit + d.Business_Unit).replace(/[^a-zA-Z0-9\n\.]/ig, "_").toLowerCase();
    return team;
}


function equalToEventTarget() {
    return this == d3.event.target;
}

d3.select("body").on("click", function () {
    var outside = tooltip.filter(equalToEventTarget).empty();
    if (outside) {
        tooltip.style('opacity', '0').style('display', 'none');
    }
});
