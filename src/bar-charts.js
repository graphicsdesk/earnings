import { select, selectAll, mouse } from 'd3-selection';
import { max } from 'd3-array';
import { format } from 'd3-format';
import { f } from 'd3-jetpack/essentials';

import SCORECARD_DATA from '../data/data.json';
import { CU_NAME } from './constants';

function graphBars(container, { cred, column }, highlights = []) {
  const data = SCORECARD_DATA
    .filter(row => row.institution === CU_NAME && row.cred === cred)
    .map(row => ({ field: row.field, [column]: row[column] }))
    .sort((a, b) => (b[column] - a[column]) * (column === 'debt' ? 1 : -1));
  const maxValue = max(data, d => d[column]);

  // Title
  if (column !== 'earnings')
    container.append('dummy');
  container.append('p.bar-chart-title')
    .text(`Median ${column} for ${cred.toLowerCase()}'s degrees at Columbia`);
  if (column === 'earnings')
    container.append('dummy');

  // Create bars
  data.forEach((d, i) => {
    const { field } = d;
    const identifier = 'bar-' + field.replace(/\s/g, '-');

    if (column !== 'earnings')
      container.append('p.bar-label.' + identifier)
        .text(field);
    const barContainer = container.append('div.bar-container.bar-container-' + column);
    const numberLabel = (x => {
      if ((x / 1000) >= 1)
        x = Math.round(x / 1000) + 'k';
      return '$' + x;
    })(d[ column ]);
    const barNumberLabel = barContainer.append('p.bar-number-label.' + identifier)
      .text(numberLabel);

    if (column === 'earnings')
      barNumberLabel.translate([ -numberLabel.length * 10, 0 ])

    const divNS = 'div.bar.' + identifier;
    const bar = column === 'earnings' ? barContainer.append(divNS) : barContainer.insert(divNS, ':first-child');

    if (column === 'earnings')
      container.append('p.bar-label.' + identifier)
        .text(field);

    const setLabelVisibility = visibility => {
      if (highlights.includes(field))
        visibility = 1;

      for (const el of document.getElementsByClassName(identifier)) {
        if (el.nodeName === 'P')
          select(el).st({ opacity: visibility });
        else {
          const defaultOpacity = 0.75;
          select(el).st({ opacity: defaultOpacity + visibility * (1 - defaultOpacity) });
        }
      }      
    };

    setLabelVisibility(0);
    bar.st({ width: d[column] / maxValue * 100 + '%' })
      .on('mouseover', () => setLabelVisibility(1))      
      .on('mouseleave', () => setLabelVisibility(0))
      .on('touchstart', () => setLabelVisibility(1))
      .on('touchend', () => setLabelVisibility(0));
  })
}

for (const container of document.getElementsByClassName('bars-container')) {  
  // Get desired highlights
  const highlights = container
    .getAttribute('data-highlights')
    .split(';')
    .map(h => h.trim());

  // Derive subject data
  const columns = container
    .getAttribute('data-columns')
    .split(';')
    .map(c => {
      let [ cred, column ] = c.split(': ');
      cred = { 'B': 'Bachelor', 'M': 'Master' }[ cred.trim() ];
      return { cred, column }
    })
    .filter(c => c.column === 'debt' || c.column === 'earnings');
  if (columns.length === 0) {
    console.error('No valid columns in this string:', container.getAttribute('data-columns'));
    break;
  }

  // Create chart containers and graph and title each one
  select(container)
    .appendMany('div.bar-chart-container', columns)
    .each(function(column) {
      const chartContainer = select(this);
      graphBars(chartContainer, column, highlights);
    });
}
