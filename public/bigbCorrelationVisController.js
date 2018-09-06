import { uiModules } from 'ui/modules';
import { notify } from 'ui/notify';
import { FilterBarQueryFilterProvider } from 'ui/filter_bar/query_filter';
import { AggTypesBucketsCreateFilterTermsProvider } from 'ui/agg_types/buckets/create_filter/terms';
import { AggTypesBucketsCreateFilterFiltersProvider } from 'ui/agg_types/buckets/create_filter/filters';
import { AggResponseTabifyProvider } from 'ui/agg_response/tabify/tabify';

const module = uiModules.get('kibana/transform_vis', ['kibana']);
const visN = require('vis');
const randomColor = require('randomcolor');
const ElementQueries = require('css-element-queries/src/ElementQueries');
const ResizeSensor = require('css-element-queries/src/ResizeSensor');

module.controller('bigbCorrelationVisController', function ($scope, $sce, getAppState, Private) {
    var bigb_id = "net_" + $scope.$id;
    var loading_id = "loading_" + $scope.$parent.$id;

    const queryFilter = Private(FilterBarQueryFilterProvider);
    const createTermsFilter = Private(AggTypesBucketsCreateFilterTermsProvider);
    const createFilter = Private(AggTypesBucketsCreateFilterFiltersProvider);
    const tabifyAggResponse = Private(AggResponseTabifyProvider);

    $scope.errorCustom = function(message, hide){
      if(!message) message = "General Error. Please undo your changes.";
      if(hide) {
	$("#" + bigb_id).hide();
      	$("#" + loading_id).hide();
      }
      notify.error(message);
    }

    $scope.initialShows = function(){
      $("#" + bigb_id).show();
      $("#" + loading_id).show();
      $("#errorHtml").hide();
    }

    $scope.startDynamicResize = function(network){
        for (var i = 0; i < $(".vis-container" ).length; i++) {
            if($(".vis-container")[i].children[0].children[1] && $(".vis-container")[i].children[0].children[1].id == bigb_id){
                var viscontainer = $(".vis-container")[i];
                break;
            }
        };
        new ResizeSensor(viscontainer, function() {
            network.setSize('100%', viscontainer.clientHeight);
        });
    }

    $scope.$watchMulti(['esResponse', 'vis.params'], function ([resp]) {
        if (resp) {
            $("#" + loading_id).hide();
	    if($scope.vis.aggs.bySchemaName['first'] == undefined){
		return
		}
            else if($scope.vis.aggs.bySchemaName['first'].length >= 1){
	        if (popupMenu !== undefined) {
		    popupMenu.parentNode.removeChild(popupMenu);
		    popupMenu = undefined;
		}

                $scope.initialShows();
                $(".secondNode").hide();

		var dataNodes = [];
		var dataEdges = [];
		var dataNodesId = [];
		var dataNodesCol = [];
		var dataBuckets = [];
		var ixx = 0;
		var popupMenu = undefined;

		var getRandomColor = function(seed){
		    var opt = {};
		    if (seed) opt.seed = seed;
		    while(true){
			var confirmColor = randomColor(opt);
                        if(dataNodesCol[seed] || dataNodesCol.indexOf(confirmColor) == -1){
                             dataNodesCol.push(confirmColor);
                             dataNodesCol[seed] = confirmColor;
                             return confirmColor;
                        }
		    }
		}

		var dataMetrics = $scope.dataMetrics = [];
		var nodeType = {};
		$scope.processTableGroups = function (tableGroups) {
   		  tableGroups.tables.forEach(function (table) {
   		    table.rows.forEach(function (row, i) {
			row.forEach(function (item, r){
				var rootCol = table.columns[r].title.split(':')[0];
				var rootId = r / 2;
				if(r % 2 === 0) {
				      nodeType[item] = rootCol;
		   		      dataMetrics.push({
		   		        bucket: rootCol,
		   		        id: rootId,
		   		        value: item
		   		      });
				}
			});
		    });
   		  });
   		};

		try {
			var tableGroups = tabifyAggResponse($scope.vis, resp);
		} catch(e) { $scope.errorCustom('tablegroup error',e); }

		var buckeroo = function(data,akey,bkey){
                  var dict = {};
                  for (var jxx in $scope.dataMetrics) {
                    dict[$scope.dataMetrics[jxx].value] = $scope.dataMetrics[jxx].bucket;
                    }

		  for (var kxx in data) {
		    if (!data.hasOwnProperty(kxx)) continue;
		    var agg = data[kxx];

		    if (agg.key && agg.key.length>0) {

			var found = dataNodes.some(function (el) {
			    return el.key === agg.key;
			});

		        if (!found||!dataNodesId[agg.key]) {
				dataNodesId[agg.key] = ixx;

			        var nodeReturn = {
					id: dataNodesId[agg.key],
					key: agg.key,
					value: agg.doc_count,
					color: getRandomColor(agg.key),
					shape: $scope.vis.params.shapeFirstNode,
        		                font : {
		                          color: $scope.vis.params.labelColor
		                        }
				};

				if (nodeType[nodeReturn.key] === "src_ip.keyword") {
					nodeReturn.color = $scope.vis.params.firstNodeColor;
				}
 
				if (nodeType[nodeReturn.key] === "dest_ip.keyword") {
					nodeReturn.color = $scope.vis.params.secondNodeColor;
				}

			        if($scope.vis.params.showLabels){
		                    nodeReturn.label = agg.key;

		                }

		                if($scope.vis.params.showPopup){
		                    var inPopup = "<p>" + agg.key + "</p>";
		                    if(akey){
		                      inPopup += "<p> Parent: " + akey + "</p>";
				    }
		                    nodeReturn.title = inPopup;
		                }

			        dataNodes.push(nodeReturn);
			}

		        if (akey) {
				dataEdges.push({ from: dataNodesId[akey], value: agg.doc_count, to: dataNodesId[agg.key] });
			}

			ixx++;
		    }

		    if (agg.buckets) {
		        buckeroo(agg.buckets,agg.key);
		    } else {
		      for (var ak in agg) {
		         if (agg[ak].buckets) {
				buckeroo(agg[ak].buckets,agg.key,akey);
			}
		      }
		    }
		  }
		}

                if($scope.vis.aggs.bySchemaName['colornode']){
                        $scope.errorCustom('Color Node is not allowed in Multi-Node mode. Please remove and try again!',1);
                        return;
                }

                if($scope.vis.aggs.bySchemaName['size_node']){
                    var metricsAgg_sizeNode = $scope.vis.aggs.bySchemaName['size_node'][0];
                }
                if($scope.vis.aggs.bySchemaName['size_edge']){
                    var metricsAgg_sizeEdge = $scope.vis.aggs.bySchemaName['size_edge'][0];
                }

		try {
			$scope.processTableGroups(tableGroups);
			buckeroo(resp.aggregations);
		} catch(e) {
	                $scope.errorCustom('OOps! Aggs to Graph error: '+e);
			return;
		}
                var nodesDataSet = new visN.DataSet(dataNodes);
                var edgesDataSet = new visN.DataSet(dataEdges);
                var container = document.getElementById(bigb_id);
                container.style.height = container.getBoundingClientRect().height;
                container.height = container.getBoundingClientRect().height;

                var data = {
                    nodes: nodesDataSet,
                    edges: edgesDataSet
                };

                var options = {
                    height: container.getBoundingClientRect().height.toString(),
                    physics: {
                        barnesHut: {
                            gravitationalConstant: parseInt($scope.vis.params.gravitationalConstant),
                            springConstant: parseFloat($scope.vis.params.springConstant),
                            springLength: parseInt($scope.vis.params.lineLength)
                        }
                    },
                    edges: {
                        arrows: {
                            to: {
                                enabled: $scope.vis.params.displayArrow,
                                scaleFactor: $scope.vis.params.scaleArrow,
                                type: $scope.vis.params.shapeArrow
                            }
                        },
                        arrowStrikethrough: false,
                        smooth: {
			    type: 'continuous'
                        },
                        scaling:{
                            min:parseInt($scope.vis.params.minNodeLine),
                            max:parseInt($scope.vis.params.maxNodeLine)
                        }
                    },
                    interaction: {
                        hideEdgesOnDrag: $scope.vis.params.hideEdgesOnDrag,
                        hover: true
                    },
                    nodes: {
                        physics: $scope.vis.params.nodePhysics,
                        scaling:{
                            min:parseInt($scope.vis.params.minNodeSize),
                            max:parseInt($scope.vis.params.maxNodeSize)
                        }
                    },
                    layout: {
                        improvedLayout: false
                    }
                }

                var network = new visN.Network(container, data, options);

		var noContext = function(){
      		  if (popupMenu !== undefined) {
      		    popupMenu.parentNode.removeChild(popupMenu);
      		    popupMenu = undefined;
      		  }
		}

                $scope.startDynamicResize(network);

                network.on("afterDrawing", function (canvasP) {
                    $("#" + loading_id).hide();
                });

                network.on("doubleClick", function (params) {
                    if($scope.vis.params.nodeFilter){
		      if(!params.nodes) return;
		      for (var nkey in dataNodesId) {
			if (dataNodesId[nkey] === params.nodes[0]) {
			  for (var mkey in dataMetrics) {
			    var zbucket = 0;
			    if (dataMetrics[mkey].value === nkey) {
				if (!dataMetrics[mkey].id) {
				     zbucket = 0;
				} else {
				     zbucket = dataMetrics[mkey].id;
				}
			  	try {
					const aggTermsConfig = $scope.vis.aggs.byTypeName.terms[zbucket];
	      				var xfilter = createTermsFilter(aggTermsConfig, nkey);
					if (xfilter) { queryFilter.addFilters([xfilter]); }
					break;
				} catch(e) { $scope.errorCustom('Error creating Filter: '+e); return; }
			    }
			  }
			}
		      }
		   }
		});

		network.on('select', function(params) {
			noContext();
      		});
		network.on('dragStart', function(params) {
			noContext();
      		});

		network.on('onFilterClick', function(params) {
	  	  try {
		      var negate = params.negate || false;
		      var node = params.node;
		      noContext();
		      for (var nkey in dataNodesId) {
			if (dataNodesId[nkey] === node ) {
			  var zbucket = 0;
			  for (var mkey in dataMetrics) {
			    if (dataMetrics[mkey].value === nkey) {
				if (!dataMetrics[mkey].id) {
				     zbucket = 0;
				} else {
				     zbucket = dataMetrics[mkey].id;
				}
				const aggTermsConfig = $scope.vis.aggs.byTypeName.terms[zbucket];
	      			var xfilter = createTermsFilter(aggTermsConfig, nkey);
				if (xfilter) {
					if (negate) xfilter.meta.negate = true;
					queryFilter.addFilters([xfilter]);
				}
				break;
			    }
			  }
			}
		      }
		  } catch(e) { $scope.errorCustom('Error creating Filter: '+e); }
		});

		network.on("oncontext", function (params) {
		        if(params.nodes && params.nodes.length>0){
		          var position = network.getPositions(params.nodes)[params.nodes[0]];
		          position = network.canvasToDOM(position);
		          params.event = "[original event]";
		          noContext();
			  try {
				  var radius = 1;
			          for (var nkey in dataNodes) {
				    if (dataNodes[nkey].id === params.nodes[0] && dataNodes[nkey].value) {
				      radius = parseInt(dataNodes[nkey].value) || 1;
				    }
			          }
			  } catch(e) { $scope.errorCustom(e); }

		          popupMenu = document.createElement("div");
		          popupMenu.setAttribute('id','visjsContext');

			  window.network = network;

			  var plus = document.createElement("span");
			  plus.setAttribute('id','kbnFilterPlus');
			  plus.setAttribute('role','button');
			  plus.setAttribute('onclick',"window.network.emit('onFilterClick',{ node:"+params.nodes[0]+",negate: false });");
		          plus.setAttribute('class','spacer fa fa-search-plus');
		          popupMenu.appendChild(plus);

			  var minus = document.createElement("span");
		          minus.setAttribute('class','spacer fa fa-search-minus');
			  minus.setAttribute('id','kbnFilterMinus');
			  minus.setAttribute('role','button');
			  minus.setAttribute('onclick',"window.network.emit('onFilterClick',{ node:"+params.nodes[0]+",negate: true });");
		          popupMenu.appendChild(minus);

		          var offsetLeft = container.offsetLeft;
		          var offsetTop = container.offsetTop;
		          popupMenu.className = 'popupMenu';
		          popupMenu.style.left = position.x - (25) + 'px';
		          popupMenu.style.top = position.y - (25) + 'px';
		          container.appendChild(popupMenu);
		        }
		});

		if(container) {
			container.addEventListener('contextmenu', function(e) {
     			  e.preventDefault();
			  return false;
     			});
		}

            }else{
                $scope.errorCustom('Error: Please select at least one Node',1);
            }
        }
    });
});
