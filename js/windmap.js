/* Interactive Quanterness map: real WindPRO layers from the project KMZ exports. */
(function () {
  if (!window.L) return;

  var map = L.map('windmap', { scrollWheelZoom: false }).setView([59.006, -3.025], 13);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  var layers = {};
  var legends = {
    noise: { img: 'assets/geo/noise_legend.png', cap: 'Predicted sound pressure at 12 m/s wind speed, WindPRO DECIBEL module' },
    flicker: { img: 'assets/geo/flicker_legend.png', cap: 'Worst-case shadow flicker, hours per year, WindPRO SHADOW module' },
    zvi: { img: 'assets/geo/zvi_legend.png', cap: 'Number of turbines visible, WindPRO ZVI module' }
  };
  var legendBox = document.getElementById('map-legend');

  /* Ground overlays from the KMZ LatLonBoxes */
  fetch('assets/geo/overlays.json').then(function (r) { return r.json(); }).then(function (m) {
    ['noise', 'flicker', 'zvi'].forEach(function (key) {
      var o = m[key][0];
      layers[key] = L.imageOverlay('assets/geo/' + key + '_overlay.png',
        [[o.south, o.west], [o.north, o.east]], { opacity: 0.62 });
    });
  });

  /* Turbines */
  fetch('assets/geo/turbines.geojson').then(function (r) { return r.json(); }).then(function (gj) {
    layers.turbines = L.geoJSON(gj, {
      pointToLayer: function (f, latlng) {
        return L.marker(latlng, {
          icon: L.divIcon({ className: 'wtg-dot', iconSize: [16, 16] })
        }).bindPopup('<b>' + f.properties.label + '</b><br>' + f.properties.model +
          '<br>Hub ' + f.properties.hub + ' &middot; tip ' + f.properties.tip);
      }
    }).addTo(map);
  });

  /* Access roads */
  fetch('assets/geo/roads.geojson').then(function (r) { return r.json(); }).then(function (gj) {
    layers.roads = L.geoJSON(gj, { style: { color: '#bc4b26', weight: 3, opacity: 0.9, dashArray: '1 6' } }).addTo(map);
  });

  function setLegend(active) {
    var last = null;
    active.forEach(function (k) { if (legends[k]) last = k; });
    if (!last) { legendBox.innerHTML = ''; return; }
    legendBox.innerHTML = '<img src="' + legends[last].img + '" alt="Map legend"><p class="cap">' + legends[last].cap + '</p>';
  }

  document.getElementById('layer-buttons').addEventListener('click', function (e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    var key = btn.getAttribute('data-layer');
    var on = btn.classList.toggle('active');
    if (layers[key]) { on ? layers[key].addTo(map) : map.removeLayer(layers[key]); }
    var active = Array.prototype.slice.call(document.querySelectorAll('#layer-buttons button.active'))
      .map(function (b) { return b.getAttribute('data-layer'); });
    setLegend(active);
  });
})();
