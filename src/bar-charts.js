// import { scaleLinear } from 'd3-scale';
import { select, selectAll, mouse } from 'd3-selection';
import { max } from 'd3-array';
// import { format } from 'd3-format';
import { f } from 'd3-jetpack/essentials';

function graphBars() {
  // TODO
}

for (const container of document.getElementsByClassName('bars-container')) {  
  // Derive subject data
  const dimensions = container
    .getAttribute('data-dimension')
    .split('; ');

  // Create chart containers and graph and title each one
  select(container)
    .appendMany('div.bar-chart-container', dimensions)
    .each(function(dimension) {
      const chartContainer = select(this);
      graphBars(dimension, chartContainer);
    });
}
