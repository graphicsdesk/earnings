import { scaleLinear } from 'd3-scale';
import { select, selectAll, mouse } from 'd3-selection';
import { max } from 'd3-array';
import { axisLeft, axisBottom } from 'd3-axis';
import { format } from 'd3-format';
import { Delaunay } from 'd3-delaunay';
import { f } from 'd3-jetpack/essentials';

import SCORECARD_DATA from '../data/data.json';
import { CU_NAME } from './constants';

const VORONOI_RADIUS = 50;
const CIRCLE_RADIUS = 6.5;

const SIZE = 300;
const ROTATED_SIZE = SIZE * 1.414;
const margin = { top: 20, right: 20, left: 55, bottom: 55 };
const gSize = SIZE - margin.left - margin.top;
const containerPadding = (ROTATED_SIZE - SIZE) / 2 - margin.bottom;

const tooltip = select('#tooltip');
const tooltipText = tooltip.append('p');

const formatAxis = (axis, scale) => axis.scale(scale)
  .tickSize(-gSize)
  .tickFormat(format('$~s'))
  .ticks(4);

function graphSubject(container, { cred, field }) {
  const data = SCORECARD_DATA.filter(row => cred === row.cred && field === row.field);

  // Create scale and axis functions
  const x = scaleLinear()
    .domain([0, max(data, r => Math.max(r.debt, r.earnings))])
    .range([0, gSize]);
  const y = scaleLinear()
    .domain([0, max(data, r => Math.max(r.debt, r.earnings))])
    .range([gSize, 0]);
  const xAxis = formatAxis(axisBottom(), x);
  const yAxis = formatAxis(axisLeft(), y);

  // Create svg
  const svg = container.append('svg')
    .at({
      width: SIZE,
      height: SIZE,
    })
    .append('g')
    .translate([ margin.left, margin.top ])

  // Create axes
  svg.append('g.x-axis')
    .translate([ 0, gSize ])
    .call(xAxis);
  svg.append('g.y-axis')
    .call(yAxis);

  // Create axis labels
  svg.append('text.axis-label')
    .translate([ gSize / 2, gSize + margin.bottom ])    
    .text('More debt');  
  svg.append('text.axis-label')
    .st({ transform: `translate(${-margin.left}px, ${gSize / 2}px) rotate(90deg)` })
    .text('More earnings');
  
  // Create dots
  svg.append('g.circles')
    .appendMany('circle', data)
    .at({
      cx: r => x(r.debt),
      cy: r => y(r.earnings),
      r: CIRCLE_RADIUS,
      fillOpacity: 0.6,
    });

  const cuDatum = data.filter(row => row.institution === CU_NAME);
  console.log(cuDatum)
  svg.append('text.institution-label')
    .at({
      x: x(cuDatum.debt),
      y: y(cuDatum.earnings),
    });

  // Create Delaunay
  const delaunay = Delaunay.from(data, d => x(d.debt), d => y(d.earnings));
  const rotatedGSize = gSize * 1.414;
  function mousemoved() {
    let [ mx, my ] = mouse(select(this).node());
    const index = delaunay.find(mx, my);
    const { x: containerX, y: containerY } = container.node().getBoundingClientRect();

    if (index !== null) {
      const datum = data[ index ];
      const datumX = x(datum.debt);
      const datumY = y(datum.earnings);
      if (distance(datumX, datumY, mx, my) > VORONOI_RADIUS)
        return mouseleft();

      circleHighlight.at({ cx: datumX, cy: datumY }).st({ opacity: 1 });

      // Baseline calculations
      let top = containerY + rotatedGSize - mx / 1.414 - (gSize - my) / 1.414 + 32;
      let left = containerX + rotatedGSize / 2 + mx / 1.414 - (gSize - my) / 1.414 + 52;
      // Adjustments
      const ADJUST = 10
      top += ADJUST
      left += ADJUST

      // TODO: ADJUST ORIENTATION IF OVER SCREEN
      tooltip.st({
        top,
        left,
        opacity: 1,
      });
      tooltipText.html(`
        <b>${datum.institution}</b><br/>
        Median debt: ${format('$,')(datum.debt)}<br/>
        Median earnings: ${format('$,')(datum.earnings)}<br/>
      `)
      // TODO: tooltip things
    }
  }
  const mouseleft = () => {
    circleHighlight.st({ opacity: 0 });
    tooltip.st({ opacity: 0 });
  }

  const circleHighlight = svg.append('circle#circle-highlight')
    .at({ r: CIRCLE_RADIUS })
    .st({ opacity: 0 });
  const rect = svg.append('rect')
    .at({
      fill: 'transparent',
      width: SIZE,
      height: SIZE,
    })
    .on('mousemove', mousemoved)
    .on('mouseleave', mouseleft);
}

for (const container of document.getElementsByClassName('charts-container')) {
  // Derive subject data
  const subjects = container
    .getAttribute('data-subjects')
    .split(';')
    .map(subject => {
      let [ cred, field ] = subject.split(': ');
      cred = { 'B': 'Bachelor', 'M': 'Master' }[ cred.trim() ];
      return { cred, field };
    });

  // Create chart containers and graph and title each one
  select(container)
    .st({
      marginTop: -containerPadding,
      paddingBottom: containerPadding,
    })
    .appendMany('div.chart-container', subjects)
    .each(function(subj) {
      const subjContainer = select(this);
      subjContainer.st({
        width: ROTATED_SIZE,
        height: ROTATED_SIZE - (ROTATED_SIZE - SIZE) / 2,
        paddingTop: containerPadding,
      })
      .append('p.subject-title')
      .st({
        marginBottom: (ROTATED_SIZE - SIZE) / 2 - margin.bottom + 15,
      })
      .text(subj.field);
      graphSubject(subjContainer, subj);
    });
}

// Utility function; cartesian distance
function distance(px, py, mx, my) {
  const a = px - mx;
  const b = py - my;
  return Math.sqrt(a * a + b * b);
}