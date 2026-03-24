import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { t } from '../utils/translations';

const DEFAULT_FARM_BOUNDARY = `76.67877949840206,20.78223135963174,0 76.67878260048575,20.78222128119604,0 76.67878184584922,20.78220990784899,0 76.67878433895004,20.78220058939666,0 76.67878677823384,20.78219217853808,0 76.67878816718793,20.78218109131431,0 76.6787938415405,20.78217420425095,0 76.67879294406336,20.78216475857916,0 76.6787954501449,20.7821584442226,0 76.67879744621884,20.78215203119859,0 76.67879788874895,20.78214427604501,0 76.67879988163651,20.78213896344793,0 76.67880132382095,20.78213213225587,0 76.67880261871632,20.78212431773141,0 76.67880570962315,20.7821187926276,0 76.67881584367493,20.78212149713459,0 76.67883048059527,20.78212365220068,0 76.67883952210182,20.78212527440008,0 76.67885020945798,20.782126727403,0 76.6788622330841,20.7821291957958,0 76.67887192361515,20.78213182048268,0 76.67888152026138,20.78213135702934,0 76.67889411550627,20.78213710340274,0 76.67889412224902,20.78214325689104,0 76.6788932725197,20.78215442253895,0 76.67889154849509,20.78216196586244,0 76.67889171065664,20.78217029424607,0 76.67889066019147,20.78218134376954,0 76.67888506351795,20.78219918553059,0 76.67888486585063,20.78220606291953,0 76.67888253117067,20.78221802123231,0 76.67887922235543,20.78223310897701,0 76.67887800223251,20.78223937422335,0 76.67887683022641,20.78225026539202,0 76.67887683022641,20.78225026539202,0 76.67887445853169,20.7822579760087,0 76.67886975515144,20.78226345050075,0 76.67885791955723,20.78226263825224,0 76.67884387391604,20.78226106261606,0 76.67883275465455,20.78225974061137,0 76.67881881438713,20.78225832705887,0 76.67880856595464,20.78225731295181,0 76.67879227386457,20.78225411888618,0 76.67878005337671,20.78225242076291,0 76.67877949840206,20.78223135963174,0`;

const parseFarmBoundary = (coordsRaw) => {
    return coordsRaw.trim().split(/\s+/).map(p => {
        const [lon, lat] = p.split(',').map(Number);
        return { lat, lon };
    });
};

const FARM_POLY = parseFarmBoundary(DEFAULT_FARM_BOUNDARY);

const generateScatterGridData = () => {
    const points = [];
    const latMin = Math.min(...FARM_POLY.map(p => p.lat));
    const latMax = Math.max(...FARM_POLY.map(p => p.lat));
    const lonMin = Math.min(...FARM_POLY.map(p => p.lon));
    const lonMax = Math.max(...FARM_POLY.map(p => p.lon));

    const steps = 15; 
    const latStep = (latMax - latMin) / steps;
    const lonStep = (lonMax - lonMin) / steps;

    for (let i = 0; i <= steps; i++) {
        for (let j = 0; j <= steps; j++) {
            const lat = latMin + i * latStep;
            const lon = lonMin + j * lonStep;
            const normX = j / steps;
            const normY = i / steps;
            const jitterLat = (Math.random() - 0.5) * latStep * 0.8;
            const jitterLon = (Math.random() - 0.5) * lonStep * 0.8;
            points.push({ 
                lat: lat + jitterLat, 
                lon: lon + jitterLon, 
                n: (1 - normX) * 0.95 + Math.random() * 0.05,
                p: normY * 0.95 + Math.random() * 0.05,
                k: (1 - normY) * 0.95 + Math.random() * 0.05,
                ph: normX * 0.95 + Math.random() * 0.05,
                mo: Math.max(0, (1 - Math.sqrt(Math.pow(normX - 0.5, 2) + Math.pow(normY - 0.5, 2)) * 2)) * 0.95 + Math.random() * 0.05
            });
        }
    }
    return points;
};

const PARAMETER_LIST = [
    { key: 'n', label: 'Nitrogen', color: '#4CAF50' },
    { key: 'ph', label: 'Soil pH', color: '#F44336' },
    { key: 'p', label: 'Phosphorus', color: '#2196F3' },
    { key: 'k', label: 'Potassium', color: '#9C27B0' },
    { key: 'mo', label: 'Moisture', color: '#00BCD4' }
];

export default function AnalyticsScreen({ openMenu, language }) {
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('ALL');
    const scatterData = generateScatterGridData();

    const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
            body { margin: 0; padding: 0; background-color: #000; overflow: hidden; }
            #map { height: 100vh; width: 100vw; }
            .leaflet-control-attribution { display: none !important; }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${FARM_POLY[0].lat}, ${FARM_POLY[0].lon}], 19.5);
            L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', { maxZoom: 22 }).addTo(map);

            var polyCoords = ${JSON.stringify(FARM_POLY.map(p => [p.lat, p.lon]))};
            var farmBoundary = L.polygon(polyCoords, { color: 'white', fillColor: 'transparent', weight: 4, dashArray: '6, 12' }).addTo(map);
            map.fitBounds(farmBoundary.getBounds(), { padding: [50, 50] });

            var data = ${JSON.stringify(scatterData)};
            var activeFilter = "${activeFilter}";

            function isInside(lat, lon, vs) {
                var x = lat, y = lon;
                var inside = false;
                for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
                    var xi = vs[i][0], yi = vs[i][1];
                    var xj = vs[j][0], yj = vs[j][1];
                    var intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                    if (intersect) inside = !inside;
                }
                return inside;
            }

            data.forEach(p => {
                const offset = 0.000005; 
                const rad = 0.22; 
                
                const layers = [
                    { key: 'n', lat: p.lat + offset, lon: p.lon, color: '#4CAF50', val: p.n },
                    { key: 'p', lat: p.lat, lon: p.lon + offset, color: '#2196F3', val: p.p },
                    { key: 'k', lat: p.lat - offset, lon: p.lon, color: '#9C27B0', val: p.k },
                    { key: 'ph', lat: p.lat, lon: p.lon - offset, color: '#F44336', val: p.ph },
                    { key: 'mo', lat: p.lat, lon: p.lon, color: '#00BCD4', val: p.mo }
                ];

                layers.forEach(l => {
                    // FILTER LOGIC: only plot the layer if it matches the active filter or if ALL is selected
                    if (activeFilter === 'ALL' || activeFilter === l.key) {
                        if (isInside(l.lat, l.lon, polyCoords)) {
                            var opacity = Math.pow(l.val, 3) * 1.0; 
                            if (opacity < 0.25) opacity = 0.25; 
                            L.circle([l.lat, l.lon], { radius: rad, fillColor: l.color, fillOpacity: opacity, stroke: false }).addTo(map);
                        }
                    }
                });
            });
        </script>
    </body>
    </html>
    `;

    return (
        <View style={styles.container}>
            <View style={styles.mapContainer}>
                <WebView 
                    key={activeFilter} // Re-render WebView on filter change
                    originWhitelist={['*']}
                    source={{ html: mapHtml }}
                    onLoadEnd={() => setLoading(false)}
                    style={{ flex: 1 }}
                />
                {loading && (
                    <View style={styles.loader}>
                        <ActivityIndicator size="large" color="#4CAF50" />
                    </View>
                )}
            </View>

            {/* Floating Header */}
            <View style={styles.floatingHeader}>
                <TouchableOpacity onPress={openMenu} style={styles.glassBtn}>
                    <Text style={{fontSize: 22, color: '#fff'}}>☰</Text>
                </TouchableOpacity>
                <View style={[styles.glassCard, { flex: 1 }]}>
                    <Text style={styles.headerTitle}>Precision Farm Analytics</Text>
                    <Text style={styles.subTitle}>Select parameter below to filter map</Text>
                </View>
            </View>

            {/* Interactive Legendary Filter */}
            <View style={styles.rightOverlay}>
                <View style={[styles.glassCard, { padding: 10 }]}>
                    <TouchableOpacity 
                        style={[styles.filterBtn, activeFilter === 'ALL' && styles.activeTab]}
                        onPress={() => setActiveFilter('ALL')}
                    >
                        <View style={[styles.dot, { backgroundColor: '#fff' }]} />
                        <Text style={styles.legendLabel}>Show All</Text>
                    </TouchableOpacity>

                    {PARAMETER_LIST.map(cfg => (
                        <TouchableOpacity 
                            key={cfg.key} 
                            style={[styles.filterBtn, activeFilter === cfg.key && { borderLeftColor: cfg.color, borderLeftWidth: 3, backgroundColor: 'rgba(0,0,0,0.8)' }]}
                            onPress={() => setActiveFilter(cfg.key)}
                        >
                            <View style={[styles.dot, { backgroundColor: cfg.color }]} />
                            <Text style={styles.legendLabel}>{cfg.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.bottomOverlay}>
                <View style={styles.glassCard}>
                    <Text style={styles.toastText}>
                        🟢 Tap Nitrogen, Soil pH etc. to Isolate Data Layer
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    mapContainer: { ...StyleSheet.absoluteFillObject },
    loader: { ...StyleSheet.absoluteFillObject, backgroundColor: '#080808', justifyContent: 'center', alignItems: 'center' },
    floatingHeader: { position: 'absolute', top: 50, left: 15, right: 15, flexDirection: 'row', alignItems: 'center', zIndex: 10 },
    glassBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    glassCard: { backgroundColor: 'rgba(0,0,0,0.7)', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#fff' },
    subTitle: { fontSize: 8, color: '#81C784', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 1 },
    rightOverlay: { position: 'absolute', top: 110, right: 15, width: 115, zIndex: 10 },
    filterBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8, padding: 4, borderRadius: 6 },
    activeTab: { backgroundColor: 'rgba(255,255,255,0.15)' },
    dot: { width: 6, height: 6, borderRadius: 3 },
    legendLabel: { fontSize: 9, fontWeight: '700', color: '#ccc' },
    bottomOverlay: { position: 'absolute', bottom: 30, left: 15, right: 15, zIndex: 10 },
    toastText: { fontSize: 9, color: '#A5D6A7', fontWeight: '900', textAlign: 'center', letterSpacing: 0.5 }
});
