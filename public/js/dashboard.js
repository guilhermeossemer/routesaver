/**
 * RouteSaver — Dashboard
 *
 * Modules:
 *   MapManager    – Leaflet map setup, route display, routing machine
 *   RouteManager  – CRUD state, creation flow, list rendering
 *   SearchManager – Nominatim geocoding search bar
 *   ModalManager  – Delete confirmation modal
 */
(function () {
  'use strict';

  // ======================== Auth Guard ========================
  if (!API.isAuthenticated()) {
    window.location.href = '/login';
    return;
  }

  // ======================== Constants ========================

  /** Polyline style for non-selected (background) routes */
  const ROUTE_STYLE_DEFAULT = { color: '#4f46e5', weight: 4, opacity: 0.45 };

  /** Polyline style for the currently selected route */
  const ROUTE_STYLE_SELECTED = { color: '#22c55e', weight: 6, opacity: 1 };

  /** Polyline style used during route creation */
  const ROUTE_STYLE_CREATION = { color: '#4f46e5', weight: 4, dashArray: '8 6' };

  // ======================== MapManager ========================

  const MapManager = (() => {
    const map = L.map('map', { center: [-15.78, -47.93], zoom: 5, zoomControl: true });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    let routingControl = null;

    /** All polylines drawn on the map for saved routes, keyed by route _id */
    const routeLayers = {};

    /** Markers for the selected route (start/end) */
    let selectedMarkers = [];

    /** Currently displayed routing distance in meters */
    let lastDistance = null;

    // ---- Geolocation ----

    function tryGeolocate() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => map.setView([pos.coords.latitude, pos.coords.longitude], 13),
          () => {}
        );
      }
    }

    // ---- Route Display (all routes as background polylines) ----

    /**
     * Draws all routes on the map.
     * Non-selected routes get the default (light) style.
     * Selected route polyline is NOT drawn here — the Routing Machine
     * will render the real road path instead. Only markers are added.
     */
    function drawAllRoutes(routes, selectedId) {
      clearAllRoutes();

      routes.forEach((route) => {
        const latlngs = route.coordinates.map((c) => [c.lat, c.lng]);
        const isSelected = route._id === selectedId;

        // Skip drawing the selected route's polyline — routing machine handles it
        if (isSelected) {
          // Still store a hidden reference so fitToRoute works
          const ghost = L.polyline(latlngs, { opacity: 0, weight: 0 }).addTo(map);
          routeLayers[route._id] = ghost;
          addSelectedMarkers(route);
          return;
        }

        const polyline = L.polyline(latlngs, ROUTE_STYLE_DEFAULT).addTo(map);

        // Click on any background route to select it
        polyline.on('click', () => {
          RouteManager.selectRoute(route._id);
        });

        routeLayers[route._id] = polyline;
      });
    }

    /** Remove all route polylines from the map */
    function clearAllRoutes() {
      Object.values(routeLayers).forEach((pl) => map.removeLayer(pl));
      Object.keys(routeLayers).forEach((k) => delete routeLayers[k]);
      clearSelectedMarkers();
      removeRouting();
    }

    /** Add start (green) and end (red) markers for the selected route */
    function addSelectedMarkers(route) {
      clearSelectedMarkers();
      if (!route) return;

      const coords = route.coordinates;
      if (coords.length === 0) return;

      const startIcon = L.divIcon({
        className: '',
        html: '<div style="width:14px;height:14px;background:#16a34a;border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const endIcon = L.divIcon({
        className: '',
        html: '<div style="width:14px;height:14px;background:#dc2626;border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      selectedMarkers.push(L.marker([coords[0].lat, coords[0].lng], { icon: startIcon }).addTo(map));
      if (coords.length > 1) {
        const last = coords[coords.length - 1];
        selectedMarkers.push(L.marker([last.lat, last.lng], { icon: endIcon }).addTo(map));
      }
    }

    function clearSelectedMarkers() {
      selectedMarkers.forEach((m) => map.removeLayer(m));
      selectedMarkers = [];
    }

    /** Fit map bounds to a specific route */
    function fitToRoute(routeId) {
      const pl = routeLayers[routeId];
      if (pl) map.fitBounds(pl.getBounds(), { padding: [50, 50] });
    }

    // ---- Leaflet Routing Machine (road-following view) ----

    /**
     * Show real road routing for a selected route.
     * Uses OSRM demo server (free, no API key needed).
     * Waypoints are sampled to max 25 for performance.
     */
    function showRouting(route) {
      removeRouting();
      lastDistance = null;

      let coords = route.coordinates;
      if (coords.length > 25) coords = sampleCoordinates(coords, 25);

      const waypoints = coords.map((c) => L.latLng(c.lat, c.lng));

      routingControl = L.Routing.control({
        waypoints,
        routeWhileDragging: false,
        addWaypoints: false,
        draggableWaypoints: false,
        show: false,            // hide instructions panel
        createMarker: () => null, // we already have our own markers
        lineOptions: {
          styles: [{ color: '#22c55e', weight: 5, opacity: 0.8 }],
          addWaypoints: false,
        },
      }).addTo(map);

      routingControl.on('routesfound', (e) => {
        const summary = e.routes[0].summary;
        lastDistance = summary.totalDistance;
        // Notify RouteManager to update sidebar distance badge
        RouteManager.onDistanceCalculated(route._id, lastDistance);
      });
    }

    function removeRouting() {
      if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null;
      }
      lastDistance = null;
    }

    function getLastDistance() {
      return lastDistance;
    }

    // ---- Helpers ----

    function sampleCoordinates(coords, max) {
      if (coords.length <= max) return coords;
      const result = [coords[0]];
      const step = (coords.length - 1) / (max - 1);
      for (let i = 1; i < max - 1; i++) result.push(coords[Math.round(i * step)]);
      result.push(coords[coords.length - 1]);
      return result;
    }

    return {
      map,
      tryGeolocate,
      drawAllRoutes,
      clearAllRoutes,
      fitToRoute,
      showRouting,
      removeRouting,
      getLastDistance,
      sampleCoordinates,
    };
  })();

  // ======================== RouteManager ========================

  const RouteManager = (() => {
    // DOM
    const $routeList = document.getElementById('routeList');
    const $emptyState = document.getElementById('emptyState');
    const $searchRoutes = document.getElementById('searchRoutes');
    const $routeBar = document.getElementById('routeBar');
    const $routeName = document.getElementById('routeName');
    const $pointCount = document.getElementById('pointCount');
    const $btnUndoPoint = document.getElementById('btnUndoPoint');
    const $btnSaveRoute = document.getElementById('btnSaveRoute');
    const $btnCancelRoute = document.getElementById('btnCancelRoute');
    const $btnNewRoute = document.getElementById('btnNewRoute');

    // State
    let routes = [];
    let selectedRouteId = null;
    let isCreating = false;
    let creationPoints = [];
    let creationMarkers = [];
    let creationPolyline = null;

    /** Distance cache: routeId -> meters */
    const distanceCache = {};

    // ---- Init ----

    function init() {
      $btnNewRoute.addEventListener('click', startCreation);
      $btnSaveRoute.addEventListener('click', saveRoute);
      $btnCancelRoute.addEventListener('click', cancelCreation);
      $btnUndoPoint.addEventListener('click', undoLastPoint);
      $routeName.addEventListener('input', updatePointCount);
      $searchRoutes.addEventListener('input', renderList);

      MapManager.map.on('click', onMapClick);

      loadRoutes();
    }

    // ---- CRUD ----

    async function loadRoutes() {
      try {
        const data = await API.getRoutes();
        routes = data.data;
        renderList();
        MapManager.drawAllRoutes(routes, selectedRouteId);
      } catch (err) {
        console.error('Failed to load routes:', err);
      }
    }

    // ---- List Rendering ----

    function renderList() {
      const query = $searchRoutes.value.toLowerCase().trim();
      const filtered = query
        ? routes.filter((r) => r.name.toLowerCase().includes(query))
        : routes;

      $routeList.innerHTML = '';

      if (filtered.length === 0) {
        $emptyState.classList.add('active');
        $routeList.hidden = true;
        return;
      }

      $emptyState.classList.remove('active');
      $routeList.hidden = false;

      filtered.forEach((route) => {
        const li = document.createElement('li');
        li.className = 'route-item' + (route._id === selectedRouteId ? ' active' : '');

        const date = new Date(route.createdAt).toLocaleDateString('pt-BR', {
          day: '2-digit', month: 'short', year: 'numeric',
        });

        // Distance badge (only for selected route when available)
        const dist = distanceCache[route._id];
        const distHtml = dist != null
          ? `<span class="route-item-distance">${formatDistance(dist)}</span>`
          : '';

        li.innerHTML = `
          <div class="route-item-info">
            <div class="route-item-name" title="${escapeHtml(route.name)}">${escapeHtml(route.name)}</div>
            <div class="route-item-meta">${route.coordinates.length} pontos &middot; ${date}</div>
            ${distHtml}
          </div>
          <div class="route-item-actions">
            <button class="btn-icon btn-icon-navigate" title="Abrir no Google Maps" data-action="navigate" data-id="${route._id}">&#9658;</button>
            <button class="btn-icon btn-icon-danger" title="Excluir rota" data-action="delete" data-id="${route._id}">&times;</button>
          </div>
        `;

        li.addEventListener('click', (e) => {
          if (e.target.closest('[data-action]')) return;
          selectRoute(route._id);
        });

        li.querySelectorAll('[data-action]').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (btn.dataset.action === 'navigate') openInGoogleMaps(btn.dataset.id);
            if (btn.dataset.action === 'delete') ModalManager.promptDelete(btn.dataset.id);
          });
        });

        $routeList.appendChild(li);
      });
    }

    // ---- Selection ----

    function selectRoute(id) {
      if (isCreating) return;

      // Deselect if clicking the same route
      if (selectedRouteId === id) {
        selectedRouteId = null;
        MapManager.removeRouting();
        MapManager.drawAllRoutes(routes, null);
        renderList();
        return;
      }

      selectedRouteId = id;
      MapManager.removeRouting();
      MapManager.drawAllRoutes(routes, id);
      MapManager.fitToRoute(id);
      renderList();

      // Show real road routing for the selected route
      const route = routes.find((r) => r._id === id);
      if (route) MapManager.showRouting(route);
    }

    /** Called by MapManager when routing distance is calculated */
    function onDistanceCalculated(routeId, meters) {
      distanceCache[routeId] = meters;
      renderList();
    }

    // ---- Route Creation ----

    function startCreation() {
      if (isCreating) return;

      isCreating = true;
      selectedRouteId = null;
      MapManager.drawAllRoutes(routes, null);
      MapManager.removeRouting();

      creationPoints = [];
      creationMarkers = [];
      creationPolyline = L.polyline([], ROUTE_STYLE_CREATION).addTo(MapManager.map);

      $routeBar.hidden = false;
      $routeName.value = '';
      $routeName.focus();
      updatePointCount();
      $btnNewRoute.disabled = true;
      MapManager.map.getContainer().style.cursor = 'crosshair';
    }

    function cancelCreation() {
      cleanupCreation();
      MapManager.drawAllRoutes(routes, selectedRouteId);
    }

    function cleanupCreation() {
      isCreating = false;
      $routeBar.hidden = true;
      $btnNewRoute.disabled = false;
      MapManager.map.getContainer().style.cursor = '';

      if (creationPolyline) {
        MapManager.map.removeLayer(creationPolyline);
        creationPolyline = null;
      }
      creationMarkers.forEach((m) => MapManager.map.removeLayer(m));
      creationMarkers = [];
      creationPoints = [];
    }

    function onMapClick(e) {
      if (!isCreating) return;

      const { lat, lng } = e.latlng;
      creationPoints.push({ lat, lng });

      const icon = L.divIcon({
        className: '',
        html: '<div style="width:12px;height:12px;background:#4f46e5;border:2px solid #fff;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,.3)"></div>',
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      creationMarkers.push(L.marker([lat, lng], { icon }).addTo(MapManager.map));
      creationPolyline.addLatLng([lat, lng]);
      updatePointCount();
    }

    function undoLastPoint() {
      if (creationPoints.length === 0) return;
      creationPoints.pop();
      const m = creationMarkers.pop();
      if (m) MapManager.map.removeLayer(m);
      creationPolyline.setLatLngs(creationPoints.map((p) => [p.lat, p.lng]));
      updatePointCount();
    }

    function updatePointCount() {
      const n = creationPoints.length;
      $pointCount.textContent = `${n} ponto${n !== 1 ? 's' : ''}`;
      $btnUndoPoint.disabled = n === 0;
      $btnSaveRoute.disabled = n < 2 || !$routeName.value.trim();
    }

    async function saveRoute() {
      const name = $routeName.value.trim();
      if (!name || creationPoints.length < 2) return;

      $btnSaveRoute.disabled = true;
      $btnSaveRoute.textContent = 'Salvando...';

      try {
        await API.createRoute(name, creationPoints);
        cleanupCreation();
        await loadRoutes();
      } catch (err) {
        alert('Erro ao salvar rota: ' + err.message);
        $btnSaveRoute.disabled = false;
        $btnSaveRoute.textContent = 'Salvar';
      }
    }

    // ---- Delete (called by ModalManager) ----

    async function deleteRoute(id) {
      await API.deleteRoute(id);
      if (selectedRouteId === id) {
        selectedRouteId = null;
        MapManager.removeRouting();
      }
      delete distanceCache[id];
      await loadRoutes();
    }

    // ---- Google Maps ----

    function openInGoogleMaps(id) {
      const route = routes.find((r) => r._id === id);
      if (!route || route.coordinates.length < 2) return;

      let coords = route.coordinates;
      if (coords.length > 25) coords = MapManager.sampleCoordinates(coords, 25);

      const path = coords.map((c) => `${c.lat},${c.lng}`).join('/');
      window.open(`https://www.google.com/maps/dir/${path}`, '_blank');
    }

    // ---- Getters ----

    function getSelectedId() { return selectedRouteId; }
    function getRoutes() { return routes; }

    return {
      init,
      selectRoute,
      onDistanceCalculated,
      deleteRoute,
      getSelectedId,
      getRoutes,
      loadRoutes,
    };
  })();

  // ======================== SearchManager ========================

  const SearchManager = (() => {
    const $form = document.getElementById('searchForm');
    const $input = document.getElementById('searchInput');
    const $results = document.getElementById('searchResults');
    let marker = null;

    function init() {
      $form.addEventListener('submit', onSearch);
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.map-search')) $results.innerHTML = '';
      });
    }

    async function onSearch(e) {
      e.preventDefault();
      const q = $input.value.trim();
      if (!q) return;

      $results.innerHTML = '<li class="search-result-item" style="opacity:.6">Buscando...</li>';

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`,
          { headers: { 'Accept-Language': 'pt-BR' } }
        );
        const data = await res.json();
        $results.innerHTML = '';

        if (data.length === 0) {
          $results.innerHTML = '<li class="search-result-item" style="opacity:.6">Nenhum resultado encontrado</li>';
          return;
        }

        data.forEach((place) => {
          const li = document.createElement('li');
          li.className = 'search-result-item';
          li.textContent = place.display_name;
          li.addEventListener('click', () => {
            const lat = parseFloat(place.lat);
            const lng = parseFloat(place.lon);
            MapManager.map.setView([lat, lng], 15);

            if (marker) MapManager.map.removeLayer(marker);
            marker = L.marker([lat, lng]).addTo(MapManager.map).bindPopup(place.display_name).openPopup();

            $results.innerHTML = '';
            $input.value = place.display_name;
          });
          $results.appendChild(li);
        });
      } catch {
        $results.innerHTML = '<li class="search-result-item" style="opacity:.6">Erro na busca</li>';
      }
    }

    return { init };
  })();

  // ======================== ModalManager ========================

  const ModalManager = (() => {
    const $modal = document.getElementById('deleteModal');
    const $btnConfirm = document.getElementById('btnConfirmDelete');
    const $btnCancel = document.getElementById('btnCancelDelete');
    let targetId = null;

    function init() {
      $btnConfirm.addEventListener('click', confirm);
      $btnCancel.addEventListener('click', close);
      $modal.addEventListener('click', (e) => { if (e.target === $modal) close(); });
    }

    function promptDelete(id) {
      targetId = id;
      $modal.classList.add('active');
    }

    async function confirm() {
      if (!targetId) { close(); return; }
      try {
        await RouteManager.deleteRoute(targetId);
        close();
      } catch (err) {
        alert('Erro ao excluir: ' + err.message);
        close();
      }
    }

    function close() {
      $modal.classList.remove('active');
      targetId = null;
    }

    return { init, promptDelete };
  })();

  // ======================== Helpers ========================

  function escapeHtml(str) {
    const el = document.createElement('div');
    el.textContent = str;
    return el.innerHTML;
  }

  function formatDistance(meters) {
    return meters >= 1000
      ? `${(meters / 1000).toFixed(1)} km`
      : `${Math.round(meters)} m`;
  }

  // ======================== Bootstrap ========================

  const user = API.getUser();
  if (user) document.getElementById('userName').textContent = `Olá, ${user.name}`;
  document.getElementById('btnLogout').addEventListener('click', () => API.logout());

  MapManager.tryGeolocate();
  RouteManager.init();
  SearchManager.init();
  ModalManager.init();
})();
