import { scaleLinear } from 'd3-scale';
import { select, selectAll, mouse } from 'd3-selection';
import { max } from 'd3-array';
import { axisLeft, axisBottom } from 'd3-axis';
import { format } from 'd3-format';
import { Delaunay } from 'd3-delaunay';
import { f } from 'd3-jetpack/essentials';

import SCORECARD_DATA from '../data/data.json';
import { CU_NAME } from './constants';

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
window.mobilecheck = function() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

const VORONOI_RADIUS = isSafari ? 300 : 70; // TOOD: SHOULDNT NEED THIS
const CIRCLE_RADIUS = 6.5;

const SIZE = window.innerWidth < 460 ? window.innerWidth / 1.4 : 300;

const ROTATED_SIZE = SIZE * 1.414;
const margin = { top: 25, right: 25, left: 65, bottom: 65 };
const gSize = SIZE - margin.left - margin.top;
const containerPadding = (ROTATED_SIZE - SIZE) / 2 - margin.bottom;

const TOOLTIP_WIDTH = 190;
const tooltip = select('#tooltip').st({ width: TOOLTIP_WIDTH });
const tooltipText = tooltip.append('p');

if (window.mobilecheck()) {
  window.addEventListener('scroll', () => tooltip.st({ opacity: 0 }));
}

const formatAxis = (axis, scale) => axis.scale(scale)
  .tickSize(-gSize)
  .tickFormat(format('$~s'))
  .ticks(4);

function graphSubject(container, { cred, field }, maxValue) {
  const data = SCORECARD_DATA.filter(row => cred === row.cred && field === row.field);

  // Create scale and axis functions
  const x = scaleLinear().domain([ 0, maxValue * 1.05 ]).range([ 0, gSize ]);
  const y = scaleLinear().domain([ 0, maxValue * 1.05 ]).range([ gSize, 0 ]);
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
  const ADJUST = 8;
  svg.append('text.axis-label')
    .translate([ gSize / 2, gSize + margin.bottom - ADJUST ])
    .text('More debt ')
    .append('tspan')
    .text('⟶');
  svg.append('text.axis-label')
    .st({ transform: `translate(${-margin.left + ADJUST}px, ${gSize / 2}px) rotate(90deg)` })
    .html('<tspan>⟵</tspan> More earnings');
  
  // Create dots
  svg.append('g.circles')
    .appendMany('circle', data)
    .at({
      cx: r => x(r.debt),
      cy: r => y(r.earnings),
      r: CIRCLE_RADIUS,
      fillOpacity: 0.6,
    });

  const cuDatum = data.filter(row => row.institution === CU_NAME)[0];
  const doRightShift = cuDatum.field === 'Film/Video and Photographic Arts';

  if (isSafari) {
    let textX = x(cuDatum.debt) + 9;
    let textY = y(cuDatum.earnings) - 9;
    if (doRightShift) {
      textX -= 16;
      textY -= 16;
    }
    const cuLabel = svg.append('text.institution-label-safari').at({
        x: textX,
        y: textY,
        transform: `rotate(45 ${textX} ${textY})`,
      });
    cuLabel.append('tspan.text-background')
      .text('Columbia');
    cuLabel.append('tspan')
      .text('Columbia')
      .at({
        x: textX,
        y: textY,
      });
  } else {
    const cuLabel = svg.append(
      `text.institution-label${doRightShift ? '.right-shift' : ''}`
    )
    cuLabel.append('tspan.text-background')
      .text('Columbia')
      .at({
        x: x(cuDatum.debt),
        y: y(cuDatum.earnings),
      });
    cuLabel.append('tspan')
      .text('Columbia')
      .at({
        x: x(cuDatum.debt),
        y: y(cuDatum.earnings),
      });
  }

  svg.append('circle.circle-highlight')
    .at({
      cx: x(cuDatum.debt),
      cy: y(cuDatum.earnings),
      r: CIRCLE_RADIUS,
    })

  // Create Delaunay
  const delaunay = Delaunay.from(data, d => x(d.debt), d => y(d.earnings));
  const rotatedGSize = gSize * 1.414;

  let createdPolygons = false;

  function mousemoved() {
    let [ mx, my ] = mouse(select(this).node());

    let delaunayX = mx;
    let delaunayY = my;

    // holy shit transform
    if (isSafari) {
      const testCircle = svg.insert('circle', ':first-child').at({ cx: mx, cy: my, transform: 'rotate(45)' });
      const matrix = testCircle.node().getCTM();
      const pt = container.select('svg').node().createSVGPoint();
      pt.x = mx; pt.y = my;
      const { x: xT, y: yT } = pt.matrixTransform(matrix);
      delaunayX = xT - 96;
      delaunayY = yT + 18;
      testCircle.remove();
    }

    const index = delaunay.find(delaunayX, delaunayY);

    const { x: containerX, y: containerY } = container.node().getBoundingClientRect();

    if (index !== null) {
      const datum = data[ index ];
      const datumX = x(datum.debt);
      const datumY = y(datum.earnings);
      console.log(distance(datumX, datumY, mx, my));
      if (distance(datumX, datumY, mx, my) > VORONOI_RADIUS)
        return mouseleft();

      circleHighlight.at({ cx: datumX, cy: datumY }).st({ opacity: 1 });

      // Baseline calculations
      let top = containerY + rotatedGSize - mx / 1.414 - (gSize - my) / 1.414 + 32;
      let left = containerX + rotatedGSize / 2 + mx / 1.414 - (gSize - my) / 1.414 + 52;
      if (isSafari) {
        top = containerY + gSize + my + 28;
        left = containerX + gSize / 3 + mx;
      } else {
        // left += rotatedGSize / 2 - 20;
      }
      // Adjustments
      const ADJUST = 10;
      top += ADJUST;
      left += ADJUST;
      if (left + TOOLTIP_WIDTH > window.innerWidth)
        left = window.innerWidth - TOOLTIP_WIDTH - 20 - 2 - ADJUST;

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
    }
  }

  const mouseleft = () => {
    circleHighlight.st({ opacity: 0 });
    tooltip.st({ opacity: 0 });
  };

  const circleHighlight = svg.append('circle.circle-highlight')
    .at({ r: CIRCLE_RADIUS })
    .st({ opacity: 0 });
  const rect = svg.append('rect')
    .at({
      fill: 'transparent',
      width: SIZE,
      height: SIZE,
    })
    .on('mousemove', mousemoved)
    .on('mouseleave', mouseleft)
    .on('touchstart', mousemoved);
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

  let maxValue = 0;
  SCORECARD_DATA.forEach(row => {
    if (subjects.some(subj => subj.cred === row.cred && subj.field === row.field)) {
      const value = Math.max(row.debt, row.earnings);
      if (value > maxValue)
        maxValue = value;
    }
  });

  // Create chart containers and graph and title each one
  const subjContainers = select(container)
    .st({
      marginTop: -containerPadding,
      paddingBottom: containerPadding,
    })  
    .appendMany('div.chart-container' + (subjects.length === 4 ? '.flex-max-two' : ''), subjects);
  subjContainers.each(function(subj) {
    const subjContainer = select(this);
    subjContainer.st({
      width: ROTATED_SIZE,
      height: ROTATED_SIZE - (ROTATED_SIZE - SIZE) / 2,
      paddingTop: containerPadding,
    })
    .append('p.subject-title')
    .st({
      marginTop: 0,
      marginBottom: (ROTATED_SIZE - SIZE) / 2 - margin.bottom + 35,
    })
    .text(subj.field);
    graphSubject(subjContainer, subj, maxValue);
  });
}

// Utility function; cartesian distance
const distance = (px, py, mx, my) => {
  const a = px - mx;
  const b = py - my;
  return Math.sqrt(a * a + b * b);
};
