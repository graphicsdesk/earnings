import { scaleLinear } from 'd3-scale';
import { select, selectAll } from 'd3-selection';
import { max } from 'd3-array';
import { axisLeft, axisBottom } from 'd3-axis';
import { format } from 'd3-format';
import { f } from 'd3-jetpack/essentials';
import SCORECARD_DATA from '../data/data.json';

const SIZE = 300;
const ROTATED_SIZE = SIZE * 1.414;
const margin = { top: 5, right: 5, left: 40, bottom: 40 };

const chartsContainers = document.getElementsByClassName('charts-container');

function graphSubject({ cred, field }, container) {
  const data = SCORECARD_DATA.filter(row => cred === row.cred && field === row.field);

  const gSize = SIZE - margin.left - margin.top;
  const x = scaleLinear()
    .domain([0, max(data, r => Math.max(r.debt, r.earnings))])
    .range([0, gSize]);
  const y = scaleLinear()
    .domain([0, max(data, r => Math.max(r.debt, r.earnings))])
    .range([gSize, 0]);
  const xAxis = axisBottom()
    .scale(x)
    .tickSize(-gSize)
    .tickFormat(format('$~s'));
  const yAxis = axisLeft()
    .scale(y)
    .tickSize(-gSize)
    .tickFormat(format('$~s'));

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

  // Create dots
  svg.appendMany('circle', data)
    .at({
      cx: r => x(r.debt),
      cy: r => y(r.earnings),
      r: 4,
    });
}

for (const container of chartsContainers) {
  const subjects = container
    .getAttribute('data-subjects')
    .split(';')
    .map(subject => {
      let [ cred, field ] = subject.split(': ');
      cred = { 'B': 'Bachelor', 'M': 'Master' }[ cred.trim() ];
      return { cred, field };
    });

  select(container).appendMany('div.chart-container', subjects)
    .each(function(subj) {
      const subjContainer = select(this);
      subjContainer.st({
        width: ROTATED_SIZE,
        height: ROTATED_SIZE,
        paddingTop: (ROTATED_SIZE - SIZE) / 3,
      })
      graphSubject(subj, subjContainer);
      subjContainer.append('p.subject-title')
        .st({
          marginTop: (ROTATED_SIZE - SIZE) / 2 - margin.bottom / 2,
        })
        .text(subj.field);
    })
}

console.log()