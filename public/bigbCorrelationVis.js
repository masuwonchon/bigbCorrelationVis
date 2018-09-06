import "plugins/bigbCorrelationVis/bigbCorrelationVis.less";
import 'plugins/bigbCorrelationVis/bigbCorrelationVisController';
import { TemplateVisTypeProvider } from 'ui/template_vis_type/template_vis_type';
import { VisTypesRegistryProvider } from 'ui/registry/vis_types';
import { VisSchemasProvider } from 'ui/vis/schemas';
import bigbVisTemplate from 'plugins/bigbCorrelationVis/bigbCorrelationVis.html';
import bigbVisParamsTemplate from 'plugins/bigbCorrelationVis/bigbCorrelationVisParams.html';

VisTypesRegistryProvider.register(BigbVisTypeProvider);

function BigbVisTypeProvider(Private) {
  const TemplateVisType = Private(TemplateVisTypeProvider);
  const Schemas = Private(VisSchemasProvider);
  return new TemplateVisType({
    name: 'Bigb',
    title: 'Bigb Correlation Analysis',
    icon: 'fa-connectdevelop',
    description: 'Displays analysis as an interactive correlation of collecting security events',
    category: 'bigb',
    template: bigbVisTemplate,
    params: {
      defaults: {
        showLabels: true,
        showPopup: false,
        nodeFilter: false,
	hideEdgesOnDrag: false,
        showColorLegend: true,
        nodePhysics: true,
        firstNodeColor: '#FD7BC4',
        secondNodeColor: '#00d1ff',
        canvasBackgroundColor: '#FFFFFF',
        shapeFirstNode: 'dot',
        shapeSecondNode: 'box',
        displayArrow: false,
        posArrow: 'to',
        shapeArrow: 'arrow',
        smoothType: 'continuous',
        scaleArrow: 1,
        maxCutMetricSizeNode: 5000,
        maxCutMetricSizeEdge: 5000,
        minCutMetricSizeNode: 0,
        maxNodeSize: 100,
        minNodeSize: 1,
	maxNodeLine: 100,
	minNodeLine: 1,
	lineLength: 100,
        springConstant: 0.001,
        gravitationalConstant: -35000,
        labelColor: '#000000'
      },
      editor: bigbVisParamsTemplate
    },

    hierarchicalData: function (vis) {
      return true;
    },

    schemas: new Schemas([
      {
        group: 'metrics',
        name: 'size_node',
        title: 'Node Size',
        max: 1
      },
      {
        group: 'metrics',
        name: 'size_edge',
        title: 'Edge Size',
        max: 1
      },
      {
        group: 'buckets',
        name: 'first',
        icon: 'fa fa-circle-thin',
        mustBeFirst: 'true',
        title: 'Node',
        min: 1,
        aggFilter: ['terms']
      }
    ])
  });
}

export default BigbVisTypeProvider;
